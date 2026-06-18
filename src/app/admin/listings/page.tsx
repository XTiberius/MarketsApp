import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { DeleteListingButton } from '@/components/DeleteListingButton'
import { ListingActivityToggle } from '@/components/ListingActivityToggle'
import type { Listing } from '@/lib/types'

export default async function AdminListingsPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Listings</h1>
        <Button asChild>
          <Link href="/admin/listings/new">New Listing</Link>
        </Button>
      </div>

      {!listings || listings.length === 0 ? (
        <GlassCard className="p-6 text-sm text-muted-foreground">No listings yet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: Listing) => (
            <GlassCard
              key={listing.id}
              interactive
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{listing.company_name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{listing.industry}</span>
                  <StatusBadge kind="listingType" value={listing.listing_type} />
                  <span>{formatDate(listing.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ListingActivityToggle listingId={listing.id} status={listing.status} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/listings/${listing.id}`} data-testid={`admin-listing-edit-${listing.id}`}>
                    Edit
                  </Link>
                </Button>
                <DeleteListingButton
                  listingId={listing.id}
                  companyName={listing.company_name}
                />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
