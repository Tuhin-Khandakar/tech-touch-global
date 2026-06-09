import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-settings'
import './globals.css'

/**
 * Default site metadata — sourced from site_settings so the admin can edit
 * <title>, description, keywords and OG image without touching code.
 * Per-page metadata (generateMetadata) can override individual fields.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title       = settings.seo.title.en       || settings.company.name
  const description = settings.seo.description.en || settings.company.tagline.en
  const keywords    = settings.seo.keywords.en
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  return {
    title: {
      default:  title,
      template: `%s | ${settings.company.name}`,
    },
    description,
    keywords,
    openGraph: {
      type:        'website',
      locale:      'en_US',
      siteName:    settings.company.name,
      title,
      description,
      images:      settings.media.ogImageUrl ? [settings.media.ogImageUrl] : undefined,
    },
    icons: settings.media.faviconUrl
      ? { icon: settings.media.faviconUrl, apple: settings.media.faviconUrl }
      : undefined,
    robots: { index: true, follow: true },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Fontshare — Cabinet Grotesk (display) + General Sans (body) */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&f[]=general-sans@600,500,400&display=swap"
          rel="stylesheet"
        />
        {/* Google Fonts — Anek Bangla */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* suppressHydrationWarning on <body> so browser extensions injecting
          attributes like bis_skin_checked don't trip React hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
