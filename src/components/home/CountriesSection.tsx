'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import Section from '@/components/layout/Section'
import SectionLabel from '@/components/design/SectionLabel'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale } from '@/types'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const COUNTRIES = [
  { slug: 'uk',       flag: '🇬🇧', name: 'United Kingdom',  tagline: 'World-class universities', stat: '£10k – £38k / yr', shade: 'from-primary to-secondary/85' },
  { slug: 'india',    flag: '🇮🇳', name: 'India',            tagline: 'Affordable excellence',    stat: '৳65k – ৳6.5L / yr', shade: 'from-gold/85 to-accent/85' },
  { slug: 'china',    flag: '🇨🇳', name: 'China',            tagline: 'CSC scholarships',         stat: '৳2.8L – ৳11.2L / yr', shade: 'from-primary-dark to-gold/80' },
  { slug: 'malaysia', flag: '🇲🇾', name: 'Malaysia',         tagline: 'English medium',           stat: '৳2.8L – ৳11.5L / yr', shade: 'from-secondary to-primary/85' },
]

export default function CountriesSection({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const navLink = (href: string) => `/${lang}${href}`

  return (
    <Section bg="bg-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
        >
          <SectionLabel className="mb-4">Study Abroad</SectionLabel>
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-display font-extrabold text-primary tracking-[-0.035em] leading-[1.1]">
            Choose your destination.
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="text-[0.9rem] text-muted max-w-xs leading-relaxed"
        >
          We handle admissions, visa, and pre-departure — end to end.
        </motion.p>
      </div>

      {/* Cards — EVEN aligned grid, no random offsets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {COUNTRIES.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
          >
            <Link
              href={navLink(`/study-abroad/${c.slug}`)}
              className="group relative flex flex-col h-72 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.shade}`} />
              <div className="absolute inset-0 bg-black/30" />

              <div className="relative flex flex-col h-full p-6">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300 mb-auto">
                  {c.flag}
                </span>
                <div>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-[0.12em] mb-1">
                    {c.tagline}
                  </p>
                  <h3 className="text-[1.05rem] font-display font-bold text-white tracking-[-0.02em] mb-3">
                    {c.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/90 bg-black/30 px-2.5 py-1 rounded-full border border-white/15">
                      {c.stat}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer nudge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.3, ease: EASE }}
        className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl bg-white border border-[#E5E7EC] shadow-card"
      >
        <p className="text-[0.9rem] font-medium text-primary">
          Not sure which country fits your profile and budget?
        </p>
        <Link
          href={navLink('/inquiry?service=study-abroad')}
          className="shrink-0 inline-flex items-center gap-2 h-11 px-6 bg-secondary text-white text-sm font-semibold rounded-xl shadow-brand hover:bg-secondary transition-all"
        >
          Free counseling session
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </Section>
  )
}
