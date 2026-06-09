'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Container from '@/components/layout/Container'
import Logo from '@/components/design/Logo'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale } from '@/types'

interface BrandingProp {
  companyName: string
  logoUrl:     string
  logoAlt:     string
}
interface HeaderProps {
  dict: Dictionary
  lang: Locale
  /** Site branding loaded server-side from site_settings */
  branding: BrandingProp
}

const SERVICES = [
  { key: 'tech',        href: '/services/tech',          icon: '💻' },
  { key: 'studyAbroad', href: '/study-abroad',           icon: '🎓' },
  { key: 'visa',        href: '/services/visa',          icon: '📋' },
  { key: 'ielts',       href: '/services/ielts-pte',     icon: '📝' },
  { key: 'travel',      href: '/services/travel',        icon: '✈️' },
  { key: 'investment',  href: '/services/investment',    icon: '📈' },
  { key: 'exportImport',href: '/services/export-import', icon: '🌐' },
]

const COUNTRIES = [
  { label: 'United Kingdom 🇬🇧', href: '/study-abroad/uk' },
  { label: 'India 🇮🇳',           href: '/study-abroad/india' },
  { label: 'China 🇨🇳',           href: '/study-abroad/china' },
  { label: 'Malaysia 🇲🇾',        href: '/study-abroad/malaysia' },
]

export default function Header({ dict, lang, branding }: HeaderProps) {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [svcOpen,   setSvcOpen]   = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const pathname = usePathname()

  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`
  // "transparent" mode only when on hero AND not scrolled
  const transparent = !scrolled && isHome

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const navLink = (href: string) => `/${lang}${href}`
  const other = lang === 'en' ? 'bn' : 'en'
  const otherLabel = lang === 'en' ? 'বাং' : 'EN'
  const switchPath = pathname.replace(`/${lang}`, `/${other}`)

  // Nav link styling based on transparent vs solid state
  const linkCls = cn(
    'px-3 py-2 rounded-xl text-[0.84rem] font-medium transition-all duration-150',
    transparent
      ? 'text-white hover:text-white hover:bg-white/10'
      : 'text-muted hover:text-primary hover:bg-surface'
  )

  const DROPDOWN = 'absolute top-full mt-2 bg-white border border-[#E5E7EC] shadow-[0_12px_32px_rgba(15,23,42,0.10)] rounded-2xl p-2 z-50 min-w-[220px]'

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        transparent
          ? 'bg-primary/40 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-white/95 backdrop-blur-xl border-b border-[#E5E7EC] shadow-[0_1px_0_rgba(15,23,42,0.04)]'
      )}
    >
      <Container>
        <nav className="flex items-center justify-between h-[68px]">

          {/* Brand logo — image contains both icon + wordmark */}
          <Link
            href={navLink('/')}
            aria-label={`${branding.companyName} — Home`}
            className="flex items-center group transition-transform hover:scale-[1.02]"
          >
            <Logo
              size="md"
              onDark={transparent}
              priority
              src={branding.logoUrl || undefined}
              alt={branding.logoAlt}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            <Link href={navLink('/')} className={cn(linkCls, pathname === navLink('/') && (transparent ? 'text-white bg-white/10' : 'text-primary bg-surface'))}>
              {dict.nav.home}
            </Link>
            <Link href={navLink('/about')} className={linkCls}>{dict.nav.about}</Link>

            {/* Services dropdown */}
            <div className="relative" onMouseEnter={() => setSvcOpen(true)} onMouseLeave={() => setSvcOpen(false)}>
              <button className={cn(linkCls, 'flex items-center gap-1')}>
                {dict.nav.services}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', svcOpen && 'rotate-180')} />
              </button>
              {svcOpen && (
                <div className={cn(DROPDOWN, 'left-1/2 -translate-x-1/2')}>
                  {SERVICES.map((s) => {
                    const title = (dict.services[s.key as keyof typeof dict.services] as { title: string })?.title ?? s.key
                    return (
                      <Link key={s.key} href={navLink(s.href)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.84rem] font-medium text-muted hover:text-secondary hover:bg-surface transition-colors"
                      >
                        <span className="w-5 text-center text-base">{s.icon}</span>
                        {title}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Study Abroad dropdown */}
            <div className="relative" onMouseEnter={() => setStudyOpen(true)} onMouseLeave={() => setStudyOpen(false)}>
              <button className={cn(linkCls, 'flex items-center gap-1')}>
                {dict.nav.studyAbroad}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', studyOpen && 'rotate-180')} />
              </button>
              {studyOpen && (
                <div className={cn(DROPDOWN, 'left-1/2 -translate-x-1/2 min-w-[180px]')}>
                  <Link href={navLink('/study-abroad')}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[0.84rem] font-semibold text-secondary hover:bg-secondary/8/60 transition-colors"
                  >
                    All countries →
                  </Link>
                  {COUNTRIES.map((c) => (
                    <Link key={c.href} href={navLink(c.href)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-[0.84rem] text-muted hover:text-secondary hover:bg-surface transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={navLink('/blog')}    className={linkCls}>{dict.nav.blog}</Link>
            <Link href={navLink('/contact')} className={linkCls}>{dict.nav.contact}</Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href={switchPath}
              className={cn(
                'hidden sm:inline-flex items-center h-8 px-3 rounded-lg border text-xs font-semibold transition-all duration-150',
                transparent
                  ? 'border-white/20 text-[rgba(255,255,255,0.82)] hover:border-white/40 hover:text-white'
                  : 'border-[#E5E7EC] text-muted hover:border-secondary/30 hover:text-secondary'
              )}
            >
              {otherLabel}
            </Link>
            <Link
              href={navLink('/inquiry')}
              className="hidden lg:inline-flex items-center h-9 px-5 rounded-xl text-[0.8125rem] font-semibold text-white bg-secondary hover:bg-secondary shadow-brand hover:shadow-brand-hover transition-all duration-200 hover:-translate-y-px"
            >
              {dict.nav.inquiry}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn('lg:hidden p-2 rounded-xl transition-colors', transparent ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-surface')}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E5E7EC] shadow-lg max-h-[80vh] overflow-y-auto">
          <Container className="py-4 flex flex-col gap-0.5">
            {[
              { label: dict.nav.home,    href: '/' },
              { label: dict.nav.about,   href: '/about' },
              { label: dict.nav.blog,    href: '/blog' },
              { label: dict.nav.contact, href: '/contact' },
              { label: dict.nav.careers, href: '/careers' },
            ].map(({ label, href }) => (
              <Link key={href} href={navLink(href)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-secondary hover:bg-surface transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 pb-1 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-muted">Services</div>
            {SERVICES.map((s) => {
              const title = (dict.services[s.key as keyof typeof dict.services] as { title: string })?.title ?? s.key
              return (
                <Link key={s.key} href={navLink(s.href)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-secondary hover:bg-surface ml-2 transition-colors"
                >
                  <span>{s.icon}</span>{title}
                </Link>
              )
            })}
            <div className="border-t border-[#E5E7EC] mt-3 pt-3 flex gap-2">
              <Link href={navLink('/inquiry')} className="flex-1 text-center h-11 flex items-center justify-center bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors">
                {dict.nav.inquiry}
              </Link>
              <Link href={switchPath} className="h-11 px-4 flex items-center justify-center border border-[#E5E7EC] text-sm font-semibold text-muted rounded-xl hover:border-secondary/30 hover:text-secondary transition-colors">
                {otherLabel}
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
