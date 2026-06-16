import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GlassCard } from '@/components/ui/glass-card'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminEditListingPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params

  const isNew = id === 'new'
  let listing = null

  if (!isNew) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('listings').select('*').eq('id', id).single()
    if (!data) notFound()
    listing = data
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">
        {isNew ? 'Create Listing' : `Edit: ${listing?.company_name}`}
      </h1>

      {/* TODO: ListingForm component */}
      <GlassCard className="border-dashed p-8 text-center text-sm text-muted-foreground">
        Listing form — coming soon
      </GlassCard>
    </div>
  )
}
