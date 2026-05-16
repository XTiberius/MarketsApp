import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bid_id, signature_image } = await req.json()

  if (!bid_id || !signature_image) {
    return NextResponse.json({ error: 'bid_id and signature_image are required' }, { status: 400 })
  }

  // Upload signature image to Supabase Storage
  const buffer = Buffer.from(signature_image.split(',')[1], 'base64')
  const filePath = `signatures/${bid_id}/${Date.now()}.png`

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(filePath, buffer, { contentType: 'image/png' })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(filePath)

  // Record NDA signature
  const { error: sigError } = await supabase.from('nda_signatures').insert({
    bid_id,
    signature_image_url: publicUrl,
    signed_at: new Date().toISOString(),
  })

  if (sigError) return NextResponse.json({ error: sigError.message }, { status: 400 })

  // Mark bid as NDA signed
  await supabase
    .from('bids')
    .update({ nda_signed: true, nda_signed_at: new Date().toISOString() })
    .eq('id', bid_id)

  return NextResponse.json({ message: 'NDA signed successfully' })
}
