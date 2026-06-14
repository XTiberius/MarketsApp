'use client'

import { useState } from 'react'
import { isValidHttpUrl } from '@/lib/utils'

interface Props {
  logoUrl: string | null
  companyName: string
}

/**
 * Renders a listing's logo defensively. A malformed or dead logo URL must never
 * crash the page: we only attempt an <img> for a valid absolute http(s) URL, and
 * fall back to the company initials on any load error. A plain <img> (not
 * next/image) is intentional — logos are arbitrary external hosts that can't be
 * allow-listed in next.config images.remotePatterns.
 */
export function ListingLogo({ logoUrl, companyName }: Props) {
  const [failed, setFailed] = useState(false)
  const initials = companyName.slice(0, 2)

  if (!logoUrl || !isValidHttpUrl(logoUrl) || failed) {
    return (
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {initials}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      className="h-8 w-auto object-contain"
      onError={() => setFailed(true)}
    />
  )
}
