import type { Metadata } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { QueryProvider } from '@/components/QueryProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { SpaceBackground } from '@/components/SpaceBackground'

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <QueryProvider>
            <SpaceBackground />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
