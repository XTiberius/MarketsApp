'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { ListingNewsfeed } from '@/lib/types'

export function NewsfeedAdminPanel({
  listingId,
  enabled,
  newsfeed,
}: {
  listingId: string
  enabled: boolean
  newsfeed: ListingNewsfeed | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState<ListingNewsfeed | null>(newsfeed)

  async function handleRefresh() {
    setBusy(true)
    setError(null)

    try {
      const res = await fetch(`/api/listings/${listingId}/newsfeed`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error ?? 'Failed to refresh newsfeed')
        return
      }

      setCurrent(data as ListingNewsfeed)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh newsfeed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge tone={enabled ? 'success' : 'neutral'}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {current?.generated_at && (
              <span className="text-xs text-muted-foreground">
                Last generated {formatDate(current.generated_at)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Toggle visibility in the listing form. Refresh generates new NDA-gated bullets.
          </p>
        </div>
        <Button type="button" variant="glass" size="sm" onClick={handleRefresh} disabled={busy}>
          <RefreshCw className={busy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {busy ? 'Refreshing…' : 'Refresh newsfeed'}
        </Button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {current?.bullets?.length ? (
        <ul className="space-y-2">
          {current.bullets.map((bullet, index) => (
            <li key={`${index}-${bullet.text}`} className="glass rounded-xl p-3 text-sm text-foreground">
              {bullet.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No newsfeed has been generated for this listing yet.
        </p>
      )}
    </div>
  )
}
