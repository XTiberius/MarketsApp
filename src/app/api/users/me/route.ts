import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Lets the signed-in user update their own first_name / last_name.
// Only name fields are written here — role and kyc_status are never touched,
// and the users_protect_privileged_columns trigger enforces that at the DB.
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const first_name = typeof body?.first_name === 'string' ? body.first_name.trim() : ''
  const last_name = typeof body?.last_name === 'string' ? body.last_name.trim() : ''

  if (!first_name || !last_name) {
    return NextResponse.json(
      { error: 'First and last name are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('users')
    .update({ first_name, last_name })
    .eq('id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}
