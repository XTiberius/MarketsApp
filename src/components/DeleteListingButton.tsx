'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

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
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
