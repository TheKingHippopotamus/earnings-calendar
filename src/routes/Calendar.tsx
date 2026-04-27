import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, cn } from '@/components/ui'
import FilterBar from '@/components/filters/FilterBar'
import { DayGroup } from '@/components/calendar/DayGroup'
import { useAppStore } from '@/lib/store/useAppStore'
import { groupByDay, selectCompanies } from '@/lib/data/select'

const TODAY_ISO = '2026-04-28'
const SKELETON_COUNT = 8

function CardSkeleton() {
  return (
    <div className="elev rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="skeleton h-5 w-16" />
          <div className="skeleton h-3 w-32" />
        </div>
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-8" />
          <div className="skeleton h-5 w-10" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-5 w-12" />
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-[color:var(--border-soft)] pt-4">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-2.5 w-10" />
          <div className="skeleton h-6 w-16" />
          <div className="flex gap-1">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-12" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-2.5 w-14" />
          <div className="skeleton h-6 w-20" />
          <div className="flex gap-1">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-12" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="skeleton h-1.5 flex-1" />
        <div className="skeleton h-3 w-6" />
      </div>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="elev rounded-xl p-10 text-center max-w-xl mx-auto mt-12">
      <div className="text-4xl mb-3" aria-hidden="true">⚠</div>
      <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
        Could not load earnings data
      </h2>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{message}</p>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="elev rounded-xl p-10 text-center max-w-xl mx-auto mt-12">
      <div className="text-4xl mb-3" aria-hidden="true">∅</div>
      <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
        No earnings match your filters
      </h2>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
        Try widening the date range, clearing verdicts, or removing the search query.
      </p>
      <div className="mt-5">
        <Button variant="primary" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </div>
  )
}

export default function Calendar() {
  const dataset = useAppStore((s) => s.dataset)
  const loading = useAppStore((s) => s.loading)
  const error = useAppStore((s) => s.error)
  const filter = useAppStore((s) => s.filter)
  const sort = useAppStore((s) => s.sort)
  const resetFilters = useAppStore((s) => s.resetFilters)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const groupRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [showScrollToToday, setShowScrollToToday] = useState(false)

  const groups = useMemo(() => {
    if (!dataset) return []
    const filtered = selectCompanies(dataset, { filter, sort })
    return groupByDay(dataset, filtered)
  }, [dataset, filter, sort])

  const todayKey = useMemo(() => {
    const found = groups.find((g) => g.isoDate && g.isoDate >= TODAY_ISO)
    return found?.label ?? null
  }, [groups])

  // Show the floating "scroll to today" only on mobile viewports.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!todayKey) {
      setShowScrollToToday(false)
      return
    }
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setShowScrollToToday(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [todayKey])

  const setGroupRef = useCallback(
    (label: string) => (el: HTMLElement | null) => {
      const map = groupRefs.current
      if (el) map.set(label, el)
      else map.delete(label)
    },
    [],
  )

  const scrollToToday = useCallback(() => {
    if (!todayKey) return
    const el = groupRefs.current.get(todayKey)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [todayKey])

  // ----- Render --------------------------------------------------------------
  if (loading && !dataset) {
    return (
      <div className="mx-auto max-w-7xl">
        <FilterBar />
        <div className="mt-4">
          <LoadingGrid />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <FilterBar />
        <ErrorState message={error} />
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="mx-auto max-w-7xl">
        <FilterBar />
        <ErrorState message="No data available." />
      </div>
    )
  }

  const totalCompanies = groups.reduce((acc, g) => acc + g.companies.length, 0)

  return (
    <div className="mx-auto max-w-7xl pb-24" ref={containerRef}>
      <FilterBar />

      {totalCompanies === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : (
        <div className="mt-4 flex flex-col gap-8">
          {groups.map((g) => (
            <DayGroup
              key={g.label}
              ref={setGroupRef(g.label)}
              label={g.label}
              isoDate={g.isoDate}
              weekday={g.weekday}
              companies={g.companies}
            />
          ))}
        </div>
      )}

      {showScrollToToday && totalCompanies > 0 && (
        <button
          type="button"
          onClick={scrollToToday}
          aria-label="Scroll to today"
          className={cn(
            'lg:hidden fixed bottom-20 right-4 z-30',
            'glass rounded-full h-11 px-4 inline-flex items-center gap-2',
            'text-xs font-semibold text-[color:var(--text-primary)] shadow-lg',
            'hover:bg-[var(--bg-elev)] transition-colors',
          )}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(91,117,255,0.8)]"
          />
          Today
        </button>
      )}
    </div>
  )
}
