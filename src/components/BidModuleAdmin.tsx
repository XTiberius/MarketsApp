'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AssociatedDocument, Bid, BidStatus, DocumentType } from '@/lib/types'

export type AdminBid = Bid & {
  listings: { company_name: string }
  users: { email: string }
  associated_documents: AssociatedDocument[]
}

const MAX_INVESTMENT_DOCS = 4

/** Human label for each document category shown in the grouped document list. */
const DOC_LABELS: Record<DocumentType, string> = {
  nii: 'Notice of Intended Investment',
  investment_doc: 'Investment documents',
  payment_instructions: 'Payment instructions',
  filing: 'Filings & additional documents',
  investment_agreement: 'Investment agreement',
  k1: 'K-1',
  reg_d: 'Reg D',
  other: 'Other',
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

export function BidModuleAdmin({ bid: initialBid }: { bid: AdminBid }) {
  const router = useRouter()
  const [bid, setBid] = useState(initialBid)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const docs = bid.associated_documents ?? []
  const docsOf = (t: DocumentType) => docs.filter((d) => d.document_type === t)

  /** PATCH the bid status; surfaces the API error message on failure. */
  async function transition(status: BidStatus, payment_confirmation?: string) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/bids/${bid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_confirmation }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Update failed')
        return false
      }
      setBid((b) => ({ ...b, ...data }))
      router.refresh()
      return true
    } finally {
      setBusy(false)
    }
  }

  /** Upload a document; the NII upload auto-advances the bid server-side. */
  async function upload(file: File, document_type: DocumentType) {
    setError(null)
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('bid_id', bid.id)
      body.append('document_type', document_type)
      const res = await fetch('/api/documents', { method: 'POST', body })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Upload failed')
        return
      }
      // Optimistically add the new document; refresh pulls the canonical state
      // (including any server-side status change from the NII auto-advance).
      setBid((b) => ({ ...b, associated_documents: [...(b.associated_documents ?? []), data] }))
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function removeDoc(docId: string) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Remove failed')
        return
      }
      setBid((b) => ({
        ...b,
        associated_documents: (b.associated_documents ?? []).filter((d) => d.id !== docId),
      }))
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-foreground">
            {bid.listings.company_name}
          </p>
          <p className="text-sm text-muted-foreground">
            {bid.users.email} · {formatDate(bid.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-mono text-lg font-semibold text-foreground">
            {formatCurrency(bid.amount)}
          </p>
          <StatusBadge kind="bidStatus" value={bid.status} />
        </div>
      </div>

      {/* ── State-driven open action ── */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <OpenAction
          bid={bid}
          busy={busy}
          investmentDocCount={docsOf('investment_doc').length}
          onUpload={upload}
          onTransition={transition}
        />
      </div>

      {/* ── All uploaded documents, grouped by category ── */}
      <DocumentList docs={docs} busy={busy} onRemove={removeDoc} />

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Open action — what the admin can do RIGHT NOW given the bid's status.      */
/* -------------------------------------------------------------------------- */

function OpenAction({
  bid,
  busy,
  investmentDocCount,
  onUpload,
  onTransition,
}: {
  bid: AdminBid
  busy: boolean
  investmentDocCount: number
  onUpload: (file: File, t: DocumentType) => void
  onTransition: (status: BidStatus, note?: string) => Promise<boolean>
}) {
  switch (bid.status) {
    case 'placed':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload the executed Notice of Intended Investment to advance the bid.
          </p>
          <UploadDropzone
            label="Upload executed NII"
            busy={busy}
            onFile={(f) => onUpload(f, 'nii')}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onTransition('rejected')}
          >
            Reject bid
          </Button>
        </div>
      )

    case 'pending_acceptance':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The executed NII has been received. Accept or reject the bid.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => onTransition('accepted')}
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onTransition('rejected')}
            >
              Reject
            </Button>
          </div>
        </div>
      )

    case 'accepted':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload up to {MAX_INVESTMENT_DOCS} executed investment documents
            ({investmentDocCount}/{MAX_INVESTMENT_DOCS}), then mark them executed.
          </p>
          {investmentDocCount < MAX_INVESTMENT_DOCS && (
            <UploadDropzone
              label="Upload investment document"
              busy={busy}
              onFile={(f) => onUpload(f, 'investment_doc')}
            />
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy || investmentDocCount < 1}
            onClick={() => onTransition('documents_executed')}
          >
            Mark documents executed
          </Button>
        </div>
      )

    case 'documents_executed':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Investment documents are executed. Advance to awaiting payment.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => onTransition('awaiting_payment')}
          >
            Advance to Awaiting Payment
          </Button>
        </div>
      )

    case 'awaiting_payment':
      return (
        <AwaitingPaymentAction busy={busy} onUpload={onUpload} onTransition={onTransition} />
      )

    case 'invested':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Investment complete. Upload post-investment filings (K-1s, etc.) below.
          </p>
          <UploadDropzone
            label="Upload filing"
            busy={busy}
            onFile={(f) => onUpload(f, 'filing')}
          />
        </div>
      )

    case 'rejected':
      return <p className="text-sm text-muted-foreground">This bid was rejected.</p>

    default:
      return null
  }
}

function AwaitingPaymentAction({
  busy,
  onUpload,
  onTransition,
}: {
  busy: boolean
  onUpload: (file: File, t: DocumentType) => void
  onTransition: (status: BidStatus, note?: string) => Promise<boolean>
}) {
  const [note, setNote] = useState('')
  const words = wordCount(note)
  const tooLong = words > 100

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Payment instructions (PDF)</Label>
        <UploadDropzone
          label="Upload payment instructions"
          accept="application/pdf"
          busy={busy}
          onFile={(f) => onUpload(f, 'payment_instructions')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment-note">Confirm payment received</Label>
        <Textarea
          id="payment-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Short note confirming payment was received (≤100 words)…"
          disabled={busy}
        />
        <div className="flex items-center justify-between">
          <span className={tooLong ? 'text-xs text-danger' : 'text-xs text-muted-foreground'}>
            {words}/100 words
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy || words < 1 || tooLong}
            onClick={async () => {
              const ok = await onTransition('invested', note.trim())
              if (ok) setNote('')
            }}
          >
            Confirm payment received
          </Button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Reusable upload dropzone (mirrors ListingDocumentsManager styling).        */
/* -------------------------------------------------------------------------- */

function UploadDropzone({
  label,
  accept,
  busy,
  onFile,
}: {
  label: string
  accept?: string
  busy: boolean
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!busy && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        <span className="text-muted-foreground">{busy ? 'Uploading…' : label}</span>
        {accept === 'application/pdf' && (
          <span className="text-xs text-muted-foreground">PDF only</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Grouped document list with download + remove.                             */
/* -------------------------------------------------------------------------- */

const DOC_GROUP_ORDER: DocumentType[] = [
  'nii',
  'investment_doc',
  'payment_instructions',
  'filing',
]

function DocumentList({
  docs,
  busy,
  onRemove,
}: {
  docs: AssociatedDocument[]
  busy: boolean
  onRemove: (docId: string) => void
}) {
  if (docs.length === 0) return null

  // Group by category, keeping the workflow order then any leftover types.
  const types = [
    ...DOC_GROUP_ORDER.filter((t) => docs.some((d) => d.document_type === t)),
    ...Array.from(new Set(docs.map((d) => d.document_type))).filter(
      (t) => !DOC_GROUP_ORDER.includes(t)
    ),
  ]

  return (
    <div className="space-y-3">
      {types.map((type) => {
        const group = docs.filter((d) => d.document_type === type)
        if (group.length === 0) return null
        return (
          <div key={type} className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {DOC_LABELS[type]}
            </p>
            {group.map((doc) => (
              <div
                key={doc.id}
                className="glass flex items-center justify-between gap-3 rounded-xl p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.14)]">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">
                    {doc.file_name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <a
                    href={`/api/files?kind=bid&id=${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemove(doc.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
