'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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

export type PortfolioBid = Bid & {
  listings: Pick<Listing, 'company_name' | 'industry' | 'ai_newsfeed_enabled'> & {
    funding_rounds: FundingRound[]
    // unique(listing_id) → PostgREST embeds this as a single object (or null), not an array.
    listing_newsfeed: ListingNewsfeed | ListingNewsfeed[] | null
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

/** One portfolio position. The summary (company, status, value/ROI) is always
 *  visible; the documents, funding chart, and newsfeed are collapsed behind a
 *  click-to-expand header to keep the page uncluttered. */
export function PortfolioItem({ bid }: { bid: PortfolioBid }) {
  const listing = bid.listings
  const rounds = [...(listing.funding_rounds ?? [])].sort(
    (a, b) => a.sequence_order - b.sequence_order
  )
  const newsfeed = Array.isArray(listing.listing_newsfeed)
    ? listing.listing_newsfeed[0] ?? null
    : listing.listing_newsfeed ?? null
  const showNewsfeed =
    listing.ai_newsfeed_enabled && !!newsfeed && newsfeed.bullets.length > 0

  const closed = bid.portfolio_status === 'closed'
  const roi = roiPercent(bid.invested_principal, bid.returned_principal)

  return (
    <GlassCard className="overflow-hidden p-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="details">
          <AccordionTrigger className="px-5 py-4 sm:px-6">
            <div className="flex flex-1 flex-wrap items-start justify-between gap-4 pr-3">
              <div className="min-w-0 space-y-2">
                <div>
                  <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
                    {listing.company_name}
                  </h3>
                  <p className="mt-1 text-sm font-normal text-muted-foreground">
                    {listing.industry}
                  </p>
                </div>
                {bid.invested_at && (
                  <Badge tone="success">Executed {formatDate(bid.invested_at)}</Badge>
                )}
              </div>
              {closed ? (
                <div className="flex flex-col items-end gap-1 text-sm font-normal">
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
                <p className="font-mono text-lg font-semibold text-foreground">
                  {formatCurrency(bid.amount)}
                </p>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-5 pb-6 text-foreground sm:px-6">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </GlassCard>
  )
}
