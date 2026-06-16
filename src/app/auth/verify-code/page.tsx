'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function subscribeToSessionStorage() {
  return () => {}
}

function getStoredOtpEmail() {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('otp_email') ?? ''
}

const OTP_LENGTH = 6

export default function VerifyCodePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const email = useSyncExternalStore(subscribeToSessionStorage, getStoredOtpEmail, () => '')
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!sessionStorage.getItem('otp_email')) {
      router.replace('/auth/login')
    }
  }, [router])

  // Segmented OTP handlers — all converge on the single `code` state so the
  // existing submit logic and 6-char limit are preserved exactly.
  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = code.split('')
    next[index] = digit
    const joined = next.join('').slice(0, OTP_LENGTH)
    setCode(joined)
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    setCode(pasted)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }

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
      <GlassCard className="w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Logo href={undefined} size={40} />
          <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
            Enter your code
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a 6-digit code to{' '}
            <strong className="text-foreground">{email || 'your email'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code-0">Verification code</Label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  ref={(el) => {
                    inputsRef.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={code[i] ?? ''}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  aria-label={`Digit ${i + 1}`}
                  className={cn(
                    'h-14 w-full min-w-0 rounded-xl border border-input bg-[hsl(var(--background)/0.4)]',
                    'text-center font-mono text-2xl text-foreground transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent'
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? 'Verifying…' : 'Verify code'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/auth/login')}
            className="w-full"
          >
            Use a different email
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
