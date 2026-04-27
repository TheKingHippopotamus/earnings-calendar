import { useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Badge, Button, cn } from '@/components/ui'
import { useAppStore } from '@/lib/store/useAppStore'
import SearchBox from '@/components/filters/SearchBox'
import ThemeToggle from './ThemeToggle'

interface NavLinkDef {
  to: string
  label: string
}

const NAV_LINKS: NavLinkDef[] = [
  { to: '/', label: 'Calendar' },
  { to: '/movers', label: 'Movers' },
  { to: '/alerts', label: 'Alerts' },
]

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grad-brand inline-flex h-7 w-7 items-center justify-center rounded-md shadow-sm shrink-0"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    </span>
  )
}

export default function Header() {
  const location = useLocation()
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen)
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen)
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen)
  const dataset = useAppStore((s) => s.dataset)

  const flaggedCount = useMemo(() => {
    if (!dataset) return 0
    return dataset.companies.reduce(
      (n, c) => (c.flags.length > 0 ? n + 1 : n),
      0,
    )
  }, [dataset])

  const onAlerts = location.pathname.startsWith('/alerts')

  return (
    <header className="glass border-b border-[color:var(--border-soft)] sticky top-0 z-40 backdrop-blur safe-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        {/* Mobile: hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[color:var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <HamburgerIcon />
        </button>

        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-md"
          aria-label="Earnings calendar home"
        >
          <BrandMark />
          <span className="hidden sm:inline-flex items-baseline gap-1 leading-none">
            <span className="font-semibold text-[15px] tracking-tight text-[color:var(--text-primary)]">
              Earnings
            </span>
            <span className="text-[13px] text-[color:var(--text-muted)] font-normal">
              /calendar
            </span>
          </span>
        </Link>

        {/* Center nav (lg+) */}
        <nav
          className="hidden lg:flex items-center gap-1 ml-6"
          aria-label="Primary"
        >
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                  isActive
                    ? 'text-indigo-400'
                    : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-2)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span>{l.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-3 right-3 -bottom-[11px] h-[2px] rounded-full bg-indigo-500"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Alerts badge */}
        {onAlerts && flaggedCount > 0 && (
          <Badge tone="warn" className="hidden sm:inline-flex">
            <span className="num">{flaggedCount}</span>
            <span>flagged</span>
          </Badge>
        )}

        {/* Search box (md+) */}
        <div className="hidden md:block w-64 max-w-xs">
          <SearchBox />
        </div>

        {/* Mobile: search-icon button -> opens palette */}
        <button
          type="button"
          aria-label="Open search"
          onClick={() => setPaletteOpen(true)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[color:var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <SearchIcon />
        </button>

        <ThemeToggle />

        {/* Command palette trigger (md+) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="hidden md:inline-flex focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <span>Command</span>
          <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border border-[color:var(--border-soft)] bg-[var(--bg-surface-2)] px-1.5 py-[1px] text-[10px] font-mono text-[color:var(--text-muted)]">
            <span aria-hidden="true">⌘</span>K
          </kbd>
        </Button>
      </div>
    </header>
  )
}
