import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
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
      <h1 className="text-2xl font-bold mb-8">Documents</h1>

      {!documents || documents.length === 0 ? (
        <p className="text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {documents.map((doc: AssociatedDocument & { bids: { listings: { company_name: string } } }) => (
            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/40">
              <div>
                <p className="font-medium">{doc.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.document_type} · {doc.bids?.listings?.company_name ?? '—'} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline text-foreground"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
