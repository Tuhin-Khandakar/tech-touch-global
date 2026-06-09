'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Reusable image-upload control for the admin panel.
 *
 * The admin selects (or drags in) a file from their device. The component:
 *   1. Validates it client-side (size + mime)
 *   2. POSTs it to /api/uploads/media as multipart/form-data
 *   3. Calls `onChange(url)` with the resulting public URL once the upload
 *      finishes successfully
 *
 * Pass `value` to render an existing image preview (e.g. when editing a row).
 * The user can clear the value with the X button.
 *
 * The DB stores only the URL string — the file lives in Supabase Storage.
 *
 *   <ImageUploader value={logoUrl} onChange={setLogoUrl} folder="settings" />
 */
interface ImageUploaderProps {
  value:    string
  onChange: (url: string) => void
  /** Subfolder under media/ — must be in the server-side whitelist */
  folder?:  'settings' | 'blog' | 'gallery' | 'countries' | 'services' | 'team' | 'testimonials' | 'about'
  /** Human label for the field, shown above the dropzone */
  label?:   string
  /** Hint text shown inside the empty state */
  hint?:    string
  /** Aspect ratio for the preview frame ('square' | '16/9' | 'auto') */
  aspect?:  'square' | '16/9' | 'auto'
  /** When true, displays a smaller compact uploader */
  compact?: boolean
  /** Disable the control */
  disabled?: boolean
  className?: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/x-icon'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB (matches server)

export default function ImageUploader({
  value,
  onChange,
  folder = 'settings',
  label,
  hint = 'PNG, JPG, WebP, SVG · up to 8 MB',
  aspect = 'auto',
  compact = false,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error,    setError]      = useState<string>('')
  const [dragging, setDragging]   = useState(false)

  const handleFile = useCallback(async (file: File): Promise<void> => {
    if (disabled) return
    setError('')
    if (file.size > MAX_BYTES) {
      setError('File too large (max 8 MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files allowed')
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      const fd = new FormData()
      fd.append('file',   file)
      fd.append('folder', folder)
      // Fetch doesn't expose upload progress; show indeterminate spinner instead
      const res = await fetch('/api/uploads/media', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) {
        setError(humanError(data.error))
        return
      }
      onChange(data.data.url as string)
      setProgress(100)
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }, [folder, onChange, disabled])

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0]
    if (f) void handleFile(f)
    // Allow re-selecting the same file
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  const aspectClass =
    aspect === 'square' ? 'aspect-square' :
    aspect === '16/9'   ? 'aspect-video'  :
    ''

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">
          {label}
        </label>
      )}

      {/* Filled state — preview + remove */}
      {value && !uploading && (
        <div className={cn(
          'relative group rounded-xl overflow-hidden border border-[rgba(255,255,255,0.10)] bg-[#0F172A]/40',
          aspectClass,
          compact && 'max-w-[200px]',
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label ?? 'Uploaded'}
            className={cn('w-full', aspectClass ? 'h-full object-contain' : 'block')}
            loading="lazy"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[rgba(0,0,0,0.65)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold disabled:opacity-50"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[rgba(0,0,0,0.65)] text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
          >
            Replace
          </button>
        </div>
      )}

      {/* Empty / uploading state — dropzone */}
      {(!value || uploading) && (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center',
            compact ? 'p-4 min-h-[100px]' : 'p-6 min-h-[140px]',
            dragging
              ? 'border-secondary bg-secondary/10'
              : 'border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.25)]',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
              <div className="text-xs text-white font-medium">Uploading…</div>
              <div className="w-32 h-1 rounded-full bg-[rgba(255,255,255,0.10)] overflow-hidden">
                <div className="h-full bg-secondary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
                {dragging ? <Upload className="w-4 h-4 text-secondary" /> : <ImageIcon className="w-4 h-4 text-[rgba(255,255,255,0.65)]" />}
              </div>
              <div className="text-sm font-medium text-white">
                {dragging ? 'Drop to upload' : 'Drag image or click to upload'}
              </div>
              <div className="text-[11px] text-[rgba(255,255,255,0.45)]">{hint}</div>
            </>
          )}
        </div>
      )}

      {/* Error pill */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-xs text-gold">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleSelect}
        disabled={disabled || uploading}
      />
    </div>
  )
}

function humanError(code: string): string {
  switch (code) {
    case 'unauthorized':    return 'Session expired. Please sign in again.'
    case 'file_too_large':  return 'File too large (max 8 MB)'
    case 'invalid_mime':    return 'Only image files allowed'
    case 'invalid_folder':  return 'Invalid upload folder'
    case 'no_file':         return 'No file selected'
    default:                return 'Upload failed — please try again'
  }
}
