import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GlassCard } from '@/components/ui/glass-card'
import { NewListingForm } from '@/components/NewListingForm'
import { ListingDocumentsManager } from '@/components/ListingDocumentsManager'
import { FundingRoundsManager } from '@/components/FundingRoundsManager'
import { NewsfeedAdminPanel } from '@/components/admin/NewsfeedAdminPanel'
import type { Listing, ListingDocument, FundingRound, ListingNewsfeed } from '@/lib/types'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminEditListingPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params

  const isNew = id === 'new'
  let listing: Listing | null = null
  let documents: ListingDocument[] = []
  let rounds: FundingRound[] = []
  let newsfeed: ListingNewsfeed | null = null

  if (!isNew) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('listings').select('*').eq('id', id).single()
    if (!data) notFound()
    listing = data as Listing

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

    const { data: newsfeedRow } = await supabase
      .from('listing_newsfeed')
      .select('*')
      .eq('listing_id', id)
      .maybeSingle()
    newsfeed = (newsfeedRow as ListingNewsfeed | null) ?? null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">
        {isNew ? 'Create Listing' : `Edit: ${listing?.company_name}`}
      </h1>

      <GlassCard className="p-6 sm:p-8">
        <NewListingForm listing={listing ?? undefined} />
      </GlassCard>

      {!isNew && listing && (
        <GlassCard className="mt-6 p-6 sm:p-8">
          <div className="mb-5 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Informational Documents
            </h2>
            <p className="text-xs text-muted-foreground">
              PDF only. Shared with investors after they sign the NDA.
            </p>
          </div>
          <ListingDocumentsManager listingId={listing.id} documents={documents} />
        </GlassCard>
      )}

      {!isNew && listing && (
        <GlassCard className="mt-6 p-6 sm:p-8">
          <div className="mb-5 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Fundraising Rounds
            </h2>
            <p className="text-xs text-muted-foreground">
              Valuation history shown to investors after they sign the NDA.
            </p>
          </div>
          <FundingRoundsManager listingId={listing.id} rounds={rounds} />
        </GlassCard>
      )}

      {!isNew && listing && (
        <GlassCard className="mt-6 p-6 sm:p-8">
          <div className="mb-5 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">AI Newsfeed</h2>
            <p className="text-xs text-muted-foreground">
              AI-generated research bullets shown to investors after they sign the NDA.
            </p>
          </div>
          <NewsfeedAdminPanel
            listingId={listing.id}
            enabled={listing.ai_newsfeed_enabled}
            newsfeed={newsfeed}
          />
        </GlassCard>
      )}
    </div>
  )
}
