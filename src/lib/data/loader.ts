// =============================================================================
// Data loader & normalization — JSON → Dataset with full derived metrics.
// =============================================================================
import type {
  Company,
  Dataset,
  DayBucket,
  Metric,
  RawCompany,
  RawDataset,
  RawDay,
  RawMetric,
} from '@/lib/types'
import { parseValue } from '@/lib/analytics/units'
import { derive, marginChangeBps, marginProxy } from '@/lib/analytics/growth'
import { computeQuality, deriveVerdict } from '@/lib/analytics/quality'
import { detectFraud, topSeverity } from '@/lib/analytics/fraud'

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}

/** "Monday Mar 30" → "2026-03-30" (year defaults to 2026; matches dataset). */
function parseDateLabel(label: string, defaultYear = 2026): { iso: string | null; weekday: string } {
  // Pattern: "Weekday Mon DD"
  const m = label.match(/^(\w+)\s+(\w{3})\s+(\d{1,2})$/)
  if (!m) return { iso: null, weekday: '' }
  const [, weekday, mon, day] = m
  const monthNum = MONTHS[mon]
  if (!monthNum) return { iso: null, weekday }
  const iso = `${defaultYear}-${String(monthNum).padStart(2, '0')}-${String(parseInt(day, 10)).padStart(2, '0')}`
  return { iso, weekday }
}

function normalizeMetric(m: RawMetric | undefined | null): Metric {
  if (!m) return { actual: null, consensus: null, previous: null }
  return {
    actual: parseValue(m.actual),
    consensus: parseValue(m.consensus),
    previous: parseValue(m.previous),
  }
}

function normalizeCompany(rc: RawCompany, day: RawDay, year = 2026): Company {
  const { iso, weekday } = parseDateLabel(day.date, year)
  const eps = normalizeMetric(rc.eps)
  const revenue = normalizeMetric(rc.revenue)
  const epsDerived = derive(eps)
  const revenueDerived = derive(revenue)
  const marginNow = marginProxy(eps.actual, revenue.actual)
  const marginPrev = marginProxy(eps.previous, revenue.previous)
  const marginChange = marginChangeBps(marginNow, marginPrev)
  const marketCap = parseValue(rc.market_cap)

  const fraudInput = {
    eps,
    revenue,
    epsDerived,
    revenueDerived,
    marginProxyChangeBps: marginChange,
  }
  const flags = detectFraud(fraudInput)

  const partial: Pick<Company, 'epsDerived' | 'revenueDerived' | 'marginProxyChangeBps' | 'flags'> = {
    epsDerived,
    revenueDerived,
    marginProxyChangeBps: marginChange,
    flags,
  }
  const quality = computeQuality(partial)
  const verdict = deriveVerdict({ epsDerived, revenueDerived })

  return {
    name: rc.name,
    ticker: rc.ticker,
    date: day.date,
    isoDate: iso,
    weekday,
    time: rc.time,
    fiscalQuarter: rc.fiscal_quarter,
    marketCap,
    marketCapLabel: rc.market_cap ?? null,
    eps,
    revenue,
    epsDerived,
    revenueDerived,
    marginProxyActual: marginNow,
    marginProxyPrevious: marginPrev,
    marginProxyChangeBps: marginChange,
    qualityScore: quality.score,
    qualityBreakdown: quality.breakdown,
    verdict,
    flags,
    topSeverity: topSeverity(flags),
  }
}

export function normalizeDataset(raw: RawDataset, year = 2026): Dataset {
  const days: DayBucket[] = []
  const all: Company[] = []

  for (const day of raw.data) {
    const { iso, weekday } = parseDateLabel(day.date, year)
    const companies = day.companies.map((rc) => normalizeCompany(rc, day, year))
    // Deduplicate (some entries appear twice in the source)
    const seen = new Set<string>()
    const deduped: Company[] = []
    for (const c of companies) {
      const key = `${c.ticker}|${c.isoDate}|${c.time}`
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(c)
    }
    days.push({ label: day.date, isoDate: iso, weekday, companies: deduped })
    all.push(...deduped)
  }

  return {
    sourceUrl: raw.source_url,
    generatedAt: new Date().toISOString(),
    days,
    companies: all,
  }
}

/** Browser-side fetch & normalize. */
export async function loadDataset(url = './data/earnings.json'): Promise<Dataset> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load earnings data: ${res.status}`)
  const raw = (await res.json()) as RawDataset
  return normalizeDataset(raw)
}
