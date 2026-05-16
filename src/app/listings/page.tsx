import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ListingCard } from '@/components/ListingCard'
import type { ListingPublic } from '@/lib/types'

export default async function ListingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, admin_id, company_name, logo_url, description, listing_type, industry, status, created_at, updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Active Listings</h1>
        <p className="text-muted-foreground mt-1">
          Browse available investment opportunities
        </p>
      </div>

      {!listings || listings.length === 0 ? (
        <p className="text-muted-foreground">No active listings at this time.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing as ListingPublic} />
          ))}
        </div>
      )}
    </div>
  )
}
