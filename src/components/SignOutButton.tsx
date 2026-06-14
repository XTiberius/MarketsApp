'use client'

import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      Sign Out
    </button>
  )
}
