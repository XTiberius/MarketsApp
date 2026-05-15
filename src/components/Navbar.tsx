import Link from 'next/link'
import { getServerUser } from '@/lib/auth'

export async function Navbar() {
  const user = await getServerUser()

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-base tracking-tight">
          MarketsApp
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/listings" className="text-muted-foreground hover:text-foreground transition-colors">
            Listings
          </Link>

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/bids" className="text-muted-foreground hover:text-foreground transition-colors">
                My Bids
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
