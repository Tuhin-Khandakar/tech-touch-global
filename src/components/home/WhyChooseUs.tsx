import { getHomeStats, getWhyItems } from '@/lib/site-content'
import type { Locale } from '@/types'
import type { Dictionary } from '@/lib/dictionaries'
import WhyChooseUsView from './WhyChooseUsView'

interface FallbackStat { n: string; l: string; color: string }
const FALLBACK_STATS: FallbackStat[] = [
  { n: '500+', l: 'Satisfied clients',   color: 'gradient-brand' },
  { n: '20+',  l: 'Countries served',    color: 'gradient-brand' },
  { n: '95%',  l: 'Visa success rate',   color: 'gradient-gold' },
  { n: '5+',   l: 'Years of expertise',  color: 'gradient-brand' },
]

interface WhyChooseUsProps {
  dict: Dictionary
  lang: Locale
}

/**
 * Server Component wrapper. Loads home_stats + why_choose_us_items from the
 * DB and falls back to the dictionary if the tables are empty. Hands the
 * resolved arrays to <WhyChooseUsView/> for the animated render.
 */
export default async function WhyChooseUs({ dict, lang }: WhyChooseUsProps) {
  const [statRows, whyRows] = await Promise.all([
    getHomeStats(),
    getWhyItems(),
  ])

  const stats = statRows.length > 0
    ? statRows.map((s, i) => ({
        n:     s.number_text,
        l:     lang === 'bn' && s.label_bn ? s.label_bn : s.label_en,
        // Highlight the third tile in gold to match the original design rhythm
        color: i === 2 ? 'gradient-gold' : 'gradient-brand',
      }))
    : FALLBACK_STATS

  const dictItems = Object.entries(dict.whyUs.items) as Array<[string, { title: string; description: string }]>

  const items = whyRows.length > 0
    ? whyRows.map((it) => ({
        key:         it.id,
        title:       lang === 'bn' && it.title_bn ? it.title_bn : it.title_en,
        description: lang === 'bn' && it.body_bn  ? it.body_bn  : it.body_en,
      }))
    : dictItems.map(([k, v]) => ({ key: k, title: v.title, description: v.description }))

  return <WhyChooseUsView title={dict.whyUs.title} stats={stats} items={items} />
}
