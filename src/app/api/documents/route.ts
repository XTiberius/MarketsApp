import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bid_id = formData.get('bid_id') as string
  const document_type = formData.get('document_type') as string

  if (!file || !bid_id || !document_type) {
    return NextResponse.json({ error: 'file, bid_id, and document_type are required' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const filePath = `${bid_id}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('associated_documents')
    .insert({
      bid_id,
      file_name: file.name,
      file_url: publicUrl,
      document_type,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
