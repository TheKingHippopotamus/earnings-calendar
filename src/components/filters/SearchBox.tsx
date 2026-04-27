import { useAppStore } from '@/lib/store/useAppStore'
import { Input, Button, cn } from '@/components/ui'

interface SearchBoxProps {
  className?: string
}

export default function SearchBox({ className }: SearchBoxProps) {
  const query = useAppStore((s) => s.filter.query)
  const setQuery = useAppStore((s) => s.setQuery)

  const hasQuery = query.length > 0

  return (
    <div className={cn('relative w-full sm:w-[280px]', className)}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ticker or company..."
        spellCheck={false}
        autoComplete="off"
        aria-label="Search ticker or company"
        className="w-full pr-20"
      />
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {hasQuery ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="h-6 w-6 p-0 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          >
            <span aria-hidden="true">×</span>
          </Button>
        ) : (
          <kbd
            aria-hidden="true"
            className={cn(
              'hidden sm:inline-flex items-center gap-0.5 px-1.5 h-5 rounded',
              'bg-[var(--bg-surface-2)] border border-[color:var(--border-soft)]',
              'text-[10px] mono text-[color:var(--text-muted)] font-medium',
            )}
          >
            <span>⌘</span>
            <span>K</span>
          </kbd>
        )}
      </div>
    </div>
  )
}
