'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCompactCurrency, formatDate } from '@/lib/utils'
import type { FundingRound } from '@/lib/types'

/** Admin UI to add and remove a listing's funding rounds. Mutates via fetch()
 *  to /api/listings/[id]/rounds. */
export function FundingRoundsManager({
  listingId,
  rounds,
}: {
  listingId: string
  rounds: FundingRound[]
}) {
  const router = useRouter()
  const [roundName, setRoundName] = useState('')
  const [valuation, setValuation] = useState('')
  const [amountRaised, setAmountRaised] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const valuationNumber = Number(valuation)
    if (!roundName.trim()) {
      setError('Round name is required.')
      return
    }
    if (!Number.isFinite(valuationNumber) || valuationNumber < 0) {
      setError('Enter a valid valuation.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_name: roundName.trim(),
          valuation: valuationNumber,
          amount_raised: amountRaised || undefined,
          event_date: eventDate || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Failed to add round')
        return
      }
      setRoundName('')
      setValuation('')
      setAmountRaised('')
      setEventDate('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add round')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(roundId: string) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/rounds/${roundId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Failed to delete round')
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete round')
    } finally {
      setBusy(false)
    }
  }

  const ordered = [...rounds].sort((a, b) => a.sequence_order - b.sequence_order)

  return (
    <div className="space-y-5">
      {ordered.length > 0 && (
        <ul className="space-y-2">
          {ordered.map((round) => (
            <li
              key={round.id}
              className="glass flex items-center justify-between gap-3 rounded-xl p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {round.round_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatCompactCurrency(round.valuation)}
                  {round.amount_raised != null
                    ? ` · ${formatCompactCurrency(round.amount_raised)} raised`
                    : ''}
                  {round.event_date ? ` · ${formatDate(round.event_date)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(round.id)}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="round_name">Round name</Label>
            <Input
              id="round_name"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="Series A"
              disabled={busy}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="round_valuation">Valuation</Label>
            <Input
              id="round_valuation"
              type="number"
              min={0}
              step="any"
              value={valuation}
              onChange={(e) => setValuation(e.target.value)}
              placeholder="50000000"
              disabled={busy}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="round_amount_raised">Amount raised</Label>
            <Input
              id="round_amount_raised"
              type="number"
              min={0}
              step="any"
              value={amountRaised}
              onChange={(e) => setAmountRaised(e.target.value)}
              placeholder="10000000"
              disabled={busy}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="round_date">Date</Label>
            <Input
              id="round_date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
        <Button type="submit" variant="glass" size="sm" disabled={busy}>
          <Plus className="h-4 w-4" />
          {busy ? 'Saving…' : 'Add round'}
        </Button>
      </form>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
