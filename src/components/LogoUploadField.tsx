'use client'

import { useRef, useState } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB

/** Drag-and-drop (or click) logo upload to the public `logos` bucket. Stores the
 *  resulting public URL via onChange (kept in the form's logo_url field). */
export function LogoUploadField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 2MB or smaller.')
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (upErr) {
        setError(upErr.message)
        return
      }
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files?.[0]
          if (f) handleFile(f)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragging ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Logo preview" className="h-12 w-auto object-contain" />
        ) : (
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">
          {uploading
            ? 'Uploading…'
            : value
              ? 'Drag a new image or click to replace'
              : 'Drag & drop a logo, or click to upload'}
        </span>
        <span className="text-xs text-muted-foreground">PNG, JPG, SVG · up to 2MB</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" /> Remove logo
        </button>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
