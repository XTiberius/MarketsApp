import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { KYCForm } from '@/components/KYCForm'
import { Logo } from '@/components/Logo'
import { GlassCard } from '@/components/ui/glass-card'

export default async function KycPage() {
  const user = await requireAuth()
  // Nothing to do here for admins or approved investors.
  if (user.role === 'admin' || user.kyc_status === 'approved') redirect('/listings')

  const supabase = await createServerSupabaseClient()
  const { data: kycIndividual } = await supabase
    .from('kyc_individual')
    .select('admin_notes')
    .eq('user_id', user.id)
    .maybeSingle()

  // account_type is written on the first submission, so a pending account
  // without one has not applied yet (new accounts start as pending).
  const submitted = user.account_type !== null
  const underReview = user.kyc_status === 'pending' && submitted
  const rejected = user.kyc_status === 'rejected'

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-2xl p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Logo href={undefined} size={40} />
          <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
            {underReview ? 'Application under review' : 'Complete your investor application'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {underReview
              ? 'Thanks — we have everything we need for now.'
              : 'Monroe Markets is open to accredited investors only. Tell us about yourself and how you intend to invest. You will have access to listings once our team has approved your application.'}
          </p>
        </div>

        {rejected && kycIndividual?.admin_notes && (
          <div className="mt-8 rounded-xl border border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.12)] p-4 text-sm text-danger">
            <p className="font-medium">Your previous application was not approved.</p>
            <p className="mt-1">{kycIndividual.admin_notes}</p>
            <p className="mt-2 text-xs opacity-80">Update the details below and resubmit.</p>
          </div>
        )}

        <div className="mt-8">
          <KYCForm
            userId={user.id}
            kycStatus={user.kyc_status}
            submitted={submitted}
            email={user.email}
            firstName={user.first_name}
            lastName={user.last_name}
          />
        </div>
      </GlassCard>
    </div>
  )
}
