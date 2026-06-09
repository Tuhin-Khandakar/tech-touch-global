'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/design/Logo'
import RecaptchaNotice from '@/components/common/RecaptchaNotice'
import { useRecaptcha } from '@/hooks/useRecaptcha'

interface LoginResponse {
  success: boolean
  error?: string
}

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error,    setError]    = useState<string>('')
  const [loading,  setLoading]  = useState<boolean>(false)
  const { execute: getRecaptchaToken } = useRecaptcha()

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const recaptcha_token = await getRecaptchaToken('admin_login').catch(() => '')
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password, recaptcha_token }),
      })
      const data = (await res.json()) as LoginResponse
      if (res.ok && data.success) {
        // Authed: hop straight to the dashboard. Use replace so the back
        // button can't take the user back to /admin/login.
        router.replace('/admin')
        router.refresh()
      } else {
        const msg = data.error === 'captcha_failed'
          ? 'Verification failed. Please refresh the page and try again.'
          : (data.error ?? 'Invalid username or password')
        setError(msg)
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-5">
            <Logo size="xl" onDark />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">Manage your website</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1A2236] rounded-2xl p-6 border border-[rgba(255,255,255,0.12)]">
          {error && (
            <div className="mb-4 px-4 py-3 bg-gold/10 border border-gold/20 rounded-xl text-sm text-gold">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-[rgba(255,255,255,0.82)] mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 bg-primary border border-[rgba(255,255,255,0.12)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary placeholder-[rgba(255,255,255,0.40)]"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[rgba(255,255,255,0.82)] mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-primary border border-[rgba(255,255,255,0.12)] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary placeholder-[rgba(255,255,255,0.40)]"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full px-4 py-3 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <RecaptchaNotice onDark className="text-center mt-4" />
        </form>
      </div>
    </div>
  )
}
