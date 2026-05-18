import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Records an NDA signature for the signed-in investor on a listing.
// This does NOT create a bid — placing a bid is a separate flow (/api/bids).
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id, signature_image } = await req.json().catch(() => ({}))

  if (!listing_id || !signature_image) {
    return NextResponse.json(
      { error: 'listing_id and signature_image are required' },
      { status: 400 }
    )
  }

  // The signature arrives as a data URL (data:image/png;base64,XXXX).
  const base64 = String(signature_image).split(',')[1]
  if (!base64) {
    return NextResponse.json({ error: 'Invalid signature image' }, { status: 400 })
  }

  const buffer = Buffer.from(base64, 'base64')
  const filePath = `${user.id}/${listing_id}/${Date.now()}.png`

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(filePath, buffer, { contentType: 'image/png' })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(filePath)

  // One signature per investor per listing (enforced by the unique constraint).
  const { error: sigError } = await supabase.from('nda_signatures').insert({
    investor_id: user.id,
    listing_id,
    signature_image_url: publicUrl,
  })

  if (sigError) return NextResponse.json({ error: sigError.message }, { status: 400 })

  return NextResponse.json({ message: 'NDA signed successfully' }, { status: 201 })
}
