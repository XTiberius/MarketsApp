'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { StatusBadge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import type { KycEntity, KycIndividual, KycStatus, User } from '@/lib/types'

export type UserWithKyc = User & {
  kyc_individual: KycIndividual | null
  kyc_entity?: KycEntity | null
}

interface Props {
  users: UserWithKyc[]
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
    return <p className="p-2 text-sm text-muted-foreground">No users found.</p>
  }

  return (
    <div className="space-y-3">
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
          <GlassCard key={user.id} interactive className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge kind="kycStatus" value={user.kyc_status} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(isExpanded ? null : user.id)}
                  disabled={updating !== null}
                  data-testid="admin-kyc-review-toggle"
                >
                  {isExpanded ? 'Collapse' : 'Review'}
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
                {user.kyc_individual ? (
                  <div className="grid gap-2">
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
                      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                        <p className="font-medium">Admin notes:</p>
                        <p>{user.kyc_individual.admin_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    No individual KYC submission found.
                  </div>
                )}

                {user.kyc_status === 'pending' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(user.id, 'approved')}
                        disabled={updating !== null}
                        data-testid="admin-kyc-approve-button"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRejecting(user.id)}
                        disabled={updating !== null}
                        data-testid="admin-kyc-reject-button"
                      >
                        Reject
                      </Button>
                    </div>

                    {isRejecting && (
                      <div className="space-y-2">
                        <Textarea
                          value={rejectReason}
                          onChange={(event) =>
                            setRejectReasons((prev) => ({
                              ...prev,
                              [user.id]: event.target.value,
                            }))
                          }
                          disabled={updating !== null}
                          data-testid="admin-kyc-reject-reason"
                          placeholder="Reason for rejection"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => updateStatus(user.id, 'rejected', rejectReason.trim())}
                          disabled={updating !== null || rejectReason.trim().length === 0}
                          data-testid="admin-kyc-confirm-reject-button"
                        >
                          Confirm rejection
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {errors[user.id] && (
                  <p className="text-xs text-danger">{errors[user.id]}</p>
                )}
              </div>
            )}
          </GlassCard>
        )
      })}
    </div>
  )
}
