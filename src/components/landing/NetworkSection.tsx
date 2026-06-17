'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Reveal } from './Reveal'

const CARDS = [
  {
    tag: 'Direct',
    tone: 'typePrimary' as const,
    title: 'Direct portfolio companies',
    body: 'Lead and follow-on allocations into operating companies, sourced through the network and screened by the IONIC desk.',
  },
  {
    tag: 'Managed',
    tone: 'typeSecondary' as const,
    title: 'IONIC Network vehicles',
    body: 'Professionally managed funds and SPVs that pool member capital into diversified, thesis-driven mandates.',
  },
]

export function NetworkSection() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <Reveal>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          The IONIC Network
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          Credibility, by design
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {CARDS.map(({ tag, tone, title, body }, i) => (
          <Reveal key={tag} delay={i * 0.1}>
            <GlassCard interactive className="h-full p-7">
              <Badge tone={tone}>{tag}</Badge>
              <h3 className="mt-4 font-display text-xl font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
