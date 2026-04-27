import { Link } from 'react-router-dom'
import { Badge, Card, Tooltip, cn } from '@/components/ui'
import { formatEps, formatMoney } from '@/lib/analytics/units'
import type { Company, FraudSeverity } from '@/lib/types'
import { MetricCell } from './MetricCell'
import { QualityBar } from './QualityBar'
import { VerdictPill } from './VerdictPill'

interface CompanyCardProps {
  company: Company
}

const VERDICT_BORDER: Record<Company['verdict'], string> = {
  beat: 'border-l-emerald-500/70',
  miss: 'border-l-red-500/70',
  mixed: 'border-l-amber-500/70',
  unknown: 'border-l-[color:var(--border-strong)]',
}

const SEVERITY_COLOR: Record<FraudSeverity, string> = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-indigo-300',
}

const SEVERITY_LABEL: Record<FraudSeverity, string> = {
  high: 'High severity',
  medium: 'Medium severity',
  low: 'Low severity',
}

export function CompanyCard({ company }: CompanyCardProps) {
  const {
    ticker,
    name,
    time,
    fiscalQuarter,
    marketCap,
    marketCapLabel,
    eps,
    revenue,
    epsDerived,
    revenueDerived,
    qualityScore,
    qualityBreakdown,
    verdict,
    flags,
    topSeverity,
  } = company

  const flagCount = flags.length
  const sev = topSeverity ?? 'low'
  const flagColor = SEVERITY_COLOR[sev]

  const flagTooltip = (
    <div className="flex flex-col gap-1 text-left max-w-[260px]">
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] font-semibold">
        {SEVERITY_LABEL[sev]} · {flagCount} flag{flagCount === 1 ? '' : 's'}
      </div>
      {flags.slice(0, 4).map((f) => (
        <div key={f.id} className="text-xs text-[color:var(--text-primary)] leading-tight">
          <span className={cn('font-semibold', SEVERITY_COLOR[f.severity])}>·</span>{' '}
          {f.label}
        </div>
      ))}
      {flagCount > 4 && (
        <div className="text-[10px] text-[color:var(--text-muted)]">+{flagCount - 4} more</div>
      )}
    </div>
  )

  const mcLabel = marketCap !== null ? formatMoney(marketCap) : marketCapLabel ?? '—'

  return (
    <Link
      to={`/c/${ticker}`}
      className="group block focus-visible:outline-none"
      aria-label={`${ticker} ${name} earnings card`}
    >
      <Card
        className={cn(
          'relative h-full p-4 sm:p-5 border-l-2 transition-all duration-150',
          'hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]',
          'group-focus-visible:ring-2 group-focus-visible:ring-indigo-500/40',
          VERDICT_BORDER[verdict],
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="mono num text-lg font-bold tracking-tight text-[color:var(--text-primary)] leading-none">
                {ticker}
              </span>
            </div>
            <span className="mt-1 text-xs text-[color:var(--text-secondary)] truncate max-w-[200px] sm:max-w-[240px]">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge tone={time === 'AM' ? 'brand' : 'neutral'} size="xs">
              {time}
            </Badge>
            <Badge tone="mute" size="xs">
              {fiscalQuarter}
            </Badge>
          </div>
        </div>

        {/* Sub-row: market cap + verdict */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="num text-xs text-[color:var(--text-muted)]">
            {mcLabel}
          </span>
          <VerdictPill verdict={verdict} />
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[color:var(--border-soft)] pt-4">
          <MetricCell
            label="EPS"
            actual={eps.actual}
            consensus={eps.consensus}
            previous={eps.previous}
            derived={epsDerived}
            formatActual={(n) => (n === null || n === undefined ? '—' : `$${formatEps(n)}`)}
          />
          <MetricCell
            label="Revenue"
            actual={revenue.actual}
            consensus={revenue.consensus}
            previous={revenue.previous}
            derived={revenueDerived}
            formatActual={(n) => formatMoney(n)}
          />
        </div>

        {/* Bottom: quality + flags */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <QualityBar score={qualityScore} breakdown={qualityBreakdown} />
          </div>
          {flagCount > 0 && (
            <Tooltip content={flagTooltip}>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-[11px] font-medium num shrink-0',
                  flagColor,
                )}
              >
                <span className="pulse-dot" aria-hidden="true" />
                <span aria-hidden="true">⚑</span>
                <span>
                  {flagCount} flag{flagCount === 1 ? '' : 's'}
                </span>
              </span>
            </Tooltip>
          )}
        </div>
      </Card>
    </Link>
  )
}

export default CompanyCard
