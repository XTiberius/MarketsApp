'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { SignOutButton } from './SignOutButton'

export function MobileMenu({ isSignedIn, isAdmin }: { isSignedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-16 mx-3 mt-2 flex flex-col gap-1 rounded-2xl border border-border/60 bg-[hsl(var(--popover)/0.92)] p-3 backdrop-blur-xl"
          onClick={() => setOpen(false)}
        >
          {isSignedIn ? (
            <>
              <Link href="/listings" className="rounded-lg px-3 py-2 text-sm hover:bg-muted/60">Listings</Link>
              {isAdmin && (
                <Link href="/admin/dashboard" className="rounded-lg px-3 py-2 text-sm hover:bg-muted/60">Admin</Link>
              )}
              <Link href="/bids" className="rounded-lg px-3 py-2 text-sm hover:bg-muted/60">My Bids</Link>
              <Link href="/portfolio" className="rounded-lg px-3 py-2 text-sm hover:bg-muted/60">Portfolio</Link>
              <Link href="/profile" className="rounded-lg px-3 py-2 text-sm hover:bg-muted/60">Profile</Link>
              <div className="px-3 py-2"><SignOutButton /></div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm hover:bg-muted/60">Sign in</Link>
              <Link
                href="/auth/login"
                className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
