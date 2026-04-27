import { Card } from '@/components/ui'
import { cn } from '@/components/ui'

type Tone = 'neutral' | 'bull' | 'bear' | 'warn' | 'brand'

const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-[color:var(--text-primary)]',
  bull: 'text-emerald-400',
  bear: 'text-red-400',
  warn: 'text-amber-400',
  brand: 'text-indigo-300',
}

const ACCENT: Record<Tone, string> = {
  neutral: 'before:bg-[var(--border-strong)]',
  bull: 'before:bg-emerald-500/60',
  bear: 'before:bg-red-500/60',
  warn: 'before:bg-amber-500/60',
  brand: 'before:bg-indigo-500/60',
}

export interface StatTileProps {
  label: string
  value: string
  sub?: string
  tone?: Tone
}

export function StatTile({ label, value, sub, tone = 'neutral' }: StatTileProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-4 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]',
        ACCENT[tone],
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className={cn('num mt-1 text-2xl font-semibold leading-tight tracking-tight', VALUE_TONE[tone])}>
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-[11px] text-[color:var(--text-secondary)]">{sub}</div>
      ) : null}
    </Card>
  )
}

export default StatTile
