'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'

/**
 * Admin quick toggle of a listing's Active/Closed state (published ↔ closed).
 * Always available on live listings; a Closed listing stops accepting new bids.
 * Drafts show the badge only (publish them via the edit form).
 */
export function ListingActivityToggle({
  listingId,
  status,
}: {
  listingId: string
  status: string
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [busy, setBusy] = useState(false)

  if (current !== 'published' && current !== 'closed') {
    return <StatusBadge kind="listingActivity" value={current} />
  }

  const next = current === 'published' ? 'closed' : 'published'

  async function toggle() {
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setCurrent(next)
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge kind="listingActivity" value={current} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={toggle}
        data-testid={`listing-activity-toggle-${listingId}`}
      >
        {busy ? '…' : current === 'published' ? 'Close' : 'Reopen'}
      </Button>
    </div>
  )
}
