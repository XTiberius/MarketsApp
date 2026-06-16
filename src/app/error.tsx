'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <GlassCard className="max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Something went off-orbit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to safe ground.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="glass">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
