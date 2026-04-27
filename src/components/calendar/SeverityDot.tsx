import { cn } from '@/components/ui'
import type { FraudSeverity } from '@/lib/types'

const SEV_COLOR: Record<FraudSeverity, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-indigo-500',
}

export interface SeverityDotProps {
  severity: FraudSeverity
  pulse?: boolean
  className?: string
}

/**
 * Small colored dot (8px) representing flag severity.
 * When `pulse` is true, uses the global `.pulse-dot` class which adds
 * an animated halo. Otherwise renders a static dot via `currentColor`.
 */
export function SeverityDot({ severity, pulse = false, className }: SeverityDotProps) {
  const tone = SEV_COLOR[severity]
  if (pulse) {
    return (
      <span
        role="img"
        aria-label={`${severity} severity`}
        className={cn('pulse-dot shrink-0', tone, className)}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={`${severity} severity`}
      className={cn(
        'inline-block shrink-0 rounded-full',
        'h-2 w-2',
        tone,
        className,
      )}
      style={{ background: 'currentColor' }}
    />
  )
}

export default SeverityDot
