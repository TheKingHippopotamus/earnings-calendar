import { Tooltip, cn } from '@/components/ui'
import type { QualityBreakdown } from '@/lib/types'

interface QualityBarProps {
  score: number
  breakdown?: QualityBreakdown
  className?: string
}

function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function scoreTone(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(0)}`
}

export function QualityBar({ score, breakdown, className }: QualityBarProps) {
  const pct = clamp(score)
  const tone = scoreTone(pct)

  const bar = (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="flex-1 relative h-1.5 rounded-full bg-[var(--bg-surface-2)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full quality-bar"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className={cn('num text-xs font-semibold tabular-nums w-7 text-right', tone)}>
        {Math.round(pct)}
      </span>
    </div>
  )

  if (!breakdown) return bar

  const rows: Array<[string, number]> = [
    ['Revenue Growth', breakdown.revenueGrowthScore],
    ['EPS Growth', breakdown.epsGrowthScore],
    ['Revenue Beat', breakdown.revenueBeatScore],
    ['EPS Beat', breakdown.epsBeatScore],
    ['Margin', breakdown.marginScore],
    ['Fraud Penalty', breakdown.fraudPenalty],
  ]

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-0.5 text-left min-w-[160px]">
          <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] font-semibold pb-1">
            Quality breakdown
          </div>
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-[color:var(--text-secondary)]">{label}</span>
              <span className="num text-[color:var(--text-primary)]">{fmt(value)}</span>
            </div>
          ))}
        </div>
      }
    >
      <span className="block w-full">{bar}</span>
    </Tooltip>
  )
}

export default QualityBar
