import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { selectCompanies } from '@/lib/data/select'
import { formatPct } from '@/lib/analytics/units'
import FilterBar from '@/components/filters/FilterBar'
import { Card } from '@/components/ui'
import { StatTile } from '@/components/calendar/StatTile'
import { SegmentedTabs, type SegmentedOption } from '@/components/calendar/SegmentedTabs'
import { MoversTable, type MoversMode } from '@/components/calendar/MoversTable'
import type { Company } from '@/lib/types'

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && Number.isFinite(v))
  if (nums.length === 0) return null
  let sum = 0
  for (const n of nums) sum += n
  return sum / nums.length
}

function applyMode(mode: MoversMode, companies: Company[]): Company[] {
  switch (mode) {
    case 'winners':
      return companies.filter(
        (c) => c.verdict === 'beat' && (c.revenueDerived.yoy ?? 0) >= 0,
      )
    case 'losers':
      return companies.filter(
        (c) => c.verdict === 'miss' || (c.revenueDerived.yoy ?? 0) < 0,
      )
    case 'quality':
    case 'all':
    default:
      return companies
  }
}

export default function Movers() {
  const dataset = useAppStore((s) => s.dataset)
  const filter = useAppStore((s) => s.filter)
  const sort = useAppStore((s) => s.sort)
  const [mode, setMode] = useState<MoversMode>('winners')

  const filtered = useMemo<Company[]>(() => {
    if (!dataset) return []
    return selectCompanies(dataset, { filter, sort })
  }, [dataset, filter, sort])

  const stats = useMemo(() => {
    const reports = filtered.length
    const beatCount = filtered.filter((c) => c.verdict === 'beat').length
    const beatRate = reports > 0 ? (beatCount / reports) * 100 : null
    const avgEpsBeat = average(filtered.map((c) => c.epsDerived.beat))
    const avgRevYoy = average(filtered.map((c) => c.revenueDerived.yoy))
    return { reports, beatRate, avgEpsBeat, avgRevYoy }
  }, [filtered])

  const counts = useMemo(
    () => ({
      winners: applyMode('winners', filtered).length,
      losers: applyMode('losers', filtered).length,
      quality: filtered.length,
      all: filtered.length,
    }),
    [filtered],
  )

  const options: SegmentedOption<MoversMode>[] = [
    { key: 'winners', label: 'Winners', count: counts.winners },
    { key: 'losers', label: 'Losers', count: counts.losers },
    { key: 'quality', label: 'Quality', count: counts.quality },
    { key: 'all', label: 'All', count: counts.all },
  ]

  const moded = useMemo(() => applyMode(mode, filtered), [mode, filtered])

  const beatRateTone =
    stats.beatRate === null
      ? 'neutral'
      : stats.beatRate >= 60
        ? 'bull'
        : stats.beatRate < 40
          ? 'bear'
          : 'warn'

  const epsBeatTone =
    stats.avgEpsBeat === null
      ? 'neutral'
      : stats.avgEpsBeat > 0
        ? 'bull'
        : stats.avgEpsBeat < 0
          ? 'bear'
          : 'neutral'

  const revYoyTone =
    stats.avgRevYoy === null
      ? 'neutral'
      : stats.avgRevYoy > 0
        ? 'bull'
        : stats.avgRevYoy < 0
          ? 'bear'
          : 'neutral'

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-[color:var(--text-primary)] md:text-2xl">
          Movers
        </h1>
        <p className="text-xs text-[color:var(--text-secondary)] md:text-sm">
          Sortable Winners, Losers, Quality, and All — ranked across the filtered universe.
        </p>
      </header>

      <FilterBar />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Reports"
          value={stats.reports.toString()}
          sub="In current filter"
          tone="brand"
        />
        <StatTile
          label="Beat rate"
          value={stats.beatRate === null ? '—' : `${stats.beatRate.toFixed(1)}%`}
          sub="verdict = beat"
          tone={beatRateTone}
        />
        <StatTile
          label="Avg EPS surprise"
          value={formatPct(stats.avgEpsBeat)}
          sub="vs consensus"
          tone={epsBeatTone}
        />
        <StatTile
          label="Avg revenue YoY"
          value={formatPct(stats.avgRevYoy)}
          sub="year-over-year"
          tone={revYoyTone}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs value={mode} onChange={setMode} options={options} />
        <div className="text-[11px] uppercase tracking-wider text-[color:var(--text-muted)]">
          {moded.length} {moded.length === 1 ? 'company' : 'companies'}
        </div>
      </div>

      {moded.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto max-w-sm space-y-2">
            <div className="text-sm font-semibold text-[color:var(--text-primary)]">
              No companies match
            </div>
            <p className="text-xs text-[color:var(--text-secondary)]">
              {dataset
                ? 'Try widening filters or switching segments.'
                : 'Dataset not yet loaded.'}
            </p>
          </div>
        </Card>
      ) : (
        <MoversTable mode={mode} companies={moded} />
      )}
    </div>
  )
}
