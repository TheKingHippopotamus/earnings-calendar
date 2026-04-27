import { useState, type ReactNode } from 'react'
import { cn } from './cn'

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none',
            'glass rounded-md px-2 py-1 text-xs text-[color:var(--text-primary)] shadow-lg',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
