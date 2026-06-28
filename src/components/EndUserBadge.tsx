import { Building2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { InvestorKind } from '@/lib/types'

/** Identifies the end-user a bid/investment is associated with: the individual
 *  account holder, or one of their entities. Entity bids show the entity name;
 *  individual bids show the account holder's name. */
export function EndUserBadge({
  investorKind,
  entityName,
  holderName,
  className,
}: {
  investorKind: InvestorKind | null
  entityName?: string | null
  holderName?: string | null
  className?: string
}) {
  if (investorKind === 'entity') {
    return (
      <Badge tone="info" className={className}>
        <Building2 className="size-3" />
        {entityName || 'Entity'} · Entity
      </Badge>
    )
  }
  // Default (individual or legacy null bids).
  return (
    <Badge tone="neutral" className={className}>
      <User className="size-3" />
      {holderName?.trim() || 'Individual'} · Individual
    </Badge>
  )
}
