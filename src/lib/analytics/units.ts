// =============================================================================
// Unit parsing & formatting — handles "247.8M", "$1.12B", "—", numbers, etc.
// =============================================================================

const SUFFIX_MULT: Record<string, number> = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
  T: 1_000_000_000_000,
}

/** Parse a value like "$1.12B" / "247.8M" / "-3.4K" / 12.34 / null → number | null */
export function parseValue(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string') return null
  const cleaned = v.replace(/[\s$,]/g, '').trim()
  if (!cleaned || cleaned === '-' || cleaned === '—') return null
  const m = cleaned.match(/^(-?\d+(?:\.\d+)?)([KMBT])?$/i)
  if (!m) return null
  const n = parseFloat(m[1])
  if (!Number.isFinite(n)) return null
  const suf = m[2]?.toUpperCase()
  return suf ? n * SUFFIX_MULT[suf] : n
}

/** Compact format: 1_234_567 → "1.23M". Preserves sign. */
export function formatCompact(n: number | null | undefined, opts?: { digits?: number }): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const digits = opts?.digits ?? 2
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(digits)}T`
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(digits)}B`
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(digits)}M`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(digits)}K`
  return `${sign}${abs.toFixed(digits)}`
}

/** EPS formatting: typically small numbers, 2 decimals */
export function formatEps(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

/** Percentage with sign and 1 decimal: 12.345 → "+12.3%". */
export function formatPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

/** Currency formatter for revenue / market cap, prefixed with $. */
export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `$${formatCompact(n)}`
}

/** Basis points formatting: 150 → "+150 bps". */
export function formatBps(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${Math.round(n)} bps`
}
