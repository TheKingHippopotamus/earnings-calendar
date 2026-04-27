import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'
import CommandPalette from '@/components/filters/CommandPalette'
import Header from './Header'
import MobileNav from './MobileNav'
import StatusStrip from './StatusStrip'

interface ShellProps {
  children: ReactNode
}

function LoadingSkeleton() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Filter / toolbar row */}
      <div className="flex items-center gap-3">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-9 w-24" />
        <div className="skeleton h-9 w-24" />
        <div className="ml-auto skeleton h-9 w-32 hidden sm:block" />
      </div>

      {/* Day groups */}
      {Array.from({ length: 3 }).map((_, dayIdx) => (
        <section key={dayIdx} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-4 w-16" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="surface rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton h-4 w-10" />
                </div>
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-2 w-full" />
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-12" />
                  <div className="skeleton h-5 w-14" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function Shell({ children }: ShellProps) {
  const dataset = useAppStore((s) => s.dataset)
  const loading = useAppStore((s) => s.loading)
  const error = useAppStore((s) => s.error)
  const paletteOpen = useAppStore((s) => s.paletteOpen)
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen)
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen)

  // Global keyboard listener: Cmd/Ctrl+K toggles palette, Escape closes overlays
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isModK =
        (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)
      if (isModK) {
        e.preventDefault()
        // Read latest state via getState to avoid stale closure
        const open = useAppStore.getState().paletteOpen
        useAppStore.getState().setPaletteOpen(!open)
        return
      }
      if (e.key === 'Escape') {
        const state = useAppStore.getState()
        if (state.paletteOpen) state.setPaletteOpen(false)
        if (state.mobileNavOpen) state.setMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // setPaletteOpen / setMobileNavOpen / paletteOpen / mobileNavOpen used via getState
  }, [setPaletteOpen, setMobileNavOpen, paletteOpen, mobileNavOpen])

  return (
    <div className="min-h-dvh bg-app text-[color:var(--text-primary)] flex flex-col">
      <Header />

      {error && (
        <div
          role="alert"
          className="border-b border-red-500/30 bg-red-500/10 text-red-300"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-start gap-3 text-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="font-medium">Failed to load data.</span>{' '}
              <span className="text-red-300/80 break-words">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {dataset && <StatusStrip />}

      <main className="flex-1 pb-24 lg:pb-10">
        {loading && !dataset ? (
          <LoadingSkeleton />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        )}
      </main>

      <MobileNav />
      <CommandPalette />
    </div>
  )
}
