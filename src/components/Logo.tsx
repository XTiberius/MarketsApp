import { useId } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  MARK_GRADIENTS,
  MARK_PATHS,
  MARK_RATIO,
  MARK_VIEWBOX,
  WORDMARK_GLYPHS,
  WORDMARK_RATIO,
  WORDMARK_VIEWBOX,
} from '@/lib/brand'

interface LogoProps {
  href?: string
  showWordmark?: boolean
  size?: number
  className?: string
}

/** The Monroe Markets wordmark, filled with `currentColor`. */
export function Wordmark({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} fill="currentColor" className={className} {...rest}>
      {WORDMARK_GLYPHS.map(({ x, d }) => (
        <path key={x} d={d} transform={x ? `translate(${x},0)` : undefined} />
      ))}
    </svg>
  )
}

/**
 * The Monroe Markets mark. Its gradient stops read `--brand-mark` / `--brand-mark-tint`
 * (globals.css): maroon → claret on the light theme, claret → tint on the dark one.
 */
function Mark({ height }: { height: number }) {
  const id = useId()
  const fade = (key: keyof typeof MARK_GRADIENTS) => `${id}-${key}`
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={Math.round(height * MARK_RATIO)}
      height={height}
      aria-hidden
      className="shrink-0"
    >
      <defs>
        {(['barA', 'barB'] as const).map((key) => (
          <linearGradient
            key={key}
            id={fade(key)}
            x1={MARK_GRADIENTS[key][0]}
            x2={MARK_GRADIENTS[key][1]}
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.05" style={{ stopColor: 'var(--brand-mark)' }} />
            <stop offset="1" style={{ stopColor: 'var(--brand-mark)', stopOpacity: 0 }} />
          </linearGradient>
        ))}
        <linearGradient
          id={fade('body')}
          x1={MARK_GRADIENTS.body[0]}
          x2={MARK_GRADIENTS.body[1]}
          y1="0"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: 'var(--brand-mark)' }} />
          <stop offset="1" style={{ stopColor: 'var(--brand-mark-tint)' }} />
        </linearGradient>
      </defs>
      <path d={MARK_PATHS.barA} fill={`url(#${fade('barA')})`} />
      <path d={MARK_PATHS.hook} style={{ fill: 'var(--brand-mark)' }} />
      <path d={MARK_PATHS.barB} fill={`url(#${fade('barB')})`} />
      <path d={MARK_PATHS.body} fill={`url(#${fade('body')})`} />
    </svg>
  )
}

/** Monroe Markets brand lockup: mark + wordmark. `size` is the mark's height in px. */
export function Logo({ href = '/', showWordmark = true, size = 30, className }: LogoProps) {
  const wordmarkHeight = size * 0.4
  const content = (
    <span
      className={cn('inline-flex max-w-full items-center text-foreground', className)}
      style={{ gap: Math.round(size / 3) }}
    >
      <Mark height={size} />
      {showWordmark && (
        <Wordmark
          width={Math.round(wordmarkHeight * WORDMARK_RATIO)}
          height={wordmarkHeight}
          role="img"
          aria-label="Monroe Markets"
          className="h-auto min-w-0 shrink"
        />
      )}
    </span>
  )

  if (!href) return content
  return (
    <Link href={href} aria-label="Monroe Markets home" className="inline-flex max-w-full items-center">
      {content}
    </Link>
  )
}
