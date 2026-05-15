import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const [
    { count: listingCount },
    { count: bidCount },
    { count: pendingKycCount },
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('bids').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
  ])

  const stats = [
    { label: 'Total Listings', value: listingCount ?? 0, href: '/admin/listings' },
    { label: 'Total Bids', value: bidCount ?? 0, href: '/admin/bids' },
    { label: 'Pending KYC Reviews', value: pendingKycCount ?? 0, href: '/admin/users' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border p-6 hover:bg-muted/40 transition-colors"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/listings"
          className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90"
        >
          Manage Listings
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
        >
          Review KYC
        </Link>
      </div>
    </div>
  )
}
