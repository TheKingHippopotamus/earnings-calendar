// =============================================================================
// Composite quality score (0..100). Higher = better, fraud-aware.
// =============================================================================
import type { Company, FraudFlag, QualityBreakdown } from '@/lib/types'

/** Smoothly map a value through a logistic so extreme growth doesn't dominate. */
function squash(value: number, scale: number): number {
  // Map (-inf, inf) → (0, 1). At value=0 → 0.5, value=scale → ~0.73.
  const x = value / scale
  return 1 / (1 + Math.exp(-x))
}

/** 0..100 score for revenue YoY growth. Anchored: -25% → ~10, 0% → 50, +25% → ~73, +50% → ~88. */
function revenueGrowthScore(yoy: number | null): number {
  if (yoy === null) return 50
  return Math.round(squash(yoy, 25) * 100)
}

function epsGrowthScore(yoy: number | null): number {
  if (yoy === null) return 50
  // EPS is more volatile, larger scale
  return Math.round(squash(yoy, 50) * 100)
}

function beatScore(beatPct: number | null): number {
  if (beatPct === null) return 50
  // ±5% beat is meaningful in equities terms
  return Math.round(squash(beatPct, 5) * 100)
}

function marginScore(changeBps: number | null): number {
  if (changeBps === null) return 50
  // ±200 bps margin shift is significant
  return Math.round(squash(changeBps, 200) * 100)
}

/** Fraud penalty in points subtracted from composite. */
function fraudPenalty(flags: FraudFlag[]): number {
  let penalty = 0
  for (const f of flags) {
    penalty += f.severity === 'high' ? 18 : f.severity === 'medium' ? 9 : 4
  }
  return Math.min(penalty, 50)
}

export interface QualityResult {
  score: number
  breakdown: QualityBreakdown
}

export function computeQuality(c: Pick<Company, 'epsDerived' | 'revenueDerived' | 'marginProxyChangeBps' | 'flags'>): QualityResult {
  const revG = revenueGrowthScore(c.revenueDerived.yoy)
  const epsG = epsGrowthScore(c.epsDerived.yoy)
  const revB = beatScore(c.revenueDerived.beat)
  const epsB = beatScore(c.epsDerived.beat)
  const margin = marginScore(c.marginProxyChangeBps)
  const penalty = fraudPenalty(c.flags)

  // Weighted average of components, then subtract fraud penalty.
  const weighted =
    revG * 0.30 +
    epsG * 0.20 +
    revB * 0.20 +
    epsB * 0.15 +
    margin * 0.15

  const score = Math.max(0, Math.min(100, Math.round(weighted - penalty)))

  return {
    score,
    breakdown: {
      revenueGrowthScore: revG,
      epsGrowthScore: epsG,
      revenueBeatScore: revB,
      epsBeatScore: epsB,
      marginScore: margin,
      fraudPenalty: penalty,
    },
  }
}

/** Verdict from EPS + revenue beat status. */
export function deriveVerdict(c: Pick<Company, 'epsDerived' | 'revenueDerived'>): Company['verdict'] {
  const e = c.epsDerived.beatConsensus
  const r = c.revenueDerived.beatConsensus
  if (e === null && r === null) return 'unknown'
  if (e === true && r === true) return 'beat'
  if (e === false && r === false) return 'miss'
  return 'mixed'
}
