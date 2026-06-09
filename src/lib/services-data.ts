import { unstable_cache as nextCache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/types'

export interface ServiceRow {
  id:           string
  slug:         string
  title_en:     string
  title_bn:     string
  intro_en:     string
  intro_bn:     string
  body_en:      string
  body_bn:      string
  icon_emoji:   string | null
  cover_image:  string | null
  accent:       'primary' | 'secondary' | 'accent' | 'gold'
  display_order: number
  published:    boolean
}

export interface ServiceItemRow {
  id:             string
  service_id:     string
  title_en:       string
  title_bn:       string
  description_en: string
  description_bn: string
  icon_emoji:     string
  display_order:  number
  published:      boolean
}

async function loadServices(): Promise<ServiceRow[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error || !data) return []
    return data as ServiceRow[]
  } catch { return [] }
}

async function loadAllItems(): Promise<ServiceItemRow[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error || !data) return []
    return data as ServiceItemRow[]
  } catch { return [] }
}

const cachedServices = nextCache(loadServices,  ['services'],      { tags: ['services'] })
const cachedItems    = nextCache(loadAllItems,  ['service-items'], { tags: ['service-items'] })

export async function getAllServices(): Promise<ServiceRow[]> { return cachedServices() }

export async function getServiceBySlug(slug: string): Promise<ServiceRow | null> {
  const all = await cachedServices()
  return all.find((s) => s.slug === slug) ?? null
}

export async function getServiceItems(serviceId: string): Promise<ServiceItemRow[]> {
  const all = await cachedItems()
  return all.filter((it) => it.service_id === serviceId)
}

export function pickServiceTitle(row: ServiceRow, lang: Locale): string {
  return lang === 'bn' && row.title_bn ? row.title_bn : row.title_en
}
export function pickServiceIntro(row: ServiceRow, lang: Locale): string {
  return lang === 'bn' && row.intro_bn ? row.intro_bn : row.intro_en
}
export function pickServiceBody(row: ServiceRow, lang: Locale): string {
  return lang === 'bn' && row.body_bn ? row.body_bn : row.body_en
}
export function pickItemTitle(item: ServiceItemRow, lang: Locale): string {
  return lang === 'bn' && item.title_bn ? item.title_bn : item.title_en
}
export function pickItemDescription(item: ServiceItemRow, lang: Locale): string {
  return lang === 'bn' && item.description_bn ? item.description_bn : item.description_en
}
