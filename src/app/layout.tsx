import type { Metadata } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { QueryProvider } from '@/components/QueryProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteBackground } from '@/components/SiteBackground'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

const SITE_URL = 'https://www.ionicmarkets.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'IONIC — Venture Marketplace',
    template: '%s · IONIC',
  },
  description: 'Discover, bid on, and invest in individual startup fund listings. Accredited investors only.',
  applicationName: 'IONIC',
  openGraph: {
    type: 'website',
    siteName: 'IONIC',
    url: SITE_URL,
    title: 'IONIC — Venture Marketplace',
    description: 'Discover, bid on, and invest in individual startup fund listings. Accredited investors only.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IONIC — Venture Marketplace',
    description: 'Discover, bid on, and invest in individual startup fund listings.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Apple liquid-glass refraction — backdrop displacement, referenced by .glass */}
        <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.005 0.007" numOctaves="2" seed="7" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="1.5" result="soft" />
              <feDisplacementMap in="SourceGraphic" in2="soft" scale="80" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <QueryProvider>
            <SiteBackground />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
