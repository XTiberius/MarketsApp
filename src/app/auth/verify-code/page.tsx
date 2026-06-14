'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

function subscribeToSessionStorage() {
  return () => {}
}

function getStoredOtpEmail() {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('otp_email') ?? ''
}

export default function VerifyCodePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const email = useSyncExternalStore(subscribeToSessionStorage, getStoredOtpEmail, () => '')

  useEffect(() => {
    if (!sessionStorage.getItem('otp_email')) {
      router.replace('/auth/login')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const storedEmail = email || sessionStorage.getItem('otp_email') || ''
    if (!storedEmail) {
      setLoading(false)
      router.replace('/auth/login')
      return
    }

    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: storedEmail, token: code }),
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.error ?? 'Unable to verify code')
      setLoading(false)
      return
    }

    sessionStorage.removeItem('otp_email')
    router.replace('/listings')
    router.refresh()
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Enter your code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a 6-digit code to <strong>{email || 'your email'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-center tracking-widest text-lg outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Verifying…' : 'Verify code'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="w-full text-sm text-muted-foreground hover:underline"
          >
            Use a different email
          </button>
        </form>
      </div>
    </div>
  )
}
