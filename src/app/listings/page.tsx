import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ListingsBrowser } from '@/components/ListingsBrowser'
import type { ListingPublic } from '@/lib/types'

export default async function ListingsPage() {
  await requireAuth()
  const supabase = await createServerSupabaseClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, admin_id, company_name, logo_url, description, listing_type, industry, status, created_at, updated_at')
    .in('status', ['published', 'closed'])
    .order('created_at', { ascending: false })

  return <ListingsBrowser listings={(listings ?? []) as ListingPublic[]} />
}
