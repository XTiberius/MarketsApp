import Link from 'next/link'
import { Gavel } from 'lucide-react'
import { requireKycApproved } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BidTimeline } from '@/components/BidTimeline'
import type { Bid, Listing } from '@/lib/types'

type BidWithListing = Bid & { listings: Pick<Listing, 'company_name' | 'industry'> }

export default async function BidsPage() {
  const user = await requireKycApproved()
  const supabase = await createServerSupabaseClient()

  const { data: bids } = await supabase
    .from('bids')
    .select('*, listings(company_name, industry)')
    .eq('investor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">My Bids</h1>

      {!bids || bids.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)] text-primary">
            <Gavel className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-medium">No bids yet</p>
            <p className="text-sm text-muted-foreground">
              When you place a bid on a listing, you&apos;ll be able to track its
              progress here.
            </p>
          </div>
          <Button asChild variant="primary">
            <Link href="/listings">Browse listings</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {bids.map((bid: BidWithListing) => (
            <GlassCard key={bid.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold leading-tight">
                    {bid.listings.company_name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bid.listings.industry} · {formatDate(bid.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-mono text-lg font-semibold">
                    {formatCurrency(bid.amount)}
                  </p>
                  <StatusBadge kind="bidStatus" value={bid.status} />
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <BidTimeline status={bid.status} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
