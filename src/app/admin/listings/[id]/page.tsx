import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GlassCard } from '@/components/ui/glass-card'
import { NewListingForm } from '@/components/NewListingForm'
import { ListingDocumentsManager } from '@/components/ListingDocumentsManager'
import type { Listing, ListingDocument } from '@/lib/types'
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
    </div>
  )
}
