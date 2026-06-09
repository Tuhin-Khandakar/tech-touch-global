import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { buildPageMetadata } from '@/lib/page-seo'
import type { Locale, StudyCountry } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/study-abroad', lang as Locale, { title: 'Study Abroad' })
}

/**
 * Public Study-Abroad overview.
 *
 * Reads the list of published countries from the `study_countries` table.
 * New countries added via /admin/study-abroad appear here automatically
 * (the admin save handler calls revalidatePath() to rebuild this page).
 */
async function loadPublishedCountries(): Promise<StudyCountry[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_countries')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('name',         { ascending: true })
    if (error || !data) return []
    return data as StudyCountry[]
  } catch {
    return []
  }
}

export default async function StudyAbroadPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()
  const L = lang as Locale

  const [dict, countries] = await Promise.all([
    getDictionary(L),
    loadPublishedCountries(),
  ])

  const localized = (c: StudyCountry) => (L === 'bn' && c.name_bn ? c.name_bn : c.name)

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.studyAbroad.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.studyAbroad.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          {countries.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p>No countries available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-8 mb-16">
              {countries.map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/study-abroad/${c.slug}`}
                  className="group flex flex-col bg-white border-2 border-[#EEF0F4] rounded-3xl overflow-hidden hover:border-secondary hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {c.image_url ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image_url}
                        alt={localized(c)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary to-[#060B17] p-10 flex items-center justify-center">
                      <span className="text-8xl group-hover:scale-110 transition-transform duration-300">
                        {c.flag_emoji || '🌍'}
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-primary mb-4 group-hover:text-secondary transition-colors">
                      {localized(c)}
                    </h2>
                    {(L === 'bn' && c.description_bn ? c.description_bn : c.description) && (
                      <p className="text-sm text-muted mb-4 line-clamp-3 leading-relaxed">
                        {L === 'bn' && c.description_bn ? c.description_bn : c.description}
                      </p>
                    )}
                    {c.tuition_range && (
                      <p className="text-xs font-semibold text-secondary">{c.tuition_range}</p>
                    )}
                    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-secondary">
                      {dict.studyAbroad.inquire} →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Why study abroad */}
          <div className="bg-gradient-to-br from-secondary/8 to-secondary/6 border border-secondary/20 rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-primary text-center mb-8">Why Study Abroad with Us?</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: '🏛️', title: 'University Selection', desc: 'We match you with the right university for your profile and budget.' },
                { icon: '📝', title: 'Application Support', desc: 'Complete application management from SOP to enrollment.' },
                { icon: '✈️', title: 'Pre-Departure', desc: 'Travel, accommodation, and arrival support included.' },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <span className="text-4xl mb-3 block">{item.icon}</span>
                  <h3 className="font-bold text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
