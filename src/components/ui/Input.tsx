import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        'h-9 px-3 rounded-lg bg-[var(--bg-surface)] border border-[color:var(--border-soft)] text-sm',
        'text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)]',
        'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30',
        'transition-colors',
        className,
      )}
    />
  )
}
