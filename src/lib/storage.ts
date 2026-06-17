import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Private-document helpers. Sensitive files (listing memoranda/decks, per-bid
 * documents) live in private buckets and are downloaded via short-lived signed
 * URLs — never public URLs. Authorization is enforced by storage.objects RLS:
 * `createSignedUrl` only succeeds for a caller permitted to read the object.
 */

/** Max upload size, mirrored by the `documents`/`listing-docs` bucket file_size_limit
 *  (migration 015). Enforced client- and server-side for a friendly error. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '50 MB'

/** Upload a file to a private bucket; returns the stored path. */
export async function uploadPrivate(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  return path
}

/** Create a short-lived signed URL for a private object (RLS authorizes the caller). */
export async function signedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn = 60
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error || !data) throw new Error(error?.message ?? 'Could not sign URL')
  return data.signedUrl
}
