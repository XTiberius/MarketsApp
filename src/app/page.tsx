import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BadgeCheck, Gem, Handshake } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

const FEATURES = [
  {
    icon: Gem,
    title: 'Exclusive deals',
    body: 'Invest in exclusive primary and secondary deals — access that isn’t on the open market.',
  },
  {
    icon: BadgeCheck,
    title: 'Pre-vetted opportunities',
    body: 'Every opportunity is screened — across direct portfolio companies and IONIC Network managed vehicles.',
  },
  {
    icon: Handshake,
    title: 'White-glove execution',
    body: 'From first interest to final allocation, every deal is handled end to end.',
  },
]

export default async function HomePage() {
  const user = await getServerUser()

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-24 text-center sm:py-32">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--background)/0.4)] px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <Image src="/ionic-logo.png" alt="" width={16} height={16} className="rounded" />
          Accredited investors only
        </span>

        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Invest beyond
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            the public markets
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          IONIC is a private marketplace for exclusive primary and secondary deals — pre-vetted
          opportunities across direct portfolio companies and IONIC Network managed vehicles.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Button asChild size="lg">
              <Link href="/listings">
                Browse Listings <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/auth/login">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Feature trio */}
      <section className="grid gap-6 pb-24 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <GlassCard key={title} className="p-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-medium">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  )
}
