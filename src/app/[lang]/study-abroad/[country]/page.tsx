import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, GraduationCap, Banknote, Award, FileCheck, Calendar, Briefcase, Building2 } from 'lucide-react'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import SectionLabel from '@/components/design/SectionLabel'
import type { Locale, StudyCountry } from '@/types'

/**
 * Public country detail page.
 *
 * No more hardcoded `VALID` whitelist or `STATIC` content blob — the page
 * looks up the country by slug in `study_countries` and 404s if it isn't
 * found or isn't published. New countries added via /admin/study-abroad
 * appear here immediately.
 */
export async function generateStaticParams() {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('study_countries')
      .select('slug')
      .eq('published', true)
    return (data ?? []).map((row: { slug: string }) => ({ country: row.slug }))
  } catch {
    return []
  }
}

async function loadCountry(slug: string): Promise<StudyCountry | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_countries')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
    if (error || !data) return null
    return data as StudyCountry
  } catch {
    return null
  }
}

export default async function CountryPage({ params }: { params: Promise<{ lang: string; country: string }> }) {
  const { lang, country } = await params
  if (!isValidLocale(lang)) notFound()
  const L = lang as Locale

  const [dict, data] = await Promise.all([
    getDictionary(L),
    loadCountry(country),
  ])
  if (!data) notFound()

  // Pick bilingual fields
  const name        = (L === 'bn' && data.name_bn)        ? data.name_bn        : data.name
  const description = (L === 'bn' && data.description_bn) ? data.description_bn : data.description

  const sections = dict.studyAbroad.sections as Record<string, string>

  const INFO = [
    { Icon: Banknote,  key: 'tuition',     value: data.tuition_range     },
    { Icon: Award,     key: 'scholarship', value: data.scholarship_info  },
    { Icon: FileCheck, key: 'visa',        value: data.visa_process      },
    { Icon: Calendar,  key: 'intake',      value: data.intake_dates      },
    { Icon: Briefcase, key: 'jobs',        value: data.job_opportunities },
  ]

  return (
    <div className="pt-[68px]" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Hero */}
      <section className="relative overflow-hidden grain section-gap" style={{ background: '#0F172A' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(37,99,235,0.18) 0%, transparent 55%)' }}
        />
        <div className="container-site relative z-10 flex flex-col lg:flex-row items-start gap-10">
          <div className="flex-1">
            <SectionLabel light className="mb-6">{dict.studyAbroad.title}</SectionLabel>
            <div className="flex items-center gap-5 mb-6">
              <span className="text-[4.5rem] leading-none">{data.flag_emoji || '🌍'}</span>
              <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display font-extrabold text-white tracking-[-0.04em] leading-[1.05]">
                Study in<br /><span className="gradient-brand">{name}</span>
              </h1>
            </div>
            {description && (
              <p className="text-[1.0625rem] text-[rgba(255,255,255,0.65)] leading-[1.75] max-w-xl mb-10">
                {description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/${lang}/inquiry?service=study-abroad`}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-secondary text-white font-semibold rounded-2xl shadow-brand hover:shadow-brand-hover hover:bg-secondary hover:-translate-y-0.5 transition-all text-[0.9375rem]"
              >
                {dict.studyAbroad.applyNow}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link href={`/${lang}/inquiry?service=study-abroad`}
                className="inline-flex items-center justify-center h-14 px-8 border border-white/12 text-white/70 font-semibold rounded-2xl hover:bg-white/6 hover:text-white transition-all text-[0.9375rem]"
              >
                {dict.studyAbroad.inquire}
              </Link>
            </div>
          </div>

          {data.image_url && (
            <div className="hidden lg:block w-[420px] rounded-3xl overflow-hidden shrink-0 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.image_url} alt={name} className="w-full aspect-[4/3] object-cover" />
            </div>
          )}
        </div>
      </section>

      {/* Info grid */}
      <section className="section-gap bg-surface">
        <div className="container-site">
          <SectionLabel className="mb-8">Key facts</SectionLabel>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INFO.map(({ Icon, key, value }) => (
              value ? (
                <div key={key} className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-[#E5E7EC] shadow-card">
                  <div className="w-9 h-9 rounded-xl bg-secondary/8 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-[0.8125rem] font-bold text-secondary uppercase tracking-[0.08em] mb-2">
                      {sections[key] ?? key}
                    </h3>
                    <p className="text-[0.875rem] text-primary/80 leading-relaxed whitespace-pre-wrap">{value}</p>
                  </div>
                </div>
              ) : null
            ))}

            {(data.top_universities ?? []).length > 0 && (
              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-[#E5E7EC] shadow-card lg:col-span-1">
                <div className="w-9 h-9 rounded-xl bg-secondary/8 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-[0.8125rem] font-bold text-secondary uppercase tracking-[0.08em] mb-3">
                    {sections.universities ?? 'Top Universities'}
                  </h3>
                  <ul className="space-y-1.5">
                    {(data.top_universities ?? []).map((u) => (
                      <li key={u} className="flex items-start gap-2 text-[0.8125rem] text-primary/75">
                        <GraduationCap className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-gap bg-white">
        <div className="container-site max-w-2xl text-center">
          <SectionLabel className="justify-center mb-6">Ready to apply?</SectionLabel>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-display font-extrabold text-primary tracking-[-0.04em] mb-5">
            Start your journey to<br />{name} today.
          </h2>
          <p className="text-[1rem] text-muted leading-relaxed mb-10">
            Book a free counseling session. We handle admissions, visa, and pre-departure — so you can focus on your future.
          </p>
          <Link href={`/${lang}/inquiry?service=study-abroad`}
            className="inline-flex items-center gap-2 h-14 px-10 bg-secondary text-white font-semibold rounded-2xl shadow-brand hover:shadow-brand-hover hover:bg-secondary hover:-translate-y-0.5 transition-all text-[0.9375rem]"
          >
            Book free counseling session
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
