'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { Reveal } from './Reveal'

const STEPS = [
  {
    n: '01',
    title: 'Browse listings',
    body: 'Filter primary and secondary deals across sectors and stages.',
    badge: { kind: 'listingType', value: 'primary' },
  },
  {
    n: '02',
    title: 'Sign NDA',
    body: 'Unlock the full data room with a single click-through agreement.',
    badge: { kind: 'kycStatus', value: 'approved' },
  },
  {
    n: '03',
    title: 'Place bid',
    body: 'Submit your allocation and terms directly into the deal.',
    badge: { kind: 'bidStatus', value: 'placed' },
  },
  {
    n: '04',
    title: 'Admin review',
    body: 'The IONIC desk reviews, confirms, and clears your bid.',
    badge: { kind: 'bidStatus', value: 'accepted' },
  },
  {
    n: '05',
    title: 'Allocation & documents',
    body: 'Countersign, fund, and receive your executed paperwork.',
    badge: { kind: 'bidStatus', value: 'invested' },
  },
] as const

export function HowItWorks() {
  return (
    <section className="relative z-10 mx-auto max-w-4xl px-4 py-24 sm:py-32">
      <Reveal>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">How it works</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          From listing to allocation
        </h2>
      </Reveal>

      <div className="relative mt-12">
        {/* progress rail behind the step nodes */}
        <div aria-hidden className="absolute bottom-7 left-7 top-7 w-px bg-border/60" />
        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="flex items-stretch gap-5">
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full glass font-display text-sm font-medium text-primary">
                  {s.n}
                </div>
                <GlassCard className="flex-1 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-medium">{s.title}</h3>
                    <StatusBadge kind={s.badge.kind} value={s.badge.value} />
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                </GlassCard>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
