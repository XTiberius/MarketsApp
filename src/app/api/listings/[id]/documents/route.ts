import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ListingDocType } from '@/lib/types'

const DOC_TYPES: ListingDocType[] = ['memorandum', 'pitch_deck', 'other']

/**
 * Admin-only: record an NDA-gated informational document (memorandum / pitch
 * deck) for a listing. The PDF is uploaded to the private `listing-docs` bucket
 * DIRECTLY from the browser (storage.objects RLS authorizes the admin), so large
 * decks bypass the serverless request-body limit. This route only persists the
 * metadata.
 *
 *   POST /api/listings/[id]/documents
 *   JSON: { doc_type, storage_path, file_name }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const doc_type = body?.doc_type as string | undefined
  const storage_path = typeof body?.storage_path === 'string' ? body.storage_path : ''
  const file_name = typeof body?.file_name === 'string' ? body.file_name : ''

  if (!doc_type || !storage_path || !file_name) {
    return NextResponse.json(
      { error: 'doc_type, storage_path, and file_name are required' },
      { status: 400 }
    )
  }
  if (!DOC_TYPES.includes(doc_type as ListingDocType)) {
    return NextResponse.json(
      { error: 'doc_type must be "memorandum", "pitch_deck" or "other"' },
      { status: 400 }
    )
  }
  // The uploaded object must live under this listing's folder.
  if (!storage_path.startsWith(`${listingId}/`)) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('listing_documents')
    .insert({
      listing_id: listingId,
      doc_type,
      file_name,
      storage_path,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data, { status: 201 })
}
