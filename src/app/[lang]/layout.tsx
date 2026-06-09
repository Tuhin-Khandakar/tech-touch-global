import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import { getSiteSettings } from '@/lib/site-settings'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import LiveChat from '@/components/common/LiveChat'
import type { Locale } from '@/types'

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'bn' }]
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isValidLocale(lang)) notFound()

  const [dict, settings] = await Promise.all([
    getDictionary(lang as Locale),
    getSiteSettings(),
  ])

  return (
    <div className="flex flex-col min-h-screen" lang={lang}>
      <Header
        dict={dict}
        lang={lang as Locale}
        branding={{
          companyName: settings.company.name,
          logoUrl:     settings.media.logoUrl,
          logoAlt:     settings.media.logoAlt,
        }}
      />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} lang={lang as Locale} />
      <WhatsAppButton />
      <LiveChat />
    </div>
  )
}
