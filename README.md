# Tech Touch Global Services

Premium multi-service corporate website for **Tech Touch Global Services** (Bangladesh) — technology, study abroad, visa, IELTS/PTE, travel, investment, and export/import consultancy. Bilingual EN / বাংলা.

## Stack

- **Next.js 16** (App Router, React Server Components, `proxy.ts`)
- **TypeScript** + **Tailwind v4**
- **Supabase** — Postgres + Storage + Realtime + RLS
- **Cabinet Grotesk / General Sans / Anek Bangla** typography
- **reCAPTCHA v3** on public forms
- Cookie-based HMAC-signed admin auth

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + admin secrets
npm run dev
```

Run the SQL migrations against your Supabase project in order:

1. `supabase-schema.sql`
2. `supabase-cms-migration.sql`
3. `supabase-settings-keys.sql`
4. `supabase-phase7-about.sql`
5. `supabase-security-hardening.sql` (RLS hardening)

Create a public Storage bucket called `media`.

## Architecture

- `src/app/[lang]/` — public site, locale-prefixed (`en` / `bn`)
- `src/app/admin/(panel)/` — auth-guarded admin shell, full CMS
- `src/app/api/` — REST routes (public + `/admin/*` for CRUD)
- `src/lib/` — cached server helpers (`getSiteSettings`, `getAllContent`, `getAboutValues`, etc.)
- `src/components/` — UI primitives, layout, admin chrome, public sections

Content lives in Supabase tables and is edited entirely from `/admin`. Server helpers wrap reads in `unstable_cache`; admin saves call `revalidatePath('/', 'layout')` so the public site picks up changes without a restart.

## Brand palette

`#0F172A` primary · `#2563EB` secondary · `#06B6D4` accent · `#F59E0B` gold · `#FFFFFF` white

(WhatsApp green `#25D366` is reserved for the WhatsApp button.)

## Deploy

Designed for **Vercel**. Push to `main`, set the env vars in the Vercel dashboard, and the build picks up the same `.env.local` keys.
