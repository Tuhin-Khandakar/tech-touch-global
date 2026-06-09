'use client'

import { motion } from 'framer-motion'
import Section from '@/components/layout/Section'
import SectionLabel from '@/components/design/SectionLabel'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface StatTile {
  n:     string
  l:     string
  color: string
}

interface FeatureItem {
  key:         string
  title:       string
  description: string
}

interface WhyChooseUsViewProps {
  title: string
  stats: StatTile[]
  items: FeatureItem[]
}

/**
 * Animated client-side render of the "Why Choose Us" section. Data is
 * resolved server-side by <WhyChooseUs/>.
 */
export default function WhyChooseUsView({ title, stats, items }: WhyChooseUsViewProps) {
  return (
    <Section>
      <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-start">

        {/* LEFT — stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
        >
          <SectionLabel className="mb-5">Why we stand out</SectionLabel>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-display font-extrabold text-primary tracking-[-0.035em] leading-[1.1] mb-14">
            {title}
          </h2>

          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.09, delayChildren: 0.15 }}
            className="grid grid-cols-2 gap-px border border-[#E5E7EC] overflow-hidden rounded-2xl shadow-card"
          >
            {stats.map(({ n, l, color }, i) => (
              <motion.div
                key={`${l}-${i}`}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
                }}
                className="flex flex-col gap-1 p-7 bg-white hover:bg-surface transition-colors"
              >
                <span className={`text-[2.75rem] font-display font-extrabold tracking-[-0.05em] leading-none ${color}`}>
                  {n}
                </span>
                <span className="text-xs font-medium text-muted tracking-wide uppercase mt-1">
                  {l}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — numbered feature list */}
        <div className="divide-y divide-[#E5E7EC]">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
              className="group flex items-start gap-5 py-7 first:pt-0 last:pb-0"
            >
              <span className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-surface border border-[#E5E7EC] flex items-center justify-center text-[11px] font-bold text-muted group-hover:bg-secondary group-hover:text-white group-hover:border-secondary transition-all duration-200">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[0.9375rem] font-display font-bold text-primary mb-1.5 tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-[0.84rem] text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}
