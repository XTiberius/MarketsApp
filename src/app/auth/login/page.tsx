'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.error ?? 'Unable to send verification code')
      setLoading(false)
      return
    }

    // Store email for the verify step
    sessionStorage.setItem('otp_email', email)
    router.push('/auth/verify-code')
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <GlassCard className="w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Logo href={undefined} size={40} />
          <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
            Sign in to IONIC
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ll send a 6-digit code to your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
            {loading ? 'Sending code…' : 'Send code'}
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
