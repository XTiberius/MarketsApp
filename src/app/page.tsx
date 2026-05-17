import Link from 'next/link'
import { getServerUser } from '@/lib/auth'

export default async function HomePage() {
  const user = await getServerUser()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Venture Marketplace
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Discover, bid on, and invest in individual startup fund listings.
        Accredited investors only.
      </p>
      <div className="flex gap-4">
        <Link
          href="/listings"
          className="px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          Browse Listings
        </Link>
        {!user && (
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  )
}
