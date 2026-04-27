// =============================================================================
// Sparkline — minimalist line chart for 3-point earnings trend
// (previous → consensus → actual). Used inside the Company detail page.
// =============================================================================
import { useId } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip as RTooltip,
  type TooltipContentProps,
} from 'recharts'

export type SparklineTone = 'bull' | 'bear' | 'neutral'

export interface SparklineProps {
  values: (number | null)[]
  labels?: string[]
  consensus?: number | null
  tone?: SparklineTone
  height?: number
  /** Optional formatter for the tooltip value */
  format?: (n: number) => string
}

const TONE_STROKE: Record<SparklineTone, string> = {
  bull: '#10b981',    // emerald-500
  bear: '#ef4444',    // red-500
  neutral: '#6366f1', // indigo-500
}

const TONE_FILL: Record<SparklineTone, string> = {
  bull: 'rgba(16, 185, 129, 0.18)',
  bear: 'rgba(239, 68, 68, 0.18)',
  neutral: 'rgba(99, 102, 241, 0.18)',
}

interface ChartPoint {
  idx: number
  label: string
  value: number | null
}

function defaultFormat(n: number): string {
  return n.toFixed(2)
}

function SparklineTooltip({
  active,
  payload,
  format,
}: TooltipContentProps<number, string> & { format: (n: number) => string }) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0]?.payload as ChartPoint | undefined
  if (!p || p.value === null) return null
  return (
    <div
      className="rounded-md border px-2 py-1 text-xs shadow-lg num"
      style={{
        background: 'var(--bg-elev)',
        borderColor: 'var(--border-soft)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        className="text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {p.label}
      </div>
      <div className="font-semibold">{format(p.value)}</div>
    </div>
  )
}

export function Sparkline({
  values,
  labels = ['Prev', 'Cons', 'Actual'],
  consensus,
  tone = 'neutral',
  height = 120,
  format = defaultFormat,
}: SparklineProps) {
  const stroke = TONE_STROKE[tone]
  const fill = TONE_FILL[tone]
  const gradId = useId().replace(/[:]/g, '_')

  const data: ChartPoint[] = values.map((v, i) => ({
    idx: i,
    label: labels[i] ?? `#${i + 1}`,
    value: v,
  }))

  const lastIdx = (() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].value !== null) return i
    }
    return -1
  })()

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: 12 }}>
          <defs>
            <linearGradient id={`sl-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={1} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="idx" hide />
          <YAxis hide domain={['auto', 'auto']} />
          {consensus !== null && consensus !== undefined && Number.isFinite(consensus) && (
            <ReferenceLine
              y={consensus}
              stroke="var(--border-strong)"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
          )}
          <RTooltip
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '2 2' }}
            content={(p) => (
              <SparklineTooltip {...(p as TooltipContentProps<number, string>)} format={format} />
            )}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number }) => {
              const { cx, cy, index } = props
              if (cx === undefined || cy === undefined) {
                return <g key={`dot-${index ?? 'na'}`} />
              }
              const isLast = index === lastIdx
              return (
                <circle
                  key={`dot-${index ?? 'na'}`}
                  cx={cx}
                  cy={cy}
                  r={isLast ? 4.5 : 3}
                  fill={isLast ? stroke : 'var(--bg-elev)'}
                  stroke={stroke}
                  strokeWidth={isLast ? 2 : 1.5}
                />
              )
            }}
            activeDot={{ r: 5, fill: stroke, stroke: 'var(--bg-elev)', strokeWidth: 2 }}
          />
          {/* Hidden filled area below line via gradient stub to satisfy defs reference */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="transparent"
            fill={`url(#sl-${gradId})`}
            connectNulls
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Sparkline
