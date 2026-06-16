import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <GlassCard className="max-w-md p-8 text-center">
        <p className="font-display text-5xl font-semibold text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold">Lost in space</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for drifted out of orbit or never existed.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href="/">Back to IONIC</Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
