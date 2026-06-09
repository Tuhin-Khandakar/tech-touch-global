import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Wrap in a white rounded pill so the logo's white background looks
   *  intentional on dark surfaces (header over hero, footer, admin sidebar). */
  onDark?: boolean
  className?: string
  /** Accessible label override (defaults to brand name) */
  alt?: string
  /** When true, render only the icon-style square — squared off, no extra wrap */
  square?: boolean
  /** Visual priority hint for above-the-fold logos (header) */
  priority?: boolean
  /** Custom image source. Defaults to /logo.jpeg from /public. Pass a
   *  Supabase Storage public URL to use a logo uploaded via /admin/settings. */
  src?: string
}

const SIZES = {
  sm: { box: 'h-7',  px: 'px-1.5', img: 28 },
  md: { box: 'h-9',  px: 'px-2',   img: 36 },
  lg: { box: 'h-11', px: 'px-2.5', img: 44 },
  xl: { box: 'h-16', px: 'px-3',   img: 64 },
}

/**
 * Brand logo block.
 *
 * Source: /public/logo.jpeg — contains both the geometric mark and the
 * "Tech Touch / Global Services" wordmark, so this single element replaces
 * the gradient "T" badge + adjacent text used previously.
 *
 * The logo is a JPEG with a white background. On dark surfaces we wrap it
 * in a white rounded pill (onDark={true}) so it reads as a deliberate
 * sticker rather than a stray white rectangle.
 */
export default function Logo({
  size = 'md',
  onDark = false,
  square = false,
  className,
  alt = 'Tech Touch Global Services',
  priority = false,
  src = '/logo.jpeg',
}: LogoProps) {
  const cfg = SIZES[size]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center bg-white shrink-0 overflow-hidden',
        square ? 'aspect-square rounded-xl' : `${cfg.px} rounded-xl`,
        cfg.box,
        // Tiny ring on dark surfaces makes the pill edge sharp
        onDark && 'shadow-[0_2px_8px_rgba(0,0,0,0.18)]',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={cfg.img * 4}
        height={cfg.img * 4}
        priority={priority}
        className="h-full w-auto object-contain select-none"
        sizes={`${cfg.img}px`}
        draggable={false}
        unoptimized={src.startsWith('http')}
      />
    </span>
  )
}
