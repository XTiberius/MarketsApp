import { requireAdmin } from '@/lib/auth'
import { NewListingForm } from '@/components/NewListingForm'
import { GlassCard } from '@/components/ui/glass-card'

export default async function NewListingPage() {
  await requireAdmin()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Create Listing</h1>
      <GlassCard className="p-6">
        <NewListingForm />
      </GlassCard>
    </div>
  )
}
