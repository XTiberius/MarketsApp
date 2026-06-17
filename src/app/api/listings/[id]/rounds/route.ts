import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Admin-only creation of a funding round for a listing.
 *
 *   POST /api/listings/[id]/rounds
 *   JSON: { round_name: string, valuation: number, event_date?: string }
 *
 * Appends the round at the next sequence_order (current max + 1, or 0 for the
 * first round) and returns the created row (201).
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
  const round_name = typeof body?.round_name === 'string' ? body.round_name.trim() : ''
  const valuation = typeof body?.valuation === 'number' ? body.valuation : Number(body?.valuation)
  const event_date =
    typeof body?.event_date === 'string' && body.event_date.trim()
      ? body.event_date.trim()
      : null

  if (!round_name) {
    return NextResponse.json({ error: 'round_name is required' }, { status: 400 })
  }
  if (!Number.isFinite(valuation) || valuation < 0) {
    return NextResponse.json(
      { error: 'valuation must be a non-negative number' },
      { status: 400 }
    )
  }

  // Append at the end: next sequence_order is the current max + 1 (or 0).
  const { data: last } = await supabase
    .from('funding_rounds')
    .select('sequence_order')
    .eq('listing_id', listingId)
    .order('sequence_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sequence_order = last ? last.sequence_order + 1 : 0

  const { data, error } = await supabase
    .from('funding_rounds')
    .insert({
      listing_id: listingId,
      round_name,
      valuation,
      event_date,
      sequence_order,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data, { status: 201 })
}
