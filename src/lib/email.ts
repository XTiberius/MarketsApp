import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase-admin'

/**
 * Branded transactional email (Resend). No-ops gracefully (logs) when
 * RESEND_API_KEY is absent, so the rest of the app works without email
 * configured. Status-update / document events notify the investor + ALL admins.
 */

const FROM = process.env.EMAIL_FROM ?? 'IONIC Markets <updates@ionicmarkets.com>'

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

/** Branded IONIC (dark chrome) HTML email. Inline styles — required for email clients. */
export function renderEmail(opts: {
  firstName?: string | null
  heading: string
  lines: string[]
}): string {
  const name = (opts.firstName ?? '').trim() || 'Investor'
  const body = opts.lines
    .map(
      (l) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#c8ccd6;">${l}</p>`
    )
    .join('')
  return `<!doctype html><html><body style="margin:0;background:#0c0f14;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:520px;max-width:92%;background:#11151c;border:1px solid #232a36;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px;">
        <span style="font-size:18px;font-weight:600;letter-spacing:0.28em;color:#eef1f6;">I O N I C</span>
        <span style="font-size:11px;letter-spacing:0.2em;color:#7d869c;"> &nbsp;MARKETS</span>
      </td></tr>
      <tr><td style="padding:8px 32px 4px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;color:#eef1f6;">${opts.heading}</h1>
      </td></tr>
      <tr><td style="padding:18px 32px 8px;">
        <p style="margin:0 0 16px;font-size:15px;color:#eef1f6;">Dear ${name},</p>
        ${body}
      </td></tr>
      <tr><td style="padding:18px 32px 28px;border-top:1px solid #1c2230;margin-top:12px;">
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#6b7488;">This is an automated notification from IONIC Markets, a private markets platform for accredited investors. Please do not reply to this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export async function sendEmail(to: string[], subject: string, html: string): Promise<void> {
  const recipients = to.filter(Boolean)
  if (recipients.length === 0) return
  const client = resend()
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not set — would send "${subject}" to ${recipients.join(', ')}`)
    return
  }
  try {
    await client.emails.send({ from: FROM, to: recipients, subject, html })
  } catch (e) {
    console.error('[email] send failed:', e)
  }
}

async function adminEmails(): Promise<string[]> {
  const svc = createServiceClient()
  if (!svc) return []
  const { data } = await svc.from('users').select('email').eq('role', 'admin')
  return (data ?? []).map((u: { email: string }) => u.email).filter(Boolean)
}

/** Notify the investor + all admins of a bid/document event. */
export async function notifyBidEvent(opts: {
  investorEmail: string
  investorFirstName?: string | null
  company: string
  subject: string
  heading: string
  lines: string[]
}): Promise<void> {
  await sendEmail(
    [opts.investorEmail],
    opts.subject,
    renderEmail({ firstName: opts.investorFirstName, heading: opts.heading, lines: opts.lines })
  )
  const admins = await adminEmails()
  if (admins.length) {
    await sendEmail(
      admins,
      `[Admin] ${opts.subject} — ${opts.company}`,
      renderEmail({
        firstName: 'Admin',
        heading: opts.heading,
        lines: [`Investor: <strong>${opts.investorEmail}</strong> · ${opts.company}`, ...opts.lines],
      })
    )
  }
}
