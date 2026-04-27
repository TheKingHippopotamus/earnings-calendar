import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import { selectCompanies } from '@/lib/data/select'

export default function StatusStrip() {
  const dataset = useAppStore((s) => s.dataset)
  const filter = useAppStore((s) => s.filter)
  const sort = useAppStore((s) => s.sort)

  const stats = useMemo(() => {
    if (!dataset) return null
    const filtered = selectCompanies(dataset, { filter, sort })
    const flagged = filtered.reduce(
      (n, c) => (c.flags.length > 0 ? n + 1 : n),
      0,
    )
    return {
      total: dataset.companies.length,
      shown: filtered.length,
      flagged,
    }
  }, [dataset, filter, sort])

  if (!dataset || !stats) return null

  let host = 'tradingeconomics.com'
  try {
    host = new URL(dataset.sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    // keep default
  }

  return (
    <div
      className="border-b border-[color:var(--border-soft)] bg-[var(--bg-surface)]"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3 text-[11px] sm:text-xs text-[color:var(--text-secondary)]">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span>Showing</span>
          <span className="num text-[color:var(--text-primary)] font-medium">
            {stats.shown.toLocaleString()}
          </span>
          <span>of</span>
          <span className="num text-[color:var(--text-primary)] font-medium">
            {stats.total.toLocaleString()}
          </span>
          <span>reports</span>
          <span className="hidden sm:inline mx-1 text-[color:var(--text-muted)]">·</span>
          <span className="hidden sm:inline num text-amber-400 font-medium">
            {stats.flagged.toLocaleString()}
          </span>
          <span className="hidden sm:inline">flagged</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[color:var(--text-muted)] shrink-0">
          <span>Source:</span>
          <a
            href={dataset.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-[color:var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded"
          >
            {host}
          </a>
        </div>
      </div>
    </div>
  )
}
