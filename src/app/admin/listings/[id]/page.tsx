import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
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
      <h1 className="text-2xl font-bold mb-8">
        {isNew ? 'Create Listing' : `Edit: ${listing?.company_name}`}
      </h1>

      {/* TODO: ListingForm component */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
        Listing form — coming soon
      </div>
    </div>
  )
}
