'use client'

import { useRef } from 'react'
import { useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'

/**
 * Bottom-anchored gradient veil that strengthens over the last ~20% of page
 * scroll, dissolving the storm + content into a deep calm tone before the footer.
 * Opacity is set imperatively from scroll progress (robust, no render-loop dep).
 */
export function ScrollOutro() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!ref.current) return
    ref.current.style.opacity = String(Math.min(1, Math.max(0, (p - 0.8) / 0.2)))
  })

  if (reduce) return null

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ opacity: 0 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[15] h-[70vh]"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.4) 45%, hsl(var(--background) / 0.85) 78%, hsl(var(--background)) 100%)',
        }}
      />
    </div>
  )
}
