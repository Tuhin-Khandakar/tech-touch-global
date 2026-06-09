import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { getSiteSettings, pickLocale } from '@/lib/site-settings'
import { buildPageMetadata } from '@/lib/page-seo'
import InquiryForm from '@/components/forms/InquiryForm'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/contact', lang as Locale, { title: 'Contact Us' })
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  const [dict, settings] = await Promise.all([
    getDictionary(lang as Locale),
    getSiteSettings(),
  ])
  const L = lang as Locale

  const contactItems = [
    { icon: Phone,  label: dict.contact.phone,   value: settings.contact.phone, href: settings.contact.phone ? `tel:${settings.contact.phone}`   : undefined },
    { icon: Mail,   label: dict.contact.email,   value: settings.contact.email, href: settings.contact.email ? `mailto:${settings.contact.email}` : undefined },
    { icon: MapPin, label: dict.contact.address, value: pickLocale(settings.contact.address, L), href: '#map' },
    {
      icon:  Clock,
      label: dict.contact.hours,
      value: [pickLocale(settings.hours.weekdays, L), pickLocale(settings.hours.weekend, L)].filter(Boolean).join(' · '),
      href:  undefined,
    },
  ].filter((i) => i.value)

  const socials = [
    { url: settings.social.facebook, color: 'bg-secondary text-white hover:bg-secondary-dark',          path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/> },
    { url: settings.social.linkedin, color: 'bg-secondary-dark text-white hover:bg-primary',            path: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></> },
    { url: settings.social.youtube,  color: 'bg-gold text-white hover:opacity-90',                       path: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></> },
  ].filter((s) => !!s.url)

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.contact.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.contact.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-14">
            {/* Contact info */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-8">Get in Touch</h2>
              <div className="space-y-5 mb-10">
                {contactItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-secondary/8 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary mb-0.5">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-muted hover:text-secondary transition-colors">{item.value}</a>
                      ) : (
                        <span className="text-sm text-muted">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              {socials.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-semibold text-primary mb-4">{dict.contact.followUs}</h3>
                  <div className="flex gap-3">
                    {socials.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${s.color}`}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">{s.path}</svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {settings.maps.embedUrl && (
                <div id="map" className="rounded-2xl overflow-hidden border border-[#E5E7EC] h-64">
                  <iframe
                    src={settings.maps.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${settings.company.name} Office Location`}
                  />
                </div>
              )}
            </div>

            {/* Inquiry form */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-8">Send Us a Message</h2>
              <InquiryForm dict={dict} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
