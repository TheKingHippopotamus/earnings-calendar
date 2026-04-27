import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { selectCompanies } from '@/lib/data/select'
import type { Company, FraudSeverity } from '@/lib/types'
import { Button, cn } from '@/components/ui'
import FilterBar from '@/components/filters/FilterBar'
import AlertCard from '@/components/calendar/AlertCard'
import AlertSummary from '@/components/calendar/AlertSummary'
import SegmentedTabs from '@/components/calendar/SegmentedTabs'
import type { SegmentedOption } from '@/components/calendar/SegmentedTabs'

type SortKey = 'highest' | 'most_flags' | 'worst_quality' | 'newest'

const SORT_OPTIONS: SegmentedOption<SortKey>[] = [
  { key: 'highest', label: 'Highest severity' },
  { key: 'most_flags', label: 'Most flags' },
  { key: 'worst_quality', label: 'Worst quality' },
  { key: 'newest', label: 'Newest' },
]

const SEV_RANK: Record<FraudSeverity, number> = { high: 3, medium: 2, low: 1 }

interface RuleMeta {
  id: string
  label: string
  count: number
  topSeverity: FraudSeverity
}

function topRuleSeverity(a: FraudSeverity | null, b: FraudSeverity): FraudSeverity {
  if (a === null) return b
  return SEV_RANK[b] > SEV_RANK[a] ? b : a
}

function sortCompanies(companies: Company[], key: SortKey): Company[] {
  const arr = [...companies]
  switch (key) {
    case 'highest':
      arr.sort((a, b) => {
        const ra = a.topSeverity ? SEV_RANK[a.topSeverity] : 0
        const rb = b.topSeverity ? SEV_RANK[b.topSeverity] : 0
        if (ra !== rb) return rb - ra
        if (a.qualityScore !== b.qualityScore) return a.qualityScore - b.qualityScore
        return a.ticker.localeCompare(b.ticker)
      })
      break
    case 'most_flags':
      arr.sort((a, b) => {
        if (a.flags.length !== b.flags.length) return b.flags.length - a.flags.length
        const ra = a.topSeverity ? SEV_RANK[a.topSeverity] : 0
        const rb = b.topSeverity ? SEV_RANK[b.topSeverity] : 0
        if (ra !== rb) return rb - ra
        return a.ticker.localeCompare(b.ticker)
      })
      break
    case 'worst_quality':
      arr.sort((a, b) => {
        if (a.qualityScore !== b.qualityScore) return a.qualityScore - b.qualityScore
        return a.ticker.localeCompare(b.ticker)
      })
      break
    case 'newest':
      arr.sort((a, b) => {
        const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0
        const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0
        if (ta !== tb) return tb - ta
        return a.ticker.localeCompare(b.ticker)
      })
      break
  }
  return arr
}

const SEV_CHIP_ACTIVE: Record<FraudSeverity, string> = {
  high: 'bg-red-500/15 text-red-300 border-red-500/40',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  low: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
}

const SEV_DOT: Record<FraudSeverity, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-indigo-500',
}

interface RuleChipProps {
  rule: RuleMeta
  active: boolean
  onToggle: (id: string) => void
}

function RuleChip({ rule, active, onToggle }: RuleChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(rule.id)}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? cn('shadow-sm', SEV_CHIP_ACTIVE[rule.topSeverity])
          : 'bg-[var(--bg-surface-2)] border-[color:var(--border-soft)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-elev)]',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', SEV_DOT[rule.topSeverity])}
        aria-hidden="true"
      />
      <span>{rule.label}</span>
      <span
        className={cn(
          'num inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-semibold tabular-nums',
          active
            ? 'bg-black/20 text-current'
            : 'bg-[var(--bg-surface)] text-[color:var(--text-muted)] border border-[color:var(--border-soft)]',
        )}
      >
        {rule.count}
      </span>
    </button>
  )
}

export default function Alerts() {
  const dataset = useAppStore((s) => s.dataset)
  const filter = useAppStore((s) => s.filter)
  const sort = useAppStore((s) => s.sort)
  const resetFilters = useAppStore((s) => s.resetFilters)

  const [activeRuleIds, setActiveRuleIds] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('highest')

  const baseSelected = useMemo<Company[]>(() => {
    if (!dataset) return []
    return selectCompanies(dataset, { filter, sort })
  }, [dataset, filter, sort])

  // Companies with at least one flag — drives the summary (full picture)
  const flagged = useMemo(
    () => baseSelected.filter((c) => c.flags.length > 0),
    [baseSelected],
  )

  // All unique rules observed across the flagged set
  const ruleMeta = useMemo<RuleMeta[]>(() => {
    const map = new Map<string, RuleMeta>()
    for (const c of flagged) {
      for (const f of c.flags) {
        const cur = map.get(f.id)
        if (cur) {
          cur.count += 1
          cur.topSeverity = topRuleSeverity(cur.topSeverity, f.severity)
        } else {
          map.set(f.id, { id: f.id, label: f.label, count: 1, topSeverity: f.severity })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const sa = SEV_RANK[a.topSeverity]
      const sb = SEV_RANK[b.topSeverity]
      if (sa !== sb) return sb - sa
      if (a.count !== b.count) return b.count - a.count
      return a.label.localeCompare(b.label)
    })
  }, [flagged])

  // Apply rule-id filter
  const ruleFiltered = useMemo(() => {
    if (activeRuleIds.size === 0) return flagged
    return flagged.filter((c) => c.flags.some((f) => activeRuleIds.has(f.id)))
  }, [flagged, activeRuleIds])

  const visible = useMemo(
    () => sortCompanies(ruleFiltered, sortKey),
    [ruleFiltered, sortKey],
  )

  const toggleRule = (id: string) => {
    setActiveRuleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearRules = () => setActiveRuleIds(new Set())

  const handleResetAll = () => {
    resetFilters()
    setActiveRuleIds(new Set())
    setSortKey('highest')
  }

  if (!dataset) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="elev rounded-xl p-8 text-center text-sm text-[color:var(--text-secondary)]">
          Loading dataset…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      {/* Page header */}
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-2xl">
            Alerts
          </h1>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
            Forensic flags across upcoming and recent reports — triage the worst first.
          </p>
        </div>
        <div className="num text-xs text-[color:var(--text-muted)]">
          {visible.length} / {flagged.length}
        </div>
      </header>

      {/* Global filter bar */}
      <div className="mb-4">
        <FilterBar />
      </div>

      {/* Summary always reflects the filtered-but-pre-rule-toggle set */}
      <div className="mb-4">
        <AlertSummary companies={flagged} />
      </div>

      {/* Rule chips */}
      {ruleMeta.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {ruleMeta.map((r) => (
            <RuleChip
              key={r.id}
              rule={r}
              active={activeRuleIds.has(r.id)}
              onToggle={toggleRule}
            />
          ))}
          {activeRuleIds.size > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRules}
              className="!h-7 !px-2 text-[11px]"
            >
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Sort selector */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
          Sort
        </div>
        <SegmentedTabs<SortKey>
          value={sortKey}
          onChange={setSortKey}
          options={SORT_OPTIONS}
          size="sm"
        />
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="elev flex flex-col items-center gap-3 rounded-xl p-8 text-center">
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            No alerts found
          </div>
          <p className="max-w-sm text-xs text-[color:var(--text-secondary)]">
            No companies match the current filter combination. Try clearing rule
            toggles or resetting global filters.
          </p>
          <div className="mt-1 flex gap-2">
            {activeRuleIds.size > 0 ? (
              <Button variant="secondary" size="sm" onClick={clearRules}>
                Clear rules
              </Button>
            ) : null}
            <Button variant="primary" size="sm" onClick={handleResetAll}>
              Reset filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((c) => (
            <AlertCard key={`${c.ticker}-${c.isoDate ?? c.date}`} company={c} />
          ))}
        </div>
      )}
    </div>
  )
}
