'use client'

import { Gem, BadgeCheck, Handshake } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Reveal } from './Reveal'

const CARDS = [
  {
    icon: Gem,
    title: 'Exclusive deals',
    body: 'Primary and secondary opportunities across direct portfolio companies and IONIC Network managed vehicles — surfaced only to verified members.',
  },
  {
    icon: BadgeCheck,
    title: 'Pre-vetted opportunities',
    body: 'Every listing is screened and diligenced before it reaches you, so the marketplace stays signal, not noise.',
  },
  {
    icon: Handshake,
    title: 'White-glove execution',
    body: 'NDA, bidding, admin review, allocation and documents — handled end to end by the IONIC desk.',
  },
]

export function WhySection() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <Reveal>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Why IONIC</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          Built for conviction at scale
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {CARDS.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.1}>
            <GlassCard interactive className="h-full p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
