import type { Metadata } from 'next'
import { ContractAnalyzer } from '@/components/ContractAnalyzer'
import { disclaimers } from '@/lib/ira'

export const metadata: Metadata = {
  title: 'Contract Analyzer | BEAM',
  description:
    "Paste a loan or investment contract and see what it covers and what is missing, scored against the financing guidance in SCORE's resource library.",
}

export default function AnalyzerPage() {
  return <ContractAnalyzer legalDisclaimer={disclaimers.legal} />
}
