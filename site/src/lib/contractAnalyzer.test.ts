/**
 * Contract analyzer tests.
 * Run with: npm test
 *
 * Every contract below is made up. Do not add real contracts to this file:
 * the repository is public.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { analyzeContract, parseDollarAmount } from './contractAnalyzer.ts'
import { CONTRACT_RUBRIC } from './contractRubric.ts'

const WEAK_TERM_SHEET = `
NONBINDING TERM SHEET - DISCUSSION DRAFT

Borrower: Riverbend Bakery LLC, to be formed prior to closing.
Lender: [Lender name]

A loan of $250,000 at 14% a year to open a second bakery.
Security: a lien on the bakery equipment, appraised at $180,000.
The owner gives a personal guarantee.
The operating agreement between the two owners is to be documented later.
Closing: ________.
This term sheet creates no obligation to fund or close.
`

const SIGNED_LOAN_AGREEMENT = `
LOAN AGREEMENT

This Loan Agreement is entered into as of the Effective Date between
Riverbend Bakery LLC, an Ohio limited liability company ("Borrower"), and
Mill Street Community Lender, Inc. ("Lender").

1. Loan. Lender shall lend Borrower a loan amount of $150,000.

2. Use of proceeds.
Oven and mixers: $60,000
Build-out: $50,000
Working capital: $40,000
Total: $150,000

3. Interest. The loan bears simple interest at 9% per year. There is no origination fee.

4. Repayment. Interest only for the first six months. After that, Borrower shall make
equal monthly payments over five years, with a maturity date of June 1, 2031.
Borrower may prepay at any time without penalty.
Borrower keeps a debt service reserve equal to three monthly payments.

5. Forecast. The low case assumes sales 30% lower than the base case. The forecast
assumes two wholesale accounts. These are estimates and not a guarantee.

6. Security. The loan is secured by a security interest in the bakery equipment,
appraised at $200,000 and perfected by a UCC financing statement recorded at closing.
No personal guarantee is required.

7. Management. Dana Ortiz is the managing member under the operating agreement
dated March 1, 2026, which includes a buy-sell agreement.

8. Conditions to closing. Funding is subject to the following conditions: delivery of
insurance certificates and the signed security agreement. Each party shall deliver its
signed documents on the Closing Date.

9. Events of Default. An event of default occurs if Borrower fails to pay within ten days
after notice. Remedies include acceleration.

10. Governing law. Ohio law governs this agreement. Venue lies in Franklin County.

SIGNATURES
Borrower: Riverbend Bakery LLC   By: Dana Ortiz, Manager   Date: May 1, 2026
Lender: Mill Street Community Lender, Inc.   By: Sam Reyes, President   Date: May 1, 2026
`

function groupScore(text: string, groupId: string): number {
  const analysis = analyzeContract(text, CONTRACT_RUBRIC)
  const group = analysis.groups.find((candidate) => candidate.id === groupId)
  assert.ok(group, `group ${groupId} exists`)
  return group.score
}

function criterionScore(text: string, criterionId: string, answers = {}): number {
  const analysis = analyzeContract(text, CONTRACT_RUBRIC, answers)
  for (const group of analysis.groups) {
    const criterion = group.criteria.find((candidate) => candidate.id === criterionId)
    if (criterion) return criterion.score
  }
  throw new Error(`criterion ${criterionId} not found`)
}

function flagIds(text: string): string[] {
  return analyzeContract(text, CONTRACT_RUBRIC).flags.map((flag) => flag.id)
}

test('rubric: every criterion is worth 5, groups total 40 and 35', () => {
  const [deal, readiness] = CONTRACT_RUBRIC
  for (const group of CONTRACT_RUBRIC) {
    for (const criterion of group.criteria) {
      const points = criterion.checks.reduce((sum, check) => sum + check.points, 0)
      assert.equal(points, 5, `${criterion.id} checks add to 5`)
    }
  }
  assert.equal(deal.criteria.length * 5, 40)
  assert.equal(readiness.criteria.length * 5, 35)
})

test('rubric: every deal criterion cites a SCORE resource', () => {
  const [deal] = CONTRACT_RUBRIC
  for (const criterion of deal.criteria) {
    assert.ok(criterion.sources.length > 0, `${criterion.id} has a source`)
    for (const source of criterion.sources) {
      assert.match(source.url, /^https:\/\/www\.score\.org\//)
    }
  }
})

test('a signed loan agreement outscores a nonbinding term sheet in both groups', () => {
  assert.ok(groupScore(SIGNED_LOAN_AGREEMENT, 'deal') > groupScore(WEAK_TERM_SHEET, 'deal'))
  assert.ok(
    groupScore(SIGNED_LOAN_AGREEMENT, 'readiness') > groupScore(WEAK_TERM_SHEET, 'readiness')
  )
})

test('a complete agreement earns full marks on the criteria the text can show', () => {
  for (const criterionId of ['use-of-funds', 'repayment', 'cost', 'collateral', 'projections', 'partners']) {
    assert.equal(criterionScore(SIGNED_LOAN_AGREEMENT, criterionId), 5, criterionId)
  }
  for (const criterionId of ['parties', 'binding', 'money-terms', 'security', 'closing', 'default', 'signatures']) {
    assert.equal(criterionScore(SIGNED_LOAN_AGREEMENT, criterionId), 5, criterionId)
  }
})

test('a nonbinding term sheet scores 0 on binding and is flagged', () => {
  assert.equal(criterionScore(WEAK_TERM_SHEET, 'binding'), 0)
  assert.ok(flagIds(WEAK_TERM_SHEET).includes('nonbinding'))
  assert.ok(!flagIds(SIGNED_LOAN_AGREEMENT).includes('nonbinding'))
})

test('a personal guarantee is flagged, and "no personal guarantee" is not', () => {
  assert.ok(flagIds(WEAK_TERM_SHEET).includes('personal-guarantee'))
  assert.ok(!flagIds(SIGNED_LOAN_AGREEMENT).includes('personal-guarantee'))
})

test('a loan larger than the stated collateral value is flagged with the ratio', () => {
  const analysis = analyzeContract(WEAK_TERM_SHEET, CONTRACT_RUBRIC)
  assert.ok(analysis.loanToValue)
  assert.equal(analysis.loanToValue.loan, 250_000)
  assert.equal(analysis.loanToValue.collateral, 180_000)
  assert.equal(Math.round(analysis.loanToValue.ratio * 100), 139)
  assert.ok(analysis.flags.some((flag) => flag.id === 'loan-exceeds-collateral'))

  const covered = analyzeContract(SIGNED_LOAN_AGREEMENT, CONTRACT_RUBRIC)
  assert.ok(covered.loanToValue)
  assert.ok(covered.loanToValue.ratio < 1)
  assert.ok(!covered.flags.some((flag) => flag.id === 'loan-exceeds-collateral'))
})

test('open blanks are counted and flagged', () => {
  const analysis = analyzeContract(WEAK_TERM_SHEET, CONTRACT_RUBRIC)
  const blanks = analysis.flags.find((flag) => flag.id === 'open-blanks')
  assert.ok(blanks)
  assert.equal(analysis.openBlanks, 2)
  assert.equal(analyzeContract(SIGNED_LOAN_AGREEMENT, CONTRACT_RUBRIC).openBlanks, 0)
})

test('a high interest rate is flagged, and other percentages are ignored', () => {
  const highRate = 'Loan of $10,000 with interest at 24% a year. 80% of available cash goes to principal.'
  const analysis = analyzeContract(highRate, CONTRACT_RUBRIC)
  assert.equal(analysis.interestRate, 24)
  assert.ok(analysis.flags.some((flag) => flag.id === 'high-interest-rate'))

  const normalRate = analyzeContract(SIGNED_LOAN_AGREEMENT, CONTRACT_RUBRIC)
  assert.equal(normalRate.interestRate, 9)
  assert.ok(!normalRate.flags.some((flag) => flag.id === 'high-interest-rate'))
})

test('a contract with no interest rate is flagged as probably not a loan', () => {
  const saleAgreement = 'Purchase agreement. Seller shall sell the bakery to Buyer for a price of $90,000.'
  assert.ok(flagIds(saleAgreement).includes('no-interest-rate'))
  assert.ok(!flagIds(SIGNED_LOAN_AGREEMENT).includes('no-interest-rate'))
})

test('look-alike wording does not earn points', () => {
  const lookAlikes = `
    The prevailing party may recover its reasonable attorneys' fees and costs.
    The equipment was appraised at $200,000 as of May 28, 2026.
    No member, manager or officer is liable. If any term of this agreement conflicts, the order controls.
    Total interest $665,000 over the life of the loan.
  `
  const analysis = analyzeContract(lookAlikes, CONTRACT_RUBRIC)
  const checks = analysis.groups.flatMap((group) => group.criteria.flatMap((criterion) => criterion.checks))
  const passed = (checkId: string) => checks.find((check) => check.id === checkId)?.passed

  assert.equal(passed('states-total'), false, 'total interest is not a use of funds total')
  assert.equal(passed('states-fees'), false, "attorneys' fees are not loan fees")
  assert.equal(passed('has-date'), false, 'an appraisal date is not a signing date')
  assert.equal(passed('names-roles'), false, 'a list of titles does not name who runs the business')
  assert.equal(passed('names-signers'), false, 'a list of titles is not a signature block')
})

test('questions only the user can answer score 0 until answered yes', () => {
  assert.equal(criterionScore(SIGNED_LOAN_AGREEMENT, 'review'), 0)
  assert.equal(criterionScore(SIGNED_LOAN_AGREEMENT, 'review', { 'lawyer-reviewed': false }), 0)
  assert.equal(criterionScore(SIGNED_LOAN_AGREEMENT, 'review', { 'lawyer-reviewed': true }), 3)
  assert.equal(
    criterionScore(SIGNED_LOAN_AGREEMENT, 'review', { 'lawyer-reviewed': true, 'mentor-reviewed': true }),
    5
  )
})

test('passed checks quote the words that earned the points', () => {
  const analysis = analyzeContract(SIGNED_LOAN_AGREEMENT, CONTRACT_RUBRIC)
  const cost = analysis.groups[0].criteria.find((criterion) => criterion.id === 'cost')
  assert.ok(cost)
  const rateCheck = cost.checks.find((check) => check.id === 'states-rate')
  assert.ok(rateCheck?.passed)
  assert.match(rateCheck.evidence ?? '', /9% per year/)
})

test('empty text scores 0 everywhere and does not throw', () => {
  const analysis = analyzeContract('   ', CONTRACT_RUBRIC)
  for (const group of analysis.groups) assert.equal(group.score, 0)
  assert.equal(analysis.wordCount, 0)
})

test('parseDollarAmount reads full and shorthand amounts', () => {
  assert.equal(parseDollarAmount('$2,667,000'), 2_667_000)
  assert.equal(parseDollarAmount('$3.92M'), 3_920_000)
  assert.equal(parseDollarAmount('$215K'), 215_000)
  assert.equal(parseDollarAmount('$1.5 million'), 1_500_000)
  assert.equal(parseDollarAmount('$80,000.00'), 80_000)
  assert.equal(parseDollarAmount('no amount here'), null)
})
