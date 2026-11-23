'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ExternalLink, FileSearch, Lock, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import {
  analyzeContract,
  type CheckResult,
  type ContractAnswers,
  type CriterionResult,
  type GroupResult,
} from '@/lib/contractAnalyzer'
import { CONTRACT_RUBRIC } from '@/lib/contractRubric'

const MINIMUM_WORDS = 30

/** The rubric's questions that only the person pasting the contract can answer. */
const answerQuestions = CONTRACT_RUBRIC.flatMap((group) =>
  group.criteria.flatMap((criterion) => criterion.checks.filter((check) => check.kind === 'answer'))
)

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

function verdictFor(score: number, max: number): string {
  const share = max === 0 ? 0 : score / max
  if (share >= 0.8) return 'Covers most of what we look for.'
  if (share >= 0.5) return 'Covers some. See the gaps below.'
  return 'Many gaps to close first.'
}

interface ContractAnalyzerProps {
  legalDisclaimer: string
}

export function ContractAnalyzer({ legalDisclaimer }: ContractAnalyzerProps) {
  const [draftText, setDraftText] = useState('')
  const [submittedText, setSubmittedText] = useState<string | null>(null)
  const [answers, setAnswers] = useState<ContractAnswers>({})
  const resultsRef = useRef<HTMLDivElement>(null)

  const draftWordCount = countWords(draftText)
  const canAnalyze = draftWordCount >= MINIMUM_WORDS

  const analysis = useMemo(
    () => (submittedText === null ? null : analyzeContract(submittedText, CONTRACT_RUBRIC, answers)),
    [submittedText, answers]
  )

  // Bring the results into view, since on a phone they open below the fold.
  useEffect(() => {
    if (submittedText !== null) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [submittedText])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (canAnalyze) setSubmittedText(draftText)
  }

  const handleClear = () => {
    setDraftText('')
    setSubmittedText(null)
    setAnswers({})
  }

  return (
    <>
      {/* Header */}
      <section className="relative pt-28 md:pt-36 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-beam-50 via-white to-accent-50/30" />
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="relative container-tight text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-beam-100 text-beam-700 rounded-full text-sm font-medium mb-4">
            <FileSearch className="w-4 h-4" />
            Free tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Contract <span className="gradient-text">Analyzer</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Paste a loan or investment contract. See what it covers and what is missing, scored
            against the financing guidance in SCORE&apos;s resource library.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-tight space-y-8">
          {/* Input */}
          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6">
            <div>
              <label htmlFor="contract-text" className="label">
                Your contract
              </label>
              <textarea
                id="contract-text"
                name="contract-text"
                rows={12}
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder="Paste the full text of the contract or term sheet here."
                className="textarea"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  Your text stays in your browser. Nothing is uploaded or saved.
                </span>
                <span>{draftWordCount.toLocaleString('en-US')} words</span>
              </div>
            </div>

            <fieldset>
              <legend className="label">Tick what is true. Only you can know these.</legend>
              <div className="grid sm:grid-cols-2 gap-3">
                {answerQuestions.map((question) => (
                  <label
                    key={question.id}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm text-gray-700 hover:border-beam-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-beam-600 focus:ring-beam-500"
                      checked={answers[question.id] === true}
                      onChange={(event) =>
                        setAnswers((previous) => ({ ...previous, [question.id]: event.target.checked }))
                      }
                    />
                    <span>{question.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!canAnalyze} className="btn-primary btn-md">
                Analyze contract
              </button>
              <button type="button" onClick={handleClear} className="btn-ghost btn-md">
                Clear
              </button>
              {!canAnalyze && draftWordCount > 0 && (
                <span className="text-sm text-gray-500">
                  Paste at least {MINIMUM_WORDS} words to analyze.
                </span>
              )}
            </div>
          </form>

          {/* Results */}
          <div ref={resultsRef} aria-live="polite" className="space-y-8 scroll-mt-24">
            {analysis && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {analysis.groups.map((group) => (
                    <ScoreTile key={group.id} group={group} />
                  ))}
                </div>

                {analysis.flags.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-900 mb-3">
                      <AlertTriangle className="w-5 h-5" />
                      Read these first
                    </h2>
                    <ul className="space-y-2 text-amber-900">
                      {analysis.flags.map((flag) => (
                        <li key={flag.id} className="flex gap-2">
                          <span aria-hidden="true">&bull;</span>
                          <span>{flag.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.groups.map((group) => (
                  <div key={group.id}>
                    <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
                    <p className="text-gray-600 mb-4">{group.description}</p>
                    <div className="space-y-4">
                      {group.criteria.map((criterion) => (
                        <CriterionCard key={criterion.id} criterion={criterion} />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 space-y-4">
                  <p className="text-gray-700">
                    This tool checks what the document says. It cannot tell whether a term is fair,
                    or whether a statement in it is true. {legalDisclaimer}
                  </p>
                  <Link href="/#contact" className="btn-primary btn-md">
                    Review it with a mentor
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function ScoreTile({ group }: { group: GroupResult }) {
  const sharePercent = group.max === 0 ? 0 : Math.round((group.score / group.max) * 100)

  return (
    <div className="card p-6">
      <div className="text-sm font-medium text-gray-500">{group.title}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-gray-900">{group.score}</span>
        <span className="text-lg text-gray-500">of {group.max}</span>
      </div>
      <div
        className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-label={`${group.title} score`}
        aria-valuenow={group.score}
        aria-valuemin={0}
        aria-valuemax={group.max}
      >
        <div className="h-full rounded-full bg-beam-600" style={{ width: `${sharePercent}%` }} />
      </div>
      <p className="mt-3 text-sm text-gray-600">{verdictFor(group.score, group.max)}</p>
    </div>
  )
}

function CriterionCard({ criterion }: { criterion: CriterionResult }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{criterion.title}</h3>
          <p className="text-sm text-gray-500">{criterion.why}</p>
        </div>
        <div
          className={clsx(
            'shrink-0 rounded-full px-3 py-1 text-sm font-semibold',
            criterion.score === criterion.max
              ? 'bg-green-100 text-green-800'
              : criterion.score === 0
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
          )}
        >
          {criterion.score} of {criterion.max}
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {criterion.checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </ul>

      {criterion.sources.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-gray-500">From SCORE:</span>
          {criterion.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-beam-600 hover:text-beam-700"
            >
              {source.title}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <li className="flex gap-3">
      {check.passed ? (
        <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 mt-0.5" aria-label="Found" />
      ) : (
        <XCircle className="w-5 h-5 shrink-0 text-gray-400 mt-0.5" aria-label="Missing" />
      )}
      <div className="min-w-0">
        <div className={clsx('text-sm', check.passed ? 'text-gray-900' : 'text-gray-600')}>
          {check.label}{' '}
          <span className="text-gray-400">
            ({check.earned} of {check.points})
          </span>
        </div>
        {check.evidence && (
          <p className="mt-0.5 text-sm text-gray-500 italic break-words">{check.evidence}</p>
        )}
      </div>
    </li>
  )
}
