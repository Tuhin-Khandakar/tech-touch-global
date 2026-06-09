'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import RecaptchaNotice from '@/components/common/RecaptchaNotice'
import { useRecaptcha } from '@/hooks/useRecaptcha'
import type { Dictionary } from '@/lib/dictionaries'
import { SERVICE_LABELS } from '@/lib/utils'

const schema = z.object({
  name:    z.string().min(2,  'Name must be at least 2 characters'),
  email:   z.string().email('Enter a valid email'),
  phone:   z.string().min(7,  'Enter a valid phone number'),
  service: z.string().min(1,  'Please select a service'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

interface InquiryFormProps {
  dict: Dictionary
  defaultService?: string
}

export default function InquiryForm({ dict, defaultService = '' }: InquiryFormProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const { execute: getRecaptchaToken } = useRecaptcha()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { service: defaultService },
  })

  async function onSubmit(data: FormData): Promise<void> {
    setErrorMsg('')
    try {
      // Fetch a fresh reCAPTCHA token (empty string if disabled — server tolerates it in dev)
      const recaptcha_token = await getRecaptchaToken('inquiry').catch(() => '')

      const res = await fetch('/api/inquiries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, recaptcha_token }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        if (body.error === 'captcha_failed') {
          setErrorMsg('Verification failed. Please refresh the page and try again.')
        } else {
          setErrorMsg(dict.inquiry.error)
        }
        setStatus('error')
        return
      }
      setStatus('success')
      reset()
    } catch {
      setErrorMsg(dict.inquiry.error)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-3xl">✅</div>
        <h3 className="text-xl font-bold text-primary">{dict.inquiry.success}</h3>
        <button onClick={() => setStatus('idle')} className="text-sm text-secondary hover:underline">
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {status === 'error' && errorMsg && (
        <div className="px-4 py-3 bg-gold/10 border border-gold/30 rounded-xl text-sm text-gold">
          {errorMsg}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={dict.inquiry.name} error={errors.name?.message}>
          <input {...register('name')} placeholder="John Doe" className={inputCls(!!errors.name)} />
        </Field>
        <Field label={dict.inquiry.email} error={errors.email?.message}>
          <input {...register('email')} type="email" placeholder="john@example.com" className={inputCls(!!errors.email)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={dict.inquiry.phone} error={errors.phone?.message}>
          <input {...register('phone')} placeholder="+880 1700-000000" className={inputCls(!!errors.phone)} />
        </Field>
        <Field label={dict.inquiry.service} error={errors.service?.message}>
          <select {...register('service')} className={inputCls(!!errors.service)}>
            <option value="">Select a service</option>
            {Object.entries(SERVICE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={dict.inquiry.message} error={errors.message?.message}>
        <textarea
          {...register('message')}
          rows={4}
          placeholder={dict.inquiry.messagePlaceholder}
          className={inputCls(!!errors.message) + ' resize-none'}
        />
      </Field>

      <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
        {isSubmitting ? dict.inquiry.submitting : dict.inquiry.submit}
      </Button>

      <RecaptchaNotice className="text-center mt-1" />
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-primary">{label}</label>
      {children}
      {error && <span className="text-xs text-gold">{error}</span>}
    </div>
  )
}

function inputCls(hasError: boolean): string {
  return `px-4 py-3 border rounded-xl text-sm bg-white transition-colors focus:outline-none focus:ring-2 w-full ${
    hasError
      ? 'border-gold/40 focus:ring-gold/40 focus:border-gold'
      : 'border-[#E5E7EC] focus:ring-secondary/20 focus:border-secondary'
  }`
}
