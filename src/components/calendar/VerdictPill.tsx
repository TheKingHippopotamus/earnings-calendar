import { Badge } from '@/components/ui'
import type { Company } from '@/lib/types'

type Verdict = Company['verdict']

const CONFIG: Record<
  Verdict,
  { tone: 'bull' | 'bear' | 'warn' | 'mute'; label: string }
> = {
  beat: { tone: 'bull', label: 'BEAT' },
  miss: { tone: 'bear', label: 'MISS' },
  mixed: { tone: 'warn', label: 'MIXED' },
  unknown: { tone: 'mute', label: '—' },
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const { tone, label } = CONFIG[verdict] ?? CONFIG.unknown
  return (
    <Badge tone={tone} size="xs" className="font-semibold">
      {label}
    </Badge>
  )
}

export default VerdictPill
