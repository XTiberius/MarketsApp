import { GlassCard } from '@/components/ui/glass-card'
import { formatDate } from '@/lib/utils'
import type { NewsfeedBullet } from '@/lib/types'

export function NewsfeedSummary({
  bullets,
  disclosure,
  generatedAt,
}: {
  bullets: NewsfeedBullet[]
  disclosure: string
  generatedAt?: string | null
}) {
  if (bullets.length === 0) return null

  return (
    <GlassCard className="space-y-4 p-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-foreground">
          AI Newsfeed Summary
        </h2>
        {generatedAt && (
          <p className="text-xs text-muted-foreground">
            Generated {formatDate(generatedAt)}
          </p>
        )}
      </div>

      <ul className="space-y-3">
        {bullets.map((bullet, index) => (
          <li key={`${index}-${bullet.text}`} className="flex gap-3 text-sm text-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="leading-relaxed">{bullet.text}</span>
          </li>
        ))}
      </ul>

      <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        {disclosure}
      </p>
    </GlassCard>
  )
}
