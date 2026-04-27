import { forwardRef } from 'react'
import { Badge, cn } from '@/components/ui'
import type { Company } from '@/lib/types'
import { CompanyCard } from './CompanyCard'

interface DayGroupProps {
  label: string
  isoDate: string | null
  weekday: string
  companies: Company[]
  isToday?: boolean
}

const TODAY_ISO = '2026-04-28'

function formatHeaderDate(isoDate: string | null, weekday: string, fallback: string): {
  primary: string
  secondary: string
} {
  if (!isoDate) {
    return { primary: weekday || fallback, secondary: '' }
  }
  // Parse as local date — append time to avoid TZ shift.
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) {
    return { primary: weekday || fallback, secondary: '' }
  }
  const wkFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
  const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return { primary: wkFmt.format(d), secondary: dateFmt.format(d) }
}

export const DayGroup = forwardRef<HTMLElement, DayGroupProps>(function DayGroup(
  { label, isoDate, weekday, companies },
  ref,
) {
  const isToday = isoDate === TODAY_ISO
  const { primary, secondary } = formatHeaderDate(isoDate, weekday, label)

  return (
    <section
      ref={ref}
      data-iso-date={isoDate ?? ''}
      aria-label={`Earnings on ${label}`}
      className="scroll-mt-24"
    >
      <header
        className={cn(
          'sticky top-[72px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5',
          'glass border-b border-[color:var(--border-soft)]',
          'flex items-center gap-3',
        )}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-[color:var(--text-primary)]">
            {primary}
          </h2>
          {secondary && (
            <span className="num text-xs text-[color:var(--text-secondary)]">{secondary}</span>
          )}
        </div>
        {isToday && (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(91,117,255,0.7)]"
            />
            <Badge tone="brand" size="xs" className="font-semibold">
              Today
            </Badge>
          </span>
        )}
        <div className="ml-auto flex items-center">
          <Badge tone="mute" size="xs">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </Badge>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies.map((c) => (
          <CompanyCard key={`${c.ticker}-${c.isoDate ?? c.date}-${c.time}`} company={c} />
        ))}
      </div>
    </section>
  )
})

export default DayGroup
