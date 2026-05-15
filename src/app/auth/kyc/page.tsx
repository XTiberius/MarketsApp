import { requireAuth } from '@/lib/auth'
import { KYCForm } from '@/components/KYCForm'

export default async function KycPage() {
  const user = await requireAuth()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Complete KYC Verification</h1>
      <p className="text-muted-foreground mb-8">
        To access listings and place bids, we need to verify your identity as an
        accredited investor.
      </p>
      <KYCForm userId={user.id} kycStatus={user.kyc_status} />
    </div>
  )
}
