'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { ListingCard } from '@/components/ListingCard'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ListingPublic } from '@/lib/types'

interface Props {
  listings: ListingPublic[]
}

type SortKey = 'newest' | 'company'
const ALL = 'all'

export function ListingsBrowser({ listings }: Props) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<string>(ALL)
  const [activity, setActivity] = useState<string>(ALL)
  const [industry, setIndustry] = useState<string>(ALL)
  const [sort, setSort] = useState<SortKey>('newest')

  const industries = useMemo(
    () =>
      Array.from(new Set(listings.map((l) => l.industry).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [listings]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = listings.filter((l) => {
      if (q && !l.company_name.toLowerCase().includes(q)) return false
      if (type !== ALL && l.listing_type !== type) return false
      if (activity === 'active' && l.status !== 'published') return false
      if (activity === 'closed' && l.status !== 'closed') return false
      if (industry !== ALL && l.industry !== industry) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'company') return a.company_name.localeCompare(b.company_name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [listings, query, type, activity, industry, sort])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Listings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse investment opportunities
        </p>
      </header>

      <GlassCard className="mb-8 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company name"
              aria-label="Search listings by company name"
              className="pl-9"
            />
          </div>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="lg:w-44" aria-label="Filter by listing type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activity} onValueChange={setActivity}>
            <SelectTrigger className="lg:w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="lg:w-48" aria-label="Filter by industry">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="lg:w-44" aria-label="Sort listings">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="company">Company A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span>
          <span className="font-mono font-medium text-foreground">{results.length}</span>{' '}
          {results.length === 1 ? 'listing' : 'listings'}
          {results.length !== listings.length && (
            <> of <span className="font-mono">{listings.length}</span></>
          )}
        </span>
      </div>

      {results.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)]">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            No matching listings
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {listings.length === 0
              ? 'No active listings at this time. Check back soon.'
              : 'Try adjusting your search or filters to find more opportunities.'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
