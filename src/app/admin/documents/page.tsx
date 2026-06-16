import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { formatDate } from '@/lib/utils'
import type { AssociatedDocument } from '@/lib/types'

export default async function AdminDocumentsPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { data: documents } = await supabase
    .from('associated_documents')
    .select('*, bids(listing_id, listings(company_name))')
    .order('uploaded_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Documents</h1>

      {!documents || documents.length === 0 ? (
        <GlassCard className="p-6 text-sm text-muted-foreground">No documents uploaded yet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {documents.map((doc: AssociatedDocument & { bids: { listings: { company_name: string } } }) => (
            <GlassCard
              key={doc.id}
              interactive
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{doc.file_name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge tone="neutral">{doc.document_type.replace(/_/g, ' ')}</Badge>
                  <span>{doc.bids?.listings?.company_name ?? '—'}</span>
                  <span>{formatDate(doc.uploaded_at)}</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
