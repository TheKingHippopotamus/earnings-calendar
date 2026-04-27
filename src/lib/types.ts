// =============================================================================
// Domain types
// =============================================================================

export interface RawMetric {
  actual: number | string | null
  consensus: number | string | null
  previous: number | string | null
}

export interface RawCompany {
  name: string
  ticker: string
  eps: RawMetric
  revenue: RawMetric
  market_cap: string | null
  fiscal_quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | string
  time: 'AM' | 'PM' | string
}

export interface RawDay {
  date: string // e.g. "Monday Mar 30"
  companies: RawCompany[]
}

export interface RawDataset {
  source_url: string
  source_update_mode: string
  data: RawDay[]
}

// -----------------------------------------------------------------------------
// Normalized + derived (the moat)
// -----------------------------------------------------------------------------

export interface Metric {
  actual: number | null
  consensus: number | null
  previous: number | null
}

export interface DerivedMetric {
  /** YoY growth (%, signed). null if previous missing or zero */
  yoy: number | null
  /** Beat magnitude vs consensus (%, signed). null if consensus missing/zero */
  beat: number | null
  /** Absolute surprise vs consensus (signed) */
  surprise: number | null
  /** Did it beat consensus? null if no consensus */
  beatConsensus: boolean | null
  /** Did it grow YoY? null if no previous */
  grewYoY: boolean | null
}

export type FraudSeverity = 'low' | 'medium' | 'high'

export interface FraudFlag {
  id: string
  label: string
  severity: FraudSeverity
  detail: string
}

export interface QualityBreakdown {
  revenueGrowthScore: number
  epsGrowthScore: number
  revenueBeatScore: number
  epsBeatScore: number
  marginScore: number
  fraudPenalty: number
}

export interface Company {
  // identity
  name: string
  ticker: string

  // schedule
  date: string // raw label "Monday Mar 30"
  isoDate: string | null // "2026-03-30"
  weekday: string
  time: 'AM' | 'PM' | string
  fiscalQuarter: string

  // raw
  marketCap: number | null
  marketCapLabel: string | null
  eps: Metric
  revenue: Metric

  // derived
  epsDerived: DerivedMetric
  revenueDerived: DerivedMetric

  /** Implied operating margin proxy (EPS / Revenue actual). Useful only for trend. */
  marginProxyActual: number | null
  marginProxyPrevious: number | null
  marginProxyChangeBps: number | null

  /** Composite quality score 0-100 (higher = better, fraud-aware) */
  qualityScore: number
  qualityBreakdown: QualityBreakdown

  /** Verdict shorthand */
  verdict: 'beat' | 'mixed' | 'miss' | 'unknown'

  /** Fraud / anomaly flags */
  flags: FraudFlag[]
  /** Highest severity flag (or null) */
  topSeverity: FraudSeverity | null
}

export interface DayBucket {
  label: string // "Monday Mar 30"
  isoDate: string | null
  weekday: string
  companies: Company[]
}

export interface Dataset {
  sourceUrl: string
  generatedAt: string
  days: DayBucket[]
  companies: Company[]
}
