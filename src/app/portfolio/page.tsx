import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { requireKycApproved } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { BidDocumentList } from '@/components/BidDocumentList'
import { FundingRoundsChart } from '@/components/FundingRoundsChart'
import { NewsfeedSummary } from '@/components/NewsfeedSummary'
import type {
  AssociatedDocument,
  Bid,
  FundingRound,
  Listing,
  ListingNewsfeed,
} from '@/lib/types'

type PortfolioBid = Bid & {
  listings: Pick<
    Listing,
    'company_name' | 'industry' | 'ai_newsfeed_enabled'
  > & {
    funding_rounds: FundingRound[]
    listing_newsfeed: ListingNewsfeed[]
  }
  associated_documents: AssociatedDocument[]
}

/** ROI = (returned − invested) / invested, as a signed percentage. Returns null
 *  when invested principal is missing or zero (undefined ROI). */
function roiPercent(invested: number | null, returned: number | null): number | null {
  if (invested == null || invested === 0 || returned == null) return null
  return ((returned - invested) / invested) * 100
}

function formatRoi(roi: number): string {
  return `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`
}

function PortfolioItem({ bid }: { bid: PortfolioBid }) {
  const listing = bid.listings
  const rounds = [...(listing.funding_rounds ?? [])].sort(
    (a, b) => a.sequence_order - b.sequence_order
  )
  const newsfeed = listing.listing_newsfeed?.[0] ?? null
  const showNewsfeed =
    listing.ai_newsfeed_enabled && !!newsfeed && newsfeed.bullets.length > 0

  const closed = bid.portfolio_status === 'closed'
  const roi = roiPercent(bid.invested_principal, bid.returned_principal)

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {listing.company_name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{listing.industry}</p>
        </div>
        {closed ? (
          <div className="flex flex-col items-end gap-1 text-sm">
            <p className="text-muted-foreground">
              Invested{' '}
              <span className="font-mono text-foreground">
                {bid.invested_principal != null
                  ? formatCurrency(bid.invested_principal)
                  : '—'}
              </span>
            </p>
            <p className="text-muted-foreground">
              Returned{' '}
              <span className="font-mono text-foreground">
                {bid.returned_principal != null
                  ? formatCurrency(bid.returned_principal)
                  : '—'}
              </span>
            </p>
            <p className="font-mono text-lg font-semibold">
              {roi == null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span className={roi >= 0 ? 'text-success' : 'text-danger'}>
                  {formatRoi(roi)}
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="font-mono text-lg font-semibold">{formatCurrency(bid.amount)}</p>
        )}
      </div>

      <BidDocumentList
        documents={bid.associated_documents}
        paymentConfirmation={bid.payment_confirmation}
      />

      <div className="mt-5 border-t border-border pt-5">
        <FundingRoundsChart rounds={rounds} />
      </div>

      {showNewsfeed && (
        <div className="mt-5">
          <NewsfeedSummary
            bullets={newsfeed.bullets}
            disclosure={newsfeed.disclosure}
            generatedAt={newsfeed.generated_at}
          />
        </div>
      )}
    </GlassCard>
  )
}

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
