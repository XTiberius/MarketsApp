import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { KYCForm } from '@/components/KYCForm'
import type { KycStatus } from '@/lib/types'

/**
 * Simple two-stage KYC progress indicator:
 *   pending → approved (success) | rejected (danger)
 * Tokens only, so it themes correctly in light + dark.
 */
function KycProgress({ status }: { status: KycStatus }) {
  const isResolved = status === 'approved' || status === 'rejected'
  const resolvedColor = status === 'rejected' ? 'danger' : 'success'

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className={
            status === 'pending'
              ? 'h-2.5 w-2.5 rounded-full bg-warning'
              : 'h-2.5 w-2.5 rounded-full bg-[hsl(var(--success)/0.6)]'
          }
        />
        <span
          className={
            status === 'pending'
              ? 'text-xs font-medium text-warning'
              : 'text-xs font-medium text-muted-foreground'
          }
        >
          Submitted
        </span>
      </div>

      <span
        className={
          isResolved
            ? resolvedColor === 'danger'
              ? 'h-0.5 w-8 rounded-full bg-[hsl(var(--danger)/0.5)]'
              : 'h-0.5 w-8 rounded-full bg-[hsl(var(--success)/0.5)]'
            : 'h-0.5 w-8 rounded-full bg-border'
        }
        aria-hidden
      />

      <div className="flex items-center gap-2">
        <span
          className={
            !isResolved
              ? 'h-2.5 w-2.5 rounded-full bg-border'
              : resolvedColor === 'danger'
                ? 'h-2.5 w-2.5 rounded-full bg-danger'
                : 'h-2.5 w-2.5 rounded-full bg-success'
          }
        />
        <span
          className={
            !isResolved
              ? 'text-xs font-medium text-muted-foreground'
              : resolvedColor === 'danger'
                ? 'text-xs font-medium text-danger'
                : 'text-xs font-medium text-success'
          }
        >
          {status === 'rejected' ? 'Rejected' : 'Approved'}
        </span>
      </div>
    </div>
  )
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
      <GlassCard className="p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {user.first_name} {user.last_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <StatusBadge kind="kycStatus" value={user.kyc_status} />
        </div>
        <div className="flex justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Member since</span>
          <span>{formatDate(user.created_at)}</span>
        </div>
      </GlassCard>

      {/* KYC Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">KYC Information</h2>
          {kycIndividual && <KycProgress status={user.kyc_status} />}
        </div>

        {kycIndividual ? (
          <GlassCard className="p-6 text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Name:</span>{' '}
              {kycIndividual.first_name} {kycIndividual.last_name}
            </p>
            <p>
              <span className="text-muted-foreground">Submitted:</span>{' '}
              {kycIndividual.submitted_at ? formatDate(kycIndividual.submitted_at) : '—'}
            </p>
            {user.kyc_status === 'rejected' && kycIndividual.admin_notes && (
              <div className="mt-3 rounded-xl border border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.12)] p-3 text-xs text-danger">
                <p className="font-medium">Review notes:</p>
                <p>{kycIndividual.admin_notes}</p>
              </div>
            )}
          </GlassCard>
        ) : (
          <KYCForm
            userId={user.id}
            kycStatus={user.kyc_status}
            firstName={user.first_name}
            lastName={user.last_name}
          />
        )}
      </section>
    </div>
  )
}
