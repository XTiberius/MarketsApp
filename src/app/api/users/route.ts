import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
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

  // An account must hold the KYC records its account type implies before it can
  // be approved. Approving an empty account produced a user that reads as
  // verified while having no party to bid as — see lib/end-users.ts.
  if (kyc_status === 'approved') {
    const [target, individual, entities] = await Promise.all([
      supabase.from('users').select('account_type').eq('id', user_id).maybeSingle(),
      supabase.from('kyc_individual').select('id').eq('user_id', user_id).maybeSingle(),
      supabase.from('kyc_entity').select('id').eq('user_id', user_id).limit(1),
    ])

    if (!target.data) {
      return NextResponse.json({ error: 'That user does not exist.' }, { status: 404 })
    }

    const accountType = target.data.account_type
    const hasIndividual = !!individual.data
    const hasEntity = (entities.data?.length ?? 0) > 0

    const missing: string[] = []
    if ((accountType === 'individual' || accountType === 'both') && !hasIndividual) {
      missing.push('individual KYC details')
    }
    if ((accountType === 'entity' || accountType === 'both') && !hasEntity) {
      missing.push('at least one entity')
    }
    // Accounts predating account_type (018) have none; require any submission.
    if (!accountType && !hasIndividual && !hasEntity) {
      missing.push('a KYC submission')
    }

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot approve this account: it has no ${missing.join(' and no ')}. ` +
            'Ask the holder to complete KYC first.',
        },
        { status: 400 }
      )
    }
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
