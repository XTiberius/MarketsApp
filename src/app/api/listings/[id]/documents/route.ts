import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadPrivate, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/storage'
import type { ListingDocType } from '@/lib/types'

const DOC_TYPES: ListingDocType[] = ['memorandum', 'pitch_deck', 'other']

/**
 * Admin-only upload of NDA-gated informational documents (memorandum / pitch
 * deck) to the private `listing-docs` bucket.
 *
 *   POST /api/listings/[id]/documents
 *   multipart/form-data: file (PDF), doc_type ('memorandum'|'pitch_deck'|'other')
 *
 * Stores at `{listingId}/{Date.now()}.pdf` and inserts a `listing_documents`
 * row. Returns the created row (201).
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

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const doc_type = formData.get('doc_type') as string | null

  if (!file || !doc_type) {
    return NextResponse.json(
      { error: 'file and doc_type are required' },
      { status: 400 }
    )
  }
  if (!DOC_TYPES.includes(doc_type as ListingDocType)) {
    return NextResponse.json(
      { error: 'doc_type must be "memorandum", "pitch_deck" or "other"' },
      { status: 400 }
    )
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_UPLOAD_LABEL} limit` },
      { status: 413 }
    )
  }

  const storagePath = `${listingId}/${Date.now()}.pdf`

  try {
    await uploadPrivate(supabase, 'listing-docs', storagePath, file)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('listing_documents')
    .insert({
      listing_id: listingId,
      doc_type,
      file_name: file.name,
      storage_path: storagePath,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) {
    // Roll back the orphaned storage object if the row insert fails.
    await supabase.storage.from('listing-docs').remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
