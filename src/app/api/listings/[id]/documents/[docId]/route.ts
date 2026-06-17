import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Admin-only removal of an informational document (storage object + row),
 * allowing a memorandum/deck to be replaced.
 *
 *   DELETE /api/listings/[id]/documents/[docId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id: listingId, docId } = await params
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

  const { data: doc } = await supabase
    .from('listing_documents')
    .select('storage_path')
    .eq('id', docId)
    .eq('listing_id', listingId)
    .single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error: removeError } = await supabase.storage
    .from('listing-docs')
    .remove([doc.storage_path])
  if (removeError) {
    return NextResponse.json({ error: removeError.message }, { status: 500 })
  }

  const { error } = await supabase.from('listing_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ message: 'Document deleted' })
}
