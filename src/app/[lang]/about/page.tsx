import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { getAllContent, getAboutValues, pick } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/page-seo'
import Container from '@/components/layout/Container'
import Section from '@/components/layout/Section'
import SectionLabel from '@/components/design/SectionLabel'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  const content = await getAllContent()
  const title       = pick(content, 'about.title',    lang as Locale, 'About Us')
  const description = pick(content, 'about.subtitle', lang as Locale, '')
  return buildPageMetadata('/about', lang as Locale, { title, description })
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)
  const [content, values] = await Promise.all([
    getAllContent(),
    getAboutValues(),
  ])
  const L = lang as Locale

  const heroTitle      = pick(content, 'about.title',          L, dict.about.title)
  const heroSubtitle   = pick(content, 'about.subtitle',       L, dict.about.subtitle)
  const missionEmoji   = pick(content, 'about.mission.emoji',  L, '🎯')
  const missionTitle   = pick(content, 'about.mission.title',  L, dict.about.mission.title)
  const missionBody    = pick(content, 'about.mission.body',   L, dict.about.mission.content)
  const visionEmoji    = pick(content, 'about.vision.emoji',   L, '🔭')
  const visionTitle    = pick(content, 'about.vision.title',   L, dict.about.vision.title)
  const visionBody     = pick(content, 'about.vision.body',    L, dict.about.vision.content)
  const valuesEyebrow  = pick(content, 'about.values.eyebrow', L, 'Our values')
  const valuesTitle    = pick(content, 'about.values.title',   L, 'Our Core Values')
  const valuesSubtitle = pick(content, 'about.values.subtitle',L, 'What guides everything we do')
  const storyEyebrow   = pick(content, 'about.story.eyebrow',  L, 'Our story')
  const storyTitle     = pick(content, 'about.story.title',    L, 'Our Story')
  const storyParas: string[] = [
    pick(content, 'about.story.paragraph_1', L, ''),
    pick(content, 'about.story.paragraph_2', L, ''),
    pick(content, 'about.story.paragraph_3', L, ''),
  ].filter((p) => p.trim().length > 0)

  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <section className="grain py-20 md:py-28 lg:py-32" style={{ background: '#0F172A' }}>
        <Container>
          <SectionLabel light className="mb-6">About Us</SectionLabel>
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-display font-extrabold text-white tracking-[-0.04em] leading-[1.08] mb-6 max-w-2xl">
            {heroTitle}
          </h1>
          <p className="text-[1.0625rem] text-[rgba(255,255,255,0.82)] leading-[1.75] max-w-xl">
            {heroSubtitle}
          </p>
        </Container>
      </section>

      {/* Mission & Vision */}
      <Section bg="bg-white">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-secondary/8 to-accent/8 rounded-2xl p-8 border border-secondary/20">
            <div className="text-4xl mb-4">{missionEmoji}</div>
            <h2 className="text-2xl font-display font-extrabold text-primary mb-4 tracking-[-0.03em]">{missionTitle}</h2>
            <p className="text-muted leading-relaxed">{missionBody}</p>
          </div>
          <div className="bg-gradient-to-br from-primary/6 to-secondary/8 rounded-2xl p-8 border border-secondary/25">
            <div className="text-4xl mb-4">{visionEmoji}</div>
            <h2 className="text-2xl font-display font-extrabold text-primary mb-4 tracking-[-0.03em]">{visionTitle}</h2>
            <p className="text-muted leading-relaxed">{visionBody}</p>
          </div>
        </div>
      </Section>

      {/* Values */}
      {values.length > 0 && (
        <Section bg="bg-surface">
          <SectionLabel className="mb-4">{valuesEyebrow}</SectionLabel>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-display font-extrabold text-primary tracking-[-0.035em] mb-4">{valuesTitle}</h2>
          <p className="text-muted text-lg mb-12">{valuesSubtitle}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v) => {
              const title = L === 'bn' && v.title_bn       ? v.title_bn       : v.title_en
              const desc  = L === 'bn' && v.description_bn ? v.description_bn : v.description_en
              return (
                <div key={v.id} className="bg-white rounded-2xl p-6 border border-[#E5E7EC] shadow-card text-center">
                  <div className="text-4xl mb-4">{v.icon_emoji}</div>
                  <h3 className="font-display font-bold text-primary mb-2 tracking-[-0.02em]">{title}</h3>
                  <p className="text-sm text-muted">{desc}</p>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Story */}
      {storyParas.length > 0 && (
        <Section bg="bg-white">
          <div className="max-w-3xl mx-auto">
            <SectionLabel className="mb-4 justify-center">{storyEyebrow}</SectionLabel>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-display font-extrabold text-primary tracking-[-0.035em] mb-8 text-center">{storyTitle}</h2>
            <div className="space-y-5 text-muted leading-relaxed text-[1.0625rem]">
              {storyParas.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
