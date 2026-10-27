import type { createServerSupabaseClient } from '@/lib/supabase-server'
import type { User } from '@/lib/types'

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

/** One end-user the account can bid as: the individual profile, or a registered entity. */
export type EndUserOption =
  | { kind: 'individual'; label: string }
  | { kind: 'entity'; entityId: string; label: string }

/**
 * Whether the individual account holder is a bidding party.
 *
 * `users.kyc_status` is the source of truth here, not the presence of a
 * kyc_individual row: an admin can approve an account through /api/users
 * (which writes users.kyc_status only), so an approved holder may have no row
 * at all — and must still be able to bid as themselves. Entity-only accounts
 * are the one case where the holder is not a party.
 */
export function individualIsEligible(
  user: Pick<User, 'kyc_status' | 'account_type'>,
  hasIndividualKyc: boolean
): boolean {
  return hasIndividualKyc || (user.kyc_status === 'approved' && user.account_type !== 'entity')
}

/** Every end-user this account can bid as, individual first. */
export async function loadEndUsers(
  supabase: ServerClient,
  user: User
): Promise<EndUserOption[]> {
  const [individual, entities] = await Promise.all([
    supabase.from('kyc_individual').select('id').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('kyc_entity')
      .select('id, entity_name')
      .eq('user_id', user.id)
      .order('entity_name', { ascending: true }),
  ])

  // A failed read used to be indistinguishable from "no parties", which showed
  // up as an unexplained empty selector. Surface it in the server log.
  if (individual.error) {
    console.error('[end-users] individual KYC query failed:', individual.error.message)
  }
  if (entities.error) {
    console.error('[end-users] entity KYC query failed:', entities.error.message)
  }

  const options: EndUserOption[] = []

  if (individualIsEligible(user, !!individual.data)) {
    options.push({
      kind: 'individual',
      label: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Individual',
    })
  }

  for (const e of entities.data ?? []) {
    options.push({ kind: 'entity', entityId: e.id, label: e.entity_name })
  }

  return options
}
