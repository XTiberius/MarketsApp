'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { BidModuleAdmin, type AdminBid } from '@/components/BidModuleAdmin'

interface Props {
  bids: AdminBid[]
}

/** Admin bid list — each bid renders a state-driven workflow module. */
export function AdminBidManagement({ bids }: Props) {
  if (bids.length === 0) {
    return <p className="p-2 text-sm text-muted-foreground">No bids yet.</p>
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => (
        <GlassCard key={bid.id} className="p-5 sm:p-6">
          <BidModuleAdmin bid={bid} />
        </GlassCard>
      ))}
    </div>
  )
}
