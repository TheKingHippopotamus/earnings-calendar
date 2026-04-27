import { useMemo } from 'react'
import { Card, cn } from '@/components/ui'
import type { Company, FraudSeverity } from '@/lib/types'

const SEV_TONE: Record<
  FraudSeverity,
  { label: string; text: string; accent: string; bar: string; dot: string }
> = {
  high: {
    label: 'HIGH',
    text: 'text-red-400',
    accent: 'before:bg-red-500',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
  },
  medium: {
    label: 'MEDIUM',
    text: 'text-amber-400',
    accent: 'before:bg-amber-500',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'LOW',
    text: 'text-indigo-300',
    accent: 'before:bg-indigo-500',
    bar: 'bg-indigo-500',
    dot: 'bg-indigo-500',
  },
}

const SEV_ORDER: FraudSeverity[] = ['high', 'medium', 'low']

export interface AlertSummaryProps {
  companies: Company[]
}

interface RuleAgg {
  id: string
  label: string
  severity: FraudSeverity
  count: number
}

const SEV_RANK: Record<FraudSeverity, number> = { high: 3, medium: 2, low: 1 }

export function AlertSummary({ companies }: AlertSummaryProps) {
  const { sevCounts, totalFlagged, ruleAgg } = useMemo(() => {
    const sev: Record<FraudSeverity, number> = { high: 0, medium: 0, low: 0 }
    const ruleMap = new Map<string, RuleAgg>()
    let flagged = 0
    for (const c of companies) {
      if (c.flags.length === 0) continue
      flagged += 1
      // count company by topSeverity for big stats
      if (c.topSeverity) sev[c.topSeverity] += 1
      // tally each rule (count companies, not occurrences — but flags per company are unique by rule id here)
      for (const f of c.flags) {
        const cur = ruleMap.get(f.id)
        if (cur) {
          cur.count += 1
          // keep highest severity observed for this rule id
          if (SEV_RANK[f.severity] > SEV_RANK[cur.severity]) cur.severity = f.severity
        } else {
          ruleMap.set(f.id, { id: f.id, label: f.label, severity: f.severity, count: 1 })
        }
      }
    }
    const agg = Array.from(ruleMap.values()).sort((a, b) => b.count - a.count)
    return { sevCounts: sev, totalFlagged: flagged, ruleAgg: agg }
  }, [companies])

  const top5 = ruleAgg.slice(0, 5)
  const top5Total = top5.reduce((s, r) => s + r.count, 0)

  return (
    <section className="flex flex-col gap-3" aria-label="Alert summary">
      {/* Severity stat cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {SEV_ORDER.map((sev) => {
          const cfg = SEV_TONE[sev]
          const count = sevCounts[sev]
          return (
            <Card
              key={sev}
              className={cn(
                'relative overflow-hidden p-3 sm:p-4',
                'before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]',
                cfg.accent,
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn('h-2 w-2 rounded-full', cfg.dot)}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
                  {cfg.label}
                </span>
              </div>
              <div
                className={cn(
                  'num mt-1 text-2xl sm:text-3xl font-semibold leading-none tracking-tight',
                  cfg.text,
                )}
              >
                {count}
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--text-secondary)]">
                of {totalFlagged} flagged
              </div>
            </Card>
          )
        })}
      </div>

      {/* Rule frequency stacked bar */}
      {top5.length > 0 ? (
        <Card className="p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
              Top rules
            </div>
            <div className="text-[10px] text-[color:var(--text-muted)] num">
              {top5Total} flag{top5Total === 1 ? '' : 's'}
            </div>
          </div>
          {/* Stacked bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
            {top5.map((r) => (
              <div
                key={r.id}
                className={cn('h-full', SEV_TONE[r.severity].bar)}
                style={{ flex: r.count }}
                title={`${r.label}: ${r.count}`}
              />
            ))}
          </div>
          {/* Inline legend */}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {top5.map((r) => (
              <li key={r.id} className="inline-flex items-center gap-1.5 text-xs">
                <span
                  className={cn('h-2 w-2 rounded-full', SEV_TONE[r.severity].dot)}
                  aria-hidden="true"
                />
                <span className="text-[color:var(--text-secondary)]">{r.label}</span>
                <span className="num text-[color:var(--text-muted)]">{r.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </section>
  )
}

export default AlertSummary
