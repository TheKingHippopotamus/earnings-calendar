// =============================================================================
// MetricBars — horizontal Previous / Consensus / Actual comparison.
// Used inside the Company detail page, one for EPS, one for Revenue.
// =============================================================================
import type { ReactElement } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from 'recharts'
import { Card, cn } from '@/components/ui'
import { formatPct } from '@/lib/analytics/units'

export interface MetricBarsProps {
  label: 'EPS' | 'Revenue'
  previous: number | null
  consensus: number | null
  actual: number | null
  format: (n: number | null) => string
  bullish: boolean
  yoy?: number | null
  beat?: number | null
}

interface BarRow {
  name: string
  /** Always non-null for chart rendering — null becomes 0 with a sentinel flag */
  value: number
  raw: number | null
  fill: string
}

const PREV_COLOR = '#475569'      // slate-600
const CONS_COLOR = '#6366f1'      // indigo-500
const BULL_COLOR = '#10b981'      // emerald-500
const BEAR_COLOR = '#ef4444'      // red-500

/** Pick a bar color for the Actual row. */
function actualColor(bullish: boolean): string {
  return bullish ? BULL_COLOR : BEAR_COLOR
}

interface ValueLabelProps {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
  index?: number
}

function toNum(v: number | string | undefined): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function MetricBars({
  label,
  previous,
  consensus,
  actual,
  format,
  bullish,
  yoy,
  beat,
}: MetricBarsProps) {
  const rows: BarRow[] = [
    {
      name: 'Previous',
      value: previous ?? 0,
      raw: previous,
      fill: PREV_COLOR,
    },
    {
      name: 'Consensus',
      value: consensus ?? 0,
      raw: consensus,
      fill: CONS_COLOR,
    },
    {
      name: 'Actual',
      value: actual ?? 0,
      raw: actual,
      fill: actualColor(bullish),
    },
  ]

  // Determine sign behavior for chart domain — pad slightly above max
  const maxAbs = Math.max(
    1e-9,
    ...rows.map((r) => Math.abs(r.value || 0)),
  )
  const allNonNeg = rows.every((r) => (r.value ?? 0) >= 0)
  const domain: [number, number] = allNonNeg
    ? [0, maxAbs * 1.25]
    : [-maxAbs * 1.25, maxAbs * 1.25]

  const renderValueLabel = (rawProps: unknown): ReactElement => {
    const props = rawProps as ValueLabelProps
    const { x, y, width, height, index } = props
    const i = index ?? -1
    const row = rows[i]
    if (!row) return <g />
    const xn = toNum(x)
    const yn = toNum(y)
    const wn = toNum(width)
    const hn = toNum(height)
    const text = format(row.raw)
    const labelX = xn + wn + 6
    const labelY = yn + hn / 2
    const fill = row.raw === null ? 'var(--text-muted)' : 'var(--text-primary)'
    return (
      <text
        x={labelX}
        y={labelY}
        dominantBaseline="middle"
        textAnchor="start"
        fontSize={11}
        fontWeight={600}
        className="num"
        fill={fill}
      >
        {text}
      </text>
    )
  }

  const yoyTone =
    yoy === null || yoy === undefined
      ? 'text-[color:var(--text-muted)]'
      : yoy > 0
        ? 'text-emerald-400'
        : yoy < 0
          ? 'text-red-400'
          : 'text-[color:var(--text-muted)]'

  const beatTone =
    beat === null || beat === undefined
      ? 'text-[color:var(--text-muted)]'
      : beat > 0
        ? 'text-emerald-400'
        : beat < 0
          ? 'text-red-400'
          : 'text-[color:var(--text-muted)]'

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-[color:var(--text-secondary)]">
          {label}
        </h3>
        <span className="num text-base font-bold text-[color:var(--text-primary)]">
          {format(actual)}
        </span>
      </div>

      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 64, bottom: 4, left: 4 }}
            barCategoryGap="22%"
          >
            <XAxis type="number" hide domain={domain} />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={78}
              tick={{
                fill: 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 500,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} isAnimationActive={false}>
              {rows.map((r, i) => (
                <Cell key={`c-${i}`} fill={r.fill} fillOpacity={r.raw === null ? 0.18 : 0.95} />
              ))}
              <LabelList dataKey="value" content={renderValueLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] num border-t border-[color:var(--border-soft)] pt-3">
        <div className="flex items-center gap-1.5">
          <span className="uppercase tracking-wide text-[10px] text-[color:var(--text-muted)]">
            YoY
          </span>
          <span className={cn('font-semibold', yoyTone)}>{formatPct(yoy)}</span>
        </div>
        <div className="h-3 w-px bg-[color:var(--border-soft)]" />
        <div className="flex items-center gap-1.5">
          <span className="uppercase tracking-wide text-[10px] text-[color:var(--text-muted)]">
            vs Cons
          </span>
          <span className={cn('font-semibold', beatTone)}>{formatPct(beat)}</span>
        </div>
      </div>
    </Card>
  )
}

export default MetricBars
