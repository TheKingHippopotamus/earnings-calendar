// =============================================================================
// QualityRadial — donut/radial gauge for the composite quality score (0-100).
// =============================================================================
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import { cn } from '@/components/ui'
import type { QualityBreakdown } from '@/lib/types'

export interface QualityRadialProps {
  score: number
  size?: number
  breakdown?: QualityBreakdown
}

function colorFor(score: number): string {
  if (score < 40) return '#ef4444' // red-500
  if (score <= 65) return '#f59e0b' // amber-500
  return '#10b981' // emerald-500
}

function rating(score: number): string {
  if (score < 40) return 'Weak'
  if (score < 55) return 'Fragile'
  if (score < 70) return 'Steady'
  if (score < 85) return 'Strong'
  return 'Pristine'
}

export function QualityRadial({ score, size = 200, breakdown }: QualityRadialProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const color = colorFor(clamped)
  const data = [
    {
      name: 'Quality',
      value: clamped,
      fill: color,
    },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius={70}
            outerRadius={90}
            startAngle={90}
            endAngle={-270}
            barSize={20}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            {/* Background track */}
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: 'var(--bg-surface-2)' }}
              fill={color}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div
          className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center"
          aria-hidden="true"
        >
          <span
            className="num text-4xl font-bold leading-none tracking-tight"
            style={{ color }}
          >
            {clamped}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-muted)] font-semibold">
            Quality
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-[color:var(--text-secondary)]">
            {rating(clamped)}
          </span>
        </div>
      </div>

      {breakdown && <BreakdownChips b={breakdown} />}
    </div>
  )
}

function BreakdownChips({ b }: { b: QualityBreakdown }) {
  const items: { key: keyof QualityBreakdown; label: string; signed?: boolean }[] = [
    { key: 'revenueGrowthScore', label: 'Rev Growth' },
    { key: 'epsGrowthScore', label: 'EPS Growth' },
    { key: 'revenueBeatScore', label: 'Rev Beat' },
    { key: 'epsBeatScore', label: 'EPS Beat' },
    { key: 'marginScore', label: 'Margin' },
    { key: 'fraudPenalty', label: 'Fraud', signed: true },
  ]
  return (
    <div className="grid grid-cols-3 gap-1.5 w-full">
      {items.map((it) => {
        const raw = b[it.key]
        const isPenalty = it.key === 'fraudPenalty'
        const display = isPenalty
          ? raw === 0
            ? '0'
            : `-${Math.round(raw)}`
          : Math.round(raw).toString()
        const tone = isPenalty
          ? raw > 0
            ? 'text-red-400'
            : 'text-[color:var(--text-muted)]'
          : 'text-[color:var(--text-secondary)]'
        return (
          <div
            key={it.key}
            className="rounded-md border border-[color:var(--border-soft)] bg-[color:var(--bg-surface-2)] px-2 py-1.5 flex flex-col items-start"
          >
            <span className="text-[9px] uppercase tracking-wide text-[color:var(--text-muted)] font-semibold leading-none">
              {it.label}
            </span>
            <span className={cn('mt-1 text-xs num font-semibold leading-none', tone)}>
              {display}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default QualityRadial
