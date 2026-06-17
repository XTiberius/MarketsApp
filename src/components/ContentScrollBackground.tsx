'use client'

/**
 * Scroll-scrubbed Ionian background for the CONTENT region (below the ping-pong
 * hero). Reuses the extracted frame sequence; the frame is derived purely from
 * scroll position (no idle movement) and only redraws when that frame changes.
 * Fixed, full-bleed, behind everything — covered by the hero + its solid veil
 * until you scroll past.
 */

import { useEffect, useRef, useState } from 'react'

const FRAME_COUNT = 151
const HERO_VH = 1.8 // hero section is 180vh
const frameUrl = (i: number) => `/hero/frames/${String(i + 1).padStart(4, '0')}.jpg`

export function ContentScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let lastDrawn = -1

    // Frame from scroll position within the post-hero (content) region.
    const frameForScroll = () => {
      const heroEnd = window.innerHeight * HERO_VH
      const total = document.documentElement.scrollHeight - window.innerHeight
      const cp = Math.min(1, Math.max(0, (window.scrollY - heroEnd) / Math.max(1, total - heroEnd)))
      return Math.round(cp * (FRAME_COUNT - 1))
    }

    const pickImage = (frame: number) => {
      const exact = imagesRef.current[frame]
      if (exact?.complete && exact.naturalWidth) return exact
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = imagesRef.current[frame - d]
        if (a?.complete && a.naturalWidth) return a
        const b = imagesRef.current[frame + d]
        if (b?.complete && b.naturalWidth) return b
      }
      return null
    }

    const draw = (frame: number) => {
      const img = pickImage(frame)
      if (!img) return
      const cw = canvas.width
      const ch = canvas.height
      const ir = img.naturalWidth / img.naturalHeight
      const cr = cw / ch
      let dw: number
      let dh: number
      if (cr > ir) {
        dw = cw
        dh = cw / ir
      } else {
        dh = ch
        dw = ch * ir
      }
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    // Only redraw when the scroll-derived frame actually changes → no idle motion.
    const render = () => {
      const f = frameForScroll()
      if (f !== lastDrawn) {
        draw(f)
        lastDrawn = f
      }
    }

    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      lastDrawn = -1
      render()
    }

    const onLoad = () => {
      lastDrawn = -1
      render()
    }
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.addEventListener('load', onLoad, { once: true })
      img.src = frameUrl(i)
      imagesRef.current[i] = img
    }

    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    const tick = () => {
      render()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  if (reduced) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/hero/poster.jpg)' }}
        />
        <div className="absolute inset-0" style={{ background: 'hsl(var(--background) / 0.6)' }} />
      </div>
    )
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ filter: 'saturate(0.8) brightness(0.7) contrast(1.05)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 85% at 50% 30%, transparent 0%, hsl(var(--background) / 0.5) 75%), ' +
            'linear-gradient(to bottom, hsl(var(--background) / 0.45) 0%, hsl(var(--background) / 0.2) 45%, hsl(var(--background) / 0.7) 100%)',
        }}
      />
    </div>
  )
}
