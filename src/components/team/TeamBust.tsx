'use client'

import type { TeamMember } from '@/lib/team'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Placeholder for a team member's classical Greek bust animation (chest-up).
 *
 * The animation itself is NOT built yet. This component is the single mount point
 * for it — when the bust assets/animation are ready, replace the placeholder block
 * marked below. Keep the outer frame + aspect ratio so the page layout stays stable
 * when the real animation drops in. It's already a client component so the future
 * animation can be interactive without touching the page.
 */
export function TeamBust({ member }: { member: TeamMember }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--muted)/0.3)]">
      {/* TODO: classical Greek bust (chest-up) animation for `member` mounts here. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-5xl font-semibold text-muted-foreground/60">
          {initials(member.name)}
        </span>
      </div>
    </div>
  )
}
