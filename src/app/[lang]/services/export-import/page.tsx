import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import ServiceDetailView from '@/components/services/ServiceDetailView'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services/export-import', lang as Locale, { title: 'Export & Import' })
}

export default async function ExportImportPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  return (
    <ServiceDetailView
      slug="export-import"
      lang={lang as Locale}
      fallback={{
        eyebrow:    'Export & Import',
        headline:   <>Open new markets, <span className="gradient-brand">trade with confidence.</span></>,
        blurb:      'Trade documentation, customs, supplier sourcing, and buyer connections — guidance across the entire export–import cycle.',
        inquireUrl: `/${lang}/inquiry?service=export-import`,
      }}
    />
  )
}
