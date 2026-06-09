-- ============================================================================
-- Phase 7 — About page editor
-- Idempotent. Adds about_values table + story keys + page_seo overrides.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── about_values ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_values (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icon_emoji    TEXT NOT NULL DEFAULT '✨',
  title_en      TEXT NOT NULL,
  title_bn      TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_bn TEXT NOT NULL DEFAULT '',
  display_order INT  NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_about_values_updated ON public.about_values;
CREATE TRIGGER trg_about_values_updated BEFORE UPDATE ON public.about_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.about_values (icon_emoji, title_en, title_bn, description_en, description_bn, display_order)
SELECT * FROM (VALUES
  ('🎯','Excellence',   'উৎকর্ষতা',        'We strive for the highest quality in every service we deliver.',                       'আমাদের প্রতিটি সেবায় সর্বোচ্চ মান বজায় রাখার চেষ্টা করি।',                 1),
  ('🤝','Integrity',    'সততা',           'Transparent, honest, and ethical in all our dealings.',                                'প্রতিটি লেনদেনে স্বচ্ছ, সৎ এবং নৈতিক।',                                       2),
  ('🌍','Global Vision','বৈশ্বিক দৃষ্টি',   'Thinking globally while serving our clients locally.',                                 'স্থানীয় ক্লায়েন্টদের সেবায় বৈশ্বিক চিন্তাধারা।',                              3),
  ('💡','Innovation',   'উদ্ভাবন',        'Continuously adopting new technologies and approaches.',                               'নতুন প্রযুক্তি ও পদ্ধতি ধারাবাহিকভাবে গ্রহণ।',                                4)
) AS s
WHERE NOT EXISTS (SELECT 1 FROM public.about_values);

-- ── about story + values heading content keys ──────────────────────────────
INSERT INTO public.site_content (key, value_en, value_bn, group_name, kind, description) VALUES
  ('about.values.eyebrow',   'Our values',                            'আমাদের মূল্যবোধ',                       'about','text','Eyebrow above values heading'),
  ('about.values.title',     'Our Core Values',                       'আমাদের মূল মূল্যবোধ',                  'about','text','Values section heading'),
  ('about.values.subtitle',  'What guides everything we do',          'যা আমাদের সবকিছুতে পথ দেখায়',           'about','text','Values section subtitle'),
  ('about.story.eyebrow',    'Our story',                             'আমাদের গল্প',                          'about','text','Story eyebrow'),
  ('about.story.title',      'Our Story',                             'আমাদের গল্প',                          'about','text','Story heading'),
  ('about.story.paragraph_1',
   'Tech Touch Global Services was founded with a singular vision: to become the most trusted multi-sector consultancy connecting Bangladeshi individuals and businesses to global opportunities.',
   'টেক টাচ গ্লোবাল সার্ভিসেস একটিমাত্র লক্ষ্য নিয়ে প্রতিষ্ঠিত হয়েছিল: বাংলাদেশী ব্যক্তি ও ব্যবসাকে বৈশ্বিক সুযোগের সাথে সংযোগকারী সবচেয়ে বিশ্বস্ত বহু-খাতের পরামর্শ সংস্থা হওয়া।',
   'about','rich','Story paragraph 1'),
  ('about.story.paragraph_2',
   'We started with technology services and quickly expanded into education consultancy, visa support, and travel — driven by the growing demand from our clients for comprehensive, reliable guidance across multiple domains.',
   'আমরা প্রযুক্তি সেবা দিয়ে শুরু করে দ্রুত শিক্ষা পরামর্শ, ভিসা সহায়তা এবং ভ্রমণে সম্প্রসারিত হয়েছি — ক্লায়েন্টদের ক্রমবর্ধমান চাহিদার দ্বারা পরিচালিত।',
   'about','rich','Story paragraph 2'),
  ('about.story.paragraph_3',
   'Today, with 500+ satisfied clients and partnerships across 20+ countries, we continue to grow — guided by our commitment to excellence, integrity, and client success.',
   'আজ ৫০০+ সন্তুষ্ট ক্লায়েন্ট ও ২০+ দেশে অংশীদারিত্ব নিয়ে আমরা উৎকর্ষতা, সততা এবং ক্লায়েন্ট সাফল্যের প্রতি আমাদের অঙ্গীকার দ্বারা পরিচালিত হয়ে এগিয়ে চলেছি।',
   'about','rich','Story paragraph 3'),
  ('about.mission.emoji',    '🎯', '🎯', 'about','text','Mission card emoji'),
  ('about.vision.emoji',     '🔭', '🔭', 'about','text','Vision card emoji')
ON CONFLICT (key) DO NOTHING;

-- ── page_seo: per-route SEO override (used by Phase 8) ─────────────────────
CREATE TABLE IF NOT EXISTS public.page_seo (
  route       TEXT PRIMARY KEY,             -- e.g. '/', '/about', '/services'
  title_en    TEXT NOT NULL DEFAULT '',
  title_bn    TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_bn TEXT NOT NULL DEFAULT '',
  og_image    TEXT NOT NULL DEFAULT '',
  noindex     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_page_seo_updated ON public.page_seo;
CREATE TRIGGER trg_page_seo_updated BEFORE UPDATE ON public.page_seo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.page_seo (route, title_en, title_bn, description_en, description_bn) VALUES
  ('/',         'Tech Touch Global Services',          'টেক টাচ গ্লোবাল সার্ভিসেস',          'Bangladesh''s premier multi-service consultancy: technology, study abroad, visa, travel, investment & global trade.', 'বাংলাদেশের প্রিমিয়ার বহুমুখী পরামর্শ সংস্থা: প্রযুক্তি, বিদেশে পড়াশোনা, ভিসা, ভ্রমণ, বিনিয়োগ ও আন্তর্জাতিক বাণিজ্য।'),
  ('/about',    'About Us',                            'আমাদের সম্পর্কে',                    'Learn about Tech Touch Global Services, our mission, vision, and the values that guide our work.', 'টেক টাচ গ্লোবাল সার্ভিসেস, আমাদের লক্ষ্য, দৃষ্টিভঙ্গি ও মূল্যবোধ সম্পর্কে জানুন।'),
  ('/services', 'Our Services',                        'আমাদের সেবা',                        'Seven services. One trusted partner. Technology, education, visa, IELTS, travel, investment, and import/export.', 'সাতটি সেবা। একজন বিশ্বস্ত অংশীদার।'),
  ('/study-abroad', 'Study Abroad',                    'বিদেশে পড়াশোনা',                    'Study abroad consultancy for top universities across 20+ destination countries.',                '২০+ দেশে সেরা বিশ্ববিদ্যালয়ে বিদেশে পড়াশোনার পরামর্শ।'),
  ('/blog',     'Blog & Resources',                    'ব্লগ ও সম্পদ',                       'Insights, guides, and updates from Tech Touch Global Services.', 'টেক টাচ গ্লোবাল সার্ভিসেস থেকে অন্তর্দৃষ্টি, গাইড এবং আপডেট।'),
  ('/contact',  'Contact Us',                          'যোগাযোগ',                            'Get in touch with Tech Touch Global Services. Free consultation available.', 'টেক টাচ গ্লোবাল সার্ভিসেসের সাথে যোগাযোগ করুন। বিনামূল্যে পরামর্শ উপলব্ধ।'),
  ('/payment',  'Make a Payment',                      'পেমেন্ট করুন',                       'Securely submit your payment via bKash, Nagad, or bank transfer.', 'বিকাশ, নগদ বা ব্যাঙ্ক ট্রান্সফারের মাধ্যমে নিরাপদে পেমেন্ট জমা দিন।'),
  ('/gallery',  'Gallery',                             'গ্যালারি',                           'A look at our work, events, and client success stories.', 'আমাদের কাজ, ইভেন্ট এবং ক্লায়েন্ট সাফল্যের গল্প।')
ON CONFLICT (route) DO NOTHING;

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.about_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_seo     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_about_values" ON public.about_values;
DROP POLICY IF EXISTS "anon_read_about_values"        ON public.about_values;
DROP POLICY IF EXISTS "service_role_all_page_seo"     ON public.page_seo;
DROP POLICY IF EXISTS "anon_read_page_seo"            ON public.page_seo;

CREATE POLICY "service_role_all_about_values" ON public.about_values FOR ALL    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_about_values"        ON public.about_values FOR SELECT TO anon          USING (published = true);

CREATE POLICY "service_role_all_page_seo"     ON public.page_seo     FOR ALL    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_page_seo"            ON public.page_seo     FOR SELECT TO anon          USING (true);
