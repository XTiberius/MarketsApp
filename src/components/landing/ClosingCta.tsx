'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Reveal } from './Reveal'

export function ClosingCta() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-8 text-center">
      <Reveal>
        <GlassCard className="px-6 py-12 sm:px-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Request access
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Membership is verified and invite-led. Start your application to explore the marketplace.
          </p>
          <div className="mt-7">
            <Button asChild size="lg">
              <Link href="/auth/login">Get started</Link>
            </Button>
          </div>
        </GlassCard>
      </Reveal>
    </section>
  )
}
