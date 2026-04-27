// =============================================================================
// Growth & beat math (the heart of the moat)
// =============================================================================
import type { DerivedMetric, Metric } from '@/lib/types'

/**
 * YoY growth in %, signed. Symmetric handling for negative previous values:
 * we use |previous| in denominator so a swing from -1 → +1 is reported as
 * +200%, and from +1 → -1 as -200%.
 */
export function yoyGrowth(actual: number | null, previous: number | null): number | null {
  if (actual === null || previous === null) return null
  if (previous === 0) {
    // Avoid +/- Infinity. If actual is also 0, treat as 0 growth.
    if (actual === 0) return 0
    return null
  }
  return ((actual - previous) / Math.abs(previous)) * 100
}

/**
 * Beat magnitude vs consensus, in %, signed.
 * +X% means beat by X%, -X% means missed by X%.
 */
export function beatPct(actual: number | null, consensus: number | null): number | null {
  if (actual === null || consensus === null) return null
  if (consensus === 0) {
    if (actual === 0) return 0
    return null
  }
  return ((actual - consensus) / Math.abs(consensus)) * 100
}

/** Absolute surprise: actual - consensus, signed. */
export function surprise(actual: number | null, consensus: number | null): number | null {
  if (actual === null || consensus === null) return null
  return actual - consensus
}

/** Compute the full derived metric for an EPS or revenue line. */
export function derive(metric: Metric): DerivedMetric {
  const yoy = yoyGrowth(metric.actual, metric.previous)
  const beat = beatPct(metric.actual, metric.consensus)
  const surp = surprise(metric.actual, metric.consensus)
  return {
    yoy,
    beat,
    surprise: surp,
    beatConsensus: beat === null ? null : beat >= 0,
    grewYoY: yoy === null ? null : yoy >= 0,
  }
}

/**
 * Margin proxy (EPS / Revenue). Not a true operating margin but a useful
 * directional indicator when only EPS + revenue are available.
 */
export function marginProxy(eps: number | null, revenue: number | null): number | null {
  if (eps === null || revenue === null) return null
  if (revenue === 0) return null
  return eps / revenue
}

/** Margin change in basis points (1bp = 0.01%). */
export function marginChangeBps(currentMargin: number | null, prevMargin: number | null): number | null {
  if (currentMargin === null || prevMargin === null) return null
  return (currentMargin - prevMargin) * 10_000
}
