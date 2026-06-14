import Link from 'next/link'
import { ListingLogo } from './ListingLogo'
import type { ListingPublic } from '@/lib/types'

interface Props {
  listing: ListingPublic
}

export function ListingCard({ listing }: Props) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-lg border border-border hover:border-foreground/30 hover:shadow-sm transition-all overflow-hidden"
    >
      <div className="h-12 bg-muted flex items-center px-4">
        <ListingLogo logoUrl={listing.logo_url} companyName={listing.company_name} />
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm group-hover:underline">
            {listing.company_name}
          </h2>
          <span className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground capitalize">
            {listing.listing_type}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>

        <p className="text-xs text-muted-foreground">{listing.industry}</p>
      </div>
    </Link>
  )
}
