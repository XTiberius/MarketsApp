import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AdminKycManagement } from '@/components/AdminKycManagement'
import type { KycEntity, KycIndividual, User } from '@/lib/types'

export default async function AdminUsersPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const [
    { data: usersData },
    { data: kycIndividualsData },
    { data: kycEntitiesData },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('kyc_individual')
      .select('*'),
    supabase
      .from('kyc_entity')
      .select('*'),
  ])

  const users = (usersData ?? []) as User[]
  const kycIndividuals = (kycIndividualsData ?? []) as KycIndividual[]
  const kycEntities = (kycEntitiesData ?? []) as KycEntity[]
  const kycIndividualByUserId = new Map<string, KycIndividual>()
  const kycEntityByUserId = new Map<string, KycEntity>()

  for (const kycIndividual of kycIndividuals) {
    kycIndividualByUserId.set(kycIndividual.user_id, kycIndividual)
  }

  for (const kycEntity of kycEntities) {
    kycEntityByUserId.set(kycEntity.user_id, kycEntity)
  }

  const usersWithKyc = users.map((user) => ({
    ...user,
    kyc_individual: kycIndividualByUserId.get(user.id) ?? null,
    kyc_entity: kycEntityByUserId.get(user.id) ?? null,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">User KYC Review</h1>
      <AdminKycManagement users={usersWithKyc} />
    </div>
  )
}
