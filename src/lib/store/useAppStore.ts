// =============================================================================
// Global app state (Zustand) — filters, sort, UI prefs, fraud-rule toggles.
// =============================================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company, Dataset } from '@/lib/types'

export type SortKey =
  | 'date'
  | 'qualityScore'
  | 'epsBeat'
  | 'revenueBeat'
  | 'epsYoy'
  | 'revenueYoy'
  | 'marketCap'
  | 'marginChange'

export type SortDir = 'asc' | 'desc'

export type Verdict = Company['verdict']

export interface FilterState {
  query: string
  verdicts: Set<Verdict>
  quarters: Set<string> // Q1..Q4
  times: Set<string> // AM, PM
  minMarketCap: number | null
  maxMarketCap: number | null
  onlyFlagged: boolean
  minQuality: number | null
  /** ISO date range or null */
  dateFrom: string | null
  dateTo: string | null
}

export interface AppState {
  // data
  dataset: Dataset | null
  loading: boolean
  error: string | null
  setDataset: (d: Dataset) => void
  setLoading: (b: boolean) => void
  setError: (e: string | null) => void

  // filter
  filter: FilterState
  setQuery: (q: string) => void
  toggleVerdict: (v: Verdict) => void
  toggleQuarter: (q: string) => void
  toggleTime: (t: string) => void
  setMarketCapRange: (min: number | null, max: number | null) => void
  setOnlyFlagged: (b: boolean) => void
  setMinQuality: (n: number | null) => void
  setDateRange: (from: string | null, to: string | null) => void
  resetFilters: () => void

  // sort
  sort: { key: SortKey; dir: SortDir }
  setSort: (key: SortKey, dir?: SortDir) => void

  // ui prefs
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void

  // command palette
  paletteOpen: boolean
  setPaletteOpen: (b: boolean) => void

  // mobile nav
  mobileNavOpen: boolean
  setMobileNavOpen: (b: boolean) => void
}

const defaultFilter: FilterState = {
  query: '',
  verdicts: new Set<Verdict>(),
  quarters: new Set<string>(),
  times: new Set<string>(),
  minMarketCap: null,
  maxMarketCap: null,
  onlyFlagged: false,
  minQuality: null,
  dateFrom: null,
  dateTo: null,
}

// Sets aren't natively serialized by JSON; convert to/from arrays for persist.
type PersistedShape = {
  theme: 'dark' | 'light'
  sort: { key: SortKey; dir: SortDir }
  filter: Omit<FilterState, 'verdicts' | 'quarters' | 'times'> & {
    verdicts: Verdict[]
    quarters: string[]
    times: string[]
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      dataset: null,
      loading: false,
      error: null,
      setDataset: (d) => set({ dataset: d }),
      setLoading: (b) => set({ loading: b }),
      setError: (e) => set({ error: e }),

      filter: defaultFilter,
      setQuery: (q) =>
        set((s) => ({ filter: { ...s.filter, query: q } })),
      toggleVerdict: (v) =>
        set((s) => {
          const next = new Set(s.filter.verdicts)
          next.has(v) ? next.delete(v) : next.add(v)
          return { filter: { ...s.filter, verdicts: next } }
        }),
      toggleQuarter: (q) =>
        set((s) => {
          const next = new Set(s.filter.quarters)
          next.has(q) ? next.delete(q) : next.add(q)
          return { filter: { ...s.filter, quarters: next } }
        }),
      toggleTime: (t) =>
        set((s) => {
          const next = new Set(s.filter.times)
          next.has(t) ? next.delete(t) : next.add(t)
          return { filter: { ...s.filter, times: next } }
        }),
      setMarketCapRange: (min, max) =>
        set((s) => ({ filter: { ...s.filter, minMarketCap: min, maxMarketCap: max } })),
      setOnlyFlagged: (b) =>
        set((s) => ({ filter: { ...s.filter, onlyFlagged: b } })),
      setMinQuality: (n) =>
        set((s) => ({ filter: { ...s.filter, minQuality: n } })),
      setDateRange: (from, to) =>
        set((s) => ({ filter: { ...s.filter, dateFrom: from, dateTo: to } })),
      resetFilters: () => set({ filter: defaultFilter }),

      sort: { key: 'date', dir: 'asc' },
      setSort: (key, dir) =>
        set((s) => ({
          sort: {
            key,
            dir: dir ?? (s.sort.key === key && s.sort.dir === 'desc' ? 'asc' : 'desc'),
          },
        })),

      theme: 'dark',
      setTheme: (t) => {
        document.documentElement.classList.toggle('dark', t === 'dark')
        set({ theme: t })
      },
      toggleTheme: () =>
        set((s) => {
          const t = s.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', t === 'dark')
          return { theme: t }
        }),

      paletteOpen: false,
      setPaletteOpen: (b) => set({ paletteOpen: b }),

      mobileNavOpen: false,
      setMobileNavOpen: (b) => set({ mobileNavOpen: b }),
    }),
    {
      name: 'earnings-calendar-prefs',
      partialize: (s): PersistedShape => ({
        theme: s.theme,
        sort: s.sort,
        filter: {
          ...s.filter,
          verdicts: Array.from(s.filter.verdicts),
          quarters: Array.from(s.filter.quarters),
          times: Array.from(s.filter.times),
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedShape> | undefined
        if (!p) return current
        return {
          ...current,
          theme: p.theme ?? current.theme,
          sort: p.sort ?? current.sort,
          filter: {
            ...current.filter,
            ...(p.filter ?? {}),
            verdicts: new Set(p.filter?.verdicts ?? []),
            quarters: new Set(p.filter?.quarters ?? []),
            times: new Set(p.filter?.times ?? []),
          },
        }
      },
    },
  ),
)
