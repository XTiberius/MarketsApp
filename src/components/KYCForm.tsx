'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { KycStatus } from '@/lib/types'

interface Props {
  userId: string
  kycStatus: KycStatus
  firstName?: string | null
  lastName?: string | null
}

export function KYCForm({ kycStatus, firstName, lastName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: firstName ?? '',
    last_name: lastName ?? '',
    dob: '',
    address: '',
    phone: '',
    occupation: '',
    accredited_investor: false,
  })

  if (kycStatus === 'pending') {
    return (
      <div className="rounded-lg border border-border p-6 text-center space-y-2">
        <p className="font-medium">KYC Under Review</p>
        <p className="text-sm text-muted-foreground">
          Your KYC submission is being reviewed. You&apos;ll be notified once approved.
        </p>
      </div>
    )
  }

  if (kycStatus === 'approved') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-2">
        <p className="font-medium text-green-800">KYC Approved</p>
        <p className="text-sm text-green-700">
          You are verified as an accredited investor.
        </p>
      </div>
    )
  }

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.refresh()
  }

  const fields: { id: keyof typeof form; label: string; type?: string }[] = [
    { id: 'first_name', label: 'First Name' },
    { id: 'last_name', label: 'Last Name' },
    { id: 'dob', label: 'Date of Birth', type: 'date' },
    { id: 'address', label: 'Address' },
    { id: 'phone', label: 'Phone Number', type: 'tel' },
    { id: 'occupation', label: 'Occupation' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(({ id, label, type = 'text' }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
          <input
            id={id}
            type={type}
            required
            value={form[id] as string}
            onChange={(e) => update(id, e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
          />
        </div>
      ))}

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.accredited_investor}
          onChange={(e) => update('accredited_investor', e.target.checked)}
          required
        />
        <span>I certify I am an accredited investor as defined by the SEC</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Submit KYC'}
      </button>
    </form>
  )
}
