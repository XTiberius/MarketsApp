'use client'

/**
 * Page backdrop by route. The landing page owns its own backgrounds (the
 * ping-pong hero + the content scroll-scrub), so it renders nothing here; every
 * other route gets the cosmic SpaceBackground.
 */

import { usePathname } from 'next/navigation'
import { SpaceBackground } from './SpaceBackground'

export function SiteBackground() {
  const pathname = usePathname()
  if (pathname === '/') return null
  return <SpaceBackground />
}
