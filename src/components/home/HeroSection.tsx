'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Container from '@/components/layout/Container'
import WorldConnectivity from '@/components/design/WorldConnectivity'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale } from '@/types'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const lineVariants = {
  hidden:  { y: '104%' },
  visible: { y: 0 },
}

const HEADLINE_LINES = ['Technology,', 'Education &', 'Global Business']

interface HeroSectionProps { dict: Dictionary; lang: Locale }

export default function HeroSection({ dict, lang }: HeroSectionProps) {
  const navLink = (href: string) => `/${lang}${href}`

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden grain"
      style={{ background: '#0F172A' }}
    >
      {/* Mesh gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 90% 70% at 10% 30%, rgba(37,99,235,0.22) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 90% 70%, rgba(6,182,212,0.12) 0%, transparent 55%)',
            'radial-gradient(ellipse 40% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50%)',
          ].join(','),
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.5) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Content */}
      <Container wide className="relative z-10 flex-1 flex flex-col justify-center pt-32 pb-20">
        <div className="grid lg:grid-cols-[1fr_480px] gap-12 lg:gap-8 items-center">

          {/* LEFT — text */}
          <div className="max-w-[640px]">
            {/* Badge — on-dark-muted */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-3 mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-accent relative shrink-0">
                <span className="animate-ping absolute inset-0 rounded-full bg-accent opacity-60" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.82)]">
                Bangladesh&apos;s Premier Multi-Service Company
              </span>
            </motion.div>

            {/* Headline — curtain reveal */}
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.10, delayChildren: 0.25 }}
              className="mb-6"
            >
              {HEADLINE_LINES.map((line) => (
                <div key={line} className="overflow-hidden leading-[1.05]">
                  <motion.h1
                    variants={lineVariants}
                    transition={{ duration: 0.75, ease: EASE }}
                    className="text-[clamp(2.5rem,6vw,5.25rem)] font-display font-extrabold text-white tracking-[-0.04em]"
                  >
                    {line}
                  </motion.h1>
                </div>
              ))}
              {/* Accent line — gradient text, blue→cyan visible on dark */}
              <div className="overflow-hidden mt-1">
                <motion.div
                  variants={lineVariants}
                  transition={{ duration: 0.75, ease: EASE }}
                  className="text-[clamp(2.5rem,6vw,5.25rem)] font-display font-extrabold tracking-[-0.04em] gradient-brand leading-[1.05]"
                >
                  One-Stop Solutions.
                </motion.div>
              </div>
            </motion.div>

            {/* Subheadline — on-dark body */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="text-[1.0625rem] text-[rgba(255,255,255,0.82)] leading-[1.75] max-w-[480px] mb-10"
            >
              {dict.hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="flex flex-col sm:flex-row gap-3 mb-12"
            >
              {/* Primary CTA */}
              <Link
                href={navLink('/inquiry')}
                className="group inline-flex items-center justify-center gap-2.5 h-14 px-8 bg-secondary text-white text-[0.9375rem] font-semibold rounded-2xl shadow-brand hover:shadow-brand-hover hover:bg-secondary hover:-translate-y-0.5 transition-all duration-200"
              >
                {dict.hero.cta1}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {/* Ghost CTA — on-dark */}
              <Link
                href={navLink('/services')}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 border border-[rgba(255,255,255,0.25)] text-white text-[0.9375rem] font-semibold rounded-2xl hover:bg-white/10 hover:border-[rgba(255,255,255,0.45)] transition-all duration-200"
              >
                {dict.hero.cta2}
              </Link>
            </motion.div>
          </div>

          {/* RIGHT — globe */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="hidden lg:flex w-full h-[420px] shrink-0 items-center justify-center"
          >
            <WorldConnectivity />
          </motion.div>
        </div>
      </Container>

      {/* Fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #ffffff 0%, transparent 100%)' }}
      />
    </section>
  )
}
