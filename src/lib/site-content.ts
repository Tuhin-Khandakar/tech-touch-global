import { unstable_cache as nextCache, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/types'

/**
 * Cached loader for editable text content + small structured tables that
 * power the homepage and other public pages.
 *
 *   home_stats           — 4-tile stats strip
 *   why_choose_us_items  — numbered feature list
 *   site_content         — bilingual key/value text (hero, section labels, etc.)
 */

export interface HomeStat {
  id:            string
  number_text:   string
  label_en:      string
  label_bn:      string
  hint_en:       string
  hint_bn:       string
  display_order: number
  published:     boolean
}

export interface WhyItem {
  id:            string
  title_en:      string
  title_bn:      string
  body_en:       string
  body_bn:       string
  display_order: number
  published:     boolean
}

export interface AboutValue {
  id:             string
  icon_emoji:     string
  title_en:       string
  title_bn:       string
  description_en: string
  description_bn: string
  display_order:  number
  published:      boolean
}

export interface SiteContentRow {
  key:        string
  value_en:   string
  value_bn:   string
  group_name: string
  kind:       string
}

async function loadStats(): Promise<HomeStat[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('home_stats')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error || !data) return []
    return data as HomeStat[]
  } catch { return [] }
}

async function loadAboutValues(): Promise<AboutValue[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('about_values')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error || !data) return []
    return data as AboutValue[]
  } catch { return [] }
}

async function loadWhy(): Promise<WhyItem[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('why_choose_us_items')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error || !data) return []
    return data as WhyItem[]
  } catch { return [] }
}

async function loadContent(): Promise<Record<string, { en: string; bn: string }>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value_en, value_bn')
    if (error || !data) return {}
    const map: Record<string, { en: string; bn: string }> = {}
    for (const row of data as Pick<SiteContentRow, 'key' | 'value_en' | 'value_bn'>[]) {
      map[row.key] = { en: row.value_en, bn: row.value_bn }
    }
    return map
  } catch { return {} }
}

// Cached wrappers
const cachedStats        = nextCache(loadStats,        ['home-stats'],    { tags: ['home-stats'] })
const cachedWhy          = nextCache(loadWhy,          ['why-items'],     { tags: ['why-items'] })
const cachedAboutValues  = nextCache(loadAboutValues,  ['about-values'],  { tags: ['about-values'] })
const cachedContent      = nextCache(loadContent,      ['site-content'],  { tags: ['site-content'] })

export async function getHomeStats():    Promise<HomeStat[]>    { return cachedStats() }
export async function getWhyItems():     Promise<WhyItem[]>     { return cachedWhy() }
export async function getAboutValues():  Promise<AboutValue[]>  { return cachedAboutValues() }

/** Look up bilingual content by key. Returns the requested locale, falling back to the other. */
export async function getContent(key: string, lang: Locale, fallback = ''): Promise<string> {
  const map = await cachedContent()
  const entry = map[key]
  if (!entry) return fallback
  if (lang === 'bn' && entry.bn) return entry.bn
  return entry.en || entry.bn || fallback
}

/** Returns all keys at once so a page can resolve many in parallel without re-querying. */
export async function getAllContent(): Promise<Record<string, { en: string; bn: string }>> {
  return cachedContent()
}

export function pick(content: Record<string, { en: string; bn: string }>, key: string, lang: Locale, fallback = ''): string {
  const e = content[key]
  if (!e) return fallback
  if (lang === 'bn' && e.bn) return e.bn
  return e.en || e.bn || fallback
}

/** Bust home / content caches and re-render all pages under the root layout. */
export function invalidateHomeContent(): void {
  revalidatePath('/', 'layout')
}
