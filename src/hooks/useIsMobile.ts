'use client'

import { useEffect, useState } from 'react'

/** Phones / touch devices, where the landing page's heavy scroll effects (frame
 *  scrub, full-screen video blur, glass-distortion backdrop) are disabled for
 *  performance. Matches the CSS gate used in globals.css. SSR-safe: starts false
 *  and resolves on mount. */
const QUERY = '(max-width: 768px), (pointer: coarse)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}
