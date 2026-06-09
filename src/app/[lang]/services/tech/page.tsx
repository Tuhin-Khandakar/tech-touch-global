import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidLocale } from '@/lib/dictionaries'
import { buildPageMetadata } from '@/lib/page-seo'
import ServiceDetailView from '@/components/services/ServiceDetailView'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/services/tech', lang as Locale, { title: 'Technology Solutions' })
}

export default async function TechSolutionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  return (
    <ServiceDetailView
      slug="tech"
      lang={lang as Locale}
      fallback={{
        eyebrow:    'Technology Solutions',
        headline:   <>We build the tech that<br /><span className="gradient-brand">powers your business.</span></>,
        blurb:      'From a clean landing page to a full enterprise platform — we design, engineer, and ship software that works.',
        inquireUrl: `/${lang}/inquiry?service=tech`,
      }}
      process={[
        { n: '01', title: 'Discovery Call',     desc: 'We understand your goals, constraints, and timeline in a 30-minute session.' },
        { n: '02', title: 'Proposal & Scope',   desc: 'A clear, fixed-price proposal with deliverables, milestones, and timeline.' },
        { n: '03', title: 'Design & Build',     desc: 'Iterative development with regular demos. You see progress every week.' },
        { n: '04', title: 'Test & Launch',      desc: 'Thorough QA, staging review, then a smooth production deployment.' },
        { n: '05', title: 'Support & Grow',     desc: 'Post-launch support, monitoring, and ongoing enhancements as you scale.' },
      ]}
    />
  )
}
