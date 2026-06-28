import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-admin'
import type { AccountType } from '@/lib/types'

const VALID_ACCOUNT_TYPES: AccountType[] = ['individual', 'entity', 'both']

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const account_type: AccountType | undefined = body?.account_type
  const individual = body?.individual
  const entities = body?.entities

  if (!account_type || !VALID_ACCOUNT_TYPES.includes(account_type)) {
    return NextResponse.json({ error: 'A valid account type is required.' }, { status: 400 })
  }

  const needsIndividual = account_type === 'individual' || account_type === 'both'
  const needsEntity = account_type === 'entity' || account_type === 'both'

  if (needsIndividual && !individual) {
    return NextResponse.json({ error: 'Individual details are required.' }, { status: 400 })
  }
  if (needsEntity && (!Array.isArray(entities) || entities.length === 0)) {
    return NextResponse.json({ error: 'At least one entity is required.' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // ── Individual profile (one per account) ──
  if (needsIndividual) {
    const { error } = await supabase
      .from('kyc_individual')
      .upsert(
        { ...individual, user_id: user.id, submitted_at: now },
        { onConflict: 'user_id' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // ── Entity profiles (many per account) — replace the set on resubmit ──
  if (needsEntity) {
    const { error: delError } = await supabase
      .from('kyc_entity')
      .delete()
      .eq('user_id', user.id)
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 })

    const rows = entities.map((e: Record<string, unknown>) => ({
      ...e,
      user_id: user.id,
      submitted_at: now,
    }))
    const { error: insError } = await supabase.from('kyc_entity').insert(rows)
    if (insError) return NextResponse.json({ error: insError.message }, { status: 400 })
  }

  // ── Record intent + move the account to pending review ──
  // kyc_status is guarded by the prevent_unauthorized_user_changes trigger (004):
  // a rejected → pending transition is blocked for non-admins, so flip it with the
  // service-role client (falls back to the user client when the key is absent —
  // pending → pending is then a no-op the trigger allows).
  const admin = createServiceClient()
  const writer = admin ?? supabase
  const { error: userError } = await writer
    .from('users')
    .update({ account_type, kyc_status: 'pending' })
    .eq('id', user.id)
  if (userError) return NextResponse.json({ error: userError.message }, { status: 400 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
