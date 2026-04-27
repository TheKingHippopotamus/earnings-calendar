// =============================================================================
// Selectors — apply filters / sort / search to the dataset.
// =============================================================================
import Fuse from 'fuse.js'
import type { Company, Dataset } from '@/lib/types'
import type { FilterState, SortKey, SortDir } from '@/lib/store/useAppStore'

export interface SelectorOptions {
  filter: FilterState
  sort: { key: SortKey; dir: SortDir }
}

let fuseCache: { dataset: Dataset; fuse: Fuse<Company> } | null = null

function getFuse(dataset: Dataset): Fuse<Company> {
  if (fuseCache && fuseCache.dataset === dataset) return fuseCache.fuse
  const fuse = new Fuse(dataset.companies, {
    keys: [
      { name: 'ticker', weight: 0.7 },
      { name: 'name', weight: 0.3 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
  })
  fuseCache = { dataset, fuse }
  return fuse
}

function passesFilter(c: Company, f: FilterState): boolean {
  if (f.verdicts.size && !f.verdicts.has(c.verdict)) return false
  if (f.quarters.size && !f.quarters.has(c.fiscalQuarter)) return false
  if (f.times.size && !f.times.has(c.time)) return false
  if (f.onlyFlagged && c.flags.length === 0) return false
  if (f.minQuality !== null && c.qualityScore < f.minQuality) return false
  if (f.minMarketCap !== null && (c.marketCap ?? -Infinity) < f.minMarketCap) return false
  if (f.maxMarketCap !== null && (c.marketCap ?? Infinity) > f.maxMarketCap) return false
  if (f.dateFrom && c.isoDate && c.isoDate < f.dateFrom) return false
  if (f.dateTo && c.isoDate && c.isoDate > f.dateTo) return false
  return true
}

const SORT_VALUE: Record<SortKey, (c: Company) => number> = {
  date: (c) => (c.isoDate ? new Date(c.isoDate).getTime() : 0),
  qualityScore: (c) => c.qualityScore,
  epsBeat: (c) => c.epsDerived.beat ?? -Infinity,
  revenueBeat: (c) => c.revenueDerived.beat ?? -Infinity,
  epsYoy: (c) => c.epsDerived.yoy ?? -Infinity,
  revenueYoy: (c) => c.revenueDerived.yoy ?? -Infinity,
  marketCap: (c) => c.marketCap ?? -Infinity,
  marginChange: (c) => c.marginProxyChangeBps ?? -Infinity,
}

export function selectCompanies(dataset: Dataset, opts: SelectorOptions): Company[] {
  const { filter, sort } = opts

  let pool: Company[]
  if (filter.query.trim()) {
    const fuse = getFuse(dataset)
    pool = fuse.search(filter.query.trim()).map((r) => r.item)
  } else {
    pool = dataset.companies
  }

  const filtered = pool.filter((c) => passesFilter(c, filter))

  const valueOf = SORT_VALUE[sort.key]
  const factor = sort.dir === 'desc' ? -1 : 1
  const sorted = [...filtered].sort((a, b) => {
    const va = valueOf(a)
    const vb = valueOf(b)
    if (va === vb) {
      // tiebreak by ticker for deterministic order
      return a.ticker.localeCompare(b.ticker) * factor
    }
    return (va < vb ? -1 : 1) * factor
  })

  return sorted
}

/** Re-group filtered companies by their day labels, preserving day order. */
export function groupByDay(dataset: Dataset, companies: Company[]) {
  const order = dataset.days.map((d) => d.label)
  const orderIdx = new Map(order.map((l, i) => [l, i]))
  const buckets = new Map<string, Company[]>()
  for (const c of companies) {
    const arr = buckets.get(c.date) ?? []
    arr.push(c)
    buckets.set(c.date, arr)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => (orderIdx.get(a[0]) ?? 999) - (orderIdx.get(b[0]) ?? 999))
    .map(([label, items]) => {
      const day = dataset.days.find((d) => d.label === label)
      return {
        label,
        isoDate: day?.isoDate ?? null,
        weekday: day?.weekday ?? '',
        companies: items,
      }
    })
}
