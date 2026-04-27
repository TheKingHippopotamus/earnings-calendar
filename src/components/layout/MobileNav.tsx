import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/components/ui'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const NAV: NavItem[] = [
  {
    to: '/',
    label: 'Calendar',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    to: '/movers',
    label: 'Movers',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    to: '/alerts',
    label: 'Alerts',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
]

export default function MobileNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-[color:var(--border-soft)] safe-bottom"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-3">
        {NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                  isActive
                    ? 'text-indigo-400'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-indigo-500"
                    />
                  )}
                  {item.icon}
                  <span className="leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
