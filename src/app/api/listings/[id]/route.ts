import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isValidHttpUrl } from '@/lib/utils'

const LISTING_TYPES = ['primary', 'secondary']
const LISTING_STATUSES = ['draft', 'published', 'closed']

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ message: 'Listing deleted' })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

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
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const company_name = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const industry = typeof body.industry === 'string' ? body.industry.trim() : ''
  const nda_text = typeof body.nda_text === 'string' ? body.nda_text.trim() : ''
  const status = typeof body.status === 'string' ? body.status : 'draft'

  if (!company_name || !description || !industry || !nda_text) {
    return NextResponse.json(
      { error: 'company_name, description, industry and nda_text are required' },
      { status: 400 }
    )
  }
  if (!LISTING_TYPES.includes(body.listing_type)) {
    return NextResponse.json(
      { error: 'listing_type must be "primary" or "secondary"' },
      { status: 400 }
    )
  }
  if (!LISTING_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const logo_url =
    typeof body.logo_url === 'string' && body.logo_url.trim() ? body.logo_url.trim() : null
  if (logo_url && !isValidHttpUrl(logo_url)) {
    return NextResponse.json(
      { error: 'logo_url must be a full URL starting with http:// or https://' },
      { status: 400 }
    )
  }

  const valuation =
    body.valuation == null || body.valuation === '' ? null : Number(body.valuation)
  const amount_raised =
    body.amount_raised == null || body.amount_raised === '' ? null : Number(body.amount_raised)
  for (const [label, n] of [
    ['valuation', valuation],
    ['amount_raised', amount_raised],
  ] as const) {
    if (n !== null && (!Number.isFinite(n) || n < 0)) {
      return NextResponse.json(
        { error: `${label} must be a non-negative number` },
        { status: 400 }
      )
    }
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      company_name,
      description,
      industry,
      listing_type: body.listing_type,
      status,
      nda_text,
      logo_url,
      valuation,
      amount_raised,
      investment_structure:
        typeof body.investment_structure === 'string' && body.investment_structure.trim()
          ? body.investment_structure.trim()
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
