'use client'

import { motion } from 'framer-motion'
import Container from '@/components/layout/Container'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface StatItem {
  number: string
  label: string
  hint?: string
}

interface StatsStripViewProps {
  stats: StatItem[]
}

/**
 * Client-side animated view for the stats strip.
 * Data is loaded server-side in <StatsStrip/> (Server Component) and passed
 * in via props — keeps the runtime JS slim while motion stays interactive.
 */
export default function StatsStripView({ stats }: StatsStripViewProps) {
  return (
    <section
      className="relative bg-white border-y border-[#E5E7EC]"
      aria-label="Track record"
    >
      <Container>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#E5E7EC]"
        >
          {stats.map((s, i) => (
            <motion.div
              key={`${s.label}-${i}`}
              variants={{
                hidden:  { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
              }}
              className={[
                'flex flex-col gap-1.5 py-8 md:py-10 px-6 md:px-10',
                i === 0 ? 'pl-0' : '',
                i === stats.length - 1 ? 'pr-0' : '',
              ].join(' ')}
            >
              <div className="text-[clamp(2.25rem,4vw,3rem)] font-display font-extrabold tracking-[-0.045em] leading-none">
                <span className="gradient-brand">{s.number}</span>
              </div>
              <div className="text-sm font-semibold text-primary tracking-tight">
                {s.label}
              </div>
              {s.hint && (
                <div className="text-xs text-muted leading-snug">
                  {s.hint}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
