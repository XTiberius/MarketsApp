import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const DEFAULT_MIN_BID = 50_000

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

  const { listing_id, amount, investor_kind, entity_id } = await req.json()

  if (!listing_id || !amount) {
    return NextResponse.json({ error: 'listing_id and amount are required' }, { status: 400 })
  }

  if (investor_kind !== 'individual' && investor_kind !== 'entity') {
    return NextResponse.json({ error: 'A valid end-user is required.' }, { status: 400 })
  }

  // Validate the chosen end-user belongs to this account.
  if (investor_kind === 'individual') {
    const { data: ind } = await supabase
      .from('kyc_individual')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!ind) {
      return NextResponse.json(
        { error: 'No individual profile found for your account.' },
        { status: 400 }
      )
    }
  } else {
    if (!entity_id) {
      return NextResponse.json({ error: 'entity_id is required for an entity bid.' }, { status: 400 })
    }
    const { data: ent } = await supabase
      .from('kyc_entity')
      .select('id')
      .eq('id', entity_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!ent) {
      return NextResponse.json(
        { error: 'That entity does not belong to your account.' },
        { status: 400 }
      )
    }
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('minimum_investment, status')
    .eq('id', listing_id)
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if (listing.status !== 'published') {
    return NextResponse.json(
      { error: 'This listing is closed to new bids.' },
      { status: 400 }
    )
  }

  const minBid = listing.minimum_investment ?? DEFAULT_MIN_BID
  if (amount < minBid) {
    return NextResponse.json(
      { error: `Minimum bid is $${minBid.toLocaleString()}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('bids')
    .insert({
      investor_id: user.id,
      listing_id,
      amount,
      status: 'placed',
      investor_kind,
      entity_id: investor_kind === 'entity' ? entity_id : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
