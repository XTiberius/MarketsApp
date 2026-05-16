import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Listing } from '@/lib/types'

export default async function AdminListingsPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  const STATUS_STYLES: Record<Listing['status'], string> = {
    draft: 'text-muted-foreground border-border',
    published: 'text-green-700 border-green-500',
    closed: 'text-red-700 border-red-500',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Listings</h1>
        <Link
          href="/admin/listings/new"
          className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90"
        >
          + New Listing
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <p className="text-muted-foreground">No listings yet.</p>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {listings.map((listing: Listing) => (
            <div key={listing.id} className="p-4 flex items-center justify-between hover:bg-muted/40">
              <div>
                <p className="font-medium">{listing.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  {listing.industry} · {listing.listing_type} · {formatDate(listing.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs border rounded px-2 py-0.5 ${STATUS_STYLES[listing.status]}`}>
                  {listing.status}
                </span>
                <Link
                  href={`/admin/listings/${listing.id}`}
                  className="text-sm underline text-foreground"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
