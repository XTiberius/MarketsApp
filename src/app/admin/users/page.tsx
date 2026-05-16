import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/types'

export default async function AdminUsersPage() {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const STATUS_STYLES: Record<User['kyc_status'], string> = {
    pending: 'text-yellow-700 border-yellow-500',
    approved: 'text-green-700 border-green-500',
    rejected: 'text-red-700 border-red-500',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">User KYC Review</h1>

      {!users || users.length === 0 ? (
        <p className="text-muted-foreground">No users found.</p>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {users.map((user: User) => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/40">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.role} · Joined {formatDate(user.created_at)}
                </p>
              </div>
              <span className={`text-xs border rounded px-2 py-0.5 ${STATUS_STYLES[user.kyc_status]}`}>
                {user.kyc_status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
