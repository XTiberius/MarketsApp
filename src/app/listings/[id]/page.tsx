import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BidModal } from '@/components/BidModal'
import { NDAModal } from '@/components/NDAModal'

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <span className="inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-2 py-0.5">
          {listing.listing_type} · {listing.industry}
        </span>
        <h1 className="text-3xl font-bold">{listing.company_name}</h1>
        <p className="text-muted-foreground text-sm">
          Listed {formatDate(listing.created_at)}
        </p>
      </div>

      {/* Description */}
      <p className="text-base leading-relaxed">{listing.description}</p>

      {/* Confidential details (NDA-gated) */}
      {ndaSigned ? (
        <div className="rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Deal Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Valuation</dt>
              <dd className="font-medium">{listing.valuation ? formatCurrency(listing.valuation) : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Amount Raised</dt>
              <dd className="font-medium">{listing.amount_raised ? formatCurrency(listing.amount_raised) : '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Investment Structure</dt>
              <dd className="font-medium">{listing.investment_structure ?? '—'}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-3">
          <p className="text-sm font-medium">
            Sign the NDA to unlock valuation, deal terms, and financial details
          </p>
          <NDAModal listingId={listing.id} ndaText={listing.nda_text} />
        </div>
      )}

      {/* Bid CTA */}
      {ndaSigned && (
        <BidModal listingId={listing.id} companyName={listing.company_name} />
      )}
    </div>
  )
}
