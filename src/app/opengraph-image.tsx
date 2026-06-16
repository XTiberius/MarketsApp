import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'IONIC - Invest beyond the public markets'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

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
          color: '#ffffff',
          background:
            'linear-gradient(135deg, #0b0814 0%, #17102b 42%, #4c1d95 72%, #7c4dff 100%)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 132,
            lineHeight: 0.9,
            fontWeight: 800,
            letterSpacing: 0,
          }}
        >
          IONIC
        </div>
        <div
          style={{
            marginTop: 42,
            fontSize: 48,
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          Invest beyond the public markets
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            lineHeight: 1.2,
            color: 'rgba(255,255,255,0.78)',
          }}
        >
          Accredited investors only
        </div>
      </div>
    ),
    size
  )
}
