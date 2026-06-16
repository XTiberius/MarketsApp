import { requireAuth } from '@/lib/auth'
import { KYCForm } from '@/components/KYCForm'
import { Logo } from '@/components/Logo'
import { GlassCard } from '@/components/ui/glass-card'

export default async function KycPage() {
  const user = await requireAuth()

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-2xl p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Logo href={undefined} size={40} />
          <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
            Complete KYC Verification
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            To access listings and place bids, we need to verify your identity as an
            accredited investor.
          </p>
        </div>
        <div className="mt-8">
          <KYCForm userId={user.id} kycStatus={user.kyc_status} />
        </div>
      </GlassCard>
    </div>
  )
}
