import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import ServiceDetailView from '@/components/services/ServiceDetailView'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services/investment', lang as Locale, { title: 'Investment & Startup Support' })
}

export default async function InvestmentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  return (
    <ServiceDetailView
      slug="investment"
      lang={lang as Locale}
      fallback={{
        eyebrow:    'Investment Support',
        headline:   <>Capital, structure, and <span className="gradient-brand">a path to scale.</span></>,
        blurb:      'Startup advisory, investor connections, pitch decks, business plans, and registration support for founders and SMEs.',
        inquireUrl: `/${lang}/inquiry?service=investment`,
      }}
    />
  )
}
