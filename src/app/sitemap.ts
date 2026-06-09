import type { MetadataRoute } from 'next'

const baseUrl = 'https://techtouchglobalservices.com'

const staticPages = [
  '',
  '/about',
  '/services',
  '/services/tech',
  '/services/visa',
  '/services/ielts-pte',
  '/services/travel',
  '/services/investment',
  '/services/export-import',
  '/study-abroad',
  '/study-abroad/uk',
  '/study-abroad/india',
  '/study-abroad/china',
  '/study-abroad/malaysia',
  '/blog',
  '/gallery',
  '/contact',
  '/careers',
  '/inquiry',
  '/payment',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'bn']
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}${page}`])),
        },
      })
    }
  }

  return entries
}
