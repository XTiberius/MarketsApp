import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Admin-only removal of a funding round (scoped to its listing).
 *
 *   DELETE /api/listings/[id]/rounds/[roundId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const { id: listingId, roundId } = await params
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

  const { error } = await supabase
    .from('funding_rounds')
    .delete()
    .eq('id', roundId)
    .eq('listing_id', listingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ message: 'Round deleted' })
}
