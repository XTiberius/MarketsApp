import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Admin-only quick toggle of a listing's Active/Closed state (published ↔ closed).
 * A lightweight partial update — the full edit form uses PATCH /api/listings/[id].
 *
 *   PATCH /api/listings/[id]/status   JSON: { status: 'published' | 'closed' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const status = body?.status
  if (status !== 'published' && status !== 'closed') {
    return NextResponse.json(
      { error: 'status must be "published" or "closed"' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
