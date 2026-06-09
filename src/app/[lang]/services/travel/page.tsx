import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import ServiceDetailView from '@/components/services/ServiceDetailView'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services/travel', lang as Locale, { title: 'Travel Services' })
}

export default async function TravelPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  return (
    <ServiceDetailView
      slug="travel"
      lang={lang as Locale}
      fallback={{
        eyebrow:    'Travel Services',
        headline:   <>Hassle-free travel, <span className="gradient-brand">end-to-end.</span></>,
        blurb:      'Flights, hotels, tour packages, Hajj & Umrah, group tours and visa-on-arrival — handled by our travel desk.',
        inquireUrl: `/${lang}/inquiry?service=travel`,
      }}
    />
  )
}
