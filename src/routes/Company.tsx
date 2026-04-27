// =============================================================================
// Company detail page — /c/:ticker
// Magazine-quality forensic detail view: hero header, metric bars, quality
// radial, fraud flags, and trend sparklines.
// =============================================================================
import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, Tooltip, cn } from '@/components/ui'
import { VerdictPill } from '@/components/calendar/VerdictPill'
import { FlagList } from '@/components/calendar/FlagList'
import { MetricBars } from '@/components/charts/MetricBars'
import { QualityRadial } from '@/components/charts/QualityRadial'
import { Sparkline } from '@/components/charts/Sparkline'
import {
  formatBps,
  formatEps,
  formatMoney,
  formatPct,
} from '@/lib/analytics/units'
import { useAppStore } from '@/lib/store/useAppStore'
import type { Company as CompanyT, QualityBreakdown } from '@/lib/types'

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatRevenue(n: number | null): string {
  return formatMoney(n)
}

function formatEpsDollar(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `$${formatEps(n)}`
}

function buildNarrative(c: CompanyT): string[] {
  const lines: string[] = []

  // EPS line
  if (c.eps.actual !== null && c.eps.consensus !== null && c.epsDerived.beat !== null) {
    const beat = c.epsDerived.beat
    const verdictWord = beat >= 0 ? 'beating' : 'missing'
    const yoyPart =
      c.epsDerived.yoy !== null
        ? ` and ${c.epsDerived.yoy >= 0 ? 'growing' : 'declining'} ${Math.abs(c.epsDerived.yoy).toFixed(1)}% YoY`
        : ''
    lines.push(
      `Reported EPS of ${formatEpsDollar(c.eps.actual)}, ${verdictWord} consensus of ${formatEpsDollar(c.eps.consensus)} by ${Math.abs(beat).toFixed(1)}%${yoyPart}.`,
    )
  } else if (c.eps.actual !== null) {
    lines.push(`Reported EPS of ${formatEpsDollar(c.eps.actual)}.`)
  }

  // Revenue line
  if (
    c.revenue.actual !== null &&
    c.revenue.consensus !== null &&
    c.revenueDerived.beat !== null
  ) {
    const beat = c.revenueDerived.beat
    const verdictWord = beat >= 0 ? 'beat' : 'missed'
    const yoyPart =
      c.revenueDerived.yoy !== null
        ? ` and ${c.revenueDerived.yoy >= 0 ? 'grew' : 'declined'} ${Math.abs(c.revenueDerived.yoy).toFixed(1)}% YoY`
        : ''
    lines.push(
      `Revenue of ${formatRevenue(c.revenue.actual)} ${verdictWord} consensus by ${Math.abs(beat).toFixed(1)}%${yoyPart}.`,
    )
  } else if (c.revenue.actual !== null) {
    lines.push(`Revenue of ${formatRevenue(c.revenue.actual)}.`)
  }

  // Composite quality
  lines.push(`Composite quality score: ${Math.round(c.qualityScore)}/100.`)

  // Flags
  if (c.flags.length > 0) {
    lines.push(`Flagged for: ${c.flags.map((f) => f.label).join(', ')}.`)
  }

  return lines
}

function timeLabel(t: string): string {
  if (t === 'AM') return 'Before Open'
  if (t === 'PM') return 'After Close'
  return t
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function HeaderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="elev rounded-2xl p-6 sm:p-8">
        <div className="skeleton h-8 w-24 mb-4" />
        <div className="skeleton h-12 w-48 mb-3" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
        <div className="skeleton h-72 rounded-xl" />
      </div>
    </div>
  )
}

function NotFound({ ticker }: { ticker: string | undefined }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Card className="p-8 sm:p-10 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <InfoIcon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-primary)]">
          Company not found
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          We couldn&apos;t find{' '}
          <span className="mono num font-semibold text-[color:var(--text-primary)]">
            {ticker ?? '—'}
          </span>{' '}
          in the current earnings calendar.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="secondary" size="md">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to calendar
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

function MarginProxySection({ c }: { c: CompanyT }) {
  const cur = c.marginProxyActual
  const prev = c.marginProxyPrevious
  const bps = c.marginProxyChangeBps
  const tone =
    bps === null
      ? 'text-[color:var(--text-muted)]'
      : bps > 0
        ? 'text-emerald-400'
        : bps < 0
          ? 'text-red-400'
          : 'text-[color:var(--text-muted)]'

  const pctFmt = (n: number | null): string => {
    if (n === null || !Number.isFinite(n)) return '—'
    return `${(n * 100).toFixed(2)}%`
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-[color:var(--text-secondary)]">
            Margin Proxy
          </h3>
          <Tooltip content="Margin proxy = EPS / Revenue. Direction-only signal.">
            <span className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] cursor-help">
              <InfoIcon className="h-3.5 w-3.5" />
            </span>
          </Tooltip>
        </div>
        <span className={cn('num text-sm font-semibold', tone)}>
          {bps === null ? '—' : formatBps(bps)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] font-semibold">
            Previous
          </div>
          <div className="num text-base font-semibold text-[color:var(--text-secondary)] mt-0.5">
            {pctFmt(prev)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] font-semibold">
            Current
          </div>
          <div className="num text-base font-bold text-[color:var(--text-primary)] mt-0.5">
            {pctFmt(cur)}
          </div>
        </div>
      </div>
    </Card>
  )
}

function WhatHappenedSection({ c }: { c: CompanyT }) {
  const lines = useMemo(() => buildNarrative(c), [c])
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-1.5 w-6 rounded-full grad-brand" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-[color:var(--text-secondary)]">
          What happened
        </h3>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-[color:var(--text-primary)]">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </Card>
  )
}

function QualityBreakdownList({ b }: { b: QualityBreakdown }) {
  const items: { key: keyof QualityBreakdown; label: string; isPenalty?: boolean }[] = [
    { key: 'revenueGrowthScore', label: 'Revenue Growth' },
    { key: 'epsGrowthScore', label: 'EPS Growth' },
    { key: 'revenueBeatScore', label: 'Revenue Beat' },
    { key: 'epsBeatScore', label: 'EPS Beat' },
    { key: 'marginScore', label: 'Margin' },
    { key: 'fraudPenalty', label: 'Fraud Penalty', isPenalty: true },
  ]
  return (
    <ul className="flex flex-col divide-y divide-[color:var(--border-soft)]">
      {items.map((it) => {
        const raw = b[it.key]
        const v = Math.round(raw)
        const display = it.isPenalty ? (v === 0 ? '0' : `-${v}`) : v.toString()
        const tone = it.isPenalty
          ? v > 0
            ? 'text-red-400'
            : 'text-[color:var(--text-muted)]'
          : 'text-[color:var(--text-primary)]'
        return (
          <li
            key={it.key}
            className="flex items-center justify-between py-2 text-xs"
          >
            <span className="text-[color:var(--text-secondary)]">{it.label}</span>
            <span className={cn('num font-semibold', tone)}>{display}</span>
          </li>
        )
      })}
    </ul>
  )
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Company() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const dataset = useAppStore((s) => s.dataset)
  const loading = useAppStore((s) => s.loading)

  const company = useMemo(
    () => dataset?.companies?.find((c) => c.ticker === ticker) ?? null,
    [dataset, ticker],
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [ticker])

  if (!dataset && loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <HeaderSkeleton />
      </div>
    )
  }

  if (!company) {
    return <NotFound ticker={ticker} />
  }

  const epsBullish = company.epsDerived.beatConsensus !== false
  const revBullish = company.revenueDerived.beatConsensus !== false

  const epsTone: 'bull' | 'bear' | 'neutral' =
    company.epsDerived.beatConsensus === true
      ? 'bull'
      : company.epsDerived.beatConsensus === false
        ? 'bear'
        : 'neutral'
  const revTone: 'bull' | 'bear' | 'neutral' =
    company.revenueDerived.beatConsensus === true
      ? 'bull'
      : company.revenueDerived.beatConsensus === false
        ? 'bear'
        : 'neutral'

  const mcLabel =
    company.marketCap !== null ? formatMoney(company.marketCap) : (company.marketCapLabel ?? '—')

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero header */}
      <div className="elev rounded-2xl overflow-hidden">
        {/* Top accent bar */}
        <div
          className={cn(
            'h-1 w-full',
            company.verdict === 'beat'
              ? 'grad-bull'
              : company.verdict === 'miss'
                ? 'grad-bear'
                : company.verdict === 'mixed'
                  ? 'bg-amber-500'
                  : 'bg-[color:var(--border-strong)]',
          )}
        />
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3 mb-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
            <VerdictPill verdict={company.verdict} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h1 className="mono num text-3xl sm:text-4xl font-bold tracking-tight text-[color:var(--text-primary)] leading-none">
                {company.ticker}
              </h1>
              <span className="text-base sm:text-lg text-[color:var(--text-secondary)] font-medium truncate">
                {company.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" size="sm">
                {company.weekday || company.date}
              </Badge>
              <Badge tone={company.time === 'AM' ? 'brand' : 'neutral'} size="sm">
                {timeLabel(company.time)}
              </Badge>
              <Badge tone="mute" size="sm">
                {company.fiscalQuarter}
              </Badge>
              <span className="num text-xs text-[color:var(--text-muted)]">
                Market Cap · <span className="text-[color:var(--text-secondary)] font-semibold">{mcLabel}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricBars
              label="EPS"
              previous={company.eps.previous}
              consensus={company.eps.consensus}
              actual={company.eps.actual}
              format={formatEpsDollar}
              bullish={epsBullish}
              yoy={company.epsDerived.yoy}
              beat={company.epsDerived.beat}
            />
            <MetricBars
              label="Revenue"
              previous={company.revenue.previous}
              consensus={company.revenue.consensus}
              actual={company.revenue.actual}
              format={formatRevenue}
              bullish={revBullish}
              yoy={company.revenueDerived.yoy}
              beat={company.revenueDerived.beat}
            />
          </div>

          <MarginProxySection c={company} />

          <WhatHappenedSection c={company} />
        </div>

        {/* RIGHT 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4 sm:p-5 flex flex-col items-center">
            <QualityRadial score={company.qualityScore} size={200} />
            <div className="mt-5 w-full">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-muted)] font-semibold mb-1">
                Breakdown
              </div>
              <QualityBreakdownList b={company.qualityBreakdown} />
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                {company.flags.length > 0
                  ? `Forensic Flags (${company.flags.length})`
                  : 'No Flags'}
              </h2>
            </div>
            <FlagList flags={company.flags} />
          </div>
        </div>
      </div>

      {/* Trend section */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-1.5 w-6 rounded-full grad-brand" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[color:var(--text-secondary)]">
            Trend
          </h2>
          <span className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wide">
            Previous · Consensus · Actual
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                EPS
              </h3>
              <span className="num text-xs text-[color:var(--text-muted)]">
                Consensus: {formatEpsDollar(company.eps.consensus)}
              </span>
            </div>
            <Sparkline
              values={[company.eps.previous, company.eps.consensus, company.eps.actual]}
              labels={['Prev', 'Cons', 'Actual']}
              consensus={company.eps.consensus}
              tone={epsTone}
              format={(n) => `$${formatEps(n)}`}
            />
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] num">
              <span>Prev {formatEpsDollar(company.eps.previous)}</span>
              <span>Cons {formatEpsDollar(company.eps.consensus)}</span>
              <span>Actual {formatEpsDollar(company.eps.actual)}</span>
            </div>
            {company.epsDerived.yoy !== null && (
              <div className="mt-1 text-[11px] num text-[color:var(--text-secondary)]">
                YoY{' '}
                <span
                  className={cn(
                    'font-semibold',
                    company.epsDerived.yoy > 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatPct(company.epsDerived.yoy)}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                Revenue
              </h3>
              <span className="num text-xs text-[color:var(--text-muted)]">
                Consensus: {formatRevenue(company.revenue.consensus)}
              </span>
            </div>
            <Sparkline
              values={[
                company.revenue.previous,
                company.revenue.consensus,
                company.revenue.actual,
              ]}
              labels={['Prev', 'Cons', 'Actual']}
              consensus={company.revenue.consensus}
              tone={revTone}
              format={(n) => formatMoney(n)}
            />
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] num">
              <span>Prev {formatRevenue(company.revenue.previous)}</span>
              <span>Cons {formatRevenue(company.revenue.consensus)}</span>
              <span>Actual {formatRevenue(company.revenue.actual)}</span>
            </div>
            {company.revenueDerived.yoy !== null && (
              <div className="mt-1 text-[11px] num text-[color:var(--text-secondary)]">
                YoY{' '}
                <span
                  className={cn(
                    'font-semibold',
                    company.revenueDerived.yoy > 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatPct(company.revenueDerived.yoy)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
