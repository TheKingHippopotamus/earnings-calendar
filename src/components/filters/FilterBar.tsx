import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import type { Verdict } from '@/lib/store/useAppStore'
import { Button, cn } from '@/components/ui'
import FilterChip from './FilterChip'
import SortMenu from './SortMenu'

type MarketCapKey = 'all' | 'mega' | 'large' | 'mid' | 'small'

const MARKET_CAP_OPTIONS: {
  key: MarketCapKey
  label: string
  min: number | null
  max: number | null
}[] = [
  { key: 'all',   label: 'All caps',         min: null, max: null },
  { key: 'mega',  label: 'Mega ( > $200B )', min: 200e9, max: null },
  { key: 'large', label: 'Large ( $10–200B )', min: 10e9,  max: 200e9 },
  { key: 'mid',   label: 'Mid ( $2–10B )',   min: 2e9,   max: 10e9 },
  { key: 'small', label: 'Small ( < $2B )',  min: null,  max: 2e9 },
]

function marketCapKey(min: number | null, max: number | null): MarketCapKey {
  for (const opt of MARKET_CAP_OPTIONS) {
    if (opt.min === min && opt.max === max) return opt.key
  }
  return 'all'
}

const VERDICT_CHIPS: { key: Verdict; label: string; tone: 'bull' | 'warn' | 'bear' }[] = [
  { key: 'beat',  label: 'BEAT',  tone: 'bull' },
  { key: 'mixed', label: 'MIXED', tone: 'warn' },
  { key: 'miss',  label: 'MISS',  tone: 'bear' },
]

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const TIMES: { key: string; label: string }[] = [
  { key: 'AM', label: 'AM' },
  { key: 'PM', label: 'PM' },
]

export default function FilterBar() {
  const dataset = useAppStore((s) => s.dataset)
  const filter = useAppStore((s) => s.filter)
  const toggleVerdict = useAppStore((s) => s.toggleVerdict)
  const toggleQuarter = useAppStore((s) => s.toggleQuarter)
  const toggleTime = useAppStore((s) => s.toggleTime)
  const setOnlyFlagged = useAppStore((s) => s.setOnlyFlagged)
  const setMinQuality = useAppStore((s) => s.setMinQuality)
  const setMarketCapRange = useAppStore((s) => s.setMarketCapRange)
  const resetFilters = useAppStore((s) => s.resetFilters)
  const sort = useAppStore((s) => s.sort)
  const setSort = useAppStore((s) => s.setSort)

  // Verdict counts (over full dataset, ignoring other filters for scannable counts)
  const verdictCounts = useMemo(() => {
    const counts: Record<Verdict, number> = {
      beat: 0, mixed: 0, miss: 0, unknown: 0,
    }
    if (!dataset) return counts
    for (const c of dataset.companies) counts[c.verdict] = (counts[c.verdict] ?? 0) + 1
    return counts
  }, [dataset])

  const minQualityValue = filter.minQuality ?? 0
  const currentCapKey = marketCapKey(filter.minMarketCap, filter.maxMarketCap)

  const isActive =
    filter.query !== '' ||
    filter.verdicts.size > 0 ||
    filter.quarters.size > 0 ||
    filter.times.size > 0 ||
    filter.onlyFlagged ||
    filter.minQuality != null ||
    filter.dateFrom != null || filter.dateTo != null ||
    filter.minMarketCap != null || filter.maxMarketCap != null

  return (
    <div className="surface rounded-xl px-3 py-2.5">
      <div
        className={cn(
          'flex items-center gap-2',
          'flex-nowrap overflow-x-auto no-scrollbar',
          'lg:flex-wrap lg:overflow-visible',
        )}
      >
        {/* Verdict chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {VERDICT_CHIPS.map((v) => (
            <FilterChip
              key={v.key}
              tone={v.tone}
              active={filter.verdicts.has(v.key)}
              onToggle={() => toggleVerdict(v.key)}
              count={verdictCounts[v.key]}
            >
              {v.label}
            </FilterChip>
          ))}
        </div>

        <Divider />

        {/* Quarter chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {QUARTERS.map((q) => (
            <FilterChip
              key={q}
              tone="brand"
              active={filter.quarters.has(q)}
              onToggle={() => toggleQuarter(q)}
            >
              {q}
            </FilterChip>
          ))}
        </div>

        <Divider />

        {/* Time chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {TIMES.map((t) => (
            <FilterChip
              key={t.key}
              tone="neutral"
              active={filter.times.has(t.key)}
              onToggle={() => toggleTime(t.key)}
              title={t.key === 'AM' ? 'Pre-market' : 'After-hours'}
            >
              {t.label}
            </FilterChip>
          ))}
        </div>

        <Divider />

        {/* Flagged */}
        <FilterChip
          tone="warn"
          active={filter.onlyFlagged}
          onToggle={() => setOnlyFlagged(!filter.onlyFlagged)}
          title="Show only companies with fraud / anomaly flags"
        >
          ⚑ Flagged only
        </FilterChip>

        {/* Market cap select */}
        <label
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-2 rounded-full border text-xs font-medium whitespace-nowrap shrink-0',
            'bg-[var(--bg-surface-2)] border-[color:var(--border-soft)] text-[color:var(--text-secondary)]',
            'transition-colors duration-150',
            currentCapKey !== 'all' && 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-semibold',
          )}
        >
          <span className="text-[color:var(--text-muted)]">Cap</span>
          <select
            value={currentCapKey}
            onChange={(e) => {
              const k = e.target.value as MarketCapKey
              const opt = MARKET_CAP_OPTIONS.find((o) => o.key === k) ?? MARKET_CAP_OPTIONS[0]
              setMarketCapRange(opt.min, opt.max)
            }}
            className={cn(
              'appearance-none bg-transparent border-none outline-none',
              'text-current text-xs font-medium pr-3.5 cursor-pointer',
              'focus:ring-0',
            )}
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0 center',
              backgroundSize: '10px 10px',
            }}
          >
            {MARKET_CAP_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key} className="bg-[var(--bg-elev)] text-[color:var(--text-primary)]">
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {/* Min Quality slider */}
        <div
          className={cn(
            'inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs whitespace-nowrap shrink-0',
            'bg-[var(--bg-surface-2)] border-[color:var(--border-soft)]',
            filter.minQuality != null &&
              'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
          )}
        >
          <span className="text-[color:var(--text-muted)] font-medium">Min Q</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minQualityValue}
            onChange={(e) => {
              const n = Number(e.target.value)
              setMinQuality(n === 0 ? null : n)
            }}
            aria-label="Minimum quality score"
            className="w-20 accent-indigo-500 cursor-pointer"
          />
          <span className="num font-semibold w-7 text-right tabular-nums">
            {minQualityValue}
          </span>
        </div>

        {/* Push remaining items to the right on desktop */}
        <div className="hidden lg:block flex-1" />

        {/* Sort menu */}
        <div className="shrink-0 ml-auto lg:ml-0">
          <SortMenu sort={sort} onChange={setSort} />
        </div>

        {/* Reset */}
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetFilters()}
            className="shrink-0"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="hidden sm:inline-block h-5 w-px bg-[color:var(--border-soft)] shrink-0"
    />
  )
}
