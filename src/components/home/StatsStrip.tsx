import Container from '@/components/layout/Container'
import { getHomeStats } from '@/lib/site-content'
import type { Locale } from '@/types'
import StatsStripView from './StatsStripView'

interface StatItem {
  number: string
  label: string
  hint?: string
}

const FALLBACK_EN: StatItem[] = [
  { number: '500+', label: 'Clients served',   hint: 'across Bangladesh & abroad' },
  { number: '20+',  label: 'Countries',         hint: 'study, visa, trade routes' },
  { number: '95%',  label: 'Visa success rate', hint: 'over five years running' },
  { number: '5+',   label: 'Years experience',  hint: 'and rapidly growing'      },
]

interface StatsStripProps {
  lang: Locale
}

export default async function StatsStrip({ lang }: StatsStripProps) {
  const rows = await getHomeStats()

  const stats: StatItem[] = rows.length > 0
    ? rows.map((r) => ({
        number: r.number_text,
        label:  lang === 'bn' && r.label_bn ? r.label_bn : r.label_en,
        hint:   lang === 'bn' && r.hint_bn  ? r.hint_bn  : r.hint_en,
      }))
    : FALLBACK_EN

  return <StatsStripView stats={stats} />
}
