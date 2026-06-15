import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { FullConfig } from '@playwright/test'

const INVESTOR_EMAIL = 'e2e+investor@marketsapp.test'
const ADMIN_EMAIL = 'e2e+admin@marketsapp.test'
const LISTING_NAME = 'E2E Test Listing'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for Playwright cleanup`)
  return value
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  const perPage = 100

  let page = 1
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email === email)
    if (user) return user

    if (data.users.length < perPage) return null
    page += 1
  }

  return null
}

export default async function globalTeardown(config: FullConfig) {
  void config

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[playwright globalTeardown] SUPABASE_SERVICE_ROLE_KEY is not set, skipping auth cleanup')
    return
  }

  const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error: listingError } = await supabase
    .from('listings')
    .delete()
    .eq('company_name', LISTING_NAME)

  if (listingError) throw listingError

  for (const email of [INVESTOR_EMAIL, ADMIN_EMAIL]) {
    const user = await findAuthUserByEmail(supabase, email)
    if (!user) continue

    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) throw error
  }
}
