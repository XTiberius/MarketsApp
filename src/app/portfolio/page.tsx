import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { requireKycApproved } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { PortfolioItem, type PortfolioBid } from '@/components/PortfolioItem'

export default async function PortfolioPage() {
  const user = await requireKycApproved()
  const supabase = await createServerSupabaseClient()

  const { data: bids } = await supabase
    .from('bids')
    .select(
      '*, associated_documents(*), listings(company_name, industry, ai_newsfeed_enabled, funding_rounds(*), listing_newsfeed(*))'
    )
    .eq('investor_id', user.id)
    .eq('status', 'invested')
    .order('invested_at', { ascending: false })

  const positions = (bids ?? []) as unknown as PortfolioBid[]
  const active = positions.filter((b) => b.portfolio_status !== 'closed')
  const closed = positions.filter((b) => b.portfolio_status === 'closed')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">Portfolio</h1>

      {positions.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)] text-primary">
            <Briefcase className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-medium">No investments yet</p>
            <p className="text-sm text-muted-foreground">
              Once a bid completes and you&apos;re invested, the position will appear
              here with its documents and performance.
            </p>
          </div>
          <Button asChild variant="primary">
            <Link href="/listings">Browse listings</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-10">
          {active.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold tracking-tight">Active</h2>
              {active.map((bid) => (
                <PortfolioItem key={bid.id} bid={bid} />
              ))}
            </section>
          )}

          {closed.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold tracking-tight">Closed</h2>
              {closed.map((bid) => (
                <PortfolioItem key={bid.id} bid={bid} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
