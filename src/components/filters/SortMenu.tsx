import { useEffect, useRef, useState } from 'react'
import { Button, cn } from '@/components/ui'
import type { SortKey, SortDir } from '@/lib/store/useAppStore'

interface SortMenuProps {
  sort: { key: SortKey; dir: SortDir }
  onChange: (key: SortKey, dir?: SortDir) => void
}

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date',         label: 'Date' },
  { key: 'qualityScore', label: 'Quality' },
  { key: 'epsBeat',      label: 'EPS Beat %' },
  { key: 'revenueBeat',  label: 'Rev Beat %' },
  { key: 'epsYoy',       label: 'EPS YoY' },
  { key: 'revenueYoy',   label: 'Rev YoY' },
  { key: 'marketCap',    label: 'Market Cap' },
  { key: 'marginChange', label: 'Margin Δ' },
]

const LABEL_BY_KEY: Record<SortKey, string> = OPTIONS.reduce((acc, o) => {
  acc[o.key] = o.label
  return acc
}, {} as Record<SortKey, string>)

export function SortMenu({ sort, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!containerRef.current || !target) return
      if (!containerRef.current.contains(target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const dirGlyph = sort.dir === 'desc' ? '↓' : '↑'
  const triggerLabel = `Sort: ${LABEL_BY_KEY[sort.key] ?? sort.key} ${dirGlyph}`

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="num"
      >
        {triggerLabel}
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 mt-1 z-30 rounded-lg surface elev p-1 min-w-[200px]',
            'shadow-xl',
          )}
        >
          {OPTIONS.map((opt) => {
            const active = sort.key === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(opt.key)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md text-sm',
                  'transition-colors duration-150',
                  active
                    ? 'bg-indigo-500/15 text-indigo-200 font-semibold'
                    : 'text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[color:var(--text-primary)]',
                )}
              >
                <span>{opt.label}</span>
                <span className={cn('text-xs num', !active && 'opacity-0')}>
                  {active ? (sort.dir === 'desc' ? '▼' : '▲') : '▲'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SortMenu
