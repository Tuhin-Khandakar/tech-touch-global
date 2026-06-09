import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services', lang as Locale, { title: 'Our Services' })
}

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)
  const navLink = (href: string) => `/${lang}${href}`

  const services = [
    { key: 'tech', href: '/services/tech', icon: '💻', color: 'from-secondary to-accent' },
    { key: 'studyAbroad', href: '/study-abroad', icon: '🎓', color: 'from-secondary to-accent' },
    { key: 'visa', href: '/services/visa', icon: '📋', color: 'from-accent to-accent' },
    { key: 'ielts', href: '/services/ielts-pte', icon: '📝', color: 'from-gold to-gold' },
    { key: 'travel', href: '/services/travel', icon: '✈️', color: 'from-accent to-secondary' },
    { key: 'investment', href: '/services/investment', icon: '📈', color: 'from-accent to-accent' },
    { key: 'exportImport', href: '/services/export-import', icon: '🌐', color: 'from-gold to-gold' },
  ]

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.services.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.services.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => {
              const service = dict.services[s.key as keyof typeof dict.services] as { title: string; description: string; icon: string }
              return (
                <Link key={s.key} href={navLink(s.href)} className="group flex flex-col bg-white border-2 border-[#EEF0F4] rounded-3xl overflow-hidden hover:border-secondary hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`bg-gradient-to-br ${s.color} p-8 flex items-center justify-center`}>
                    <span className="text-6xl">{service.icon}</span>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">{service.title}</h2>
                    <p className="text-muted leading-relaxed mb-4">{service.description}</p>
                    <span className="text-sm font-semibold text-secondary">
                      {dict.services.learnMore} →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
