import Link from 'next/link'
import Image from 'next/image'
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
        {listing.logo_url ? (
          <Image
            src={listing.logo_url}
            alt={`${listing.company_name} logo`}
            width={80}
            height={32}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {listing.company_name.slice(0, 2)}
          </span>
        )}
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
