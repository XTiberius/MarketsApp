'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { KycEntity, KycIndividual, KycStatus, User } from '@/lib/types'

export type UserWithKyc = User & {
  kyc_individual: KycIndividual | null
  kyc_entity?: KycEntity | null
}

interface Props {
  users: UserWithKyc[]
}

const STATUS_STYLES: Record<KycStatus, string> = {
  pending: 'text-yellow-700 border-yellow-500',
  approved: 'text-green-700 border-green-500',
  rejected: 'text-red-700 border-red-500',
}

export function AdminKycManagement({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function updateStatus(userId: string, status: KycStatus, adminNotes?: string) {
    setUpdating(userId)
    setErrors((prev) => ({ ...prev, [userId]: '' }))

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, kyc_status: status, admin_notes: adminNotes }),
      })

      if (res.ok) {
        const reviewedAt = new Date().toISOString()

        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  kyc_status: status,
                  kyc_individual: user.kyc_individual
                    ? {
                        ...user.kyc_individual,
                        reviewed_at: reviewedAt,
                        admin_notes: adminNotes ?? user.kyc_individual.admin_notes,
                      }
                    : user.kyc_individual,
                }
              : user
          )
        )
        setRejecting((prev) => (prev === userId ? null : prev))
      } else {
        const data = await res.json() as { error?: string }
        setErrors((prev) => ({
          ...prev,
          [userId]: data.error ?? 'Unable to update KYC status',
        }))
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        [userId]: 'Unable to update KYC status',
      }))
    } finally {
      setUpdating(null)
    }
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">No users found.</p>
  }

  return (
    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
      {users.map((user) => {
        const isExpanded = expanded === user.id
        const isRejecting = rejecting === user.id
        const rejectReason = rejectReasons[user.id] ?? ''
        const displayName = user.first_name || user.last_name
          ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
          : user.email
        const individualName = user.kyc_individual
          ? `${user.kyc_individual.first_name} ${user.kyc_individual.last_name}`
          : null

        return (
          <div key={user.id} className="hover:bg-muted/40">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs border rounded px-2 py-0.5 capitalize ${STATUS_STYLES[user.kyc_status]}`}>
                  {user.kyc_status}
                </span>
                <button
                  onClick={() => setExpanded(isExpanded ? null : user.id)}
                  disabled={updating !== null}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50"
                >
                  {isExpanded ? 'Collapse' : 'Review'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 text-sm space-y-4">
                {user.kyc_individual ? (
                  <div className="grid gap-2 border-t border-border pt-4">
                    <p><span className="text-muted-foreground">Full name:</span> {individualName}</p>
                    <p><span className="text-muted-foreground">DOB:</span> {user.kyc_individual.dob}</p>
                    <p><span className="text-muted-foreground">Address:</span> {user.kyc_individual.address}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {user.kyc_individual.phone}</p>
                    <p><span className="text-muted-foreground">Occupation:</span> {user.kyc_individual.occupation}</p>
                    <p><span className="text-muted-foreground">Accredited investor:</span> {user.kyc_individual.accredited_investor ? 'Yes' : 'No'}</p>
                    <p><span className="text-muted-foreground">Submitted:</span> {user.kyc_individual.submitted_at ? formatDate(user.kyc_individual.submitted_at) : 'Not submitted'}</p>

                    {user.kyc_entity && (
                      <div className="grid gap-2 pt-2">
                        <p><span className="text-muted-foreground">Entity name:</span> {user.kyc_entity.entity_name}</p>
                        <p><span className="text-muted-foreground">Entity type:</span> {user.kyc_entity.entity_type}</p>
                        <p><span className="text-muted-foreground">EIN:</span> {user.kyc_entity.ein}</p>
                      </div>
                    )}

                    {user.kyc_status !== 'pending' && user.kyc_individual.admin_notes && (
                      <div className="p-3 bg-muted rounded text-xs">
                        <p className="font-medium">Admin notes:</p>
                        <p>{user.kyc_individual.admin_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-border pt-4 text-muted-foreground">
                    No individual KYC submission found.
                  </div>
                )}

                {user.kyc_status === 'pending' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(user.id, 'approved')}
                        disabled={updating !== null}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejecting(user.id)}
                        disabled={updating !== null}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>

                    {isRejecting && (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(event) =>
                            setRejectReasons((prev) => ({
                              ...prev,
                              [user.id]: event.target.value,
                            }))
                          }
                          disabled={updating !== null}
                          className="w-full min-h-24 rounded border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                          placeholder="Reason for rejection"
                        />
                        <button
                          onClick={() => updateStatus(user.id, 'rejected', rejectReason.trim())}
                          disabled={updating !== null || rejectReason.trim().length === 0}
                          className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-50"
                        >
                          Confirm rejection
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {errors[user.id] && (
                  <p className="text-xs text-red-700">{errors[user.id]}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
