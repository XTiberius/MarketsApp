import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AdminBidManagement } from '@/components/AdminBidManagement'
import type { AdminBid } from '@/components/BidModuleAdmin'
import { GlassCard } from '@/components/ui/glass-card'

export default async function AdminBidsPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { data: bids } = await supabase
    .from('bids')
    .select('*, listings(company_name), users(email), associated_documents(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <GlassCard className="mb-6 p-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Bid Management</h1>
      </GlassCard>
      <AdminBidManagement bids={(bids ?? []) as unknown as AdminBid[]} />
    </div>
  )
}
