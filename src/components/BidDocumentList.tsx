import { FileText, Download } from 'lucide-react'
import type { AssociatedDocument, DocumentType } from '@/lib/types'

// Documents the investor sees inline, in workflow order, with their labels.
const INVESTOR_DOC_GROUPS: { type: DocumentType; label: string }[] = [
  { type: 'nii', label: 'Notice of Intended Investment' },
  { type: 'investment_doc', label: 'Investment Documents' },
  { type: 'payment_instructions', label: 'Payment Instructions' },
]

function DocumentRow({ doc }: { doc: AssociatedDocument }) {
  return (
    <a
      href={`/api/files?kind=bid&id=${doc.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="glass flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.14)]">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <Download className="h-3 w-3" /> Download
      </span>
    </a>
  )
}

/** Investor-facing bid document list: grouped workflow docs, a payment-confirmation
 *  callout, and filings. Shared by My-Bids and Portfolio so both render identically. */
export function BidDocumentList({
  documents,
  paymentConfirmation,
}: {
  documents: AssociatedDocument[]
  paymentConfirmation?: string | null
}) {
  const docs = documents ?? []
  const groups = INVESTOR_DOC_GROUPS.map((g) => ({
    ...g,
    docs: docs.filter((d) => d.document_type === g.type),
  })).filter((g) => g.docs.length > 0)
  const filings = docs.filter((d) => d.document_type === 'filing')

  return (
    <>
      {groups.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          {groups.map((g) => (
            <div key={g.type} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
              {g.docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          ))}
        </div>
      )}

      {paymentConfirmation && (
        <div className="mt-5 rounded-xl border border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.12)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-success">
            Payment confirmed
          </p>
          <p className="mt-1 text-sm text-foreground">
            {paymentConfirmation}
          </p>
        </div>
      )}

      {filings.length > 0 && (
        <div className="mt-5 space-y-1.5 border-t border-border pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Filings &amp; Additional Documents
          </p>
          {filings.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </>
  )
}
