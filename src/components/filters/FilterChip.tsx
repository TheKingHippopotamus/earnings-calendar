import type { ReactNode } from 'react'
import { cn } from '@/components/ui'

export type ChipTone = 'neutral' | 'bull' | 'bear' | 'warn' | 'brand' | 'mute'

interface FilterChipProps {
  active: boolean
  onToggle: () => void
  children: ReactNode
  tone?: ChipTone
  count?: number
  className?: string
  title?: string
}

const ACTIVE_TONE: Record<ChipTone, string> = {
  neutral: 'bg-[var(--bg-elev)] border-[color:var(--border-strong)] text-[color:var(--text-primary)]',
  mute:    'bg-[var(--bg-elev)] border-[color:var(--border-strong)] text-[color:var(--text-secondary)]',
  bull:    'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  bear:    'bg-red-500/15 border-red-500/40 text-red-300',
  warn:    'bg-amber-500/15 border-amber-500/40 text-amber-300',
  brand:   'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
}

const COUNT_TONE: Record<ChipTone, string> = {
  neutral: 'bg-[var(--bg-surface-2)] text-[color:var(--text-secondary)]',
  mute:    'bg-[var(--bg-surface-2)] text-[color:var(--text-muted)]',
  bull:    'bg-emerald-500/20 text-emerald-200',
  bear:    'bg-red-500/20 text-red-200',
  warn:    'bg-amber-500/20 text-amber-200',
  brand:   'bg-indigo-500/20 text-indigo-200',
}

export function FilterChip({
  active,
  onToggle,
  children,
  tone = 'neutral',
  count,
  className,
  title,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium whitespace-nowrap',
        'transition-colors duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
        active
          ? cn(ACTIVE_TONE[tone], 'font-semibold shadow-sm')
          : 'bg-[var(--bg-surface-2)] border-[color:var(--border-soft)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-strong)]',
        className,
      )}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[1.25rem] px-1 h-4 rounded-full text-[10px] font-semibold num',
            COUNT_TONE[tone],
            !active && 'opacity-50',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export default FilterChip
