import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SectionLabel from '@/components/design/SectionLabel'
import {
  getServiceBySlug,
  getServiceItems,
  pickServiceTitle,
  pickServiceIntro,
  pickServiceBody,
  pickItemTitle,
  pickItemDescription,
} from '@/lib/services-data'
import type { Locale } from '@/types'

interface Process {
  n:     string
  title: string
  desc:  string
}

interface Props {
  slug:    string
  lang:    Locale
  fallback: {
    eyebrow:    string
    headline:   React.ReactNode
    blurb:      string
    inquireUrl: string
  }
  /** Optional 5-step process. If omitted, the section is hidden. */
  process?: Process[]
  /** Optional override for the offerings section heading. */
  offeringsHeading?: { eyebrow: string; title: string }
}

export default async function ServiceDetailView({ slug, lang, fallback, process, offeringsHeading }: Props) {
  const service = await getServiceBySlug(slug)
  const items   = service ? await getServiceItems(service.id) : []

  const heroTitle  = service ? pickServiceTitle(service, lang) : ''
  const heroIntro  = service ? pickServiceIntro(service, lang) : fallback.blurb
  const longBody   = service ? pickServiceBody(service, lang)  : ''

  return (
    <div className="pt-[68px]" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden grain section-gap"
        style={{ background: '#0F172A' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 55%, rgba(37,99,235,0.2) 0%, transparent 55%)' }}
        />
        <div className="container-site relative z-10 max-w-3xl">
          <SectionLabel light className="mb-6">{fallback.eyebrow}</SectionLabel>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display font-extrabold text-white tracking-[-0.04em] leading-[1.08] mb-6">
            {heroTitle || fallback.headline}
          </h1>
          <p className="text-[1.0625rem] text-[rgba(255,255,255,0.65)] leading-[1.75] max-w-xl mb-10">
            {heroIntro}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={fallback.inquireUrl}
              className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-secondary text-white font-semibold rounded-2xl shadow-brand hover:shadow-brand-hover hover:bg-secondary hover:-translate-y-0.5 transition-all text-[0.9375rem]"
            >
              Get a free quote
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="inline-flex items-center justify-center h-14 px-8 border border-white/12 text-white/70 font-semibold rounded-2xl hover:bg-white/6 hover:text-white transition-all text-[0.9375rem]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* Offerings */}
      {items.length > 0 && (
        <section className="section-gap bg-surface">
          <div className="container-site">
            <div className="mb-12">
              <SectionLabel className="mb-4">{offeringsHeading?.eyebrow ?? 'What we offer'}</SectionLabel>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-display font-extrabold text-primary tracking-[-0.035em]">
                {offeringsHeading?.title ?? `${items.length} disciplines, one team.`}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col p-6 rounded-2xl bg-white border border-[#E5E7EC]/70 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-250"
                >
                  <span className="text-[2rem] mb-4 block">{item.icon_emoji}</span>
                  <h3 className="text-[0.9375rem] font-display font-bold text-primary mb-2 tracking-[-0.02em] leading-tight">
                    {pickItemTitle(item, lang)}
                  </h3>
                  <p className="text-[0.8125rem] text-muted leading-relaxed flex-1">
                    {pickItemDescription(item, lang)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Long-form body */}
      {longBody && (
        <section className="section-gap bg-white">
          <div className="container-site max-w-3xl">
            <div className="space-y-5 text-muted leading-relaxed text-[1.0625rem]" dangerouslySetInnerHTML={{ __html: longBody }} />
          </div>
        </section>
      )}

      {/* Process (optional, fallback only) */}
      {process && process.length > 0 && (
        <section className="section-gap bg-white">
          <div className="container-site">
            <div className="mb-12">
              <SectionLabel className="mb-4">How we work</SectionLabel>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-display font-extrabold text-primary tracking-[-0.035em]">
                A process built for clarity.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {process.map((step, i) => (
                <div key={step.n} className="relative flex flex-col gap-4 p-6 rounded-2xl bg-surface border border-[#E5E7EC]">
                  <span className="text-[2rem] font-display font-extrabold text-[#D0D4DC]">{step.n}</span>
                  {i < process.length - 1 && (
                    <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-4 h-px bg-[#D0D4DC]" />
                  )}
                  <div>
                    <h3 className="font-display font-bold text-primary text-[0.9375rem] mb-1.5 tracking-[-0.02em]">{step.title}</h3>
                    <p className="text-[0.8125rem] text-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-gap bg-surface">
        <div className="container-site">
          <div
            className="rounded-3xl grain overflow-hidden px-8 sm:px-16 py-16 text-center relative"
            style={{ background: '#0F172A' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,99,235,0.15) 0%, transparent 55%)' }}
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.55)] mb-4">Free estimate</p>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-display font-extrabold text-white tracking-[-0.04em] mb-5">
                Ready to start?
              </h2>
              <p className="text-[rgba(255,255,255,0.65)] text-[1rem] mb-10 max-w-md mx-auto leading-relaxed">
                Tell us about your project. We&apos;ll respond within one business day with a clear proposal.
              </p>
              <Link
                href={fallback.inquireUrl}
                className="inline-flex items-center gap-2 h-14 px-10 bg-white text-primary font-semibold rounded-2xl shadow-[0_8px_24px_rgba(255,255,255,0.1)] hover:bg-surface hover:-translate-y-0.5 transition-all text-[0.9375rem]"
              >
                Get free quote
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
