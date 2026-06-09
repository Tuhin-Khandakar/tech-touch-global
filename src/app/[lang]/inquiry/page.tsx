import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/dictionaries'
import InquiryForm from '@/components/forms/InquiryForm'
import type { Locale } from '@/types'

export default async function InquiryPage({ params, searchParams }: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ service?: string }>
}) {
  const { lang } = await params
  const { service } = await searchParams
  if (!isValidLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)

  return (
    <div className="pt-24">
      <section className="hero-gradient py-20 text-white text-center">
        <div className="container-custom">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{dict.inquiry.title}</h1>
          <p className="text-lg text-[rgba(255,255,255,0.82)] max-w-xl mx-auto">{dict.inquiry.subtitle}</p>
        </div>
      </section>

      <section className="section-padding bg-surface">
        <div className="container-custom max-w-2xl">
          <div className="bg-white rounded-3xl border border-[#EEF0F4] shadow-sm p-8 sm:p-10">
            <InquiryForm dict={dict} defaultService={service ?? ''} />
          </div>
        </div>
      </section>
    </div>
  )
}
