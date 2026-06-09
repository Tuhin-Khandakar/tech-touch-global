'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, Phone } from 'lucide-react'
import Container from '@/components/layout/Container'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale } from '@/types'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function ContactCTA({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const waNum = process.env.NEXT_PUBLIC_WHATSAPP?.replace(/\D/g, '') ?? ''
  const waUrl = `https://wa.me/${waNum}?text=Hello%20Tech%20Touch%20Global%2C%20I%20need%20assistance.`

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-surface">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
          className="relative rounded-3xl overflow-hidden grain px-8 sm:px-16 py-16 sm:py-20"
          style={{ background: '#0F172A' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'radial-gradient(ellipse 80% 70% at 5% 50%, rgba(37,99,235,0.22) 0%, transparent 55%)',
                'radial-gradient(ellipse 50% 60% at 95% 50%, rgba(6,182,212,0.12) 0%, transparent 50%)',
              ].join(','),
            }}
          />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.65)] mb-5">
                Free · No commitment
              </p>
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-display font-extrabold text-white tracking-[-0.04em] leading-[1.08] mb-5">
                {dict.cta.title}
              </h2>
              <p className="text-[1rem] text-[rgba(255,255,255,0.82)] leading-relaxed">
                {dict.cta.subtitle}
              </p>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
              <Link
                href={`/${lang}/inquiry`}
                className="group inline-flex items-center justify-center gap-2.5 h-14 px-10 bg-white text-primary text-[0.9375rem] font-semibold rounded-2xl shadow-[0_8px_24px_rgba(255,255,255,0.12)] hover:bg-surface hover:-translate-y-0.5 transition-all duration-200"
              >
                {dict.cta.button}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {waNum && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 h-14 px-10 border border-white/20 text-white text-[0.9375rem] font-semibold rounded-2xl hover:bg-white/8 hover:border-white/30 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  {dict.cta.whatsapp}
                </a>
              )}

              {process.env.NEXT_PUBLIC_PHONE && (
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}
                  className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.82)] hover:text-white transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {process.env.NEXT_PUBLIC_PHONE}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
