import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'muted'
  className?: string
}

const variantClasses = {
  primary: 'bg-secondary/8 text-secondary border border-secondary/20',
  secondary: 'bg-surface text-primary border border-[#E5E7EC]',
  accent: 'bg-accent/8 text-accent border border-accent/25',
  gold: 'bg-gold/10 text-gold border border-gold/25',
  success: 'bg-accent/10 text-accent border border-accent/25',
  warning: 'bg-gold/10 text-gold border border-gold/25',
  danger: 'bg-gold/10 text-gold border border-gold/30',
  muted: 'bg-surface text-[rgba(255,255,255,0.55)] border border-[#EEF0F4]',
}

export default function Badge({ children, variant = 'primary', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
