'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { useIsMobile } from '@/hooks/useIsMobile'

const MOTTO = 'Your guide to private markets'

/**
 * Top hero: a seamless ping-pong video auto-loops (no scroll needed); the IONIC
 * wordmark settles in on load. As you scroll through the tall section, the video
 * blurs and a dark gradient fills from the bottom until the viewport is fully
 * solid --background — the separator before the scroll-scrub content begins.
 *
 * Desktop is unchanged. On mobile the scroll-driven video blur is dropped (a
 * full-screen playing-video repaint is the main scroll-jank source there), and
 * autoplay is made robust: the `muted` DOM *property* is set imperatively (React
 * doesn't reliably apply the `muted` attribute, which iOS requires for inline
 * autoplay), with a tap-to-play fallback when a device still blocks it.
 */
export function HeroPingPong() {
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const gradRef = useRef<HTMLDivElement>(null)
  const solidRef = useRef<HTMLDivElement>(null)
  const [needsTap, setNeedsTap] = useState(false)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const clamp = (v: number) => Math.min(1, Math.max(0, v))

  // Robust autoplay. Pause is intentional only for a deliberate desktop
  // reduced-motion preference; on mobile (where Low Power Mode also forces
  // reduced-motion) we always try to play so the hero isn't a dead poster.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.playsInline = true
    if (reduce && !isMobile) {
      v.pause()
      return
    }
    const p = v.play()
    if (p) p.then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
  }, [reduce, isMobile])

  function handleTap() {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.play().then(() => setNeedsTap(false)).catch(() => {})
  }

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    // Deliberate desktop reduced-motion: leave everything at rest (poster).
    if (reduce && !isMobile) return
    // Video blur scrub is desktop-only — the costly repaint on mobile.
    if (!isMobile && videoRef.current) {
      videoRef.current.style.filter = `blur(${(p * 26).toFixed(1)}px) saturate(115%) brightness(0.85)`
    }
    if (textRef.current) {
      const t = clamp(p / 0.35)
      textRef.current.style.opacity = String(1 - t)
      textRef.current.style.transform = `translateY(${(-t * 26).toFixed(1)}px)`
    }
    if (gradRef.current) gradRef.current.style.opacity = String(clamp((p - 0.1) / 0.55))
    if (solidRef.current) solidRef.current.style.opacity = String(clamp((p - 0.6) / 0.32))
  })

  return (
    <section ref={sectionRef} className="relative h-[180vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'saturate(115%) brightness(0.85)' }}
          src="/hero/pingpong.mp4?v=2"
          poster="/hero/pingpong-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {/* gentle scrim for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(120% 80% at 50% 38%, transparent 0%, hsl(var(--background) / 0.38) 82%)',
          }}
        />

        {/* tap-to-play fallback when a device blocks autoplay (e.g. Low Power Mode) */}
        {needsTap && (
          <button
            type="button"
            onClick={handleTap}
            aria-label="Play background video"
            className="absolute inset-0 z-30 flex items-center justify-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/30 backdrop-blur-sm">
              <Play className="h-7 w-7 translate-x-0.5 text-white" />
            </span>
          </button>
        )}

        {/* IONIC intro text (settles in on load, fades out on scroll) */}
        <div ref={textRef} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-6xl font-semibold tracking-tight sm:text-8xl">
            <span className="ionic-settle inline-block">IONIC</span>
          </h1>
          <p className="ionic-settle mt-5 font-display text-xl text-foreground/85 sm:text-2xl">{MOTTO}</p>
        </div>

        {/* scroll-exit: gradient fills from the bottom, then a full solid veil */}
        <div
          ref={gradRef}
          className="absolute inset-0 z-20"
          style={{
            opacity: 0,
            background:
              'linear-gradient(to bottom, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.5) 45%, hsl(var(--background)) 88%)',
          }}
        />
        <div ref={solidRef} className="absolute inset-0 z-20" style={{ opacity: 0, background: 'hsl(var(--background))' }} />
      </div>
    </section>
  )
}
