import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types'

// ─── Get current session user (server-side) ───────────────────────────────────

export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Never fabricate a profile. Defaulting to role: 'investor' silently
  // downgrades admins and hides admin-only UI. An empty or failed read is a
  // real error — surface it instead of guessing the role.
  if (profileError) {
    console.error('[getServerUser] profile query failed:', profileError.message)
    return null
  }

  if (!profile) {
    console.error('[getServerUser] no public.users row for auth user', user.id)
    return null
  }

  return profile
}

// ─── Auth guards ─────────────────────────────────────────────────────────────

export async function requireAuth(): Promise<User> {
  const user = await getServerUser()
  if (!user) redirect('/auth/login')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') redirect('/listings')
  return user
}

export async function requireKycApproved(): Promise<User> {
  const user = await requireAuth()
  if (user.kyc_status !== 'approved') redirect('/auth/kyc')
  return user
}
