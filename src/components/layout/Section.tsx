import { cn } from '@/lib/utils'
import Container from './Container'

interface SectionProps {
  children: React.ReactNode
  className?: string
  /** Background class — applied to the outer wrapper, not the container */
  bg?: string
  /** Use wider container (1440px) for hero-style sections */
  wide?: boolean
  /** HTML id for anchor links */
  id?: string
  /** Inline styles for the outer section (backgrounds etc.) */
  style?: React.CSSProperties
}

/**
 * Consistent vertical rhythm wrapper.
 * py-20 (80px) mobile · py-28 (112px) md · py-32 (128px) lg
 *
 * Wraps a <Container> automatically. Pass bg= for section background.
 */
export default function Section({ children, className, bg, wide, id, style }: SectionProps) {
  return (
    <section
      id={id}
      className={cn('py-20 md:py-28 lg:py-32', bg, className)}
      style={style}
    >
      <Container wide={wide}>{children}</Container>
    </section>
  )
}
