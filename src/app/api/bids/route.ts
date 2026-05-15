import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const MIN_BID = 50_000

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bids')
    .select('*, listings(company_name, industry)')
    .eq('investor_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id, amount } = await req.json()

  if (!listing_id || !amount) {
    return NextResponse.json({ error: 'listing_id and amount are required' }, { status: 400 })
  }

  if (amount < MIN_BID) {
    return NextResponse.json({ error: `Minimum bid is $${MIN_BID.toLocaleString()}` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bids')
    .insert({ investor_id: user.id, listing_id, amount, status: 'placed' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
