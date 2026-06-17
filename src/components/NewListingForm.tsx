'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { LogoUploadField } from '@/components/LogoUploadField'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/storage'
import { formatCompactCurrency, formatDate } from '@/lib/utils'
import type { Listing, ListingType, ListingStatus } from '@/lib/types'

type PendingRound = {
  round_name: string
  valuation: string
  amount_raised: string
  event_date: string
}

type FormState = {
  company_name: string
  description: string
  industry: string
  listing_type: ListingType
  status: ListingStatus
  nda_text: string
  logo_url: string
  valuation: string
  amount_raised: string
  minimum_investment: string
  investment_structure: string
  ai_newsfeed_enabled: boolean
}

type RequiredTextField = Extract<
  keyof FormState,
  'company_name' | 'description' | 'industry' | 'nda_text'
>

const REQUIRED_FIELDS: RequiredTextField[] = [
  'company_name',
  'description',
  'industry',
  'nda_text',
]

export function NewListingForm({ listing }: { listing?: Listing }) {
  const router = useRouter()
  const isEdit = !!listing
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [form, setForm] = useState<FormState>(() =>
    listing
      ? {
          company_name: listing.company_name,
          description: listing.description,
          industry: listing.industry,
          listing_type: listing.listing_type,
          status: listing.status,
          nda_text: listing.nda_text,
          logo_url: listing.logo_url ?? '',
          valuation: listing.valuation?.toString() ?? '',
          amount_raised: listing.amount_raised?.toString() ?? '',
          minimum_investment: listing.minimum_investment?.toString() ?? '',
          investment_structure: listing.investment_structure ?? '',
          ai_newsfeed_enabled: listing.ai_newsfeed_enabled,
        }
      : {
          company_name: '',
          description: '',
          industry: '',
          listing_type: 'primary',
          status: 'draft',
          nda_text: '',
          logo_url: '',
          valuation: '',
          amount_raised: '',
          minimum_investment: '',
          investment_structure: '',
          ai_newsfeed_enabled: false,
        }
  )

  const memorandumInputRef = useRef<HTMLInputElement>(null)
  const pitchDeckInputRef = useRef<HTMLInputElement>(null)
  const [memorandumFile, setMemorandumFile] = useState<File | null>(null)
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null)
  const [memorandumError, setMemorandumError] = useState<string | null>(null)
  const [pitchDeckError, setPitchDeckError] = useState<string | null>(null)

  const [pendingRounds, setPendingRounds] = useState<PendingRound[]>([])
  const [roundName, setRoundName] = useState('')
  const [roundValuation, setRoundValuation] = useState('')
  const [roundAmountRaised, setRoundAmountRaised] = useState('')
  const [roundDate, setRoundDate] = useState('')
  const [roundError, setRoundError] = useState<string | null>(null)

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function pickDocument(
    file: File,
    setFile: (f: File | null) => void,
    setError: (e: string | null) => void
  ) {
    setError(null)
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File exceeds the ${MAX_UPLOAD_LABEL} limit.`)
      return
    }
    setFile(file)
  }

  function handleAddRound() {
    setRoundError(null)
    const valuationNumber = Number(roundValuation)
    if (!roundName.trim()) {
      setRoundError('Round name is required.')
      return
    }
    if (!Number.isFinite(valuationNumber) || valuationNumber < 0) {
      setRoundError('Enter a valid valuation.')
      return
    }
    setPendingRounds((prev) => [
      ...prev,
      {
        round_name: roundName.trim(),
        valuation: roundValuation,
        amount_raised: roundAmountRaised,
        event_date: roundDate,
      },
    ])
    setRoundName('')
    setRoundValuation('')
    setRoundAmountRaised('')
    setRoundDate('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    const nextErrors: Partial<Record<keyof FormState, string>> = {}
    for (const field of REQUIRED_FIELDS) {
      if (!form[field].trim()) {
        nextErrors[field] = 'This field is required'
      }
    }
    for (const field of ['valuation', 'amount_raised', 'minimum_investment'] as const) {
      const v = form[field].trim()
      if (v && (!Number.isFinite(Number(v)) || Number(v) < 0)) {
        nextErrors[field] = 'Enter a non-negative number'
      }
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    const res = await fetch(isEdit ? `/api/listings/${listing!.id}` : '/api/listings', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: form.company_name.trim(),
        description: form.description.trim(),
        industry: form.industry.trim(),
        listing_type: form.listing_type,
        status: form.status,
        nda_text: form.nda_text.trim(),
        logo_url: form.logo_url.trim() || null,
        valuation: form.valuation === '' ? null : Number(form.valuation),
        amount_raised: form.amount_raised === '' ? null : Number(form.amount_raised),
        minimum_investment:
          form.minimum_investment === '' ? null : Number(form.minimum_investment),
        investment_structure: form.investment_structure.trim() || null,
        ai_newsfeed_enabled: form.ai_newsfeed_enabled,
      }),
    })
    const result = await res.json().catch(() => null)

    if (!res.ok) {
      setApiError(result?.error ?? 'Failed to save listing')
      setLoading(false)
      return
    }

    if (isEdit) {
      router.push('/admin/listings')
      router.refresh()
      return
    }

    // Create mode: attach the buffered documents and rounds to the new listing.
    // The listing already exists, so we always move forward to its edit page —
    // sub-request failures are recoverable there via the live managers.
    const newId = result.id as string
    const docSlots: { file: File | null; doc_type: 'memorandum' | 'pitch_deck' }[] = [
      { file: memorandumFile, doc_type: 'memorandum' },
      { file: pitchDeckFile, doc_type: 'pitch_deck' },
    ]
    for (const slot of docSlots) {
      if (!slot.file) continue
      const body = new FormData()
      body.append('file', slot.file)
      body.append('doc_type', slot.doc_type)
      await fetch(`/api/listings/${newId}/documents`, {
        method: 'POST',
        body,
      }).catch(() => null)
    }
    for (const round of pendingRounds) {
      await fetch(`/api/listings/${newId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_name: round.round_name,
          valuation: Number(round.valuation),
          amount_raised: round.amount_raised || undefined,
          event_date: round.event_date || undefined,
        }),
      }).catch(() => null)
    }

    router.push(`/admin/listings/${newId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <Label htmlFor="company_name" className="mb-1 block">
          Company name <span className="text-danger">*</span>
        </Label>
        <Input
          id="company_name"
          type="text"
          value={form.company_name}
          onChange={(e) => update('company_name', e.target.value)}
        />
        {errors.company_name && (
          <p className="mt-1 text-xs text-danger">{errors.company_name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="mb-1 block">
          Description <span className="text-danger">*</span>
        </Label>
        <Textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-danger">{errors.description}</p>
        )}
      </div>

      <div>
        <Label htmlFor="industry" className="mb-1 block">
          Industry <span className="text-danger">*</span>
        </Label>
        <Input
          id="industry"
          type="text"
          value={form.industry}
          onChange={(e) => update('industry', e.target.value)}
        />
        {errors.industry && (
          <p className="mt-1 text-xs text-danger">{errors.industry}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="listing_type" className="mb-1 block">
            Listing type <span className="text-danger">*</span>
          </Label>
          <Select
            value={form.listing_type}
            onValueChange={(value) => update('listing_type', value as ListingType)}
          >
            <SelectTrigger id="listing_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status" className="mb-1 block">
            Status <span className="text-danger">*</span>
          </Label>
          <Select
            value={form.status}
            onValueChange={(value) => update('status', value as ListingStatus)}
          >
            <SelectTrigger id="status" data-testid="form-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-1 block">Logo</Label>
        <LogoUploadField value={form.logo_url} onChange={(url) => update('logo_url', url)} />
      </div>

      <label
        htmlFor="ai_newsfeed_enabled"
        className="flex items-start gap-3 rounded-xl border border-border p-4"
      >
        <input
          id="ai_newsfeed_enabled"
          type="checkbox"
          checked={form.ai_newsfeed_enabled}
          onChange={(e) => update('ai_newsfeed_enabled', e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium text-foreground">AI Newsfeed</span>
          <span className="block text-xs text-muted-foreground">
            Show the generated newsfeed summary to investors after they sign the NDA.
          </span>
        </span>
      </label>

      <div>
        <Label htmlFor="nda_text" className="mb-1 block">
          NDA text <span className="text-danger">*</span>
        </Label>
        <Textarea
          id="nda_text"
          rows={5}
          value={form.nda_text}
          onChange={(e) => update('nda_text', e.target.value)}
          placeholder="Plain-text NDA shown to investors before they unlock deal details."
        />
        {errors.nda_text && (
          <p className="mt-1 text-xs text-danger">{errors.nda_text}</p>
        )}
      </div>

      <div className="border-t border-border pt-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold">Confidential details</h2>
          <p className="text-xs text-muted-foreground">
            Optional. Hidden from investors until they sign the NDA.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="valuation" className="mb-1 block">
              Valuation ($)
            </Label>
            <Input
              id="valuation"
              type="number"
              min="0"
              value={form.valuation}
              onChange={(e) => update('valuation', e.target.value)}
            />
            {errors.valuation && (
              <p className="mt-1 text-xs text-danger">{errors.valuation}</p>
            )}
          </div>
          <div>
            <Label htmlFor="amount_raised" className="mb-1 block">
              Amount raised ($)
            </Label>
            <Input
              id="amount_raised"
              type="number"
              min="0"
              value={form.amount_raised}
              onChange={(e) => update('amount_raised', e.target.value)}
            />
            {errors.amount_raised && (
              <p className="mt-1 text-xs text-danger">{errors.amount_raised}</p>
            )}
          </div>
          <div>
            <Label htmlFor="minimum_investment" className="mb-1 block">
              Minimum investment ($)
            </Label>
            <Input
              id="minimum_investment"
              type="number"
              min="0"
              value={form.minimum_investment}
              onChange={(e) => update('minimum_investment', e.target.value)}
            />
            {errors.minimum_investment && (
              <p className="mt-1 text-xs text-danger">{errors.minimum_investment}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="investment_structure" className="mb-1 block">
            Investment structure
          </Label>
          <Textarea
            id="investment_structure"
            rows={3}
            value={form.investment_structure}
            onChange={(e) => update('investment_structure', e.target.value)}
          />
        </div>
      </div>

      {!isEdit && (
        <div className="border-t border-border pt-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Informational documents</h2>
            <p className="text-xs text-muted-foreground">
              Optional. Attached to the listing when it is created.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="mb-1 block">Investment Memorandum</Label>
              {memorandumFile ? (
                <div className="glass flex items-center justify-between gap-3 rounded-xl p-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {memorandumFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMemorandumFile(null)
                      setMemorandumError(null)
                    }}
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => memorandumInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      memorandumInputRef.current?.click()
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-muted-foreground">Click to upload a PDF</span>
                  <span className="text-xs text-muted-foreground">PDF only</span>
                </div>
              )}
              <input
                ref={memorandumInputRef}
                data-testid="create-doc-memorandum"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) pickDocument(f, setMemorandumFile, setMemorandumError)
                  e.target.value = ''
                }}
              />
              {memorandumError && (
                <p className="mt-1 text-xs text-danger">{memorandumError}</p>
              )}
            </div>

            <div>
              <Label className="mb-1 block">Pitch Deck</Label>
              {pitchDeckFile ? (
                <div className="glass flex items-center justify-between gap-3 rounded-xl p-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {pitchDeckFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPitchDeckFile(null)
                      setPitchDeckError(null)
                    }}
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => pitchDeckInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      pitchDeckInputRef.current?.click()
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-muted-foreground">Click to upload a PDF</span>
                  <span className="text-xs text-muted-foreground">PDF only</span>
                </div>
              )}
              <input
                ref={pitchDeckInputRef}
                data-testid="create-doc-pitch_deck"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) pickDocument(f, setPitchDeckFile, setPitchDeckError)
                  e.target.value = ''
                }}
              />
              {pitchDeckError && (
                <p className="mt-1 text-xs text-danger">{pitchDeckError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isEdit && (
        <div className="border-t border-border pt-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Fundraising rounds</h2>
            <p className="text-xs text-muted-foreground">
              Optional. Saved to the listing when it is created.
            </p>
          </div>

          {pendingRounds.length > 0 && (
            <ul className="space-y-2">
              {pendingRounds.map((round, index) => (
                <li
                  key={index}
                  className="glass flex items-center justify-between gap-3 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {round.round_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCompactCurrency(Number(round.valuation))}
                      {round.amount_raised
                        ? ` · ${formatCompactCurrency(Number(round.amount_raised))} raised`
                        : ''}
                      {round.event_date ? ` · ${formatDate(round.event_date)}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingRounds((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="round_name">Round name</Label>
                <Input
                  id="round_name"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="Series A"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="round_valuation">Valuation</Label>
                <Input
                  id="round_valuation"
                  type="number"
                  min={0}
                  step="any"
                  value={roundValuation}
                  onChange={(e) => setRoundValuation(e.target.value)}
                  placeholder="50000000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="round_amount_raised">Amount raised</Label>
                <Input
                  id="round_amount_raised"
                  type="number"
                  min={0}
                  step="any"
                  value={roundAmountRaised}
                  onChange={(e) => setRoundAmountRaised(e.target.value)}
                  placeholder="10000000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="round_date">Date</Label>
                <Input
                  id="round_date"
                  type="date"
                  value={roundDate}
                  onChange={(e) => setRoundDate(e.target.value)}
                />
              </div>
            </div>
            <Button type="button" variant="glass" size="sm" onClick={handleAddRound}>
              <Plus className="h-4 w-4" />
              Add round
            </Button>
          </div>

          {roundError && <p className="text-xs text-danger">{roundError}</p>}
        </div>
      )}

      {apiError && <p className="text-sm text-danger">{apiError}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          data-testid="form-submit-button"
        >
          {loading ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create listing'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/listings')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
