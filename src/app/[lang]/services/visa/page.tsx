import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import ServiceDetailView from '@/components/services/ServiceDetailView'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services/visa', lang as Locale, { title: 'Visa Services' })
}

export default async function VisaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  return (
    <ServiceDetailView
      slug="visa"
      lang={lang as Locale}
      fallback={{
        eyebrow:    'Visa Services',
        headline:   <>End-to-end visa support, <span className="gradient-brand">handled for you.</span></>,
        blurb:      'Student, tourist, business, and family visas — we manage applications, documents, and embassy coordination from start to finish.',
        inquireUrl: `/${lang}/inquiry?service=visa`,
      }}
    />
  )
}
