import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { NewsfeedBullet } from '@/lib/types'

const DISCLOSURE =
  'This is AI generated and is subject to make mistakes. This is not investment advice and user understands Ionic Markets advises to do your own research and Ionic Markets is not responsible for investment decisions made as a result of this summary.'

// Deliberately a small, cost-efficient model (not the strongest) with web search —
// this is grunt summarization, so we keep token spend low.
const NEWSFEED_MODEL = 'gpt-4.1-mini'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI newsfeed is not configured (OPENAI_API_KEY missing).' },
      { status: 503 }
    )
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('company_name, description')
    .eq('id', listingId)
    .single()

  if (listingError) return NextResponse.json({ error: listingError.message }, { status: 400 })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const { company_name, description } = listing
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const resp = await client.responses.create({
    model: NEWSFEED_MODEL,
    tools: [{ type: 'web_search' }],
    input: `You are a research analyst. Using web search, find recent, relevant developments about the private company "${company_name}". Context: ${description}. Return 3 to 7 short, factual bullet points about notable RECENT events (≈ last 12 months). No advice, no fluff. Respond with ONLY a JSON object on the last line: {"bullets": ["...", "..."]}`,
  })

  const text = resp.output_text ?? ''

  const bulletTexts = extractBullets(text).slice(0, 7)
  if (bulletTexts.length < 1) {
    return NextResponse.json({ error: 'Could not generate a summary.' }, { status: 502 })
  }

  const bullets: NewsfeedBullet[] = bulletTexts.map((text) => ({ text }))

  const { data, error } = await supabase
    .from('listing_newsfeed')
    .upsert(
      {
        listing_id: listingId,
        bullets,
        disclosure: DISCLOSURE,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'listing_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

function extractBullets(text: string): string[] {
  const parsed = parseTrailingJson(text)
  if (parsed.length > 0) return parsed

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^([-*•]\s+|\d+[.)]\s+)/.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => line.length > 0 && line !== '{' && line !== '}')
}

function parseTrailingJson(text: string): string[] {
  const start = text.lastIndexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return []

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { bullets?: unknown }
    if (!Array.isArray(parsed.bullets)) return []
    return parsed.bullets
      .filter((bullet): bullet is string => typeof bullet === 'string')
      .map((bullet) => bullet.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}
