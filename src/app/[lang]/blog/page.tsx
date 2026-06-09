import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { buildPageMetadata } from '@/lib/page-seo'
import { formatDate } from '@/lib/utils'
import type { Locale, BlogPost } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/blog', lang as Locale, { title: 'Blog & Resources' })
}

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  let posts: BlogPost[] = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    posts = data ?? []
  } catch { /* db not configured */ }

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.blog.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.blog.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📰</div>
              <p className="text-muted text-lg">{dict.blog.noPosts}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/${lang}/blog/${post.slug}`} className="group flex flex-col bg-white border border-[#EEF0F4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {post.cover_image && (
                    <div className="h-48 bg-gradient-to-br from-secondary to-accent overflow-hidden">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  {!post.cover_image && (
                    <div className="h-48 bg-gradient-to-br from-secondary/10 to-accent/10 flex items-center justify-center text-6xl">
                      📰
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-secondary/8 text-secondary text-xs font-semibold rounded-full border border-secondary/20">{post.category}</span>
                      <span className="text-xs text-muted">{formatDate(post.created_at)}</span>
                    </div>
                    <h2 className="font-bold text-primary mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                      {lang === 'bn' && post.title_bn ? post.title_bn : post.title}
                    </h2>
                    <p className="text-sm text-muted leading-relaxed flex-1 line-clamp-3">
                      {lang === 'bn' && post.excerpt_bn ? post.excerpt_bn : post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-secondary">
                      {dict.blog.readMore} →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
