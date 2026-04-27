import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...rest}
      className={cn(
        'elev rounded-xl transition-shadow hover:shadow-lg',
        className,
      )}
    >
      {children}
    </div>
  )
}
