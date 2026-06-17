'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency, formatCurrency, formatDate } from '@/lib/utils'
import type { FundingRound } from '@/lib/types'

type Point = {
  name: string
  valuation: number
  amount_raised: number | null
  axis: string
  date: string | null
}

/** Valuation trajectory across a listing's funding rounds, plotted over time.
 *  Self-contained: takes `rounds` as a prop so it can be reused (listing detail,
 *  portfolio, …). X-axis is the round date (time); each point is labelled with the
 *  round name + valuation, and the tooltip adds the exact valuation, amount raised,
 *  and date. Styled with the chrome/glass tokens. */
export function FundingRoundsChart({ rounds }: { rounds: FundingRound[] }) {
  if (rounds.length === 0) {
    return <p className="text-sm text-muted-foreground">No fundraising rounds yet.</p>
  }

  // Order by event date when present, falling back to the admin's explicit order.
  const data: Point[] = [...rounds]
    .sort((a, b) =>
      a.event_date && b.event_date
        ? a.event_date.localeCompare(b.event_date)
        : a.sequence_order - b.sequence_order
    )
    .map((r) => ({
      name: r.round_name,
      valuation: r.valuation,
      amount_raised: r.amount_raised,
      axis: r.event_date ? formatDate(r.event_date) : r.round_name,
      date: r.event_date,
    }))

  const stroke = 'hsl(var(--primary))'
  const muted = 'hsl(var(--muted-foreground))'
  const border = 'hsl(var(--border))'

  // Name + compact valuation sitting above each plot point.
  const renderLabel = (props: { x?: string | number; y?: string | number; index?: number }) => {
    const { x, y, index } = props
    if (x == null || y == null || index == null) return null
    const px = Number(x)
    const py = Number(y)
    const d = data[index]
    if (!d) return null
    return (
      <g>
        <text x={px} y={py - 18} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={11} fontWeight={600}>
          {d.name}
        </text>
        <text x={px} y={py - 6} textAnchor="middle" fill={muted} fontSize={10}>
          {formatCompactCurrency(d.valuation)}
        </text>
      </g>
    )
  }

  const ChartTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: Point }>
  }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
      <div className="rounded-xl border border-border bg-[hsl(var(--background))] p-3 text-xs">
        <p className="font-medium text-foreground">{p.name}</p>
        {p.date && <p className="text-muted-foreground">{formatDate(p.date)}</p>}
        <p className="mt-1 text-foreground">Valuation: {formatCurrency(p.valuation)}</p>
        {p.amount_raised != null && (
          <p className="text-foreground">Raised: {formatCurrency(p.amount_raised)}</p>
        )}
      </div>
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 28, right: 16, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fundingValuationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={border} strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="axis"
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
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: border }} />
          <Area
            type="monotone"
            dataKey="valuation"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#fundingValuationFill)"
            dot={{ fill: stroke, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          >
            <LabelList dataKey="name" content={renderLabel} />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
