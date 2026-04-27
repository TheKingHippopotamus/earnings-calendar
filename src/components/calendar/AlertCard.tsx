import { Link } from 'react-router-dom'
import { Badge, Card, cn } from '@/components/ui'
import type { Company, FraudFlag, FraudSeverity } from '@/lib/types'
import { formatMoney, formatPct } from '@/lib/analytics/units'
import { SeverityDot } from './SeverityDot'
import { VerdictPill } from './VerdictPill'

const SEV_BORDER: Record<FraudSeverity, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-indigo-500',
}

const SEV_HOVER_GLOW: Record<FraudSeverity, string> = {
  high: 'hover:shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_8px_24px_-6px_rgba(239,68,68,0.25)]',
  medium: 'hover:shadow-[0_0_0_1px_rgba(245,158,11,0.30),0_8px_24px_-6px_rgba(245,158,11,0.20)]',
  low: 'hover:shadow-[0_0_0_1px_rgba(99,102,241,0.30),0_8px_24px_-6px_rgba(99,102,241,0.18)]',
}

const SEV_BADGE: Record<FraudSeverity, 'bear' | 'warn' | 'brand'> = {
  high: 'bear',
  medium: 'warn',
  low: 'brand',
}

const SEV_LABEL: Record<FraudSeverity, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
}

function qualityTone(score: number): 'bull' | 'warn' | 'bear' | 'mute' {
  if (!Number.isFinite(score)) return 'mute'
  if (score >= 70) return 'bull'
  if (score >= 40) return 'warn'
  return 'bear'
}

function pctClass(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return 'text-[color:var(--text-muted)]'
  if (n > 0) return 'text-emerald-400'
  if (n < 0) return 'text-red-400'
  return 'text-[color:var(--text-secondary)]'
}

function FlagRow({ flag }: { flag: FraudFlag }) {
  const tone = SEV_BADGE[flag.severity]
  return (
    <li className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
      <span className="mt-1.5">
        <SeverityDot severity={flag.severity} pulse={flag.severity === 'high'} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[color:var(--text-primary)]">
            {flag.label}
          </span>
          <Badge tone={tone} size="xs" className="font-semibold">
            {SEV_LABEL[flag.severity]}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--text-secondary)]">
          {flag.detail}
        </p>
      </div>
    </li>
  )
}

interface MetricInlineProps {
  label: string
  value: number | null
}

function MetricInline({ label, value }: MetricInlineProps) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] font-semibold">
        {label}
      </span>
      <span className={cn('num text-xs font-semibold tabular-nums', pctClass(value))}>
        {formatPct(value)}
      </span>
    </div>
  )
}

export interface AlertCardProps {
  company: Company
}

export function AlertCard({ company }: AlertCardProps) {
  const sev = company.topSeverity ?? 'low'
  const qTone = qualityTone(company.qualityScore)

  // Sort flags inside the card high → low for visual hierarchy
  const SEV_RANK: Record<FraudSeverity, number> = { high: 3, medium: 2, low: 1 }
  const flags = [...company.flags].sort(
    (a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity],
  )

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-l-4 p-4 sm:p-5',
        'transition-all duration-150 hover:-translate-y-px hover:border-strong',
        SEV_BORDER[sev],
        SEV_HOVER_GLOW[sev],
      )}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link
              to={`/c/${company.ticker}`}
              className={cn(
                'mono text-base font-bold tracking-tight text-[color:var(--text-primary)]',
                'hover:text-indigo-300 transition-colors',
              )}
            >
              {company.ticker}
            </Link>
            <span className="truncate text-sm text-[color:var(--text-secondary)]">
              {company.name}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[color:var(--text-muted)]">
            <span>{company.date}</span>
            <span aria-hidden="true">·</span>
            <span>{company.time}</span>
            <span aria-hidden="true">·</span>
            <span>{company.fiscalQuarter}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {company.marketCapLabel ? (
            <span className="num text-xs font-semibold text-[color:var(--text-secondary)]">
              {formatMoney(company.marketCap)}
            </span>
          ) : null}
          <Badge tone={qTone} size="xs" className="font-semibold">
            Q {Math.round(company.qualityScore)}
          </Badge>
          <VerdictPill verdict={company.verdict} />
        </div>
      </header>

      {/* Flags */}
      <ul className="mt-3 divide-y divide-[color:var(--border-soft)]">
        {flags.map((f) => (
          <FlagRow key={f.id} flag={f} />
        ))}
      </ul>

      {/* Snapshot row */}
      <footer
        className={cn(
          'mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3',
          'border-[color:var(--border-soft)]',
        )}
      >
        <MetricInline label="EPS YoY" value={company.epsDerived.yoy} />
        <span className="text-[color:var(--border-strong)]" aria-hidden="true">·</span>
        <MetricInline label="Rev YoY" value={company.revenueDerived.yoy} />
        <span className="text-[color:var(--border-strong)]" aria-hidden="true">·</span>
        <MetricInline label="EPS Beat" value={company.epsDerived.beat} />
        <span className="text-[color:var(--border-strong)]" aria-hidden="true">·</span>
        <MetricInline label="Rev Beat" value={company.revenueDerived.beat} />
      </footer>
    </Card>
  )
}

export default AlertCard
