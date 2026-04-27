// =============================================================================
// FlagList — vertical list of forensic FraudFlags. Empty-state when none.
// =============================================================================
import { Badge, Card, cn } from '@/components/ui'
import type { FraudFlag, FraudSeverity } from '@/lib/types'

export interface FlagListProps {
  flags: FraudFlag[]
}

const DOT_BG: Record<FraudSeverity, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-indigo-500',
}

const SEV_TONE: Record<FraudSeverity, 'bear' | 'warn' | 'brand'> = {
  high: 'bear',
  medium: 'warn',
  low: 'brand',
}

const SEV_LABEL: Record<FraudSeverity, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function FlagList({ flags }: FlagListProps) {
  if (flags.length === 0) {
    return (
      <Card className="p-4 sm:p-5 flex items-start gap-3">
        <span className="grad-bull/10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckIcon className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-emerald-400">
            No forensic flags detected
          </span>
          <span className="mt-0.5 text-xs text-[color:var(--text-muted)]">
            All rule checks passed for this report.
          </span>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {flags.map((f) => (
        <Card key={f.id} className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full',
                DOT_BG[f.severity],
              )}
              aria-label={`${f.severity} severity`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug text-[color:var(--text-primary)]">
                  {f.label}
                </span>
                <Badge tone={SEV_TONE[f.severity]} size="xs">
                  {SEV_LABEL[f.severity]}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--text-secondary)]">
                {f.detail}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default FlagList
