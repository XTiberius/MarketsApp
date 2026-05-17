'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us your name to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-1">
              First name
            </label>
            <input
              id="first_name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-1">
              Last name
            </label>
            <input
              id="last_name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
