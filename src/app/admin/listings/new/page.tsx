import { requireAdmin } from '@/lib/auth'
import { NewListingForm } from '@/components/NewListingForm'

export default async function NewListingPage() {
  await requireAdmin()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Create Listing</h1>
      <NewListingForm />
    </div>
  )
}
