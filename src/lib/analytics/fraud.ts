// =============================================================================
// Fraud / anomaly rules engine — operates on a (partially-)derived Company.
// Each rule is independent; explanations are user-facing strings.
// =============================================================================
import type { Company, FraudFlag } from '@/lib/types'
import { formatBps, formatPct } from '@/lib/analytics/units'

export interface FraudInput {
  eps: Company['eps']
  revenue: Company['revenue']
  epsDerived: Company['epsDerived']
  revenueDerived: Company['revenueDerived']
  marginProxyChangeBps: Company['marginProxyChangeBps']
}

type Rule = (c: FraudInput) => FraudFlag | null

// -----------------------------------------------------------------------------
// Rules
// -----------------------------------------------------------------------------

/** EPS up sharply while revenue declines — classic margin-engineering / one-time tell. */
const epsRevDivergence: Rule = (c) => {
  const e = c.epsDerived.yoy
  const r = c.revenueDerived.yoy
  if (e === null || r === null) return null
  if (e >= 30 && r <= -5) {
    return {
      id: 'eps_rev_divergence',
      label: 'EPS / Revenue divergence',
      severity: e >= 60 || r <= -15 ? 'high' : 'medium',
      detail: `EPS ${formatPct(e)} YoY while revenue ${formatPct(r)} YoY — possible one-time gains, buyback inflation, or margin engineering.`,
    }
  }
  return null
}

/** Beat EPS, miss revenue significantly — low-quality beat. */
const lowQualityBeat: Rule = (c) => {
  const eb = c.epsDerived.beat
  const rb = c.revenueDerived.beat
  if (eb === null || rb === null) return null
  if (eb >= 1 && rb <= -2) {
    return {
      id: 'low_quality_beat',
      label: 'Low-quality EPS beat',
      severity: rb <= -5 ? 'medium' : 'low',
      detail: `EPS beat consensus by ${formatPct(eb)} but revenue missed by ${formatPct(rb)} — beat driven by below-the-line items, not topline.`,
    }
  }
  return null
}

/** Margin spiked sharply without proportional revenue support. */
const marginSpike: Rule = (c) => {
  const bps = c.marginProxyChangeBps
  const r = c.revenueDerived.yoy
  if (bps === null) return null
  if (bps >= 500 && (r === null || r < 5)) {
    return {
      id: 'margin_spike',
      label: 'Margin spike without growth',
      severity: bps >= 1500 ? 'high' : 'medium',
      detail: `Implied margin expanded ${formatBps(bps)} YoY with revenue ${r === null ? 'flat/unknown' : formatPct(r)} — verify for one-offs, accounting changes, or share-count effects.`,
    }
  }
  return null
}

/** Beat that was set up by a sandbagged consensus (consensus << previous result). */
const sandbaggedConsensus: Rule = (c) => {
  const cons = c.eps.consensus
  const prev = c.eps.previous
  const eb = c.epsDerived.beat
  if (cons === null || prev === null || eb === null) return null
  if (prev <= 0) return null
  // Consensus reset down >25% vs previous, then beaten
  const reset = ((cons - prev) / Math.abs(prev)) * 100
  if (reset <= -25 && eb >= 5) {
    return {
      id: 'sandbagged_consensus',
      label: 'Reset & beat',
      severity: 'low',
      detail: `Consensus was reset ${formatPct(reset)} below prior-year EPS, then beaten by ${formatPct(eb)} — beat is partly mechanical.`,
    }
  }
  return null
}

/** EPS exactly meeting consensus — managed-earnings smell test. */
const exactlyMet: Rule = (c) => {
  const a = c.eps.actual
  const cons = c.eps.consensus
  if (a === null || cons === null || cons === 0) return null
  const diff = Math.abs(a - cons)
  if (diff < 0.005 && Math.abs(cons) >= 0.05) {
    return {
      id: 'exactly_met',
      label: 'EPS exactly meets consensus',
      severity: 'low',
      detail: `Actual EPS ${a.toFixed(2)} vs consensus ${cons.toFixed(2)} — suspicious precision, common with smoothed earnings.`,
    }
  }
  return null
}

/** Big revenue miss vs consensus. */
const majorRevenueMiss: Rule = (c) => {
  const rb = c.revenueDerived.beat
  if (rb === null) return null
  if (rb <= -5) {
    return {
      id: 'major_revenue_miss',
      label: 'Major revenue miss',
      severity: rb <= -10 ? 'high' : 'medium',
      detail: `Revenue missed consensus by ${formatPct(rb)} — demand or pricing problem.`,
    }
  }
  return null
}

/** Implausibly large EPS swing (e.g., +500%+ off a near-zero base). */
const implausibleEpsSwing: Rule = (c) => {
  const e = c.epsDerived.yoy
  const r = c.revenueDerived.yoy
  if (e === null) return null
  if (Math.abs(e) >= 500 && (r === null || Math.abs(r) < 50)) {
    return {
      id: 'implausible_eps_swing',
      label: 'Implausible EPS swing',
      severity: 'medium',
      detail: `EPS YoY ${formatPct(e)} with revenue ${r === null ? 'unknown' : formatPct(r)} — likely off a near-zero base; growth % is mechanically inflated.`,
    }
  }
  return null
}

/** EPS down sharply while revenue grew — operating deleverage / cost spike. */
const epsCollapseRevGrowth: Rule = (c) => {
  const e = c.epsDerived.yoy
  const r = c.revenueDerived.yoy
  if (e === null || r === null) return null
  if (e <= -30 && r >= 5) {
    return {
      id: 'eps_collapse_rev_growth',
      label: 'EPS collapse vs revenue growth',
      severity: e <= -60 ? 'high' : 'medium',
      detail: `Revenue grew ${formatPct(r)} but EPS fell ${formatPct(e)} — likely cost inflation, dilution, or impairment.`,
    }
  }
  return null
}

/** Beat looks tiny (< 0.5%) — within noise; flag to be aware. */
const trivialBeat: Rule = (c) => {
  const eb = c.epsDerived.beat
  if (eb === null) return null
  if (eb > 0 && eb < 0.5 && c.revenueDerived.beat !== null && c.revenueDerived.beat < 0.5) {
    return {
      id: 'trivial_beat',
      label: 'In-line / trivial beat',
      severity: 'low',
      detail: `Both EPS and revenue beat consensus by under 0.5% — effectively in-line.`,
    }
  }
  return null
}

const RULES: Rule[] = [
  epsRevDivergence,
  lowQualityBeat,
  marginSpike,
  sandbaggedConsensus,
  exactlyMet,
  majorRevenueMiss,
  implausibleEpsSwing,
  epsCollapseRevGrowth,
  trivialBeat,
]

export function detectFraud(c: FraudInput): FraudFlag[] {
  const out: FraudFlag[] = []
  for (const rule of RULES) {
    const f = rule(c)
    if (f) out.push(f)
  }
  return out
}

const SEV_RANK: Record<FraudFlag['severity'], number> = { low: 1, medium: 2, high: 3 }

export function topSeverity(flags: FraudFlag[]): FraudFlag['severity'] | null {
  let top: FraudFlag['severity'] | null = null
  for (const f of flags) {
    if (top === null || SEV_RANK[f.severity] > SEV_RANK[top]) top = f.severity
  }
  return top
}
