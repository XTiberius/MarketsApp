'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  listingId: string
  companyName: string
}

export function DeleteListingButton({ listingId, companyName }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${companyName}"? This cannot be undone.`)) return

    setDeleting(true)
    const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })

    if (res.ok) {
      router.refresh()
      return
    }

    setDeleting(false)
    const result = await res.json().catch(() => null)
    alert(result?.error ?? 'Failed to delete listing')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  )
}
