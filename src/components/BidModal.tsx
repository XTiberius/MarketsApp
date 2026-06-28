'use client'

import { useState } from 'react'
import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** One end-user the account can bid as: the individual profile, or a registered entity. */
export type EndUserOption =
  | { kind: 'individual'; label: string }
  | { kind: 'entity'; entityId: string; label: string }

interface Props {
  listingId: string
  companyName: string
  minimumInvestment?: number | null
  endUsers: EndUserOption[]
}

const DEFAULT_MIN_BID = 50_000

/** Stable value used in the <Select>: 'individual' or `entity:<id>`. */
function optionValue(o: EndUserOption): string {
  return o.kind === 'individual' ? 'individual' : `entity:${o.entityId}`
}

export function BidModal({ listingId, companyName, minimumInvestment, endUsers }: Props) {
  const minBid = minimumInvestment ?? DEFAULT_MIN_BID
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [endUser, setEndUser] = useState<string>(
    endUsers.length === 1 ? optionValue(endUsers[0]) : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const numericAmount = Number(amount.replace(/[^0-9]/g, ''))

    if (numericAmount < minBid) {
      setError(`Minimum bid is ${formatCurrency(minBid)}`)
      setLoading(false)
      return
    }

    if (!endUser) {
      setError('Please choose who this bid is from.')
      setLoading(false)
      return
    }

    const investor_kind = endUser === 'individual' ? 'individual' : 'entity'
    const entity_id = endUser.startsWith('entity:') ? endUser.slice('entity:'.length) : null

    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        amount: numericAmount,
        investor_kind,
        entity_id,
      }),
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="lg" className="w-full" data-testid="bid-open-button">
          <TrendingUp className="h-4 w-4" />
          Place Bid
        </Button>
      </DialogTrigger>

      <DialogContent data-testid="bid-modal" className="max-w-sm">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--success)/0.14)]">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-lg font-semibold text-foreground">Bid placed!</p>
              <p className="text-sm text-muted-foreground">
                Your bid on <strong className="text-foreground">{companyName}</strong> has been submitted. The team will be in touch.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setOpen(false)
                setSuccess(false)
                setAmount('')
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Place a Bid</DialogTitle>
              <DialogDescription>
                {companyName} · Min. {formatCurrency(minBid)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {endUsers.length > 1 ? (
                <div className="space-y-1.5">
                  <Label htmlFor="bid-end-user">Bidding as</Label>
                  <Select value={endUser} onValueChange={setEndUser}>
                    <SelectTrigger id="bid-end-user" data-testid="bid-end-user">
                      <SelectValue placeholder="Select who this bid is from" />
                    </SelectTrigger>
                    <SelectContent>
                      {endUsers.map((o) => (
                        <SelectItem key={optionValue(o)} value={optionValue(o)}>
                          {o.label}
                          {o.kind === 'entity' ? ' · Entity' : ' · Individual'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : endUsers.length === 1 ? (
                <div className="space-y-1.5">
                  <Label>Bidding as</Label>
                  <p className="rounded-xl border border-border bg-[hsl(var(--background)/0.4)] px-3.5 py-2 text-sm text-foreground">
                    {endUsers[0].label}
                    {endUsers[0].kind === 'entity' ? ' · Entity' : ' · Individual'}
                  </p>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="bid-amount">Bid Amount (USD)</Label>
                <Input
                  id="bid-amount"
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={formatCurrency(minBid)}
                  className="font-mono"
                />
              </div>

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
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={loading}
                  data-testid="bid-submit-button"
                >
                  {loading ? 'Submitting…' : 'Submit Bid'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
