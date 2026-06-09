import 'server-only'
import type { Locale } from '@/types'

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((m) => m.default),
  bn: () => import('@/dictionaries/bn.json').then((m) => m.default),
}

export function isValidLocale(locale: string): locale is Locale {
  return locale in dictionaries
}

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
