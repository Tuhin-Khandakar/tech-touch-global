import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { buildPageMetadata } from '@/lib/page-seo'
import HeroSection     from '@/components/home/HeroSection'
import StatsStrip      from '@/components/home/StatsStrip'
import ServicesSection from '@/components/home/ServicesSection'
import WhyChooseUs     from '@/components/home/WhyChooseUs'
import Testimonials    from '@/components/home/Testimonials'
import ContactCTA      from '@/components/home/ContactCTA'
import type { Locale, Testimonial } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/', lang as Locale)
}

/**
 * Homepage — deliberately minimal "intro" composition.
 *   Hero → Stats strip → 7 category cards → Why us → Testimonials → CTA.
 * Detailed content lives on the inner service / study-abroad pages.
 */
export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  const dict = await getDictionary(lang as Locale)

  let testimonials: Testimonial[] = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('testimonials').select('*').eq('published', true)
      .order('display_order', { ascending: true })
      .order('created_at',    { ascending: false })
      .limit(3)
    testimonials = data ?? []
  } catch { /* render-time safety: section hides itself if no rows */ }

  return (
    <>
      <HeroSection     dict={dict} lang={lang as Locale} />
      <StatsStrip      lang={lang as Locale} />
      <ServicesSection dict={dict} lang={lang as Locale} />
      <WhyChooseUs     dict={dict} lang={lang as Locale} />
      <Testimonials    dict={dict} lang={lang as Locale} testimonials={testimonials} />
      <ContactCTA      dict={dict} lang={lang as Locale} />
    </>
  )
}
