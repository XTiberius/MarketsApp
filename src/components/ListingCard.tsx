import Link from 'next/link'
import { ListingLogo } from './ListingLogo'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge, StatusBadge } from '@/components/ui/badge'
import type { ListingPublic } from '@/lib/types'

interface Props {
  listing: ListingPublic
}

export function ListingCard({ listing }: Props) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <GlassCard interactive className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border/60 bg-[hsl(var(--muted)/0.4)] px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-[hsl(var(--background)/0.5)]">
            <ListingLogo logoUrl={listing.logo_url} companyName={listing.company_name} />
          </div>
          <h2 className="min-w-0 flex-1 truncate font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {listing.company_name}
          </h2>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="listingActivity" value={listing.status} />
            <StatusBadge kind="listingType" value={listing.listing_type} />
            <Badge tone="neutral">{listing.industry}</Badge>
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {listing.description}
          </p>
        </div>
      </GlassCard>
    </Link>
  )
}
