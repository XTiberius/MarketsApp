import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('kyc_individual')
    .upsert({ ...body, user_id: user.id, submitted_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Set kyc_status to pending on the users table
  await supabase.from('users').update({ kyc_status: 'pending' }).eq('id', user.id)

  return NextResponse.json(data, { status: 201 })
}
