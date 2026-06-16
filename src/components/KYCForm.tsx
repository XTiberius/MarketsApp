'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2 } from 'lucide-react'
import type { KycStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.08)] p-6 text-center">
        <Clock className="size-7 text-warning" />
        <p className="font-display font-semibold text-foreground">KYC Under Review</p>
        <p className="text-sm text-muted-foreground">
          Your KYC submission is being reviewed. You&apos;ll be notified once approved.
        </p>
      </div>
    )
  }

  if (kycStatus === 'approved') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.08)] p-6 text-center">
        <CheckCircle2 className="size-7 text-success" />
        <p className="font-display font-semibold text-foreground">KYC Approved</p>
        <p className="text-sm text-muted-foreground">
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(({ id, label, type = 'text' }) => (
          <div key={id} className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              type={type}
              required
              value={form[id] as string}
              onChange={(e) => update(id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-[hsl(var(--background)/0.3)] p-4 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.accredited_investor}
          onChange={(e) => update('accredited_investor', e.target.checked)}
          required
          className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
        />
        <span className="text-foreground">
          I certify I am an accredited investor as defined by the SEC
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading ? 'Submitting…' : 'Submit KYC'}
      </Button>
    </form>
  )
}
