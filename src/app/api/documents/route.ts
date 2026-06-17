import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notifyBidEvent } from '@/lib/email'
import type { DocumentType } from '@/lib/types'

const VALID_TYPES: DocumentType[] = [
  'investment_agreement',
  'k1',
  'reg_d',
  'other',
  'nii',
  'investment_doc',
  'payment_instructions',
  'filing',
]

// Upload-event notifications. Status-transition emails fire inside the bid PATCH
// route; here we only notify on the document arriving (no double-send).
const UPLOAD_MESSAGES: Partial<
  Record<DocumentType, { subject: string; heading: string; lines: (c: string) => string[] }>
> = {
  investment_doc: {
    subject: 'Investment document available',
    heading: 'Investment document available',
    lines: (c) => [
      `A new executed investment document for <strong>${c}</strong> is available in your bid module.`,
    ],
  },
  payment_instructions: {
    subject: 'Payment instructions available',
    heading: 'Payment instructions available',
    lines: (c) => [
      `Payment instructions for <strong>${c}</strong> are now available in your bid module.`,
    ],
  },
  filing: {
    subject: 'New filing available',
    heading: 'New filing available',
    lines: (c) => [
      `A new filing for <strong>${c}</strong> is available in the Filings & Additional Documents section of your bid module.`,
    ],
  },
}

/**
 * Admin upload of a per-bid document to the private `documents` bucket.
 *   POST  (FormData: file, bid_id, document_type)
 *
 * Files live at `{bid_id}/{timestamp}.{ext}`; we store `storage_path` and never
 * a public URL (downloads go through /api/files signed URLs). Uploading the NII
 * while a bid is `placed` auto-advances it to `pending_acceptance` (the PATCH
 * route's email fires for the status change). Other notable uploads notify the
 * investor + admins here.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // The file is uploaded to the private `documents` bucket DIRECTLY from the
  // browser (so large PDFs bypass the serverless request-body limit); we receive
  // only the metadata here.
  const body = await req.json().catch(() => null)
  const bid_id = typeof body?.bid_id === 'string' ? body.bid_id : null
  const document_type = body?.document_type as DocumentType | null
  const storage_path = typeof body?.storage_path === 'string' ? body.storage_path : ''
  const file_name = typeof body?.file_name === 'string' ? body.file_name : ''

  if (!bid_id || !document_type || !storage_path || !file_name) {
    return NextResponse.json(
      { error: 'bid_id, document_type, storage_path, and file_name are required' },
      { status: 400 }
    )
  }
  if (!VALID_TYPES.includes(document_type)) {
    return NextResponse.json({ error: 'Invalid document_type' }, { status: 400 })
  }
  // The uploaded object must live under this bid's folder.
  if (!storage_path.startsWith(`${bid_id}/`)) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
  }

  const { data: bid } = await supabase
    .from('bids')
    .select('id, status')
    .eq('id', bid_id)
    .single()
  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

  const path = storage_path

  const { data: doc, error } = await supabase
    .from('associated_documents')
    .insert({
      bid_id,
      file_name,
      file_url: '',
      storage_path: path,
      document_type,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // NII received while the bid is `placed` → advance to pending_acceptance.
  // The PATCH route owns the state machine + its email, so call it server-side.
  if (document_type === 'nii' && bid.status === 'placed') {
    const res = await fetch(`${req.nextUrl.origin}/api/bids/${bid_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Forward the caller's session so the PATCH route's admin guard passes.
        cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({ status: 'pending_acceptance' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      return NextResponse.json(
        { error: data?.error ?? 'NII uploaded but advancing the bid failed.' },
        { status: 400 }
      )
    }
  } else {
    // Best-effort upload-event email for documents that matter to the investor.
    const msg = UPLOAD_MESSAGES[document_type]
    if (msg) {
      try {
        const { data: ctx } = await supabase
          .from('bids')
          .select('listings(company_name), users(email, first_name)')
          .eq('id', bid_id)
          .single()
        const company =
          (ctx?.listings as { company_name?: string } | null)?.company_name ?? 'your listing'
        const investor = ctx?.users as { email?: string; first_name?: string | null } | null
        if (investor?.email) {
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
        console.error('[documents POST] notify failed:', e)
      }
    }
  }

  return NextResponse.json(doc, { status: 201 })
}
