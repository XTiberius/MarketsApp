import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { User } from '@/lib/types'

// ─── Get current session user (server-side) ───────────────────────────────────

export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) return profile

  // Profile row missing — the handle_new_user trigger may not have fired yet
  // (e.g. first login race condition). Upsert it now so the user isn't
  // permanently locked out of auth-gated pages.
  const { data: upserted } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email ?? '' }, { onConflict: 'id' })
    .select()
    .single()

  return upserted ?? null
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
