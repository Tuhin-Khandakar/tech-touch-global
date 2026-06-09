'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Monitor, GraduationCap, FileText, BookOpen, Plane, TrendingUp, Globe } from 'lucide-react'
import Section from '@/components/layout/Section'
import SectionLabel from '@/components/design/SectionLabel'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale, ServiceCategory } from '@/types'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface CategoryCard {
  key: ServiceCategory
  dictKey: 'tech' | 'studyAbroad' | 'visa' | 'ielts' | 'travel' | 'investment' | 'exportImport'
  href: string
  Icon: React.ComponentType<{ className?: string }>
  /** One-line intro shown on the card — no sub-services, no lists */
  intro: string
  accent: 'primary' | 'secondary' | 'accent' | 'gold'
}

const CATEGORIES: CategoryCard[] = [
  { key: 'tech',           dictKey: 'tech',         href: '/services/tech',          Icon: Monitor,        intro: 'Software, web, mobile, AI, cloud and security — engineered end to end.',  accent: 'secondary' },
  { key: 'study-abroad',   dictKey: 'studyAbroad',  href: '/study-abroad',           Icon: GraduationCap,  intro: 'Counseling, admissions and pre-departure for top universities abroad.',   accent: 'accent'    },
  { key: 'visa',           dictKey: 'visa',         href: '/services/visa',          Icon: FileText,       intro: 'Complete documentation and processing for every visa category.',          accent: 'secondary' },
  { key: 'ielts-pte',      dictKey: 'ielts',        href: '/services/ielts-pte',     Icon: BookOpen,       intro: 'Structured coaching that lifts your band score quickly and reliably.',    accent: 'gold'      },
  { key: 'travel',         dictKey: 'travel',       href: '/services/travel',        Icon: Plane,          intro: 'Fully managed travel arrangements for individuals, families and groups.', accent: 'accent'    },
  { key: 'investment',     dictKey: 'investment',   href: '/services/investment',    Icon: TrendingUp,     intro: 'Strategy, planning and investor introductions for ambitious founders.',   accent: 'secondary' },
  { key: 'export-import',  dictKey: 'exportImport', href: '/services/export-import', Icon: Globe,          intro: 'Sourcing, documentation and logistics across global trade routes.',       accent: 'gold'      },
]

const ACCENT: Record<CategoryCard['accent'], { icon: string; chip: string; ring: string }> = {
  primary:   { icon: 'text-primary',   chip: 'bg-primary/8',   ring: 'group-hover:ring-primary/30'   },
  secondary: { icon: 'text-secondary', chip: 'bg-secondary/8', ring: 'group-hover:ring-secondary/30' },
  accent:    { icon: 'text-accent',    chip: 'bg-accent/8',    ring: 'group-hover:ring-accent/35'    },
  gold:      { icon: 'text-gold',      chip: 'bg-gold/10',     ring: 'group-hover:ring-gold/35'      },
}

interface Props { dict: Dictionary; lang: Locale }

export default function ServicesSection({ dict, lang }: Props) {
  const navLink = (href: string) => `/${lang}${href}`

  return (
    <Section bg="bg-white">
      {/* Header — restrained intro */}
      <div className="max-w-2xl mb-16 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
        >
          <SectionLabel className="mb-5">What we do</SectionLabel>
          <h2 className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-display font-extrabold text-primary tracking-[-0.035em] leading-[1.1]">
            Seven services.<br />
            <span className="gradient-brand">One trusted partner.</span>
          </h2>
          <p className="text-lg text-muted leading-relaxed mt-6 max-w-xl">
            Choose a category to learn more about how we can help.
          </p>
        </motion.div>
      </div>

      {/* 7 uniform category cards */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: 0.07, delayChildren: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {CATEGORIES.map((c) => {
          const accent = ACCENT[c.accent]
          const title = (dict.services[c.dictKey] as { title: string })?.title ?? c.dictKey
          return (
            <motion.div
              key={c.key}
              variants={{
                hidden:  { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
              }}
            >
              <Link
                href={navLink(c.href)}
                className={`group relative flex flex-col h-full min-h-[230px] p-7 rounded-2xl bg-white border border-[#E5E7EC] ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover ${accent.ring}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-7 ${accent.chip}`}>
                  <c.Icon className={`w-5 h-5 ${accent.icon}`} />
                </div>

                <h3 className="text-[1.125rem] font-display font-bold text-primary tracking-[-0.025em] leading-tight mb-2">
                  {title}
                </h3>

                <p className="text-[0.875rem] text-muted leading-relaxed mb-7">
                  {c.intro}
                </p>

                <div className="mt-auto flex items-center gap-1.5 text-[0.8125rem] font-semibold transition-all duration-300 group-hover:gap-2.5">
                  <span className={accent.icon}>Learn more</span>
                  <ArrowUpRight className={`w-3.5 h-3.5 ${accent.icon} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </Section>
  )
}
