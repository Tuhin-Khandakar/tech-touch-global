import { cn } from '@/lib/utils'

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
  light?: boolean
}

export default function SectionLabel({ children, className, light = false }: SectionLabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[10px] font-body font-semibold uppercase tracking-[0.14em]',
        light
          ? 'text-[rgba(255,255,255,0.65)]'
          : 'text-secondary',
        className
      )}
    >
      <span className={cn('block w-4 h-px', light ? 'bg-[rgba(15,23,42,0.65)]' : 'bg-secondary')} />
      {children}
    </span>
  )
}
