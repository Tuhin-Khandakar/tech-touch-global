import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { getSiteSettings } from '@/lib/site-settings'
import { buildPageMetadata } from '@/lib/page-seo'
import PaymentForm from '@/components/forms/PaymentForm'
import type { Locale } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) return {}
  return buildPageMetadata('/payment', lang as Locale, { title: 'Make a Payment' })
}

export default async function PaymentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  const [dict, settings] = await Promise.all([
    getDictionary(lang as Locale),
    getSiteSettings(),
  ])

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <div className="text-5xl mb-4">💳</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.payment.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.payment.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-surface">
        <div className="container-custom max-w-2xl">
          <div className="bg-white rounded-3xl border border-[#EEF0F4] shadow-sm p-8 sm:p-10">
            <PaymentForm
              dict={dict}
              accounts={{
                bkash:       settings.payments.bkash,
                nagad:       settings.payments.nagad,
                bankAccount: settings.payments.bankAccount,
                bankName:    settings.payments.bankName,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
