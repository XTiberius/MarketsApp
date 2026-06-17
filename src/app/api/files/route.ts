import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { signedUrl } from '@/lib/storage'

/**
 * Authorized download for private documents.
 *   GET /api/files?kind=listing|bid&id=<documentId>
 *
 * Double-gated by RLS: the document-row read returns nothing unless the caller
 * is permitted (admin, NDA-signed for listing docs, or bid owner for bid docs),
 * and `createSignedUrl` itself enforces storage.objects RLS. Redirects to a 60s
 * signed URL on success; 403/404 otherwise. No public URLs are ever exposed.
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind')
  const id = searchParams.get('id')
  if (!id || (kind !== 'listing' && kind !== 'bid')) {
    return NextResponse.json({ error: 'kind (listing|bid) and id are required' }, { status: 400 })
  }

  try {
    if (kind === 'listing') {
      const { data: doc } = await supabase
        .from('listing_documents')
        .select('storage_path')
        .eq('id', id)
        .single()
      if (!doc?.storage_path) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.redirect(await signedUrl(supabase, 'listing-docs', doc.storage_path))
    }

    const { data: doc } = await supabase
      .from('associated_documents')
      .select('storage_path')
      .eq('id', id)
      .single()
    if (!doc?.storage_path) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.redirect(await signedUrl(supabase, 'documents', doc.storage_path))
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not access file' },
      { status: 403 }
    )
  }
}
