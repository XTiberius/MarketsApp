'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  listingId: string
  companyName: string
}

const MIN_BID = 50_000

export function BidModal({ listingId, companyName }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const numericAmount = Number(amount.replace(/[^0-9]/g, ''))

    if (numericAmount < MIN_BID) {
      setError(`Minimum bid is ${formatCurrency(MIN_BID)}`)
      setLoading(false)
      return
    }

    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, amount: numericAmount }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-testid="bid-open-button"
        className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
      >
        Place Bid
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        data-testid="bid-modal"
        className="w-full max-w-sm bg-background rounded-xl border border-border p-6 space-y-4 shadow-xl"
      >
        {success ? (
          <div className="text-center space-y-3">
            <p className="font-semibold text-lg">Bid placed!</p>
            <p className="text-sm text-muted-foreground">
              Your bid on <strong>{companyName}</strong> has been submitted. The team will be in touch.
            </p>
            <button
              onClick={() => {
                setOpen(false)
                setSuccess(false)
                setAmount('')
              }}
              className="w-full py-2 rounded-lg border border-border text-sm hover:bg-muted"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-semibold text-lg">Place a Bid</h2>
              <p className="text-sm text-muted-foreground">{companyName} · Min. {formatCurrency(MIN_BID)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="bid-amount" className="block text-sm font-medium mb-1">
                  Bid Amount (USD)
                </label>
                <input
                  id="bid-amount"
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$50,000"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="bid-submit-button"
                  className="flex-1 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit Bid'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
