'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import RecaptchaNotice from '@/components/common/RecaptchaNotice'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import type { Dictionary } from '@/lib/dictionaries'
import { SERVICE_LABELS, cn } from '@/lib/utils'

interface AccountInfo {
  bkash:       string
  nagad:       string
  bankAccount: string
  bankName:    string
}

// ── Zod schema ─────────────────────────────────────────────────────────
const schema = z.object({
  service:        z.string().min(1, 'Select a service'),
  payment_method: z.enum(['bkash', 'nagad', 'bank']),
  transaction_id: z.string().min(4, 'Enter transaction ID'),
  sender_number:  z.string().min(7, 'Enter your number / reference'),
  amount:         z.string().min(1, 'Enter amount'),
  payer_name:     z.string().min(2, 'Enter your name'),
  payer_email:    z.string().email('Enter a valid email').optional().or(z.literal('')),
  note:           z.string().optional(),
})
type FormData = z.infer<typeof schema>

// ── Component ──────────────────────────────────────────────────────────
interface PaymentFormProps {
  dict: Dictionary
  /** Payment account info loaded server-side from site_settings */
  accounts: AccountInfo
}

export default function PaymentForm({ dict, accounts }: PaymentFormProps) {
  const [status, setStatus]         = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]     = useState<string>('')
  const [file, setFile]             = useState<File | null>(null)
  const [uploading, setUploading]   = useState(false)
  const fileInputRef                 = useRef<HTMLInputElement | null>(null)
  const { execute: getRecaptchaToken } = useRecaptcha()

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: 'bkash' },
  })

  const method = watch('payment_method')

  // ── File handlers ──────────────────────────────────────────────────────
  function handleFile(f: File | null): void {
    if (!f) { setFile(null); return }
    if (f.size > 5 * 1024 * 1024) { setErrorMsg('File too large (max 5 MB)'); return }
    setErrorMsg('')
    setFile(f)
  }

  function removeFile(): void {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadReceipt(): Promise<string> {
    if (!file) return ''
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads/payment', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Upload failed')
      return data.data.url as string
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data: FormData): Promise<void> {
    setErrorMsg('')
    try {
      const recaptcha_token = await getRecaptchaToken('payment').catch(() => '')
      const screenshot_url  = file ? await uploadReceipt() : ''
      const res = await fetch('/api/payments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, screenshot_url, recaptcha_token }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        const msg = body.error === 'captcha_failed'
          ? 'Verification failed. Please refresh the page and try again.'
          : (body.error ?? 'Failed')
        throw new Error(msg)
      }
      setStatus('success')
      reset()
      setFile(null)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-3xl">✅</div>
        <h3 className="text-xl font-bold text-primary">{dict.payment.success}</h3>
        <p className="text-sm text-muted max-w-sm">Our team will confirm your payment within a few hours.</p>
        <button onClick={() => setStatus('idle')} className="text-sm text-secondary hover:underline">Submit another</button>
      </div>
    )
  }

  const methodNumber =
    method === 'bkash' ? accounts.bkash :
    method === 'nagad' ? accounts.nagad :
    ''

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Method selector */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">{dict.payment.method}</label>
        <div className="grid grid-cols-3 gap-3">
          {(['bkash', 'nagad', 'bank'] as const).map((m) => (
            <label key={m} className="cursor-pointer">
              <input type="radio" value={m} {...register('payment_method')} className="sr-only" />
              <div className={cn(
                'border-2 rounded-xl p-3 text-center text-sm font-medium transition-all',
                method === m
                  ? 'border-secondary bg-secondary/8 text-secondary'
                  : 'border-[#E5E7EC] text-muted hover:border-[#D0D4DC]'
              )}>
                {m === 'bkash' ? '🟣 bKash' : m === 'nagad' ? '🟠 Nagad' : '🏦 Bank'}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-gold/10 border border-gold/25 rounded-xl text-sm text-primary">
        <p>{dict.payment.instructions[method as keyof typeof dict.payment.instructions]}</p>
        <div className="mt-2 font-semibold text-gold">
          {method === 'bank' ? (
            <span>{accounts.bankName}: {accounts.bankAccount}</span>
          ) : (
            <span>Number: {methodNumber}</span>
          )}
        </div>
      </div>

      {/* Payer info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" error={errors.payer_name?.message}>
          <input {...register('payer_name')} placeholder="Full name" className={inputCls(!!errors.payer_name)} />
        </Field>
        <Field label="Email (optional)" error={errors.payer_email?.message}>
          <input {...register('payer_email')} type="email" placeholder="you@email.com" className={inputCls(!!errors.payer_email)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={dict.payment.service} error={errors.service?.message}>
          <select {...register('service')} className={inputCls(!!errors.service)}>
            <option value="">Select service</option>
            {Object.entries(SERVICE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label={dict.payment.amount} error={errors.amount?.message}>
          <input {...register('amount')} placeholder="e.g. 5000 BDT" className={inputCls(!!errors.amount)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={dict.payment.transactionId} error={errors.transaction_id?.message}>
          <input {...register('transaction_id')} placeholder="TX ID / Ref number" className={inputCls(!!errors.transaction_id)} />
        </Field>
        <Field label={dict.payment.senderNumber} error={errors.sender_number?.message}>
          <input {...register('sender_number')} placeholder="01XXXXXXXXX" className={inputCls(!!errors.sender_number)} />
        </Field>
      </div>

      <Field label="Note (optional)">
        <input {...register('note')} placeholder="Any additional info..." className={inputCls(false)} />
      </Field>

      {/* Receipt upload */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Receipt screenshot <span className="text-muted font-normal">(strongly recommended)</span>
        </label>
        {file ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/8">
            {file.type === 'application/pdf'
              ? <FileText className="w-5 h-5 text-secondary shrink-0" />
              : <ImageIcon className="w-5 h-5 text-secondary shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary truncate">{file.name}</div>
              <div className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-[#D0D4DC] hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-colors text-center">
            <Upload className="w-5 h-5 text-muted" />
            <div className="text-sm text-primary font-medium">Tap to upload receipt</div>
            <div className="text-xs text-muted">JPG, PNG, WebP, PDF · max 5 MB</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {status === 'error' && errorMsg && (
        <div className="px-4 py-3 bg-gold/10 border border-gold/30 rounded-xl text-sm text-gold">
          {errorMsg}
        </div>
      )}

      <Button type="submit" loading={isSubmitting || uploading} size="lg" className="w-full">
        {uploading ? 'Uploading receipt…' : isSubmitting ? 'Submitting…' : dict.payment.submit}
      </Button>

      <RecaptchaNotice className="text-center mt-1" />
    </form>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────
interface FieldProps {
  label:    string
  error?:   string
  children: React.ReactNode
}
function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-primary">{label}</label>
      {children}
      {error && <span className="text-xs text-gold">{error}</span>}
    </div>
  )
}

function inputCls(hasError: boolean): string {
  return cn(
    'px-4 py-3 border rounded-xl text-sm bg-white transition-colors focus:outline-none focus:ring-2 w-full',
    hasError
      ? 'border-gold/40 focus:ring-gold/40'
      : 'border-[#E5E7EC] focus:ring-secondary/20 focus:border-secondary'
  )
}
