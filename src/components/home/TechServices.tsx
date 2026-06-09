'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import Container from '@/components/layout/Container'
import SectionLabel from '@/components/design/SectionLabel'
import type { Locale } from '@/types'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const ITEMS = [
  { icon: '🌐', title: 'Website Development',  desc: 'Next.js, React, high-performance web apps.' },
  { icon: '📱', title: 'Mobile Apps',           desc: 'iOS & Android with React Native / Flutter.' },
  { icon: '🖥️', title: 'Custom Software',       desc: 'ERP, CRM, SaaS platforms built to spec.' },
  { icon: '🔐', title: 'Cyber Security',        desc: 'Audits, pen testing, threat monitoring.' },
  { icon: '☁️', title: 'Cloud & DevOps',        desc: 'AWS, Azure, GCP · CI/CD pipelines.' },
  { icon: '🤖', title: 'AI Solutions',           desc: 'ML models, chatbots, process automation.' },
  { icon: '💼', title: 'IT Consulting',          desc: 'Digital transformation & road-mapping.' },
  { icon: '🖨️', title: 'Hardware & Networks',   desc: 'Workstations, servers, network setup.' },
]

export default function TechServices({ lang }: { lang: Locale }) {
  return (
    <section
      className="py-20 md:py-28 lg:py-32 relative overflow-hidden grain"
      style={{ background: '#0F172A' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/3 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 65%)',
          transform: 'translateY(-30%)',
        }}
      />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-start mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
          >
            <SectionLabel light className="mb-5">Technology</SectionLabel>
            <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-display font-extrabold text-white tracking-[-0.035em] leading-[1.1] mb-5">
              We build tech that<br />
              <span className="gradient-brand">powers growth.</span>
            </h2>
            <p className="text-[0.9375rem] text-[rgba(255,255,255,0.82)] leading-relaxed max-w-sm">
              End-to-end engineering services — from a landing page to a full enterprise platform.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.25 }}
            className="shrink-0 flex items-end"
          >
            <Link
              href={`/${lang}/services/tech`}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[rgba(255,255,255,0.82)] hover:text-white transition-colors"
            >
              All tech services
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.055, ease: EASE }}
              className="group glass rounded-2xl p-5 hover:bg-white/10 transition-all duration-200 hover:-translate-y-1 cursor-default"
            >
              <span className="text-[1.6rem] mb-3 block">{item.icon}</span>
              <h3 className="text-[0.875rem] font-display font-bold text-white mb-2 tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="text-[0.78rem] text-[rgba(255,255,255,0.82)] leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.45, ease: EASE }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-5"
        >
          <p className="text-[0.9rem] font-medium text-white">
            Get a free estimate — no commitment, no spam.
          </p>
          <Link
            href={`/${lang}/inquiry?service=tech`}
            className="shrink-0 inline-flex items-center gap-2 h-11 px-6 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary shadow-brand transition-all"
          >
            Request free quote
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </Container>
    </section>
  )
}
