/**
 * Contract analyzer
 *
 * Scores the text of a loan, investment or purchase contract against a rubric
 * (see contractRubric.ts). It is a pure function with no network calls, so it
 * can run in the browser and the contract never leaves the user's device.
 *
 * It reads what the document says. It cannot judge whether a term is fair or
 * whether a statement is true.
 */

import type {
  AbsentCheck,
  ContractRubric,
  RubricCheck,
  RubricCriterion,
  RubricSource,
} from './contractRubric'

/** Answers to the rubric's `answer` checks, keyed by check id. Unanswered counts as no. */
export type ContractAnswers = Record<string, boolean | undefined>

export interface CheckResult {
  id: string
  label: string
  points: number
  earned: number
  passed: boolean
  /** Words from the contract that decided the check, when there are any. */
  evidence?: string
}

export interface CriterionResult {
  id: string
  title: string
  why: string
  score: number
  max: number
  checks: CheckResult[]
  sources: RubricSource[]
}

export interface GroupResult {
  id: string
  title: string
  description: string
  score: number
  max: number
  criteria: CriterionResult[]
}

export interface ContractFlag {
  id: string
  message: string
}

export interface LoanToValue {
  loan: number
  collateral: number
  ratio: number
}

export interface ContractAnalysis {
  groups: GroupResult[]
  flags: ContractFlag[]
  wordCount: number
  openBlanks: number
  /** Yearly interest rate in percent, when the text states one. */
  interestRate: number | null
  /** Loan against stated collateral value, when the text states both. */
  loanToValue: LoanToValue | null
}

const HIGH_INTEREST_RATE_PERCENT = 18
const SHORT_TEXT_WORDS = 150
const USE_OF_FUNDS_WINDOW_CHARS = 1500

const DOLLAR_AMOUNT = String.raw`\$\s?\d[\d,]*(?:\.\d+)?\s?(?:million|thousand|[MKmk]\b)?`
const DOLLAR_AMOUNT_PARTS = /\$\s?(\d[\d,]*(?:\.\d+)?)\s?(million|thousand|[MKmk]\b)?/

const LOAN_AMOUNT_PATTERNS = [
  new RegExp(String.raw`loan amount[^$]{0,40}(${DOLLAR_AMOUNT})`, 'i'),
  new RegExp(String.raw`loan of (${DOLLAR_AMOUNT})`, 'i'),
  new RegExp(String.raw`principal (?:amount )?of (${DOLLAR_AMOUNT})`, 'i'),
  new RegExp(String.raw`\blends? (?:to )?(?:the )?\w+ (${DOLLAR_AMOUNT})`, 'i'),
]

const COLLATERAL_VALUE_PATTERNS = [
  new RegExp(String.raw`(?:apprais\w*|valued at|market value)[^$\n.]{0,60}(${DOLLAR_AMOUNT})`, 'i'),
  new RegExp(String.raw`(${DOLLAR_AMOUNT})[^$\n.]{0,40}(?:apprais\w*|market value)`, 'i'),
]

const INTEREST_RATE_PATTERNS = [
  /interest (?:rate )?(?:of|at|is|:)?\s?(\d+(?:\.\d+)?)\s?%/i,
  /(\d+(?:\.\d+)?)\s?% (?:a|per) (?:year|annum)/i,
  /(\d+(?:\.\d+)?)\s?% (?:simple |annual |fixed )?interest/i,
]

const PERSONAL_GUARANTEE = /personal(?:ly)? guarant\w*/gi
const NEGATION_BEFORE = /\b(no|not|without|none|nor)\b[^.]{0,30}$/i
const NEGATION_AFTER = /^[^.]{0,40}\b(is|are) not required\b|^\s?:\s?none\b/i

const OPEN_BLANK_PATTERNS = [/\[[^\]\n]{0,80}\]/g, /_{4,}/g]

/** Reads the first dollar amount in `text`, including shorthand such as $3.92M or $215K. */
export function parseDollarAmount(text: string): number | null {
  const match = DOLLAR_AMOUNT_PARTS.exec(text)
  if (!match) return null

  const digits = Number.parseFloat(match[1].replace(/,/g, ''))
  const unit = (match[2] ?? '').toLowerCase()
  const multiplier = unit === 'million' || unit === 'm' ? 1_000_000 : unit === 'thousand' || unit === 'k' ? 1_000 : 1
  return Math.round(digits * multiplier)
}

/** Scores `rawText` against `rubric`. `answers` covers what only the user can know. */
export function analyzeContract(
  rawText: string,
  rubric: ContractRubric,
  answers: ContractAnswers = {}
): ContractAnalysis {
  const text = normalizeText(rawText)
  const wordCount = text === '' ? 0 : text.split(/\s+/).length
  const loanToValue = findLoanToValue(text)
  const flags: ContractFlag[] = []

  const groups = rubric.map((group) => {
    const criteria = group.criteria.map((criterion) =>
      scoreCriterion(criterion, text, answers, loanToValue, flags)
    )
    return {
      id: group.id,
      title: group.title,
      description: group.description,
      score: sum(criteria.map((criterion) => criterion.score)),
      max: sum(criteria.map((criterion) => criterion.max)),
      criteria,
    }
  })

  const openBlanks = countOpenBlanks(text)
  const interestRate = findInterestRate(text)
  flags.push(...findEngineFlags(text, wordCount, openBlanks, interestRate, loanToValue))

  return { groups, flags, wordCount, openBlanks, interestRate, loanToValue }
}

function scoreCriterion(
  criterion: RubricCriterion,
  text: string,
  answers: ContractAnswers,
  loanToValue: LoanToValue | null,
  flags: ContractFlag[]
): CriterionResult {
  const passedCheckIds = new Set<string>()
  const checks: CheckResult[] = []

  for (const check of criterion.checks) {
    const result = scoreCheck(check, text, answers, loanToValue, passedCheckIds)
    if (result.passed) passedCheckIds.add(check.id)
    checks.push(result)

    if (check.kind === 'absent' && check.flagWhenFound && firstMatch(check.patterns, text)) {
      flags.push(check.flagWhenFound)
    }
  }

  return {
    id: criterion.id,
    title: criterion.title,
    why: criterion.why,
    score: sum(checks.map((check) => check.earned)),
    max: sum(checks.map((check) => check.points)),
    checks,
    sources: criterion.sources,
  }
}

function scoreCheck(
  check: RubricCheck,
  text: string,
  answers: ContractAnswers,
  loanToValue: LoanToValue | null,
  passedCheckIds: Set<string>
): CheckResult {
  const base = { id: check.id, label: check.label, points: check.points }
  const pass = (evidence?: string): CheckResult => ({ ...base, earned: check.points, passed: true, evidence })
  const fail = (evidence?: string): CheckResult => ({ ...base, earned: 0, passed: false, evidence })

  if (text === '' && check.kind !== 'answer') return fail()

  switch (check.kind) {
    case 'present': {
      const match = firstMatch(check.patterns, text)
      return match ? pass(snippetAround(text, match)) : fail()
    }
    case 'absent':
      return scoreAbsentCheck(check, text, passedCheckIds, pass, fail)
    case 'answer':
      return answers[check.id] === true ? pass() : fail()
    case 'itemized-amounts': {
      const amountCount = mostAmountsAfter(check.anchor, text)
      return amountCount >= check.minimumAmounts
        ? pass(`${amountCount} dollar amounts listed`)
        : fail()
    }
    case 'loan-within-collateral': {
      if (!loanToValue) return fail('Could not find both a loan amount and a collateral value')
      const comparison = `Loan ${formatDollars(loanToValue.loan)} against stated value ${formatDollars(loanToValue.collateral)}`
      return loanToValue.ratio <= 1 ? pass(comparison) : fail(comparison)
    }
  }
}

function scoreAbsentCheck(
  check: AbsentCheck,
  text: string,
  passedCheckIds: Set<string>,
  pass: (evidence?: string) => CheckResult,
  fail: (evidence?: string) => CheckResult
): CheckResult {
  if (check.requires && !passedCheckIds.has(check.requires)) return fail()
  const match = firstMatch(check.patterns, text)
  return match ? fail(snippetAround(text, match)) : pass()
}

function findEngineFlags(
  text: string,
  wordCount: number,
  openBlanks: number,
  interestRate: number | null,
  loanToValue: LoanToValue | null
): ContractFlag[] {
  const flags: ContractFlag[] = []

  if (requiresPersonalGuarantee(text)) {
    flags.push({
      id: 'personal-guarantee',
      message: 'It asks for a personal guarantee. Your own assets could be at risk.',
    })
  }
  if (loanToValue && loanToValue.ratio > 1) {
    flags.push({
      id: 'loan-exceeds-collateral',
      message: `The loan (${formatDollars(loanToValue.loan)}) is ${loanToValue.ratio.toFixed(2)} times the stated collateral value (${formatDollars(loanToValue.collateral)}). Expect the lender to ask for more.`,
    })
  }
  if (interestRate !== null && interestRate >= HIGH_INTEREST_RATE_PERCENT) {
    flags.push({
      id: 'high-interest-rate',
      message: `The interest rate is ${interestRate}% a year. Compare it with other lenders before you accept.`,
    })
  }
  if (interestRate === null && wordCount > 0) {
    flags.push({
      id: 'no-interest-rate',
      message:
        'No interest rate found. The deal terms score is built for loans, so if this is not a loan, read the contract readiness score first.',
    })
  }
  if (openBlanks > 0) {
    flags.push({
      id: 'open-blanks',
      message: `${openBlanks} ${openBlanks === 1 ? 'blank is' : 'blanks are'} still open.`,
    })
  }
  if (wordCount > 0 && wordCount < SHORT_TEXT_WORDS) {
    flags.push({
      id: 'short-text',
      message: 'This text is short. Paste the whole document for a score you can rely on.',
    })
  }
  return flags
}

function requiresPersonalGuarantee(text: string): boolean {
  for (const match of Array.from(text.matchAll(PERSONAL_GUARANTEE))) {
    const start = match.index ?? 0
    const before = text.slice(Math.max(0, start - 40), start)
    const after = text.slice(start + match[0].length, start + match[0].length + 60)
    if (!NEGATION_BEFORE.test(before) && !NEGATION_AFTER.test(after)) return true
  }
  return false
}

function findLoanToValue(text: string): LoanToValue | null {
  const loan = firstCapturedAmount(LOAN_AMOUNT_PATTERNS, text)
  const collateral = firstCapturedAmount(COLLATERAL_VALUE_PATTERNS, text)
  if (loan === null || collateral === null || collateral === 0) return null
  return { loan, collateral, ratio: loan / collateral }
}

function findInterestRate(text: string): number | null {
  let earliest: { index: number; rate: number } | null = null
  for (const pattern of INTEREST_RATE_PATTERNS) {
    const match = pattern.exec(text)
    if (match && (earliest === null || match.index < earliest.index)) {
      earliest = { index: match.index, rate: Number.parseFloat(match[1]) }
    }
  }
  return earliest ? earliest.rate : null
}

function firstCapturedAmount(patterns: RegExp[], text: string): number | null {
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match) return parseDollarAmount(match[1])
  }
  return null
}

function mostAmountsAfter(anchor: RegExp, text: string): number {
  const everyAnchor = new RegExp(anchor.source, anchor.flags.includes('g') ? anchor.flags : `${anchor.flags}g`)
  let most = 0
  for (const match of Array.from(text.matchAll(everyAnchor))) {
    const start = match.index ?? 0
    const window = text.slice(start, start + USE_OF_FUNDS_WINDOW_CHARS)
    most = Math.max(most, (window.match(new RegExp(DOLLAR_AMOUNT, 'g')) ?? []).length)
  }
  return most
}

function countOpenBlanks(text: string): number {
  return sum(OPEN_BLANK_PATTERNS.map((pattern) => (text.match(pattern) ?? []).length))
}

function firstMatch(patterns: RegExp[], text: string): RegExpExecArray | null {
  for (const pattern of patterns) {
    const match = new RegExp(pattern.source, pattern.flags.replace('g', '')).exec(text)
    if (match) return match
  }
  return null
}

/** A short, single-line quote of the text around a match, cut at whole words. */
function snippetAround(text: string, match: RegExpExecArray): string {
  const contextChars = 50
  const start = Math.max(0, match.index - contextChars)
  const end = Math.min(text.length, match.index + match[0].length + contextChars)
  let quote = text.slice(start, end)
  if (start > 0) quote = quote.replace(/^\S*\s/, '')
  if (end < text.length) quote = quote.replace(/\s\S*$/, '')
  quote = quote.replace(/\s+/g, ' ').trim()
  return `${start > 0 ? '…' : ''}${quote}${end < text.length ? '…' : ''}`
}

function normalizeText(rawText: string): string {
  return rawText
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatDollars(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
