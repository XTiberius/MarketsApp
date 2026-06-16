import { StatusBadge } from 'ionic'

const Surface = ({ children }: any) => (
  <div
    className="dark"
    style={{
      background: 'hsl(var(--background))',
      padding: 32,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      alignItems: 'center',
    }}
  >
    {children}
  </div>
)

export const ListingStatus = () => (
  <Surface>
    <StatusBadge kind="listingStatus" value="published" />
    <StatusBadge kind="listingStatus" value="draft" />
    <StatusBadge kind="listingStatus" value="closed" />
  </Surface>
)

export const BidStatus = () => (
  <Surface>
    <StatusBadge kind="bidStatus" value="placed" />
    <StatusBadge kind="bidStatus" value="accepted" />
    <StatusBadge kind="bidStatus" value="awaiting_payment" />
    <StatusBadge kind="bidStatus" value="invested" />
    <StatusBadge kind="bidStatus" value="rejected" />
  </Surface>
)

export const ListingType = () => (
  <Surface>
    <StatusBadge kind="listingType" value="primary" />
    <StatusBadge kind="listingType" value="secondary" />
  </Surface>
)
