import { createClient } from '@/lib/supabase-browser'

/**
 * Upload a file DIRECTLY from the browser to a private bucket using the caller's
 * session. storage.objects RLS authorizes the write (admins for the document
 * buckets — see migration 015). Uploading client-side means large PDFs (pitch
 * decks, memoranda) bypass the Next.js route / serverless request-body limit
 * (Vercel caps function bodies at ~4.5 MB); the file goes straight to Supabase
 * Storage and only small JSON metadata is POSTed to our API afterwards.
 */
export async function uploadToPrivateBucket(
  bucket: string,
  path: string,
  file: File
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
}

/** Best-effort removal of an uploaded object — used to roll back when the
 *  follow-up metadata save fails, so we don't leak orphaned files. */
export async function removeFromBucket(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  await supabase.storage.from(bucket).remove([path])
}
