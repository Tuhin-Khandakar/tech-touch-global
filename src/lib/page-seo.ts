import { unstable_cache as nextCache, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export interface PageSeoRow {
  route:          string
  title_en:       string
  title_bn:       string
  description_en: string
  description_bn: string
  og_image:       string
  noindex:        boolean
}

async function loadAll(): Promise<Record<string, PageSeoRow>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('page_seo')
      .select('route, title_en, title_bn, description_en, description_bn, og_image, noindex')
    if (error || !data) return {}
    const map: Record<string, PageSeoRow> = {}
    for (const row of data as PageSeoRow[]) map[row.route] = row
    return map
  } catch { return {} }
}

const cachedSeo = nextCache(loadAll, ['page-seo'], { tags: ['page-seo'] })

export async function getAllPageSeo(): Promise<Record<string, PageSeoRow>> {
  return cachedSeo()
}

/**
 * Build a Next.js Metadata object from the page_seo row for `route` (e.g. '/about').
 * Falls back to provided defaults.
 */
export async function buildPageMetadata(
  route: string,
  lang:  Locale,
  fallback: { title?: string; description?: string } = {},
): Promise<Metadata> {
  const all = await cachedSeo()
  const row = all[route]
  if (!row) return { title: fallback.title, description: fallback.description }
  const title       = lang === 'bn' && row.title_bn       ? row.title_bn       : row.title_en       || fallback.title
  const description = lang === 'bn' && row.description_bn ? row.description_bn : row.description_en || fallback.description
  const meta: Metadata = { title, description }
  if (row.og_image) {
    meta.openGraph = { title, description, images: [row.og_image] }
    meta.twitter   = { card: 'summary_large_image', title, description, images: [row.og_image] }
  }
  if (row.noindex) meta.robots = { index: false, follow: false }
  return meta
}

export function invalidatePageSeo(): void {
  revalidatePath('/', 'layout')
}
