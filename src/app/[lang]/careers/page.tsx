import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import type { Locale, CareerOpening } from '@/types'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

export default async function CareersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  let openings: CareerOpening[] = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('career_openings')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    openings = data ?? []
  } catch { /* db not configured */ }

  const typeVariant: Record<string, 'primary' | 'gold' | 'success' | 'accent'> = {
    'full-time': 'primary',
    'part-time': 'gold',
    internship: 'accent',
    remote: 'success',
  }

  const typeLabels = dict.careers.type as Record<string, string>

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <div className="text-5xl mb-4">💼</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.careers.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.careers.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          {openings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted text-lg">{dict.careers.noOpenings}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {openings.map((job) => (
                <div key={job.id} className="bg-white border border-[#EEF0F4] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-secondary/30 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={typeVariant[job.type] ?? 'primary'}>
                          {typeLabels[job.type] ?? job.type}
                        </Badge>
                        <span className="text-xs text-muted">{job.department}</span>
                        <span className="text-xs text-muted">· {job.location}</span>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">
                        {lang === 'bn' && job.title_bn ? job.title_bn : job.title}
                      </h3>
                      <p className="text-sm text-muted line-clamp-2">
                        {lang === 'bn' && job.description_bn ? job.description_bn : job.description}
                      </p>
                    </div>
                    <Link
                      href={`/${lang}/inquiry?service=general`}
                      className="shrink-0 px-5 py-2.5 bg-secondary text-white font-semibold rounded-xl text-sm hover:bg-secondary-dark transition-colors"
                    >
                      {dict.careers.apply}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
