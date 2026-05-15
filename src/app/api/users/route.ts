import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { KycStatus } from '@/lib/types'

// Admin: update a user's KYC status
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is admin
  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, kyc_status, admin_notes } = await req.json() as {
    user_id: string
    kyc_status: KycStatus
    admin_notes?: string
  }

  const { error } = await supabase
    .from('users')
    .update({ kyc_status })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Record review timestamp and notes
  await supabase
    .from('kyc_individual')
    .update({ reviewed_at: new Date().toISOString(), admin_notes: admin_notes ?? null })
    .eq('user_id', user_id)

  return NextResponse.json({ message: 'KYC status updated' })
}
