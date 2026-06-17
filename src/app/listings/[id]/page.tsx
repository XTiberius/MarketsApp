import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock, FileText, Download } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BidModal } from '@/components/BidModal'
import { NDAModal } from '@/components/NDAModal'
import { ListingLogo } from '@/components/ListingLogo'
import { FundingRoundsChart } from '@/components/FundingRoundsChart'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ListingDocument, ListingDocType, FundingRound } from '@/lib/types'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireAuth()
  const supabase = await createServerSupabaseClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!listing) notFound()

  // Check if the investor has signed the NDA for this listing
  const { data: nda } = await supabase
    .from('nda_signatures')
    .select('id')
    .eq('investor_id', user.id)
    .eq('listing_id', id)
    .maybeSingle()
  const ndaSigned = !!nda

  // Informational documents and funding rounds are NDA-gated by RLS; only query
  // once unlocked.
  let documents: ListingDocument[] = []
  let rounds: FundingRound[] = []
  if (ndaSigned) {
    const { data: docs } = await supabase
      .from('listing_documents')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: true })
    documents = (docs as ListingDocument[] | null) ?? []

    const { data: roundRows } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('listing_id', id)
      .order('sequence_order', { ascending: true })
    rounds = (roundRows as FundingRound[] | null) ?? []
  }

  const DOC_TYPE_LABELS: Record<ListingDocType, string> = {
    memorandum: 'Investment Memorandum',
    pitch_deck: 'Pitch Deck',
    other: 'Document',
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      {/* Back link */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      {/* Glass header */}
      <GlassCard className="overflow-hidden">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--background)/0.5)]">
            <ListingLogo logoUrl={listing.logo_url} companyName={listing.company_name} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {listing.company_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="listingType" value={listing.listing_type} />
              <Badge tone="neutral">{listing.industry}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Listed {formatDate(listing.created_at)}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Sections */}
      <GlassCard className="px-6">
        <Accordion type="multiple" defaultValue={['overview', 'deal']}>
          <AccordionItem value="overview">
            <AccordionTrigger>Overview</AccordionTrigger>
            <AccordionContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="deal">
            <AccordionTrigger>Deal Details</AccordionTrigger>
            <AccordionContent>
              {ndaSigned ? (
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Valuation
                    </dt>
                    <dd className="font-mono text-base font-medium text-foreground">
                      {listing.valuation ? formatCurrency(listing.valuation) : '—'}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Amount Raised
                    </dt>
                    <dd className="font-mono text-base font-medium text-foreground">
                      {listing.amount_raised ? formatCurrency(listing.amount_raised) : '—'}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Minimum Investment
                    </dt>
                    <dd className="font-mono text-base font-medium text-foreground">
                      {listing.minimum_investment
                        ? formatCurrency(listing.minimum_investment)
                        : '—'}
                    </dd>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Investment Structure
                    </dt>
                    <dd className="text-base font-medium text-foreground">
                      {listing.investment_structure ?? '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="glass flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)]">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <p className="max-w-sm text-sm font-medium text-foreground">
                    Sign the NDA to unlock valuation, deal terms, and financial details
                  </p>
                  <NDAModal listingId={listing.id} ndaText={listing.nda_text} />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {ndaSigned && (
            <AccordionItem value="documents">
              <AccordionTrigger>Informational Documents</AccordionTrigger>
              <AccordionContent>
                {documents.length > 0 ? (
                  <ul className="space-y-2">
                    {documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="glass flex items-center justify-between gap-3 rounded-xl p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.14)]">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {DOC_TYPE_LABELS[doc.doc_type]}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doc.file_name}
                            </p>
                          </div>
                        </div>
                        <Button asChild variant="glass" size="sm">
                          <a href={`/api/files?kind=listing&id=${doc.id}`}>
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No documents have been shared for this listing yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {ndaSigned && (
            <AccordionItem value="fundraising">
              <AccordionTrigger>Fundraising History</AccordionTrigger>
              <AccordionContent>
                <FundingRoundsChart rounds={rounds} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </GlassCard>

      {/* Bid CTA */}
      {ndaSigned && (
        <GlassCard className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Ready to invest?
            </h2>
            <p className="text-sm text-muted-foreground">
              Place a bid on {listing.company_name} to start the process.
            </p>
          </div>
          <BidModal
            listingId={listing.id}
            companyName={listing.company_name}
            minimumInvestment={listing.minimum_investment}
          />
        </GlassCard>
      )}
    </div>
  )
}
