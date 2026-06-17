'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid, BidStatus } from '@/lib/types'

type BidWithRelations = Bid & {
  listings: { company_name: string }
  users: { email: string }
}

interface Props {
  bids: BidWithRelations[]
}

const TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  placed: ['pending_acceptance', 'rejected'],
  pending_acceptance: ['accepted', 'rejected'],
  accepted: ['documents_executed'],
  documents_executed: ['awaiting_payment'],
  awaiting_payment: ['invested'],
  invested: [],
  rejected: [],
}

export function AdminBidManagement({ bids: initialBids }: Props) {
  const [bids, setBids] = useState(initialBids)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(bidId: string, status: BidStatus) {
    setUpdating(bidId)

    const res = await fetch(`/api/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      setBids((prev) =>
        prev.map((b) => (b.id === bidId ? { ...b, status } : b))
      )
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Update failed' }))
      // Gated transitions (e.g. requires an uploaded NII / payment note) surface here.
      // The full per-bid workflow UI lands in the per-bid documents slice.
      alert(error || 'Update failed')
    }

    setUpdating(null)
  }

  if (bids.length === 0) {
    return <p className="p-2 text-sm text-muted-foreground">No bids yet.</p>
  }

  return (
    <div className="space-y-3">
      {bids.map((bid) => {
        const nextStatuses = TRANSITIONS[bid.status]
        return (
          <GlassCard
            key={bid.id}
            interactive
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{bid.listings.company_name}</p>
              <p className="text-sm text-muted-foreground">
                {bid.users.email} · {formatDate(bid.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm font-semibold text-foreground">
                {formatCurrency(bid.amount)}
              </p>
              <StatusBadge kind="bidStatus" value={bid.status} />

              {nextStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((next) => (
                    <Button
                      key={next}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(bid.id, next)}
                      disabled={updating === bid.id}
                      data-testid={`admin-bid-status-${next}`}
                    >
                      {next.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}
