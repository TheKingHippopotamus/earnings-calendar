import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:   'bg-indigo-500 hover:bg-indigo-600 text-white border-transparent shadow-sm',
  secondary: 'bg-[var(--bg-surface-2)] hover:bg-[var(--bg-elev)] text-[color:var(--text-primary)] border-[color:var(--border-soft)]',
  ghost:     'bg-transparent hover:bg-[var(--bg-surface-2)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] border-transparent',
  danger:    'bg-red-500 hover:bg-red-600 text-white border-transparent',
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT[variant], SIZE[size], className,
      )}
    >
      {children}
    </button>
  )
}
