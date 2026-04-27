import { cn } from '@/components/ui'

export interface SegmentedOption<T extends string> {
  key: T
  label: string
  count?: number
}

export interface SegmentedTabsProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
  className?: string
  size?: 'sm' | 'md'
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: SegmentedTabsProps<T>) {
  const pad = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[color:var(--border-soft)] bg-[var(--bg-surface-2)] p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full font-medium transition-colors',
              pad,
              active
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-elev)]',
            )}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' ? (
              <span
                className={cn(
                  'num inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--bg-surface)] text-[color:var(--text-muted)] border border-[color:var(--border-soft)]',
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedTabs
