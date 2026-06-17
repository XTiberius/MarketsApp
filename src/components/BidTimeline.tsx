import { Check, X } from 'lucide-react'
import type { BidStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Visualizes a bid's progression through the happy-path lifecycle as a
 * horizontal 4-step stepper:
 *
 *   placed → accepted → awaiting_payment → invested
 *
 * The step matching the current status (and all preceding steps) are
 * highlighted with their status color token; later steps are dimmed.
 * A `rejected` bid short-circuits the stepper and renders a terminal
 * danger state instead.
 *
 * Colors come exclusively from status tokens (neutral / info / warning /
 * success / danger) so the component themes correctly in light + dark.
 */

type Step = {
  status: Exclude<BidStatus, 'rejected'>
  label: string
  /** Tailwind status color name backing this step when active. */
  color: 'neutral' | 'info' | 'warning' | 'success'
}

const STEPS: Step[] = [
  { status: 'placed', label: 'Placed', color: 'neutral' },
  { status: 'pending_acceptance', label: 'Pending Acceptance', color: 'info' },
  { status: 'accepted', label: 'Accepted', color: 'info' },
  { status: 'documents_executed', label: 'Docs Executed', color: 'info' },
  { status: 'awaiting_payment', label: 'Awaiting Payment', color: 'warning' },
  { status: 'invested', label: 'Invested', color: 'success' },
]

// Static class maps so Tailwind can statically extract every variant.
const ACTIVE_DOT: Record<Step['color'], string> = {
  neutral:
    'bg-[hsl(var(--neutral)/0.16)] border-[hsl(var(--neutral)/0.5)] text-neutral',
  info: 'bg-[hsl(var(--info)/0.16)] border-[hsl(var(--info)/0.5)] text-info',
  warning:
    'bg-[hsl(var(--warning)/0.16)] border-[hsl(var(--warning)/0.5)] text-warning',
  success:
    'bg-[hsl(var(--success)/0.16)] border-[hsl(var(--success)/0.5)] text-success',
}

const ACTIVE_LABEL: Record<Step['color'], string> = {
  neutral: 'text-neutral',
  info: 'text-info',
  warning: 'text-warning',
  success: 'text-success',
}

const ACTIVE_CONNECTOR: Record<Step['color'], string> = {
  neutral: 'bg-[hsl(var(--neutral)/0.5)]',
  info: 'bg-[hsl(var(--info)/0.5)]',
  warning: 'bg-[hsl(var(--warning)/0.5)]',
  success: 'bg-[hsl(var(--success)/0.5)]',
}

export function BidTimeline({
  status,
  className,
}: {
  status: BidStatus
  className?: string
}) {
  if (status === 'rejected') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border px-4 py-3',
          'border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.12)]',
          className
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--danger)/0.5)] bg-[hsl(var(--danger)/0.16)] text-danger">
          <X className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-danger">Rejected</p>
          <p className="text-xs text-muted-foreground">
            This bid was not accepted.
          </p>
        </div>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status)

  return (
    <ol className={cn('flex items-start', className)}>
      {STEPS.map((step, i) => {
        const reached = i <= currentIndex
        const isCurrent = i === currentIndex
        const isComplete = i < currentIndex
        const connectorReached = i < currentIndex

        return (
          <li key={step.status} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* leading connector (hidden for first step) */}
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  i === 0
                    ? 'opacity-0'
                    : i <= currentIndex
                      ? ACTIVE_CONNECTOR[STEPS[i - 1].color]
                      : 'bg-border'
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  reached
                    ? ACTIVE_DOT[step.color]
                    : 'border-border bg-muted/40 text-muted-foreground',
                  isCurrent && 'ring-2 ring-offset-2 ring-offset-background',
                  isCurrent &&
                    {
                      neutral: 'ring-[hsl(var(--neutral)/0.4)]',
                      info: 'ring-[hsl(var(--info)/0.4)]',
                      warning: 'ring-[hsl(var(--warning)/0.4)]',
                      success: 'ring-[hsl(var(--success)/0.4)]',
                    }[step.color]
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              {/* trailing connector (hidden for last step) */}
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  i === STEPS.length - 1
                    ? 'opacity-0'
                    : connectorReached
                      ? ACTIVE_CONNECTOR[step.color]
                      : 'bg-border'
                )}
                aria-hidden
              />
            </div>
            <span
              className={cn(
                'mt-2 text-center text-[11px] font-medium leading-tight',
                reached ? ACTIVE_LABEL[step.color] : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
