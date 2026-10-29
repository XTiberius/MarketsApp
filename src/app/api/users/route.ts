import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { renderEmail, sendEmail } from '@/lib/email'
import type { KycStatus } from '@/lib/types'

const SITE_URL = 'https://www.monroemarkets.com'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

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

  const { data: target } = await supabase
    .from('users')
    .select('email, first_name, account_type')
    .eq('id', user_id)
    .maybeSingle()
  if (!target) {
    return NextResponse.json({ error: 'That user does not exist.' }, { status: 404 })
  }

  // An account must hold the KYC records its account type implies before it can
  // be approved. Approving an empty account produced a user that reads as
  // verified while having no party to bid as — see lib/end-users.ts.
  if (kyc_status === 'approved') {
    const [individual, entities] = await Promise.all([
      supabase.from('kyc_individual').select('id').eq('user_id', user_id).maybeSingle(),
      supabase.from('kyc_entity').select('id').eq('user_id', user_id).limit(1),
    ])

    const accountType = target.account_type
    const hasIndividual = !!individual.data
    const hasEntity = (entities.data?.length ?? 0) > 0

    const missing: string[] = []
    if ((accountType === 'individual' || accountType === 'both') && !hasIndividual) {
      missing.push('individual KYC details')
    }
    if ((accountType === 'entity' || accountType === 'both') && !hasEntity) {
      missing.push('at least one entity')
    }
    // account_type is written on the first submission; an account with none and
    // no records has never applied.
    const nothingSubmitted = !accountType && !hasIndividual && !hasEntity

    if (nothingSubmitted || missing.length > 0) {
      const reason = nothingSubmitted
        ? 'it has no KYC submission'
        : `it is missing ${missing.join(' and ')}`
      return NextResponse.json(
        { error: `Cannot approve this account: ${reason}. Ask the holder to complete KYC first.` },
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

  // Tell the applicant. The platform is closed to them until approval, and the
  // application page promises this email. sendEmail never throws and no-ops
  // without RESEND_API_KEY.
  if (kyc_status === 'approved') {
    await sendEmail(
      [target.email],
      'Your Monroe Markets application is approved',
      renderEmail({
        firstName: target.first_name,
        eyebrow: 'Investor application',
        heading: "You're approved",
        lines: [
          'Your investor application has been reviewed and approved. You now have full access to Monroe Markets.',
          `<a href="${SITE_URL}/listings" style="color:#D98AA3;">Browse current listings</a>`,
        ],
      })
    )
  } else if (kyc_status === 'rejected') {
    const notes = admin_notes?.trim()
    await sendEmail(
      [target.email],
      'Your Monroe Markets application needs attention',
      renderEmail({
        firstName: target.first_name,
        eyebrow: 'Investor application',
        heading: "We couldn't approve your application yet",
        lines: [
          'Our team has reviewed your investor application and could not approve it as submitted.',
          ...(notes ? [`<strong>Reviewer notes:</strong> ${escapeHtml(notes)}`] : []),
          `<a href="${SITE_URL}/auth/kyc" style="color:#D98AA3;">Update and resubmit your application</a>`,
        ],
      })
    )
  }

  return NextResponse.json({ message: 'KYC status updated' })
}
