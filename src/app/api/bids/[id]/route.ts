import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { BidStatus } from '@/lib/types'
import { notifyBidEvent } from '@/lib/email'

// Expanded investment lifecycle:
//   placed → pending_acceptance → accepted → documents_executed
//          → awaiting_payment → invested      (| rejected from placed/pending_acceptance)
const VALID_TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  placed: ['pending_acceptance', 'rejected'],
  pending_acceptance: ['accepted', 'rejected'],
  accepted: ['documents_executed'],
  documents_executed: ['awaiting_payment'],
  awaiting_payment: ['invested'],
  invested: [],
  rejected: [],
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

// Concise per-status messaging for the investor/admin notification emails.
const STATUS_MESSAGES: Record<
  BidStatus,
  { subject: string; heading: string; lines: (company: string) => string[] }
> = {
  placed: {
    subject: 'Bid placed',
    heading: 'Bid received',
    lines: (c) => [`Your bid for <strong>${c}</strong> has been placed.`],
  },
  pending_acceptance: {
    subject: 'Pending acceptance',
    heading: 'Notice of Intended Investment received',
    lines: (c) => [
      `Your executed Notice of Intended Investment for <strong>${c}</strong> has been received.`,
      `Your bid is now <strong>pending acceptance</strong> by the IONIC desk.`,
    ],
  },
  accepted: {
    subject: 'Bid accepted',
    heading: 'Your bid has been accepted',
    lines: (c) => [
      `Your bid for <strong>${c}</strong> has been accepted. Executed investment documents will appear in your bid module shortly.`,
    ],
  },
  documents_executed: {
    subject: 'Investment documents executed',
    heading: 'Investment documents executed',
    lines: (c) => [
      `The executed investment documents for <strong>${c}</strong> are now available in your bid module.`,
    ],
  },
  awaiting_payment: {
    subject: 'Awaiting payment',
    heading: 'Awaiting payment',
    lines: (c) => [
      `Your investment in <strong>${c}</strong> is awaiting payment. Payment instructions will be provided in your bid module.`,
    ],
  },
  invested: {
    subject: 'Investment complete',
    heading: 'You are invested',
    lines: (c) => [
      `Your investment in <strong>${c}</strong> is complete and now appears in your Portfolio.`,
    ],
  },
  rejected: {
    subject: 'Bid not accepted',
    heading: 'Bid update',
    lines: (c) => [`Your bid for <strong>${c}</strong> was not accepted at this time.`],
  },
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as { status: BidStatus; payment_confirmation?: string }
  const status = body.status

  const { data: bid } = await supabase
    .from('bids')
    .select('status, payment_confirmation')
    .eq('id', id)
    .single()
  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

  const allowed = VALID_TRANSITIONS[bid.status as BidStatus]
  if (!allowed?.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${bid.status} to ${status}` },
      { status: 400 }
    )
  }

  // ── Gates: required artifacts must exist before certain transitions ──
  const countDocs = async (docType: string) => {
    const { count } = await supabase
      .from('associated_documents')
      .select('id', { count: 'exact', head: true })
      .eq('bid_id', id)
      .eq('document_type', docType)
    return count ?? 0
  }

  if (status === 'pending_acceptance' && (await countDocs('nii')) < 1) {
    return NextResponse.json(
      { error: 'Upload the executed Notice of Intended Investment before advancing.' },
      { status: 400 }
    )
  }
  if (status === 'documents_executed' && (await countDocs('investment_doc')) < 1) {
    return NextResponse.json(
      { error: 'Upload at least one executed investment document before advancing.' },
      { status: 400 }
    )
  }

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }

  if (status === 'invested') {
    // Confirming payment received (≤100 words) is the action that resolves to Invested.
    const note = (body.payment_confirmation ?? bid.payment_confirmation ?? '').trim()
    if (!note) {
      return NextResponse.json(
        { error: 'Confirm payment received (a short note) before marking Invested.' },
        { status: 400 }
      )
    }
    if (wordCount(note) > 100) {
      return NextResponse.json({ error: 'Payment note must be 100 words or fewer.' }, { status: 400 })
    }
    update.payment_confirmation = note
    update.invested_at = new Date().toISOString()
    update.portfolio_status = 'active'
  }

  const { data, error } = await supabase
    .from('bids')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notify the investor + all admins of the status change (best-effort, non-blocking on failure).
  try {
    const { data: ctx } = await supabase
      .from('bids')
      .select('listings(company_name), users(email, first_name)')
      .eq('id', id)
      .single()
    const company =
      (ctx?.listings as { company_name?: string } | null)?.company_name ?? 'your listing'
    const investor = ctx?.users as { email?: string; first_name?: string | null } | null
    if (investor?.email) {
      const msg = STATUS_MESSAGES[status]
      await notifyBidEvent({
        investorEmail: investor.email,
        investorFirstName: investor.first_name,
        company,
        subject: `${company} — ${msg.subject}`,
        heading: msg.heading,
        lines: msg.lines(company),
      })
    }
  } catch (e) {
    console.error('[bid PATCH] notify failed:', e)
  }

  return NextResponse.json(data)
}
