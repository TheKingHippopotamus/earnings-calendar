import { Badge, Tooltip, cn } from '@/components/ui'
import { formatPct } from '@/lib/analytics/units'
import type { DerivedMetric } from '@/lib/types'

type Tone = 'bull' | 'bear' | 'warn' | 'mute' | 'neutral'

interface MetricCellProps {
  label: 'EPS' | 'Revenue'
  actual: number | null
  consensus: number | null
  previous: number | null
  derived: DerivedMetric
  formatActual: (n: number | null | undefined) => string
}

function toneFor(positive: boolean | null, signedValue: number | null): Tone {
  if (positive === null) return 'mute'
  if (signedValue === null || !Number.isFinite(signedValue)) {
    return positive ? 'bull' : 'bear'
  }
  if (signedValue > 0) return 'bull'
  if (signedValue < 0) return 'bear'
  return 'mute'
}

export function MetricCell({
  label,
  actual,
  consensus,
  previous,
  derived,
  formatActual,
}: MetricCellProps) {
  const beatTone = toneFor(derived.beatConsensus, derived.beat)
  const yoyTone = toneFor(derived.grewYoY, derived.yoy)

  const consensusStr = formatActual(consensus)
  const previousStr = formatActual(previous)

  const tooltipContent = (
    <div className="flex flex-col gap-0.5 text-left">
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-[color:var(--text-secondary)]">Consensus</span>
        <span className="num text-[color:var(--text-primary)]">{consensusStr}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-[color:var(--text-secondary)]">Previous</span>
        <span className="num text-[color:var(--text-primary)]">{previousStr}</span>
      </div>
    </div>
  )

  const beatLabel = derived.beat === null ? '—' : formatPct(derived.beat)
  const yoyLabel = derived.yoy === null ? '—' : formatPct(derived.yoy)

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold">
        {label}
      </div>
      <Tooltip content={tooltipContent}>
        <span
          className={cn(
            'num text-xl font-semibold leading-none text-[color:var(--text-primary)]',
            'cursor-help',
          )}
        >
          {formatActual(actual)}
        </span>
      </Tooltip>
      <div className="flex flex-wrap items-center gap-1 pt-0.5">
        <Badge tone={beatTone} size="xs" className="!normal-case tracking-normal">
          <span className="text-[color:var(--text-muted)] mr-0.5 normal-case">vs cons</span>
          <span className="num">{beatLabel}</span>
        </Badge>
        <Badge tone={yoyTone} size="xs" className="!normal-case tracking-normal">
          <span className="text-[color:var(--text-muted)] mr-0.5 normal-case">YoY</span>
          <span className="num">{yoyLabel}</span>
        </Badge>
      </div>
    </div>
  )
}

export default MetricCell
