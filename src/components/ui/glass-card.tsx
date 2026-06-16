import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * The core liquid-glass surface. `interactive` adds a hover lift + glow for
 * clickable cards (e.g. listing cards).
 */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'glass rounded-2xl',
        interactive &&
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_-12px_hsl(var(--primary)/0.45)] hover:border-[hsl(var(--primary)/0.4)]',
        className
      )}
      {...props}
    />
  )
)
GlassCard.displayName = 'GlassCard'
