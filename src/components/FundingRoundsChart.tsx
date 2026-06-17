'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency } from '@/lib/utils'
import type { FundingRound } from '@/lib/types'

/** Valuation trajectory across a listing's funding rounds. Self-contained: takes
 *  `rounds` as a prop so it can be reused (listing detail, portfolio, …).
 *  Styled with the chrome/glass tokens — low-alpha primary fill, muted axes/grid. */
export function FundingRoundsChart({ rounds }: { rounds: FundingRound[] }) {
  if (rounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No fundraising rounds yet.</p>
    )
  }

  const data = [...rounds]
    .sort((a, b) => a.sequence_order - b.sequence_order)
    .map((r) => ({ name: r.round_name, valuation: r.valuation }))

  const stroke = 'hsl(var(--primary))'
  const muted = 'hsl(var(--muted-foreground))'
  const border = 'hsl(var(--border))'

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fundingValuationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={border} strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={muted}
            tick={{ fill: muted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: border }}
          />
          <YAxis
            stroke={muted}
            tick={{ fill: muted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => formatCompactCurrency(v)}
          />
          <Tooltip
            cursor={{ stroke: border }}
            contentStyle={{
              background: 'hsl(var(--background))',
              border: `1px solid ${border}`,
              borderRadius: 12,
              color: 'hsl(var(--foreground))',
              fontSize: 12,
            }}
            labelStyle={{ color: muted }}
            formatter={(value) => [formatCompactCurrency(Number(value)), 'Valuation']}
          />
          <Area
            type="monotone"
            dataKey="valuation"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#fundingValuationFill)"
            dot={{ fill: stroke, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
