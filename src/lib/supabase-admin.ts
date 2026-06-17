import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS. Use ONLY in trusted server code
 * for operations that legitimately span users (e.g. emailing all admins on an
 * investor-triggered event). Returns null when the service key isn't configured,
 * so callers degrade gracefully rather than crash.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
