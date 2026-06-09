'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  asChild?: boolean
}

const styles = {
  base: 'inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 active:scale-[0.975]',

  variant: {
    primary:   'bg-secondary text-white shadow-brand hover:shadow-brand-hover hover:bg-secondary hover:-translate-y-px',
    secondary: 'bg-white text-primary border border-[#E5E7EC] shadow-card hover:shadow-card-hover hover:border-secondary/30 hover:-translate-y-px',
    ghost:     'text-secondary hover:bg-secondary/6',
    gold:      'bg-gold text-white hover:bg-gold shadow-[0_6px_20px_rgba(245,158,11,0.30)]',
  },

  size: {
    sm: 'h-9  px-4   text-sm  rounded-xl  gap-1.5',
    md: 'h-11 px-6   text-sm  rounded-xl',
    lg: 'h-14 px-8   text-base rounded-2xl',
  },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(styles.base, styles.variant[variant], styles.size[size], className)}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export default Button
