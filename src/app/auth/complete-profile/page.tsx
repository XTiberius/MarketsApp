'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    })
    const result = await res.json().catch(() => null)

    if (res.status === 401) {
      router.replace('/auth/login')
      return
    }
    if (!res.ok) {
      setError(result?.error ?? 'Unable to save your profile')
      setLoading(false)
      return
    }

    router.replace('/listings')
    router.refresh()
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <GlassCard className="w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Logo href={undefined} size={40} />
          <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us your name to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
