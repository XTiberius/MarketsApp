import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Admin-only removal of a per-bid document (storage object + row).
 *   DELETE /api/documents/[docId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: doc } = await supabase
    .from('associated_documents')
    .select('storage_path')
    .eq('id', docId)
    .single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (doc.storage_path) {
    const { error: removeError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path])
    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 })
    }
  }

  const { error } = await supabase.from('associated_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ message: 'Document deleted' })
}
