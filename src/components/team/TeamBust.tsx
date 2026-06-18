'use client'

import { useState } from 'react'
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
 * A team member's portrait frame. Renders the member's `photo` (tinted toward the
 * IONIC stormy-blue palette so warm marble blends with the scheme), falling back
 * to their initials if no photo is set or the image fails to load.
 *
 * This is also the single mount point for the future classical Greek bust
 * (chest-up) animation — when it's built, replace the <img> block below with it;
 * keep the outer frame + aspect ratio so the layout stays stable.
 */
export function TeamBust({ member }: { member: TeamMember }) {
  const [imgOk, setImgOk] = useState(true)
  const showPhoto = !!member.photo && imgOk

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--muted)/0.3)]">
      {/* Fallback: initials (shown until a photo / the bust animation is in place). */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-5xl font-semibold text-muted-foreground/60">
          {initials(member.name)}
        </span>
      </div>

      {member.photo && (
        /* eslint-disable-next-line @next/next/no-img-element -- matches the project's
           intentional plain-<img> convention (see ListingLogo). */
        <img
          src={member.photo}
          alt={member.name}
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover object-top transition-opacity"
          style={{
            filter: 'grayscale(0.5) contrast(1.05) brightness(1.03)',
            opacity: showPhoto ? 1 : 0,
          }}
        />
      )}

      {showPhoto && (
        <>
          {/* IONIC stormy-blue tint blended over the (desaturated) marble. */}
          <div className="pointer-events-none absolute inset-0 mix-blend-color bg-[hsl(var(--primary)/0.40)]" />
          <div className="pointer-events-none absolute inset-0 mix-blend-soft-light bg-gradient-to-t from-[hsl(var(--primary)/0.50)] via-transparent to-[hsl(220_40%_10%/0.25)]" />
        </>
      )}
    </div>
  )
}
