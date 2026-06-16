import Link from 'next/link'
import { User } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SignOutButton } from '@/components/SignOutButton'
import { MobileMenu } from '@/components/MobileMenu'
import { Button } from '@/components/ui/button'

const navLink =
  'rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50'

export async function Navbar() {
  const user = await getServerUser()
  const isAdmin = user?.role === 'admin'

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[hsl(var(--background)/0.6)] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <div className="hidden items-center gap-1 text-sm md:flex">
          {user && (
            <Link href="/listings" className={navLink}>
              Listings
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className={navLink}>
              Admin
            </Link>
          )}
          {user && (
            <Link href="/bids" className={navLink}>
              My Bids
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/profile"
                aria-label="Profile"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
              >
                <User className="h-4 w-4" />
              </Link>
              <div className="hidden md:block">
                <SignOutButton />
              </div>
            </>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )}
          <MobileMenu isSignedIn={!!user} isAdmin={isAdmin} />
        </div>
      </nav>
    </header>
  )
}
