import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase-admin'

/**
 * Branded transactional email (Resend). No-ops gracefully (logs) when
 * RESEND_API_KEY is absent, so the rest of the app works without email
 * configured. Status-update / document events notify the investor + ALL admins.
 */

const FROM = process.env.EMAIL_FROM ?? 'Monroe Markets <updates@monroemarkets.com>'

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

/**
 * Branded Monroe Markets HTML email, on the same system as the Supabase OTP
 * template (supabase/templates/otp_email.html): flat ink surfaces, square
 * corners, mono uppercase eyebrows, the maroon rail. Inline styles only and no
 * web fonts — required for email clients. The mark is served from the
 * production domain because clients drop SVG.
 */
export function renderEmail(opts: {
  firstName?: string | null
  heading: string
  lines: string[]
  /** Small mono label above the heading, e.g. the company name. */
  eyebrow?: string
}): string {
  const text = "font-family:'Söhne','Inter Tight','Helvetica Neue',Helvetica,Arial,sans-serif;"
  const display = "font-family:'Söhne Schmal','Archivo','Arial Narrow','Helvetica Neue',Arial,sans-serif;"
  const mono = "font-family:'Söhne Mono','IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;"
  const label = `${mono}font-size:12px;line-height:16px;letter-spacing:0.14em;text-transform:uppercase;`

  const name = (opts.firstName ?? '').trim() || 'Investor'
  // Callers emphasise with <strong>; lift it to ivory so it reads against the slate body.
  const body = opts.lines
    .map(
      (l) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#AAA5B2;">${l.replace(
          /<strong>/g,
          '<strong style="font-weight:600;color:#F3F0EA;">'
        )}</p>`
    )
    .join('')
  const eyebrow = opts.eyebrow
    ? `<div style="${label}color:#D98AA3;">${opts.eyebrow}</div>`
    : ''

  return `<!doctype html><html><body style="margin:0;background:#0A0710;padding:48px 0;${text}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 16px;">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:520px;max-width:100%;background:#151020;border:1px solid #2C2538;">
      <tr><td align="center" style="padding:40px 40px 0;">
        <img src="https://www.monroemarkets.com/monroe-mark.png" width="84" height="48" alt="Monroe Markets" style="display:block;width:84px;height:48px;margin:0 auto;" />
        <div style="margin-top:16px;${label}color:#F3F0EA;">Monroe Markets</div>
      </td></tr>
      <tr><td style="padding:40px 40px 0;">
        ${eyebrow}
        <h1 style="margin:${opts.eyebrow ? '12px' : '0'} 0 0;${display}font-weight:600;font-size:28px;line-height:32px;letter-spacing:-0.01em;color:#F3F0EA;">${opts.heading}</h1>
      </td></tr>
      <tr><td style="padding:28px 40px 0;">
        <div style="width:20px;height:4px;background:#7A1C3A;font-size:0;line-height:0;">&nbsp;</div>
        <p style="margin:20px 0 14px;font-size:15px;line-height:23px;color:#F3F0EA;">Dear ${name},</p>
        ${body}
      </td></tr>
      <tr><td style="padding:28px 40px 40px;">
        <div style="border-top:1px solid #2C2538;padding-top:20px;font-size:12px;line-height:18px;color:#AAA5B2;">This is an automated notification from Monroe Markets, a private markets platform for accredited investors. Please do not reply to this email.</div>
        <div style="margin-top:16px;${mono}font-size:11px;line-height:16px;letter-spacing:0.14em;text-transform:uppercase;color:#AAA5B2;">Accredited investors only · Monroe Markets</div>
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
    renderEmail({
      firstName: opts.investorFirstName,
      eyebrow: opts.company,
      heading: opts.heading,
      lines: opts.lines,
    })
  )
  const admins = await adminEmails()
  if (admins.length) {
    await sendEmail(
      admins,
      `[Admin] ${opts.subject} — ${opts.company}`,
      renderEmail({
        firstName: 'Admin',
        eyebrow: `Admin · ${opts.company}`,
        heading: opts.heading,
        lines: [`Investor: <strong>${opts.investorEmail}</strong> · ${opts.company}`, ...opts.lines],
      })
    )
  }
}
