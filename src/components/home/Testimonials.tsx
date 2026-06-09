'use client'

import { motion } from 'framer-motion'
import Section from '@/components/layout/Section'
import SectionLabel from '@/components/design/SectionLabel'
import type { Dictionary } from '@/lib/dictionaries'
import type { Locale, Testimonial } from '@/types'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface Props {
  dict:         Dictionary
  lang:         Locale
  testimonials: Testimonial[]
}

function pick(en: string, bn: string, lang: Locale): string {
  if (lang === 'bn' && bn && bn.trim().length > 0) return bn
  return en
}

export default function Testimonials({ dict, lang, testimonials }: Props) {
  if (testimonials.length === 0) return null
  const items = testimonials.slice(0, 3)
  const [featured, ...secondary] = items

  const featuredContent = pick(featured.content, featured.content_bn ?? '', lang)
  const featuredName    = pick(featured.name,    featured.name_bn    ?? '', lang)
  const featuredRole    = pick(featured.role,    featured.role_bn    ?? '', lang)

  return (
    <Section bg="bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
        className="mb-16 text-center"
      >
        <SectionLabel className="mb-4 justify-center">Testimonials</SectionLabel>
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-display font-extrabold text-primary tracking-[-0.035em]">
          {dict.testimonials.title}
        </h2>
      </motion.div>

      {/* Featured pull-quote */}
      <motion.div
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
        className="relative mb-12 rounded-3xl overflow-hidden grain"
        style={{ background: '#0F172A' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 15% 50%, rgba(37,99,235,0.18) 0%, transparent 55%)' }}
        />

        <div className="relative px-8 sm:px-16 py-16 sm:py-20">
          <span
            className="absolute top-6 left-8 sm:left-16 gradient-gold font-display font-extrabold select-none pointer-events-none"
            style={{ fontSize: 'clamp(6rem,12vw,10rem)', lineHeight: 1, opacity: 0.2 }}
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <blockquote className="relative max-w-3xl mx-auto text-center">
            <p className="text-[clamp(1.1rem,2.5vw,1.5rem)] font-display font-medium text-white leading-[1.55] tracking-[-0.02em] mb-10">
              &ldquo;{featuredContent}&rdquo;
            </p>

            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: featured.rating ?? 5 }).map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-gold text-gold" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Avatar avatar={featured.avatar} name={featuredName} size={40} fontSize="text-sm" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white font-display tracking-[-0.01em]">{featuredName}</p>
                {featuredRole && <p className="text-xs text-[rgba(255,255,255,0.65)]">{featuredRole}</p>}
              </div>
            </div>
          </blockquote>
        </div>
      </motion.div>

      {/* Secondary quotes */}
      {secondary.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {secondary.slice(0, 2).map((t, i) => {
            const content = pick(t.content, t.content_bn ?? '', lang)
            const name    = pick(t.name,    t.name_bn    ?? '', lang)
            const role    = pick(t.role,    t.role_bn    ?? '', lang)
            return (
              <motion.figure
                key={t.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
                className="flex flex-col p-7 rounded-2xl bg-surface border border-[#E5E7EC] shadow-card"
              >
                <blockquote className="flex-1">
                  <p className="text-[0.9rem] text-primary/80 leading-relaxed italic mb-6">
                    &ldquo;{content}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <Avatar avatar={t.avatar} name={name} size={36} fontSize="text-xs" />
                  <div>
                    <p className="text-sm font-semibold text-primary font-display tracking-[-0.01em]">{name}</p>
                    {role && <p className="text-xs text-muted">{role}</p>}
                  </div>
                </figcaption>
              </motion.figure>
            )
          })}
        </div>
      )}
    </Section>
  )
}

function Avatar({ avatar, name, size, fontSize }: { avatar?: string; name: string; size: number; fontSize: string }) {
  const isUrl = avatar && /^https?:|^\//i.test(avatar)
  return (
    <div
      className="rounded-full bg-gradient-to-br from-brand to-glow flex items-center justify-center text-white font-bold overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {isUrl
        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
        : <span className={fontSize}>{(name || '?').charAt(0).toUpperCase()}</span>}
    </div>
  )
}
