'use client'

import { useState } from 'react'
import { SignatureField } from '@/components/SignatureField'

interface Props {
  listingId: string
  ndaText: string
}

export function NDAModal({ listingId, ndaText }: Props) {
  const [open, setOpen] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSign() {
    if (!signature || !agreed) return
    setLoading(true)
    setError(null)

    // Record the NDA signature only — no bid is created here.
    // Placing a bid is a separate flow (BidModal → /api/bids).
    const res = await fetch('/api/nda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, signature_image: signature }),
    })

    if (!res.ok) {
      const d = await res.json().catch(() => null)
      setError(d?.error ?? 'Failed to record signature')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    // Refresh so the page re-renders with confidential fields unlocked
    // and the Place Bid button visible.
    setTimeout(() => window.location.reload(), 1500)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-testid="nda-open-button"
        className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign NDA to Unlock
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        data-testid="nda-modal"
        className="w-full max-w-lg bg-background rounded-xl border border-border shadow-xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold text-lg">Non-Disclosure Agreement</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign to unlock confidential deal details
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {ndaText}
        </div>

        {success ? (
          <div className="p-6 text-center text-sm text-green-700 border-t border-border">
            ✓ NDA signed — unlocking details…
          </div>
        ) : (
          <div className="p-6 border-t border-border space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Your signature</p>
              <SignatureField onChange={setSignature} />
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              <span>I agree to the terms of this NDA and confirm I am an accredited investor</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={!signature || !agreed || loading}
                data-testid="nda-submit-button"
                className="flex-1 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Signing…' : 'Sign NDA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
