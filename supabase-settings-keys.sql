-- ============================================================================
-- Tech Touch Global — site_settings: image, bilingual SEO, business hours keys
-- Idempotent. Run after the main supabase-cms-migration.sql.
-- ============================================================================

BEGIN;

-- Insert (or no-op) the new keys so the admin UI has something to render.
INSERT INTO public.site_settings (key, value, description, group_name) VALUES
  -- Brand media (file uploads via /admin/settings)
  ('media.logo_url',      '/logo.jpeg', 'Site logo (header + footer)',     'media'),
  ('media.logo_alt',      'Tech Touch Global Services', 'Logo alt text',   'media'),
  ('media.favicon_url',   '',           'Browser tab icon',                'media'),
  ('media.og_image_url',  '',           'Default Open Graph share image',  'media'),

  -- Business hours (bilingual — paired with company.*)
  ('hours.weekdays_en',   'Sun – Thu: 9am – 6pm', 'Office hours (English)', 'general'),
  ('hours.weekdays_bn',   'রবি – বৃহস্পতি: সকাল ৯টা – সন্ধ্যা ৬টা', 'Office hours (Bangla)', 'general'),
  ('hours.weekend_en',    'Friday & Saturday: Closed', 'Weekend hours (English)', 'general'),
  ('hours.weekend_bn',    'শুক্র ও শনি: বন্ধ', 'Weekend hours (Bangla)', 'general'),

  -- Bilingual SEO defaults (replaces the legacy seo.default_* keys for new code)
  ('seo.title_en',
   'Tech Touch Global Services',
   'Default <title> (English)', 'seo'),
  ('seo.title_bn',
   'টেক টাচ গ্লোবাল সার্ভিসেস',
   'Default <title> (Bangla)', 'seo'),
  ('seo.description_en',
   'Technology, Education & Global Business — One-Stop Solutions. Study abroad, visa support, IELTS/PTE, travel, startup investment, and export-import services.',
   'Default meta description (English)', 'seo'),
  ('seo.description_bn',
   'প্রযুক্তি, শিক্ষা ও বৈশ্বিক ব্যবসা — সব সেবা এক জায়গায়। বিদেশে পড়াশোনা, ভিসা, আইইএলটিএস, ভ্রমণ ও আমদানি-রপ্তানি।',
   'Default meta description (Bangla)', 'seo'),
  ('seo.keywords_en',
   'software bangladesh, study abroad, ielts, visa, export import, travel agency, startup',
   'Default keywords (English)', 'seo'),
  ('seo.keywords_bn',
   'বাংলাদেশ সফটওয়্যার, বিদেশে পড়াশোনা, ভিসা, ট্রাভেল, স্টার্টআপ',
   'Default keywords (Bangla)', 'seo'),

  -- Footer blurb (bilingual — was hardcoded in dictionary, now editable)
  ('footer.blurb_en',
   'A global technology, education, travel, and business solutions company — your one-stop partner for international success.',
   'Footer description text (English)', 'general'),
  ('footer.blurb_bn',
   'একটি বৈশ্বিক প্রযুক্তি, শিক্ষা, ভ্রমণ ও ব্যবসা সমাধান কোম্পানি — আন্তর্জাতিক সাফল্যের আপনার এক জায়গায় অংশীদার।',
   'Footer description text (Bangla)', 'general')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- Verify:
--   SELECT key, group_name, left(value, 60) FROM public.site_settings ORDER BY group_name, key;
