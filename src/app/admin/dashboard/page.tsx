import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Building2, ClipboardCheck, Gavel } from 'lucide-react'
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
    { label: 'Total Listings', value: listingCount ?? 0, href: '/admin/listings', icon: Building2 },
    { label: 'Total Bids', value: bidCount ?? 0, href: '/admin/bids', icon: Gavel },
    {
      label: 'Pending KYC Reviews',
      value: pendingKycCount ?? 0,
      href: '/admin/users',
      icon: ClipboardCheck,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Monitor marketplace activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {stats.map((stat) => (
          <GlassCard key={stat.label} interactive className="p-6">
            <Link href={stat.href} className="block">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="font-mono text-4xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </Link>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="flex flex-wrap gap-3 p-5">
        <Button asChild>
          <Link href="/admin/listings">Manage Listings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/users">Review KYC</Link>
        </Button>
      </GlassCard>
    </div>
  )
}
