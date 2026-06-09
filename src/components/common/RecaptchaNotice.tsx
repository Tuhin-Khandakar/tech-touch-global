import { cn } from '@/lib/utils'

interface RecaptchaNoticeProps {
  className?: string
  /** Use a darker palette suited for dark backgrounds (e.g. admin login). */
  onDark?: boolean
}

/**
 * Branding disclaimer required by Google when the floating reCAPTCHA badge
 * is hidden via CSS. Must be visibly displayed near every form protected
 * by reCAPTCHA.
 *
 * Reference:
 *   https://developers.google.com/recaptcha/docs/faq#id-like-to-hide-the-recaptcha-badge.-what-is-allowed
 */
export default function RecaptchaNotice({ className, onDark = false }: RecaptchaNoticeProps) {
  // Render nothing when reCAPTCHA is disabled (e.g. local dev without keys),
  // so the form doesn't show a misleading "protected by" line.
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return null

  const linkClass = onDark
    ? 'underline hover:text-white transition-colors'
    : 'underline hover:text-primary transition-colors'

  return (
    <p
      className={cn(
        'text-[0.6875rem] leading-snug',
        onDark ? 'text-[rgba(255,255,255,0.55)]' : 'text-muted',
        className,
      )}
    >
      This site is protected by reCAPTCHA and the Google{' '}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        Privacy Policy
      </a>{' '}
      and{' '}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        Terms of Service
      </a>{' '}
      apply.
    </p>
  )
}
