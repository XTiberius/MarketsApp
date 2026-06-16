'use client'

import { useState } from 'react'
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { SignatureField } from '@/components/SignatureField'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" data-testid="nda-open-button">
          <Lock className="h-4 w-4" />
          Sign NDA to Unlock
        </Button>
      </DialogTrigger>

      <DialogContent
        data-testid="nda-modal"
        className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b border-border/60 p-6">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Non-Disclosure Agreement
          </DialogTitle>
          <DialogDescription>
            Sign to unlock confidential deal details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto whitespace-pre-wrap p-6 text-sm leading-relaxed text-muted-foreground">
          {ndaText}
        </div>

        {success ? (
          <div className="flex items-center justify-center gap-2 border-t border-border/60 p-6 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            NDA signed — unlocking details…
          </div>
        ) : (
          <div className="space-y-4 border-t border-border/60 p-6">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Your signature</p>
              <SignatureField onChange={setSignature} />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              <span>I agree to the terms of this NDA and confirm I am an accredited investor</span>
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={handleSign}
                disabled={!signature || !agreed || loading}
                data-testid="nda-submit-button"
              >
                {loading ? 'Signing…' : 'Sign NDA'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
