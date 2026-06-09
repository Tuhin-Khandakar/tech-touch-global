import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import Container from '@/components/layout/Container'
import Logo from '@/components/design/Logo'
import { getSiteSettings, pickLocale } from '@/lib/site-settings'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale } from '@/types'

interface FooterProps { dict: Dictionary; lang: Locale }

export default async function Footer({ dict, lang }: FooterProps) {
  const settings = await getSiteSettings()
  const navLink = (href: string): string => `/${lang}${href}`
  const year = new Date().getFullYear()

  const QUICK = [
    { l: dict.nav.home,    href: '/'       },
    { l: dict.nav.about,   href: '/about'  },
    { l: dict.nav.blog,    href: '/blog'   },
    { l: dict.nav.gallery, href: '/gallery'},
    { l: dict.nav.careers, href: '/careers'},
    { l: dict.nav.contact, href: '/contact'},
  ]

  const SERVICES = [
    { l: (dict.services.tech as { title: string }).title,         href: '/services/tech'         },
    { l: (dict.services.studyAbroad as { title: string }).title,  href: '/study-abroad'          },
    { l: (dict.services.visa as { title: string }).title,         href: '/services/visa'         },
    { l: (dict.services.ielts as { title: string }).title,        href: '/services/ielts-pte'    },
    { l: (dict.services.travel as { title: string }).title,       href: '/services/travel'       },
    { l: (dict.services.investment as { title: string }).title,   href: '/services/investment'   },
    { l: (dict.services.exportImport as { title: string }).title, href: '/services/export-import'},
  ]

  const socials = [
    { label: 'Facebook', url: settings.social.facebook, svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
    { label: 'LinkedIn', url: settings.social.linkedin, svg: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></> },
    { label: 'YouTube',  url: settings.social.youtube,  svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></> },
  ].filter((s) => !!s.url)

  const contactItems = [
    { Icon: Phone,  val: settings.contact.phone,                          href: settings.contact.phone  ? `tel:${settings.contact.phone}`     : undefined },
    { Icon: Mail,   val: settings.contact.email,                          href: settings.contact.email  ? `mailto:${settings.contact.email}` : undefined },
    { Icon: MapPin, val: pickLocale(settings.contact.address, lang),      href: undefined },
  ].filter((c) => !!c.val)

  return (
    <footer
      className="grain"
      style={{ background: '#060B17', fontFamily: 'var(--font-body)' }}
    >
      <Container className="pt-16 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1.3fr] gap-12 pb-14 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

          {/* Brand col */}
          <div>
            <Link href={navLink('/')} aria-label={`${settings.company.name} — Home`} className="inline-flex mb-5">
              <Logo size="lg" onDark src={settings.media.logoUrl || undefined} alt={settings.media.logoAlt || settings.company.name} />
            </Link>

            <p className="text-[0.84rem] text-[rgba(255,255,255,0.65)] leading-relaxed mb-6 max-w-[260px]">
              {pickLocale(settings.footer.blurb, lang)}
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5">
              {socials.map(({ label, url, svg }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center text-[rgba(255,255,255,0.65)] hover:text-white hover:border-secondary/50 transition-all duration-150"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current stroke-current" strokeWidth={0}>{svg}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.65)] mb-5">{dict.footer.quickLinks}</h4>
            <ul className="space-y-2.5">
              {QUICK.map(({ l, href }) => (
                <li key={href}>
                  <Link href={navLink(href)} className="text-[0.84rem] text-[rgba(255,255,255,0.65)] hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.65)] mb-5">{dict.footer.services}</h4>
            <ul className="space-y-2.5">
              {SERVICES.map(({ l, href }) => (
                <li key={href}>
                  <Link href={navLink(href)} className="text-[0.84rem] text-[rgba(255,255,255,0.65)] hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.65)] mb-5">{dict.footer.contact}</h4>
            <ul className="space-y-3.5">
              {contactItems.map(({ Icon, val, href }) => (
                <li key={val} className="flex items-start gap-3">
                  <Icon className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                  {href
                    ? <a href={href} className="text-[0.84rem] text-[rgba(255,255,255,0.65)] hover:text-white transition-colors">{val}</a>
                    : <span className="text-[0.84rem] text-[rgba(255,255,255,0.65)]">{val}</span>
                  }
                </li>
              ))}
            </ul>

            {settings.maps.embedUrl && (
              <div className="mt-5 rounded-xl overflow-hidden border h-28" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <iframe
                  src={settings.maps.embedUrl}
                  width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade" title={`${settings.company.name} office location`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[0.78rem] text-[rgba(255,255,255,0.65)]">
          <span>© {year} {settings.company.name}. {dict.footer.rights}</span>
          <div className="flex gap-5">
            <Link href={navLink('/privacy')} className="hover:text-[rgba(255,255,255,0.82)] transition-colors">{dict.footer.privacy}</Link>
            <Link href={navLink('/terms')}   className="hover:text-[rgba(255,255,255,0.82)] transition-colors">{dict.footer.terms}</Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
