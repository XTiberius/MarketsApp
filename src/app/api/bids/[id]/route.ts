import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { BidStatus } from '@/lib/types'

const VALID_TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  placed: ['accepted', 'rejected'],
  accepted: ['awaiting_payment'],
  awaiting_payment: ['invested'],
  invested: [],
  rejected: [],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status }: { status: BidStatus } = await req.json()

  const { data: bid } = await supabase.from('bids').select('status').eq('id', id).single()
  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[bid.status as BidStatus]
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${bid.status} to ${status}` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bids')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
