/**
 * Contract rubric
 *
 * The questions the contract analyzer asks of a loan, investment or purchase
 * contract. Two groups:
 *
 *  - "Deal terms": built from the financing guidance in the SCORE resource
 *    library (scraper/data/raw/score_content.json). Each criterion links to the
 *    SCORE resource it comes from.
 *  - "Contract readiness": standard contract checks. These do not come from
 *    SCORE's library.
 *
 * Every criterion is worth 5 points, split across its checks.
 * This file holds data only. The scoring lives in contractAnalyzer.ts.
 */

export interface RubricSource {
  title: string
  url: string
}

interface RubricCheckBase {
  id: string
  /** Plain statement of what earns the points. Shown to the user either way. */
  label: string
  points: number
}

/** Passes when any pattern is found in the text. */
export interface PresentCheck extends RubricCheckBase {
  kind: 'present'
  patterns: RegExp[]
}

/**
 * Passes when no pattern is found. If `requires` names another check in the
 * same criterion, that check must pass first, so silence never earns points.
 */
export interface AbsentCheck extends RubricCheckBase {
  kind: 'absent'
  patterns: RegExp[]
  requires?: string
  /** Raised as a warning whenever a pattern is found. */
  flagWhenFound?: { id: string; message: string }
}

/** Only the user can answer this. Scores 0 until they do. */
export interface AnswerCheck extends RubricCheckBase {
  kind: 'answer'
}

/** Passes when enough dollar amounts follow the anchor heading. */
export interface ItemizedAmountsCheck extends RubricCheckBase {
  kind: 'itemized-amounts'
  anchor: RegExp
  minimumAmounts: number
}

/** Passes when the loan is no larger than the stated collateral value. */
export interface LoanWithinCollateralCheck extends RubricCheckBase {
  kind: 'loan-within-collateral'
}

export type RubricCheck =
  | PresentCheck
  | AbsentCheck
  | AnswerCheck
  | ItemizedAmountsCheck
  | LoanWithinCollateralCheck

export interface RubricCriterion {
  id: string
  title: string
  /** One line on why this matters to a small business owner. */
  why: string
  checks: RubricCheck[]
  sources: RubricSource[]
}

export interface RubricGroup {
  id: string
  title: string
  description: string
  criteria: RubricCriterion[]
}

export type ContractRubric = RubricGroup[]

const USE_OF_FUNDS_HEADING = /use of (the )?(loan |sale )?(funds|proceeds)|sources and uses/i

const NONBINDING_PATTERNS = [
  /non-?binding/i,
  /discussion draft/i,
  /letter of intent/i,
  /not for signature/i,
  /draft for [^.\n]{0,30}review/i,
  /no obligation to (fund|close)/i,
]

const dealTerms: RubricGroup = {
  id: 'deal',
  title: 'Deal terms',
  description: "Built from the financing guidance in SCORE's resource library.",
  criteria: [
    {
      id: 'use-of-funds',
      title: 'Use of funds is clear',
      why: 'A lender and a mentor both want to see where each dollar goes.',
      checks: [
        {
          id: 'has-use-of-funds',
          kind: 'present',
          points: 2,
          label: 'Has a use of funds section',
          patterns: [USE_OF_FUNDS_HEADING],
        },
        {
          id: 'itemizes-amounts',
          kind: 'itemized-amounts',
          points: 2,
          label: 'Lists at least three dollar amounts under it',
          anchor: USE_OF_FUNDS_HEADING,
          minimumAmounts: 3,
        },
        {
          id: 'states-total',
          kind: 'present',
          points: 1,
          label: 'Gives a total',
          patterns: [
            /(project costs?|total uses|total cost|loan amount)[^$]{0,40}\$\s?\d/i,
            /\btotal\s*:?\s*\$\s?\d/i,
          ],
        },
      ],
      sources: [
        {
          title: 'Startup Expenses template',
          url: 'https://www.score.org/resource/template/startup-expenses',
        },
        {
          title: 'Bank Loan Request for Small Business',
          url: 'https://www.score.org/resource/article/bank-loan-request-small-business',
        },
      ],
    },
    {
      id: 'repayment',
      title: 'Repayment fits your cash flow',
      why: 'Payments that come due before the cash does are the usual way a good business fails.',
      checks: [
        {
          id: 'states-schedule',
          kind: 'present',
          points: 1,
          label: 'Says when payments are due',
          patterns: [
            /(monthly|quarterly|annual|weekly) (payments?|installments?)/i,
            /payment (schedule|date)/i,
            /amortiz/i,
            /payments? (is|are) due/i,
          ],
        },
        {
          id: 'states-length',
          kind: 'present',
          points: 1,
          label: 'Says how long you have to repay',
          patterns: [
            /maturity/i,
            /\bterm of \w+ (years?|months?)/i,
            /over \w+ (years?|months?)/i,
            /\w+[- ]year term/i,
          ],
        },
        {
          id: 'grace-period',
          kind: 'present',
          points: 1,
          label: 'Gives an interest-only or start-up period',
          patterns: [
            /interest[- ]only/i,
            /grace period/i,
            /deferr(ed|al)/i,
            /start-?up period/i,
            /no payments? (is |are )?(due|required) (until|before)/i,
          ],
        },
        {
          id: 'early-repayment',
          kind: 'present',
          points: 1,
          label: 'Lets you repay early without a penalty',
          patterns: [
            /(prepay|pre-pay|repay early|early repayment|repaid early)[^.\n]{0,80}(without|no) (premium or )?(premium|penalty|fee)/i,
            /any time,? without (premium or )?penalty/i,
          ],
        },
        {
          id: 'reserve-or-cover',
          kind: 'present',
          points: 1,
          label: 'Keeps a reserve, or ties payments to cash coming in',
          patterns: [
            /interest reserve/i,
            /debt service (reserve|coverage)/i,
            /reserve (equal|of)\b/i,
            /available cash/i,
            /cash sweep/i,
            /coverage ratio/i,
            /covers? (them|it|the payments?) (about )?[\d.]+ times/i,
          ],
        },
      ],
      sources: [
        {
          title: 'Navigating SBA Loans',
          url: 'https://www.score.org/resource/article/navigating-sba-loans-women-veteran-owned-businesses',
        },
        {
          title: 'Loan Amortization Schedule',
          url: 'https://www.score.org/resource/template/loan-amortization-schedule',
        },
        {
          title: 'Business Loan Estimator Tool',
          url: 'https://www.score.org/resource/tool/business-loan-estimator-tool',
        },
      ],
    },
    {
      id: 'cost',
      title: 'The cost of the money is stated',
      why: 'SCORE’s advice is to check the rate and the fees before you accept any loan.',
      checks: [
        {
          id: 'states-rate',
          kind: 'present',
          points: 2,
          label: 'States the interest rate',
          patterns: [
            /\d+(\.\d+)?\s?% (a|per) (year|annum)/i,
            /interest (rate )?(of|at|is|:)?\s?\d+(\.\d+)?\s?%/i,
            /\d+(\.\d+)?\s?% (simple |annual |fixed )?interest/i,
            /\bAPR\b/,
          ],
        },
        {
          id: 'rate-type',
          kind: 'present',
          points: 1,
          label: 'Says how interest is worked out (simple, fixed or variable)',
          patterns: [
            /\bsimple\b/i,
            /\b(non)?compound/i,
            /fixed (rate|interest)/i,
            /\b(variable|floating|adjustable)\b/i,
          ],
        },
        {
          id: 'states-fees',
          kind: 'present',
          points: 1,
          label: 'States the fees, or says there are none',
          patterns: [
            /origination fee/i,
            /\bpoints\b/i,
            /\bno fees?\b/i,
            /(closing|processing|application|late|commitment|underwriting) fee/i,
          ],
        },
        {
          id: 'early-cost',
          kind: 'present',
          points: 1,
          label: 'States any charge for paying early',
          patterns: [
            /minimum interest/i,
            /prepayment (penalty|premium|fee|charge)/i,
            /without (premium or )?penalty/i,
            /yield maintenance/i,
            /make-?whole/i,
          ],
        },
      ],
      sources: [
        {
          title: 'Best Small Business Financing Options',
          url: 'https://www.score.org/resource/blog-post/best-small-business-financing-options-women',
        },
        {
          title: 'Online Small Business Loan Worksheet',
          url: 'https://www.score.org/resource/template/online-small-business-loan-worksheet',
        },
      ],
    },
    {
      id: 'collateral',
      title: 'Collateral is reasonable for the loan',
      why: 'Know exactly what you could lose, and whether it covers what you borrow.',
      checks: [
        {
          id: 'names-collateral',
          kind: 'present',
          points: 2,
          label: 'Names what secures the loan',
          patterns: [
            /collateral/i,
            /deed of trust/i,
            /security interest/i,
            /\blien\b/i,
            /mortgage/i,
            /\bpledge/i,
            /secured by/i,
          ],
        },
        {
          id: 'states-value',
          kind: 'present',
          points: 1,
          label: 'States what the collateral is worth',
          patterns: [/apprais/i, /valued at/i, /market value/i],
        },
        {
          id: 'guarantee-stated',
          kind: 'present',
          points: 1,
          label: 'Says whether a personal guarantee is required',
          patterns: [/personal(ly)? guarant/i, /personally liable/i],
        },
        {
          id: 'loan-within-collateral',
          kind: 'loan-within-collateral',
          points: 1,
          label: 'The loan is no larger than the stated collateral value',
        },
      ],
      sources: [
        {
          title: 'SBA Disaster Loan Assistance',
          url: 'https://www.score.org/resource/article/sba-disaster-loan-assistance-your-lifeline-after-a-crisis',
        },
      ],
    },
    {
      id: 'lender-fit',
      title: 'The lender fits your business',
      why: 'A lender who knows your industry structures a loan you can live with.',
      checks: [
        {
          id: 'lender-checked',
          kind: 'answer',
          points: 3,
          label: 'You know who the lender is and have checked their record',
        },
        {
          id: 'lender-knows-industry',
          kind: 'answer',
          points: 2,
          label: 'The lender understands your industry',
        },
      ],
      sources: [
        {
          title: 'Navigating SBA Loans',
          url: 'https://www.score.org/resource/article/navigating-sba-loans-women-veteran-owned-businesses',
        },
      ],
    },
    {
      id: 'projections',
      title: 'The forecast has been tested',
      why: 'A forecast that only shows the good case tells you nothing about the bad one.',
      checks: [
        {
          id: 'has-forecast',
          kind: 'present',
          points: 1,
          label: 'Shows a forecast',
          patterns: [/forecast/i, /projection/i, /(low|base|high) case/i, /pro forma/i, /illustrative/i],
        },
        {
          id: 'tests-downside',
          kind: 'present',
          points: 2,
          label: 'Tests a worse case',
          patterns: [
            /\d+\s?% (lower|less|below|drop)/i,
            /downside/i,
            /worst case/i,
            /low case/i,
            /stress/i,
            /sensitivity/i,
          ],
        },
        {
          id: 'lists-assumptions',
          kind: 'present',
          points: 1,
          label: 'Lists its assumptions',
          patterns: [/assum(es?|ing|ptions?)\b/i],
        },
        {
          id: 'no-guarantee',
          kind: 'present',
          points: 1,
          label: 'Says results are not guaranteed',
          patterns: [/not (a )?guarantee/i, /no [^.\n]{0,60}(is|are) guaranteed/i, /\bestimates?\b/i],
        },
      ],
      sources: [
        {
          title: '3-Year Cash Flow Statement',
          url: 'https://www.score.org/resource/template/3-year-cash-flow-statement',
        },
        {
          title: 'Financial Projections Template',
          url: 'https://www.score.org/resource/template/financial-projections-template',
        },
      ],
    },
    {
      id: 'partners',
      title: 'Partners and key people are covered',
      why: 'An agreement among the owners protects everyone when plans change.',
      checks: [
        {
          id: 'names-roles',
          kind: 'present',
          points: 1,
          label: 'Names who runs the business',
          patterns: [
            /managing member/i,
            /\bthe manager of\b/i,
            /\bmanaged by\b/i,
            /\boperator\b/i,
            /key person/i,
            /(shall|will) manage/i,
            /general partner/i,
          ],
        },
        {
          id: 'has-owner-agreement',
          kind: 'present',
          points: 2,
          label: 'Refers to an operating, partnership or buy-sell agreement',
          patterns: [
            /operating agreement/i,
            /buy-?sell/i,
            /partnership agreement/i,
            /shareholders'? agreement/i,
          ],
        },
        {
          id: 'owner-agreement-settled',
          kind: 'absent',
          points: 2,
          requires: 'has-owner-agreement',
          label: 'Those agreements are in place, not left to be written later',
          patterns: [
            /to be (documented|agreed|negotiated|determined|written)/i,
            /will be set in/i,
            /shall agree their final terms/i,
          ],
        },
      ],
      sources: [
        {
          title: 'Covering Your Back: The Buy-Sell Agreement',
          url: 'https://www.score.org/resource/article/covering-your-back-buy-sell-agreement',
        },
      ],
    },
    {
      id: 'review',
      title: 'A professional has reviewed it',
      why: 'A second pair of trained eyes costs far less than a bad contract.',
      checks: [
        {
          id: 'lawyer-reviewed',
          kind: 'answer',
          points: 3,
          label: 'A lawyer has reviewed this document',
        },
        {
          id: 'mentor-reviewed',
          kind: 'answer',
          points: 2,
          label: 'A mentor or accountant has reviewed the numbers',
        },
      ],
      sources: [{ title: 'Find a SCORE mentor', url: 'https://www.score.org/find-mentor' }],
    },
  ],
}

const contractReadiness: RubricGroup = {
  id: 'readiness',
  title: 'Contract readiness',
  description: "Standard contract checks. These do not come from SCORE's library.",
  criteria: [
    {
      id: 'parties',
      title: 'The parties are named and exist',
      why: 'A contract with a party that does not exist yet binds no one.',
      checks: [
        {
          id: 'names-parties',
          kind: 'present',
          points: 2,
          label: 'Identifies both sides',
          patterns: [
            /\(\s?"?(the )?(borrower|lender|buyer|seller|investor|landlord|tenant|company|client|contractor)"?\s?\)/i,
            /\b(borrower|lender|buyer|seller|investor)\s?:/i,
            /\bbetween\b[^.]{3,200}\band\b/i,
          ],
        },
        {
          id: 'parties-complete',
          kind: 'absent',
          points: 3,
          requires: 'names-parties',
          label: 'No party is still to be formed or left blank',
          patterns: [
            /to be formed/i,
            /\[(investor|lender|buyer|seller|borrower|name|company|operating company)[^\]]*\]/i,
          ],
        },
      ],
      sources: [],
    },
    {
      id: 'binding',
      title: 'It commits the parties',
      why: 'A term sheet or draft is a plan. Only a binding agreement can be enforced.',
      checks: [
        {
          id: 'uses-obligation-words',
          kind: 'present',
          points: 2,
          label: 'Uses words that commit the parties',
          patterns: [/\bshall\b/i, /hereby agree/i, /\bagrees? to\b/i, /is entered into/i],
        },
        {
          id: 'not-nonbinding',
          kind: 'absent',
          points: 3,
          requires: 'uses-obligation-words',
          label: 'Does not call itself nonbinding or a draft',
          patterns: NONBINDING_PATTERNS,
          flagWhenFound: {
            id: 'nonbinding',
            message: 'This document says it is nonbinding or a draft. It does not commit anyone yet.',
          },
        },
      ],
      sources: [],
    },
    {
      id: 'money-terms',
      title: 'The money terms are complete',
      why: 'Amount, rate or price, dates and payment method should leave nothing to guess.',
      checks: [
        {
          id: 'states-amount',
          kind: 'present',
          points: 1,
          label: 'States the amount',
          patterns: [/\$\s?\d/],
        },
        {
          id: 'states-rate-or-price',
          kind: 'present',
          points: 1,
          label: 'States the rate or the price',
          patterns: [/\d\s?%/, /\bprice\b/i],
        },
        {
          id: 'states-term',
          kind: 'present',
          points: 1,
          label: 'States the term or the key dates',
          patterns: [/maturity/i, /\bterm of \w+ (years?|months?)/i, /closing date/i, /due (on|date)/i, /\b(19|20)\d\d\b/],
        },
        {
          id: 'states-payment',
          kind: 'present',
          points: 1,
          label: 'Says how and when money is paid',
          patterns: [/\bpayments?\b/i, /\bpayable\b/i, /\bpaid\b/i],
        },
        {
          id: 'no-blank-amounts',
          kind: 'absent',
          points: 1,
          requires: 'states-amount',
          label: 'Leaves no amount blank',
          patterns: [/\$\s?\[?_{2,}/, /\[\s?\$[^\]]*\]/, /\$\s?\[/, /\[_+\]\s?%/],
        },
      ],
      sources: [],
    },
    {
      id: 'security',
      title: 'Security is documented',
      why: 'A lien that is described but never recorded may not hold.',
      checks: [
        {
          id: 'describes-security',
          kind: 'present',
          points: 2,
          label: 'Describes what secures the deal',
          patterns: [
            /deed of trust/i,
            /security agreement/i,
            /security interest/i,
            /\bpledge/i,
            /mortgage/i,
            /\blien\b/i,
          ],
        },
        {
          id: 'perfection',
          kind: 'present',
          points: 2,
          label: 'Says how the security is recorded or perfected',
          patterns: [/record(ed|ing)\b/i, /\bUCC\b/, /financing statement/i, /title insurance/i, /perfect(ed|ion)\b/i],
        },
        {
          id: 'no-pending-consent',
          kind: 'absent',
          points: 1,
          requires: 'describes-security',
          label: 'Does not depend on a consent still to come',
          patterns: [/subject to [^.\n]{0,80}consent/i],
        },
      ],
      sources: [],
    },
    {
      id: 'closing',
      title: 'Closing steps and conditions are set',
      why: 'Each side should know what must happen before money moves.',
      checks: [
        {
          id: 'lists-conditions',
          kind: 'present',
          points: 2,
          label: 'Lists the conditions to closing or funding',
          patterns: [
            /conditions? (to|precedent)/i,
            /subject to (each of )?the following/i,
            /closing conditions/i,
            /conditioned on/i,
          ],
        },
        {
          id: 'names-date',
          kind: 'present',
          points: 1,
          label: 'Names a closing or funding date',
          patterns: [/closing date/i, /funding date/i, /target(ed)? (close|closing|for)/i, /outside date/i, /on or before/i],
        },
        {
          id: 'lists-deliveries',
          kind: 'present',
          points: 2,
          label: 'Says what each side must deliver',
          patterns: [/shall deliver/i, /deliver(y|ies) of/i, /deposit into escrow/i, /delivers (its|the|evidence)/i],
        },
      ],
      sources: [],
    },
    {
      id: 'default',
      title: 'Default, remedies and disputes are covered',
      why: 'If something goes wrong, the contract should already say what happens next.',
      checks: [
        {
          id: 'defines-default',
          kind: 'present',
          points: 2,
          label: 'Defines what counts as a default',
          patterns: [
            /events? of default/i,
            /constitutes? a default/i,
            /\bis in default\b/i,
            /default and remedies/i,
            /(buyer|seller|borrower|lender) default/i,
          ],
        },
        {
          id: 'states-remedies',
          kind: 'present',
          points: 1,
          label: 'States the remedies',
          patterns: [/remed(y|ies)/i, /accelerat/i, /foreclos/i, /liquidated damages/i, /specific performance/i],
        },
        {
          id: 'governing-law',
          kind: 'present',
          points: 1,
          label: 'Names the governing law',
          patterns: [/governing law/i, /governed by/i, /laws? of the state of/i, /\w+ law governs/i],
        },
        {
          id: 'venue',
          kind: 'present',
          points: 1,
          label: 'Names where disputes are heard',
          patterns: [/\bvenue\b/i, /jurisdiction/i, /arbitration/i, /mediation/i],
        },
      ],
      sources: [],
    },
    {
      id: 'signatures',
      title: 'It is ready to sign',
      why: 'Blanks and missing signature lines are where signed deals come apart.',
      checks: [
        {
          id: 'has-signature-lines',
          kind: 'present',
          points: 2,
          label: 'Has signature lines',
          patterns: [/\bsignatures?\b/i, /\bby:\s/i, /in witness whereof/i, /signed by/i],
        },
        {
          id: 'names-signers',
          kind: 'present',
          points: 1,
          label: 'Names who signs for each side',
          patterns: [
            /\bby:\s*\S/i,
            /\b(name|title|its):\s/i,
            /authorized (signatory|representative)/i,
            /,\s?by [A-Z][a-z]+ [A-Z][a-z]+,/,
          ],
        },
        {
          id: 'has-date',
          kind: 'present',
          points: 1,
          label: 'Carries a date',
          patterns: [/effective date/i, /entered into as of/i, /\bdated (as of )?\w+ \d/i, /\bdate:\s?/i],
        },
        {
          id: 'no-open-blanks',
          kind: 'absent',
          points: 1,
          requires: 'has-signature-lines',
          label: 'Has no blanks left to fill',
          patterns: [/\[[^\]\n]{0,80}\]/, /_{4,}/],
        },
      ],
      sources: [],
    },
  ],
}

export const CONTRACT_RUBRIC: ContractRubric = [dealTerms, contractReadiness]
