import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Locale } from '@/types'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  const supabase = createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const title = lang === 'bn' && post.title_bn ? post.title_bn : post.title
  const content = lang === 'bn' && post.content_bn ? post.content_bn : post.content

  return (
    <div className="pt-24">
      <article className="container-custom max-w-3xl py-16">
        <Link href={`/${lang}/blog`} className="inline-flex items-center gap-2 text-sm text-secondary hover:underline mb-8">
          ← {dict.blog.allPosts}
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-secondary/8 text-secondary text-sm font-semibold rounded-full border border-secondary/20">{post.category}</span>
          <span className="text-sm text-muted">{formatDate(post.created_at)}</span>
          <span className="text-sm text-muted">By {post.author}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-6 leading-tight">{title}</h1>

        {post.cover_image && (
          <div className="rounded-2xl overflow-hidden mb-8">
            <img src={post.cover_image} alt={title} className="w-full h-72 object-cover" />
          </div>
        )}

        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-secondary prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="mt-12 pt-8 border-t border-[#EEF0F4]">
          <Link href={`/${lang}/blog`} className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors">
            ← {dict.blog.allPosts}
          </Link>
        </div>
      </article>
    </div>
  )
}
