import { ImageResponse } from 'next/og'
import {
  MARK_GRADIENTS,
  MARK_PATHS,
  MARK_RATIO,
  MARK_VIEWBOX,
  WORDMARK_GLYPHS,
  WORDMARK_RATIO,
  WORDMARK_VIEWBOX,
} from '@/lib/brand'

export const runtime = 'edge'

export const alt = 'Monroe Markets - Private capital evolved'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Satori renders inline <svg> as an image, so the mark and wordmark are drawn
// from their raw paths (no <use>, no web fonts). Dark-surface variant: claret → tint.
const CLARET = '#A8405F'
const TINT = '#D98AA3'
const IVORY = '#F3F0EA'

const MARK_HEIGHT = 96
const WORDMARK_HEIGHT = 40

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '84px 96px',
          color: IVORY,
          background: 'linear-gradient(135deg, #0A0710 0%, #151020 100%)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        <svg
          viewBox={MARK_VIEWBOX}
          width={Math.round(MARK_HEIGHT * MARK_RATIO)}
          height={MARK_HEIGHT}
        >
          <defs>
            <linearGradient
              id="og-a"
              x1={MARK_GRADIENTS.barA[0]}
              x2={MARK_GRADIENTS.barA[1]}
              y1="0"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.05" stopColor={CLARET} />
              <stop offset="1" stopColor={CLARET} stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="og-b"
              x1={MARK_GRADIENTS.barB[0]}
              x2={MARK_GRADIENTS.barB[1]}
              y1="0"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.05" stopColor={CLARET} />
              <stop offset="1" stopColor={CLARET} stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="og-c"
              x1={MARK_GRADIENTS.body[0]}
              x2={MARK_GRADIENTS.body[1]}
              y1="0"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor={CLARET} />
              <stop offset="1" stopColor={TINT} />
            </linearGradient>
          </defs>
          <path d={MARK_PATHS.barA} fill="url(#og-a)" />
          <path d={MARK_PATHS.hook} fill={CLARET} />
          <path d={MARK_PATHS.barB} fill="url(#og-b)" />
          <path d={MARK_PATHS.body} fill="url(#og-c)" />
        </svg>
        <svg
          viewBox={WORDMARK_VIEWBOX}
          width={Math.round(WORDMARK_HEIGHT * WORDMARK_RATIO)}
          height={WORDMARK_HEIGHT}
          style={{ marginTop: 40 }}
        >
          {WORDMARK_GLYPHS.map(({ x, d }) => (
            <path key={x} d={d} fill={IVORY} transform={`translate(${x},0)`} />
          ))}
        </svg>
        <div
          style={{
            marginTop: 56,
            fontSize: 48,
            lineHeight: 1.1,
            fontWeight: 600,
          }}
        >
          Private capital evolved
        </div>
      </div>
    ),
    size
  )
}
