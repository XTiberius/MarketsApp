import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'border-[hsl(var(--neutral)/0.3)] bg-[hsl(var(--neutral)/0.12)] text-neutral',
        typePrimary:
          'border-[hsl(var(--type-primary)/0.35)] bg-[hsl(var(--type-primary)/0.14)] text-type-primary',
        typeSecondary:
          'border-[hsl(var(--type-secondary)/0.35)] bg-[hsl(var(--type-secondary)/0.14)] text-type-secondary',
        success: 'border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.14)] text-success',
        warning: 'border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.14)] text-warning',
        danger: 'border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.14)] text-danger',
        info: 'border-[hsl(var(--info)/0.35)] bg-[hsl(var(--info)/0.14)] text-info',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* StatusBadge — maps domain enums to a color-coded tone + readable label.    */
/* -------------------------------------------------------------------------- */

type Tone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

const LISTING_TYPE: Record<string, { tone: Tone; label: string }> = {
  primary: { tone: 'typePrimary', label: 'Primary' },
  secondary: { tone: 'typeSecondary', label: 'Secondary' },
}
const LISTING_STATUS: Record<string, { tone: Tone; label: string }> = {
  published: { tone: 'success', label: 'Published' },
  draft: { tone: 'neutral', label: 'Draft' },
  closed: { tone: 'danger', label: 'Closed' },
}
const BID_STATUS: Record<string, { tone: Tone; label: string }> = {
  placed: { tone: 'neutral', label: 'Placed' },
  accepted: { tone: 'info', label: 'Accepted' },
  awaiting_payment: { tone: 'warning', label: 'Awaiting Payment' },
  invested: { tone: 'success', label: 'Invested' },
  rejected: { tone: 'danger', label: 'Rejected' },
}
const KYC_STATUS: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
}

const MAPS = {
  listingType: LISTING_TYPE,
  listingStatus: LISTING_STATUS,
  bidStatus: BID_STATUS,
  kycStatus: KYC_STATUS,
} as const

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: keyof typeof MAPS
  value: string
  className?: string
}) {
  const entry = MAPS[kind][value] ?? { tone: 'neutral' as Tone, label: value }
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  )
}

export { badgeVariants }
