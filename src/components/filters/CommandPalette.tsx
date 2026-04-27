import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Fuse from 'fuse.js'
import { useAppStore } from '@/lib/store/useAppStore'
import { Input, cn } from '@/components/ui'
import VerdictPill from '@/components/calendar/VerdictPill'
import type { Company } from '@/lib/types'

type ActionItem = {
  type: 'action'
  id: string
  label: string
  hint?: string
  icon?: ReactNode
  run: () => void
}

type CompanyItem = {
  type: 'company'
  id: string
  company: Company
  run: () => void
}

type Item = ActionItem | CompanyItem

const QUICK_ICON = {
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  trendUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
  ),
  trendDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>
  ),
  bell: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
  ),
  reset: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
  ),
  theme: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
  ),
}

export default function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen)
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen)
  const dataset = useAppStore((s) => s.dataset)
  const resetFilters = useAppStore((s) => s.resetFilters)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  const navigate = useNavigate()
  const location = useLocation()

  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Build Fuse index once per dataset
  const fuse = useMemo(() => {
    if (!dataset) return null
    return new Fuse(dataset.companies, {
      keys: [
        { name: 'ticker', weight: 0.7 },
        { name: 'name',   weight: 0.3 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  }, [dataset])

  // Mount/unmount animation
  useEffect(() => {
    if (open) {
      // next frame so transition runs
      const id = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(id)
    } else {
      setMounted(false)
      setQuery('')
      setSelectedIdx(0)
    }
  }, [open])

  // Autofocus input when opening
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        const el = dialogRef.current?.querySelector<HTMLInputElement>('input[data-palette-input]')
        el?.focus()
      })
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  // Close on route change
  useEffect(() => {
    if (open) setPaletteOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Build items
  const items: Item[] = useMemo(() => {
    const q = query.trim()
    if (q && fuse) {
      const results = fuse.search(q).slice(0, 8)
      return results.map((r): Item => ({
        type: 'company',
        id: `c-${r.item.ticker}`,
        company: r.item,
        run: () => {
          setPaletteOpen(false)
          navigate(`/c/${encodeURIComponent(r.item.ticker)}`)
        },
      }))
    }
    // Quick actions when no query
    const actions: ActionItem[] = [
      { type: 'action', id: 'go-calendar', label: 'Calendar',          hint: 'Go to calendar', icon: QUICK_ICON.calendar,  run: () => { setPaletteOpen(false); navigate('/') } },
      { type: 'action', id: 'go-winners',  label: 'Movers — Winners',  hint: 'Top beats',      icon: QUICK_ICON.trendUp,   run: () => { setPaletteOpen(false); navigate('/movers') } },
      { type: 'action', id: 'go-losers',   label: 'Movers — Losers',   hint: 'Top misses',     icon: QUICK_ICON.trendDown, run: () => { setPaletteOpen(false); navigate('/movers') } },
      { type: 'action', id: 'go-alerts',   label: 'Alerts',            hint: 'Flagged earnings', icon: QUICK_ICON.bell,    run: () => { setPaletteOpen(false); navigate('/alerts') } },
      { type: 'action', id: 'reset',       label: 'Reset filters',     hint: 'Clear all filters', icon: QUICK_ICON.reset,  run: () => { resetFilters(); setPaletteOpen(false) } },
      { type: 'action', id: 'theme',       label: 'Toggle theme',      hint: 'Light / dark',   icon: QUICK_ICON.theme,     run: () => { toggleTheme() } },
    ]
    return actions
  }, [query, fuse, navigate, resetFilters, setPaletteOpen, toggleTheme])

  // Reset selection when items change
  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  // Keep selected in view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const el = list.querySelector<HTMLElement>(`[data-idx="${selectedIdx}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx, items.length])

  if (!open) return null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => (items.length === 0 ? 0 : (i + 1) % items.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => (items.length === 0 ? 0 : (i - 1 + items.length) % items.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const it = items[selectedIdx]
      if (it) it.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setPaletteOpen(false)
    }
  }

  const showCompanies = query.trim().length > 0 && items.length > 0
  const showActions = query.trim().length === 0

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-150',
        mounted ? 'opacity-100' : 'opacity-0',
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close command palette"
        onClick={() => setPaletteOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative max-w-2xl mx-auto top-[12vh] px-4',
          'transition-all duration-150 ease-out',
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        )}
      >
        <div className="glass rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--border-soft)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[color:var(--text-muted)] shrink-0"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              data-palette-input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a ticker or jump to..."
              spellCheck={false}
              autoComplete="off"
              className={cn(
                'flex-1 h-10 text-base bg-transparent border-0 px-0',
                'focus:ring-0 focus:border-transparent',
              )}
              aria-label="Command palette search"
            />
            <kbd
              className={cn(
                'hidden sm:inline-flex items-center px-1.5 h-5 rounded',
                'bg-[var(--bg-surface-2)] border border-[color:var(--border-soft)]',
                'text-[10px] mono text-[color:var(--text-muted)] font-medium',
              )}
            >
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
            {showCompanies && (
              <Section label="Companies">
                {items.map((it, idx) =>
                  it.type === 'company' ? (
                    <CompanyRow
                      key={it.id}
                      idx={idx}
                      company={it.company}
                      selected={idx === selectedIdx}
                      onSelect={() => setSelectedIdx(idx)}
                      onRun={() => it.run()}
                    />
                  ) : null,
                )}
              </Section>
            )}

            {showActions && (
              <Section label="Quick actions">
                {items.map((it, idx) =>
                  it.type === 'action' ? (
                    <ActionRow
                      key={it.id}
                      idx={idx}
                      item={it}
                      selected={idx === selectedIdx}
                      onSelect={() => setSelectedIdx(idx)}
                      onRun={() => it.run()}
                    />
                  ) : null,
                )}
              </Section>
            )}

            {query.trim() && items.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-[color:var(--text-muted)]">
                No results for &ldquo;{query.trim()}&rdquo;
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className={cn(
              'flex items-center justify-between gap-3 px-4 py-2',
              'border-t border-[color:var(--border-soft)]',
              'text-[11px] text-[color:var(--text-muted)]',
            )}
          >
            <div className="flex items-center gap-3">
              <FooterKey label="↑↓" desc="navigate" />
              <FooterKey label="↵" desc="open" />
              <FooterKey label="esc" desc="close" />
            </div>
            <span className="hidden sm:inline">Command palette</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold">
        {label}
      </div>
      <div className="px-1">{children}</div>
    </div>
  )
}

function CompanyRow({
  idx,
  company,
  selected,
  onSelect,
  onRun,
}: {
  idx: number
  company: Company
  selected: boolean
  onSelect: () => void
  onRun: () => void
}) {
  return (
    <button
      type="button"
      data-idx={idx}
      onMouseEnter={onSelect}
      onClick={onRun}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left',
        'transition-colors duration-150',
        selected
          ? 'bg-indigo-500/10 text-[color:var(--text-primary)]'
          : 'hover:bg-[var(--bg-surface-2)] text-[color:var(--text-primary)]',
      )}
    >
      <span className="mono text-sm font-bold tabular-nums w-16 shrink-0">
        {company.ticker}
      </span>
      <span className="flex-1 min-w-0 text-sm text-[color:var(--text-secondary)] truncate">
        {company.name}
      </span>
      <span className="text-xs text-[color:var(--text-muted)] num shrink-0 hidden sm:inline">
        {company.date}
      </span>
      <span className="shrink-0">
        <VerdictPill verdict={company.verdict} />
      </span>
    </button>
  )
}

function ActionRow({
  idx,
  item,
  selected,
  onSelect,
  onRun,
}: {
  idx: number
  item: ActionItem
  selected: boolean
  onSelect: () => void
  onRun: () => void
}) {
  return (
    <button
      type="button"
      data-idx={idx}
      onMouseEnter={onSelect}
      onClick={onRun}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left',
        'transition-colors duration-150',
        selected
          ? 'bg-indigo-500/10 text-[color:var(--text-primary)]'
          : 'hover:bg-[var(--bg-surface-2)] text-[color:var(--text-primary)]',
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0',
          'bg-[var(--bg-surface-2)] text-[color:var(--text-secondary)]',
        )}
      >
        {item.icon}
      </span>
      <span className="flex-1 min-w-0 text-sm font-medium truncate">{item.label}</span>
      {item.hint && (
        <span className="text-xs text-[color:var(--text-muted)] shrink-0 hidden sm:inline">
          {item.hint}
        </span>
      )}
    </button>
  )
}

function FooterKey({ label, desc }: { label: string; desc: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd
        className={cn(
          'inline-flex items-center justify-center px-1 min-w-[18px] h-4 rounded',
          'bg-[var(--bg-surface-2)] border border-[color:var(--border-soft)]',
          'text-[10px] mono font-medium',
        )}
      >
        {label}
      </kbd>
      <span>{desc}</span>
    </span>
  )
}
