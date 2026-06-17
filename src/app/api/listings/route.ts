import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isValidHttpUrl } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'published'

  const { data, error } = await supabase
    .from('listings')
    .select('id, admin_id, company_name, logo_url, description, listing_type, industry, status, created_at, updated_at')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

const LISTING_TYPES = ['primary', 'secondary']
const LISTING_STATUSES = ['draft', 'published', 'closed']

export async function POST(req: NextRequest) {
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
  const minimum_investment =
    body.minimum_investment == null || body.minimum_investment === ''
      ? null
      : Number(body.minimum_investment)
  for (const [label, n] of [
    ['valuation', valuation],
    ['amount_raised', amount_raised],
    ['minimum_investment', minimum_investment],
  ] as const) {
    if (n !== null && (!Number.isFinite(n) || n < 0)) {
      return NextResponse.json(
        { error: `${label} must be a non-negative number` },
        { status: 400 }
      )
    }
  }

  // Only known columns are inserted — never spread the raw body.
  const { data, error } = await supabase
    .from('listings')
    .insert({
      admin_id: user.id,
      company_name,
      description,
      industry,
      listing_type: body.listing_type,
      status,
      nda_text,
      logo_url,
      valuation,
      amount_raised,
      minimum_investment,
      investment_structure:
        typeof body.investment_structure === 'string' && body.investment_structure.trim()
          ? body.investment_structure.trim()
          : null,
      ai_newsfeed_enabled: body.ai_newsfeed_enabled === true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
