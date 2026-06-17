import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Admin close/liquidate: records the realized invested/returned principal and
// marks the position closed. Does NOT change `status` — it stays 'invested'.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as {
    invested_principal: number
    returned_principal: number
  }
  const { invested_principal, returned_principal } = body

  if (
    typeof invested_principal !== 'number' ||
    typeof returned_principal !== 'number' ||
    !Number.isFinite(invested_principal) ||
    !Number.isFinite(returned_principal) ||
    invested_principal < 0 ||
    returned_principal < 0
  ) {
    return NextResponse.json(
      { error: 'Invested and returned principal must be finite numbers ≥ 0.' },
      { status: 400 }
    )
  }

  const { data: bid } = await supabase
    .from('bids')
    .select('status, portfolio_status')
    .eq('id', id)
    .single()
  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

  if (bid.status !== 'invested' || bid.portfolio_status !== 'active') {
    return NextResponse.json(
      { error: 'Only an active invested position can be closed.' },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('bids')
    .update({
      invested_principal,
      returned_principal,
      closed_at: now,
      portfolio_status: 'closed',
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}
