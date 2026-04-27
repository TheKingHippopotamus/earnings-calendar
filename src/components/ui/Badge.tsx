import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'neutral' | 'bull' | 'bear' | 'warn' | 'brand' | 'mute'

const TONE: Record<Tone, string> = {
  neutral: 'bg-[var(--bg-surface-2)] text-[color:var(--text-primary)] border-[color:var(--border-soft)]',
  mute:    'bg-[var(--bg-surface-2)] text-[color:var(--text-muted)] border-[color:var(--border-soft)]',
  bull:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  bear:    'bg-red-500/10 text-red-400 border-red-500/30',
  warn:    'bg-amber-500/10 text-amber-400 border-amber-500/30',
  brand:   'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  size = 'sm',
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'md'
}) {
  const sz = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : size === 'md' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium uppercase tracking-wide num',
        sz,
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
