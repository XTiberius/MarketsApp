'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import type { Listing, ListingType, ListingStatus } from '@/lib/types'

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
  investment_structure: string
}

const REQUIRED_FIELDS: (keyof FormState)[] = [
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
          investment_structure: listing.investment_structure ?? '',
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
          investment_structure: '',
        }
  )

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    const nextErrors: Partial<Record<keyof FormState, string>> = {}
    for (const field of REQUIRED_FIELDS) {
      if (!form[field].trim()) nextErrors[field] = 'This field is required'
    }
    for (const field of ['valuation', 'amount_raised'] as const) {
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
        investment_structure: form.investment_structure.trim() || null,
      }),
    })
    const result = await res.json().catch(() => null)

    if (!res.ok) {
      setApiError(result?.error ?? 'Failed to save listing')
      setLoading(false)
      return
    }

    router.push('/admin/listings')
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
            <SelectTrigger id="status">
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

      {apiError && <p className="text-sm text-danger">{apiError}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
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
