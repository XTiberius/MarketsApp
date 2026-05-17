import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import { KYCForm } from '@/components/KYCForm'

const KYC_STATUS_LABELS = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = await createServerSupabaseClient()

  const { data: kycIndividual } = await supabase
    .from('kyc_individual')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Account Info */}
      <div className="rounded-lg border border-border p-6 space-y-3">
        <div>
          <h1 className="text-2xl font-bold">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="text-sm space-y-1 pt-3 border-t border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span>{formatDate(user.created_at)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">KYC Status</span>
            <span className={`text-xs border rounded px-2 py-0.5 ${
              user.kyc_status === 'approved'
                ? 'border-green-500 text-green-700'
                : user.kyc_status === 'rejected'
                  ? 'border-red-500 text-red-700'
                  : 'border-border'
            }`}>
              {KYC_STATUS_LABELS[user.kyc_status]}
            </span>
          </div>
        </div>
      </div>

      {/* KYC Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">KYC Information</h2>
        {kycIndividual ? (
          <div className="rounded-lg border border-border p-6 text-sm space-y-2">
            <p><span className="text-muted-foreground">Name:</span> {kycIndividual.first_name} {kycIndividual.last_name}</p>
            <p><span className="text-muted-foreground">Submitted:</span> {kycIndividual.submitted_at ? formatDate(kycIndividual.submitted_at) : '—'}</p>
            {user.kyc_status === 'rejected' && kycIndividual.admin_notes && (
              <div className="mt-3 p-3 bg-red-50 rounded text-red-700 text-xs">
                <p className="font-medium">Review notes:</p>
                <p>{kycIndividual.admin_notes}</p>
              </div>
            )}
          </div>
        ) : (
          <KYCForm
            userId={user.id}
            kycStatus={user.kyc_status}
            firstName={user.first_name}
            lastName={user.last_name}
          />
        )}
      </div>
    </div>
  )
}
