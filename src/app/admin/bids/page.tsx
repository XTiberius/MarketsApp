import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { AdminBidManagement } from '@/components/AdminBidManagement'

export default async function AdminBidsPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { data: bids } = await supabase
    .from('bids')
    .select('*, listings(company_name), users(email)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Bid Management</h1>
      <AdminBidManagement bids={bids ?? []} />
    </div>
  )
}
