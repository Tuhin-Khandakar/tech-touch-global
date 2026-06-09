import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { buildPageMetadata } from '@/lib/page-seo'
import type { Locale, GalleryItem } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/gallery', lang as Locale, { title: 'Gallery' })
}

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  let items: GalleryItem[] = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false })
    items = data ?? []
  } catch { /* db not configured */ }

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.gallery.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.gallery.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-muted text-lg">{dict.gallery.noItems}</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm border border-[#EEF0F4] hover:shadow-md transition-shadow">
                  <img
                    src={item.image_url}
                    alt={lang === 'bn' && item.title_bn ? item.title_bn : item.title}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium text-primary">
                      {lang === 'bn' && item.title_bn ? item.title_bn : item.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{item.category}</p>
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
