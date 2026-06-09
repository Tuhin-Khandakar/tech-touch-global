import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  /** Allow wider max-width for full-bleed hero sections */
  wide?: boolean
}

/**
 * Single source of truth for horizontal containment.
 * max-width 1280px (1440px if wide), with responsive padding:
 *   24px mobile · 32px tablet · 48px desktop
 *
 * EVERY section's content must sit inside this. Nothing touches the viewport edge.
 */
export default function Container({ children, className, wide = false }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 sm:px-8 lg:px-12',
        wide ? 'max-w-[1440px]' : 'max-w-[1280px]',
        className
      )}
    >
      {children}
    </div>
  )
}
