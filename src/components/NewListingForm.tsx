'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ListingType, ListingStatus } from '@/lib/types'
import { isValidHttpUrl } from '@/lib/utils'

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

const inputClass =
  'w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground'

export function NewListingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [form, setForm] = useState<FormState>({
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
  })

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
    if (form.logo_url.trim() && !isValidHttpUrl(form.logo_url.trim())) {
      nextErrors.logo_url = 'Enter a full URL starting with https:// (or leave blank)'
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
    const res = await fetch('/api/listings', {
      method: 'POST',
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
      setApiError(result?.error ?? 'Failed to create listing')
      setLoading(false)
      return
    }

    router.push('/admin/listings')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium mb-1">
          Company name <span className="text-red-600">*</span>
        </label>
        <input
          id="company_name"
          type="text"
          value={form.company_name}
          onChange={(e) => update('company_name', e.target.value)}
          className={inputClass}
        />
        {errors.company_name && (
          <p className="text-xs text-red-600 mt-1">{errors.company_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description <span className="text-red-600">*</span>
        </label>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className={inputClass}
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium mb-1">
          Industry <span className="text-red-600">*</span>
        </label>
        <input
          id="industry"
          type="text"
          value={form.industry}
          onChange={(e) => update('industry', e.target.value)}
          className={inputClass}
        />
        {errors.industry && (
          <p className="text-xs text-red-600 mt-1">{errors.industry}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="listing_type" className="block text-sm font-medium mb-1">
            Listing type <span className="text-red-600">*</span>
          </label>
          <select
            id="listing_type"
            value={form.listing_type}
            onChange={(e) => update('listing_type', e.target.value as ListingType)}
            className={inputClass}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status <span className="text-red-600">*</span>
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => update('status', e.target.value as ListingStatus)}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium mb-1">
          Logo URL
        </label>
        <input
          id="logo_url"
          type="url"
          value={form.logo_url}
          onChange={(e) => update('logo_url', e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
        {errors.logo_url && (
          <p className="text-xs text-red-600 mt-1">{errors.logo_url}</p>
        )}
      </div>

      <div>
        <label htmlFor="nda_text" className="block text-sm font-medium mb-1">
          NDA text <span className="text-red-600">*</span>
        </label>
        <textarea
          id="nda_text"
          rows={5}
          value={form.nda_text}
          onChange={(e) => update('nda_text', e.target.value)}
          placeholder="Plain-text NDA shown to investors before they unlock deal details."
          className={inputClass}
        />
        {errors.nda_text && (
          <p className="text-xs text-red-600 mt-1">{errors.nda_text}</p>
        )}
      </div>

      <div className="border-t border-border pt-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold">Confidential details</h2>
          <p className="text-xs text-muted-foreground">
            Optional. Hidden from investors until they sign the NDA.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="valuation" className="block text-sm font-medium mb-1">
              Valuation ($)
            </label>
            <input
              id="valuation"
              type="number"
              min="0"
              value={form.valuation}
              onChange={(e) => update('valuation', e.target.value)}
              className={inputClass}
            />
            {errors.valuation && (
              <p className="text-xs text-red-600 mt-1">{errors.valuation}</p>
            )}
          </div>
          <div>
            <label htmlFor="amount_raised" className="block text-sm font-medium mb-1">
              Amount raised ($)
            </label>
            <input
              id="amount_raised"
              type="number"
              min="0"
              value={form.amount_raised}
              onChange={(e) => update('amount_raised', e.target.value)}
              className={inputClass}
            />
            {errors.amount_raised && (
              <p className="text-xs text-red-600 mt-1">{errors.amount_raised}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="investment_structure" className="block text-sm font-medium mb-1">
            Investment structure
          </label>
          <textarea
            id="investment_structure"
            rows={3}
            value={form.investment_structure}
            onChange={(e) => update('investment_structure', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {apiError && <p className="text-sm text-red-600">{apiError}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create listing'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/listings')}
          className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
