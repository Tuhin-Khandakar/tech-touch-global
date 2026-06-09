import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import ServiceDetailView from '@/components/services/ServiceDetailView'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services/ielts-pte', lang as Locale, { title: 'IELTS / PTE Coaching' })
}

export default async function IeltsPtePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  return (
    <ServiceDetailView
      slug="ielts-pte"
      lang={lang as Locale}
      fallback={{
        eyebrow:    'IELTS / PTE Coaching',
        headline:   <>Score with confidence. <span className="gradient-brand">Test like a pro.</span></>,
        blurb:      'Structured prep, expert trainers, full-length mocks, and 1-on-1 speaking practice — engineered to lift your band.',
        inquireUrl: `/${lang}/inquiry?service=ielts-pte`,
      }}
    />
  )
}
