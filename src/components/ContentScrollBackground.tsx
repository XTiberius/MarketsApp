'use client'

/**
 * Scroll-scrubbed Ionian background for the CONTENT region (below the ping-pong
 * hero). Reuses the extracted frame sequence; the frame is derived purely from
 * scroll position (no idle movement) and only redraws when that frame changes.
 * Fixed, full-bleed, behind everything — covered by the hero + its solid veil
 * until you scroll past.
 */

import { useEffect, useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const FRAME_COUNT = 151
const HERO_VH = 1.8 // hero section is 180vh
const frameUrl = (i: number) => `/hero/frames/${String(i + 1).padStart(4, '0')}.jpg`

export function ContentScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [reduced, setReduced] = useState(false)
  const isMobile = useIsMobile()

  // Only reduced-motion gets the static poster. Mobile keeps the scroll-scrub but
  // runs a lighter version (fewer frames + lower canvas resolution) so it animates
  // without the original decode/draw cost. Desktop is unchanged.
  const inert = reduced

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (inert) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Mobile: cap pixel ratio at 1 (phones are 2–3×) and load every Nth frame to
    // cut decode + per-scroll draw cost. Desktop: full ratio + every frame.
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2)
    const stride = isMobile ? 4 : 1
    let lastDrawn = -1

    // Scroll metrics are cached and recomputed on resize, not read per frame
    // (reading scrollHeight forces layout).
    let heroEnd = 0
    let denom = 1
    const measure = () => {
      heroEnd = window.innerHeight * HERO_VH
      const total = document.documentElement.scrollHeight - window.innerHeight
      denom = Math.max(1, total - heroEnd)
    }

    // Frame from scroll position within the post-hero (content) region.
    const frameForScroll = () => {
      const cp = Math.min(1, Math.max(0, (window.scrollY - heroEnd) / denom))
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
      measure()
      lastDrawn = -1
      render()
    }

    const onLoad = () => {
      lastDrawn = -1
      render()
    }
    // Load every `stride`-th frame (always including the last). pickImage() falls
    // back to the nearest loaded frame, so a sparse set just yields a coarser scrub.
    const load = (i: number) => {
      if (imagesRef.current[i]) return
      const img = new Image()
      img.addEventListener('load', onLoad, { once: true })
      img.src = frameUrl(i)
      imagesRef.current[i] = img
    }
    for (let i = 0; i < FRAME_COUNT; i += stride) load(i)
    load(FRAME_COUNT - 1)

    resize()
    window.addEventListener('resize', resize)

    // Only do work while actually scrolling — one rAF per scroll burst, nothing
    // at idle (replaces the previous always-on 60fps loop).
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        render()
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [inert, isMobile])

  if (inert) {
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
