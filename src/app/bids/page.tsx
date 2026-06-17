import Link from 'next/link'
import { Gavel, FileText, Download } from 'lucide-react'
import { requireKycApproved } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BidTimeline } from '@/components/BidTimeline'
import type { AssociatedDocument, Bid, DocumentType, Listing } from '@/lib/types'

type BidWithListing = Bid & {
  listings: Pick<Listing, 'company_name' | 'industry'>
  associated_documents: AssociatedDocument[]
}

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

export default async function BidsPage() {
  const user = await requireKycApproved()
  const supabase = await createServerSupabaseClient()

  const { data: bids } = await supabase
    .from('bids')
    .select('*, listings(company_name, industry), associated_documents(*)')
    .eq('investor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-8">My Bids</h1>

      {!bids || bids.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)] text-primary">
            <Gavel className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-medium">No bids yet</p>
            <p className="text-sm text-muted-foreground">
              When you place a bid on a listing, you&apos;ll be able to track its
              progress here.
            </p>
          </div>
          <Button asChild variant="primary">
            <Link href="/listings">Browse listings</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {bids.map((bid: BidWithListing) => (
            <GlassCard key={bid.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold leading-tight">
                    {bid.listings.company_name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bid.listings.industry} · {formatDate(bid.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-mono text-lg font-semibold">
                    {formatCurrency(bid.amount)}
                  </p>
                  <StatusBadge kind="bidStatus" value={bid.status} />
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <BidTimeline status={bid.status} />
              </div>

              {(() => {
                const docs = bid.associated_documents ?? []
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

                    {bid.payment_confirmation && (
                      <div className="mt-5 rounded-xl border border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.12)] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-success">
                          Payment confirmed
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {bid.payment_confirmation}
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
              })()}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
