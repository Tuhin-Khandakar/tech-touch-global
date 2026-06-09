'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Google reCAPTCHA v3 client hook.
 *
 * Lazily injects the api.js script (only once per page, only when the hook
 * is mounted) and exposes:
 *   - execute(action): returns a fresh token for the given action name
 *   - ready:           true once grecaptcha is available
 *   - enabled:         true iff NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set
 *
 * Usage:
 *   const { execute, enabled } = useRecaptcha()
 *   const token = enabled ? await execute('inquiry') : ''
 *   await fetch('/api/inquiries', { body: JSON.stringify({ ...data, recaptcha_token: token }) })
 *
 * The server is the source of truth — verifyRecaptcha() rejects bad/low-score
 * tokens. This hook is just plumbing for the browser side.
 */
interface GrecaptchaApi {
  ready:   (cb: () => void) => void
  execute: (siteKey: string, opts: { action: string }) => Promise<string>
}

interface WindowWithGrecaptcha extends Window {
  grecaptcha?: GrecaptchaApi
}

const SCRIPT_ID = 'google-recaptcha-v3'

function injectScript(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      // Script already in DOM — wait for grecaptcha to be ready
      if ((window as WindowWithGrecaptcha).grecaptcha) {
        resolve()
        return
      }
      existing.addEventListener('load',  () => resolve())
      existing.addEventListener('error', () => reject(new Error('recaptcha_load_failed')))
      return
    }

    const s = document.createElement('script')
    s.id    = SCRIPT_ID
    s.src   = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    s.async = true
    s.defer = true
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('recaptcha_load_failed'))
    document.head.appendChild(s)
  })
}

interface UseRecaptchaApi {
  execute: (action: string) => Promise<string>
  ready:   boolean
  enabled: boolean
}

export function useRecaptcha(): UseRecaptchaApi {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''
  const enabled = Boolean(siteKey)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    injectScript(siteKey)
      .then(() => { if (!cancelled) setReady(true) })
      .catch(() => { if (!cancelled) setReady(false) })
    return () => { cancelled = true }
  }, [enabled, siteKey])

  const execute = useCallback((action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!enabled) {
        // No key configured — return empty token so the form still submits in dev
        resolve('')
        return
      }
      const grecaptcha = (window as WindowWithGrecaptcha).grecaptcha
      if (!grecaptcha) {
        reject(new Error('recaptcha_not_ready'))
        return
      }
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve).catch(reject)
      })
    })
  }, [enabled, siteKey])

  return { execute, ready, enabled }
}
