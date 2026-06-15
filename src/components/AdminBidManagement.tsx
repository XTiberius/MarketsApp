'use client'

import { useState } from 'react'
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
  placed: ['accepted', 'rejected'],
  accepted: ['awaiting_payment'],
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
    }

    setUpdating(null)
  }

  if (bids.length === 0) {
    return <p className="text-muted-foreground">No bids yet.</p>
  }

  return (
    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
      {bids.map((bid) => {
        const nextStatuses = TRANSITIONS[bid.status]
        return (
          <div key={bid.id} className="p-4 flex items-center justify-between hover:bg-muted/40">
            <div>
              <p className="font-medium">{bid.listings.company_name}</p>
              <p className="text-sm text-muted-foreground">
                {bid.users.email} · {formatDate(bid.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="font-semibold text-sm">{formatCurrency(bid.amount)}</p>
              <span className="text-xs border border-border rounded px-2 py-0.5 capitalize">
                {bid.status.replace(/_/g, ' ')}
              </span>

              {nextStatuses.length > 0 && (
                <div className="flex gap-1">
                  {nextStatuses.map((next) => (
                    <button
                      key={next}
                      onClick={() => updateStatus(bid.id, next)}
                      disabled={updating === bid.id}
                      data-testid={`admin-bid-status-${next}`}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50 capitalize"
                    >
                      {next.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
