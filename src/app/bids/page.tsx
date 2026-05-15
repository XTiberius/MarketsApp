import { requireKycApproved } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid, Listing } from '@/lib/types'

type BidWithListing = Bid & { listings: Pick<Listing, 'company_name' | 'industry'> }

const STATUS_LABELS: Record<Bid['status'], string> = {
  placed: 'Placed',
  accepted: 'Accepted',
  awaiting_payment: 'Awaiting Payment',
  invested: 'Invested',
  rejected: 'Rejected',
}

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
      <h1 className="text-2xl font-bold mb-8">My Bids</h1>

      {!bids || bids.length === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t placed any bids yet.{' '}
          <a href="/listings" className="underline text-foreground">Browse listings</a>
        </p>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {bids.map((bid: BidWithListing) => (
            <div key={bid.id} className="p-4 flex items-center justify-between hover:bg-muted/40">
              <div>
                <p className="font-medium">{bid.listings.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  {bid.listings.industry} · {formatDate(bid.created_at)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold">{formatCurrency(bid.amount)}</p>
                <span className="inline-block text-xs border border-border rounded px-2 py-0.5">
                  {STATUS_LABELS[bid.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
