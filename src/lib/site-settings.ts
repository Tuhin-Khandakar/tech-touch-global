import { unstable_cache as nextCache, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/types'

/**
 * Single source of truth for site_settings.
 *
 * Reads the key/value `site_settings` table once per request (memoized via
 * React cache) and once per N seconds across requests (Next.js fetch cache
 * with the 'site-settings' tag). After admin saves, /api/admin/settings
 * calls revalidateTag('site-settings') so the next request rebuilds.
 *
 * Public components import getSiteSettings() (or getSiteSetting('key')) from
 * here instead of reading process.env directly.
 */

const CACHE_TAG = 'site-settings'

// ── Raw row shape ────────────────────────────────────────────────────────
interface SettingRow {
  key:        string
  value:      string
  group_name: string
}

// ── Public structured view (only the keys the public site cares about) ──
export interface SiteSettings {
  company: {
    name:    string
    tagline: { en: string; bn: string }
  }
  contact: {
    phone:    string
    whatsapp: string
    email:    string
    address:  { en: string; bn: string }
  }
  social: {
    facebook: string
    linkedin: string
    youtube:  string
  }
  payments: {
    bkash:        string
    nagad:        string
    bankAccount:  string
    bankName:     string
    bankRouting:  string
  }
  hours: {
    weekdays: { en: string; bn: string }
    weekend:  { en: string; bn: string }
  }
  footer: {
    blurb: { en: string; bn: string }
  }
  media: {
    logoUrl:    string
    logoAlt:    string
    faviconUrl: string
    ogImageUrl: string
  }
  seo: {
    title:       { en: string; bn: string }
    description: { en: string; bn: string }
    keywords:    { en: string; bn: string }
  }
  maps: {
    embedUrl: string
  }
  /** Raw key/value bag for callers that need an obscure key */
  raw: Record<string, string>
}

// ── Fallback values used if a key is missing or the DB is unreachable ────
function envFallback(): SiteSettings {
  const env = (k: string, d = ''): string => process.env[k] ?? d
  return {
    company: {
      name:    'Tech Touch Global Services',
      tagline: { en: 'Your Gateway to Global Success.', bn: 'বৈশ্বিক সাফল্যের আপনার প্রবেশদ্বার।' },
    },
    contact: {
      phone:    env('NEXT_PUBLIC_PHONE'),
      whatsapp: env('NEXT_PUBLIC_WHATSAPP'),
      email:    env('NEXT_PUBLIC_EMAIL'),
      address:  { en: env('NEXT_PUBLIC_ADDRESS', 'Dhaka, Bangladesh'), bn: 'ঢাকা, বাংলাদেশ' },
    },
    social: {
      facebook: env('NEXT_PUBLIC_FACEBOOK'),
      linkedin: env('NEXT_PUBLIC_LINKEDIN'),
      youtube:  env('NEXT_PUBLIC_YOUTUBE'),
    },
    payments: {
      bkash:       env('NEXT_PUBLIC_BKASH_NUMBER'),
      nagad:       env('NEXT_PUBLIC_NAGAD_NUMBER'),
      bankAccount: env('NEXT_PUBLIC_BANK_ACCOUNT'),
      bankName:    env('NEXT_PUBLIC_BANK_NAME'),
      bankRouting: env('NEXT_PUBLIC_BANK_ROUTING'),
    },
    hours: {
      weekdays: { en: 'Sun – Thu: 9am – 6pm', bn: 'রবি – বৃহস্পতি: সকাল ৯টা – সন্ধ্যা ৬টা' },
      weekend:  { en: 'Friday & Saturday: Closed', bn: 'শুক্র ও শনি: বন্ধ' },
    },
    footer: {
      blurb: {
        en: 'A global technology, education, travel, and business solutions company — your one-stop partner for international success.',
        bn: 'একটি বৈশ্বিক প্রযুক্তি, শিক্ষা, ভ্রমণ ও ব্যবসা সমাধান কোম্পানি।',
      },
    },
    media: {
      logoUrl:    '/logo.jpeg',
      logoAlt:    'Tech Touch Global Services',
      faviconUrl: '',
      ogImageUrl: '',
    },
    seo: {
      title:       { en: 'Tech Touch Global Services', bn: 'টেক টাচ গ্লোবাল সার্ভিসেস' },
      description: { en: 'Technology, Education & Global Business — One-Stop Solutions.', bn: 'প্রযুক্তি, শিক্ষা ও বৈশ্বিক ব্যবসা।' },
      keywords:    { en: '', bn: '' },
    },
    maps: {
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d233668.37!2d90.279!3d23.780!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhaka!5e0!3m2!1sen!2sbd!4v1720000000000',
    },
    raw: {},
  }
}

// ── Build the structured view from the raw rows ─────────────────────────
function shape(raw: Record<string, string>): SiteSettings {
  const fallback = envFallback()
  // Use fallback for any missing key, otherwise the DB value
  const get = (key: string, fb: string): string => (raw[key] && raw[key] !== '' ? raw[key] : fb)
  return {
    company: {
      name:    get('company.name',       fallback.company.name),
      tagline: {
        en: get('company.tagline_en',    fallback.company.tagline.en),
        bn: get('company.tagline_bn',    fallback.company.tagline.bn),
      },
    },
    contact: {
      phone:    get('contact.phone',    fallback.contact.phone),
      whatsapp: get('contact.whatsapp', fallback.contact.whatsapp),
      email:    get('contact.email',    fallback.contact.email),
      address:  {
        en: get('contact.address_en',   fallback.contact.address.en),
        bn: get('contact.address_bn',   fallback.contact.address.bn),
      },
    },
    social: {
      facebook: get('social.facebook',  fallback.social.facebook),
      linkedin: get('social.linkedin',  fallback.social.linkedin),
      youtube:  get('social.youtube',   fallback.social.youtube),
    },
    payments: {
      bkash:       get('payments.bkash',        fallback.payments.bkash),
      nagad:       get('payments.nagad',        fallback.payments.nagad),
      bankAccount: get('payments.bank_account', fallback.payments.bankAccount),
      bankName:    get('payments.bank_name',    fallback.payments.bankName),
      bankRouting: get('payments.bank_routing', fallback.payments.bankRouting),
    },
    hours: {
      weekdays: {
        en: get('hours.weekdays_en', fallback.hours.weekdays.en),
        bn: get('hours.weekdays_bn', fallback.hours.weekdays.bn),
      },
      weekend: {
        en: get('hours.weekend_en',  fallback.hours.weekend.en),
        bn: get('hours.weekend_bn',  fallback.hours.weekend.bn),
      },
    },
    footer: {
      blurb: {
        en: get('footer.blurb_en', fallback.footer.blurb.en),
        bn: get('footer.blurb_bn', fallback.footer.blurb.bn),
      },
    },
    media: {
      logoUrl:    get('media.logo_url',     fallback.media.logoUrl),
      logoAlt:    get('media.logo_alt',     fallback.media.logoAlt),
      faviconUrl: get('media.favicon_url',  fallback.media.faviconUrl),
      ogImageUrl: get('media.og_image_url', fallback.media.ogImageUrl),
    },
    seo: {
      title: {
        en: get('seo.title_en',       fallback.seo.title.en),
        bn: get('seo.title_bn',       fallback.seo.title.bn),
      },
      description: {
        en: get('seo.description_en', fallback.seo.description.en),
        bn: get('seo.description_bn', fallback.seo.description.bn),
      },
      keywords: {
        en: get('seo.keywords_en',    fallback.seo.keywords.en),
        bn: get('seo.keywords_bn',    fallback.seo.keywords.bn),
      },
    },
    maps: {
      embedUrl: get('maps.embed_url', fallback.maps.embedUrl),
    },
    raw,
  }
}

// ── Cached loader ───────────────────────────────────────────────────────
async function loadRaw(): Promise<Record<string, string>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, group_name')
    if (error || !data) return {}
    const out: Record<string, string> = {}
    for (const row of data as SettingRow[]) {
      out[row.key] = row.value
    }
    return out
  } catch {
    return {}
  }
}

const cachedLoad = nextCache(loadRaw, ['site-settings-raw'], { tags: [CACHE_TAG] })

/** Get all settings as a structured object. Cached server-side, invalidated on admin save. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const raw = await cachedLoad()
  return shape(raw)
}

/** Look up a single setting by key with a sensible default. */
export async function getSiteSetting(key: string, fallback = ''): Promise<string> {
  const raw = await cachedLoad()
  return raw[key] && raw[key] !== '' ? raw[key] : fallback
}

/** Pick the EN or BN value of a bilingual pair, with safe fall-through. */
export function pickLocale(pair: { en: string; bn: string }, lang: Locale): string {
  return lang === 'bn' && pair.bn ? pair.bn : pair.en
}

/**
 * Called by the admin save handler to push the new settings live.
 * `revalidatePath('/', 'layout')` rebuilds every page under the root layout,
 * which is what we need because Header, Footer, WhatsApp and SEO all derive
 * from these settings.
 */
export function invalidateSiteSettings(): void {
  revalidatePath('/', 'layout')
}
