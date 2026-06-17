'use client'

import { useEffect } from 'react'

/**
 * Apple-style pointer-reactive glass: tracks the cursor over any `.glass`
 * surface and writes its local position to --gx/--gy, which the glass utility's
 * specular highlight follows. One passive listener; mount once on the page.
 */
export function GlassPointer() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('.glass') as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return null
}
