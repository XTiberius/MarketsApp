'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ListingDocument, ListingDocType } from '@/lib/types'

const SLOTS: { type: Exclude<ListingDocType, 'other'>; label: string }[] = [
  { type: 'memorandum', label: 'Investment Memorandum' },
  { type: 'pitch_deck', label: 'Pitch Deck' },
]

/** Admin upload/replace of NDA-gated informational documents (PDF) for a listing.
 *  Mutates via FormData POST/DELETE to /api/listings/[id]/documents. */
export function ListingDocumentsManager({
  listingId,
  documents,
}: {
  listingId: string
  documents: ListingDocument[]
}) {
  const router = useRouter()

  return (
    <div className="space-y-5">
      {SLOTS.map((slot) => (
        <DocumentSlot
          key={slot.type}
          listingId={listingId}
          docType={slot.type}
          label={slot.label}
          existing={documents.find((d) => d.doc_type === slot.type) ?? null}
          onChange={() => router.refresh()}
        />
      ))}
    </div>
  )
}

function DocumentSlot({
  listingId,
  docType,
  label,
  existing,
  onChange,
}: {
  listingId: string
  docType: ListingDocType
  label: string
  existing: ListingDocument | null
  onChange: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.')
      return
    }
    setBusy(true)
    try {
      // Replace: remove the existing document first so there's one per slot.
      if (existing) {
        await fetch(`/api/listings/${listingId}/documents/${existing.id}`, {
          method: 'DELETE',
        })
      }
      const body = new FormData()
      body.append('file', file)
      body.append('doc_type', docType)
      const res = await fetch(`/api/listings/${listingId}/documents`, {
        method: 'POST',
        body,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Upload failed')
        return
      }
      onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!existing) return
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/documents/${existing.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Remove failed')
        return
      }
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {existing ? (
        <div className="glass flex items-center justify-between gap-3 rounded-xl p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.14)]">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="truncate text-sm font-medium text-foreground">
              {existing.file_name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <span className="text-muted-foreground">
            {busy ? 'Uploading…' : 'Click to upload a PDF'}
          </span>
          <span className="text-xs text-muted-foreground">PDF only</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
