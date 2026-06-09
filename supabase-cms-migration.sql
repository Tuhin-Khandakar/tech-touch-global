-- ============================================================================
-- Tech Touch Global — CMS Migration
-- Idempotent. Safe to run multiple times.
-- Adds full content-management tables so the public site can be controlled
-- entirely from /admin without code changes.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Helper trigger: keep updated_at fresh ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

-- ============================================================================
-- 1. SITE SETTINGS  (singleton-style key/value)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  group_name  TEXT NOT NULL DEFAULT 'general',          -- contact | social | seo | payments
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default settings (only inserts if key missing)
INSERT INTO public.site_settings (key, value, description, group_name) VALUES
  ('company.name',       'Tech Touch Global Services',          'Company name shown in header / footer', 'general'),
  ('company.tagline_en', 'Your Gateway to Global Success.',     'English tagline',                       'general'),
  ('company.tagline_bn', 'বৈশ্বিক সাফল্যের আপনার প্রবেশদ্বার।', 'Bangla tagline',                        'general'),
  ('contact.phone',      '+8801624547667',                       'Primary phone number',                  'contact'),
  ('contact.whatsapp',   '+8801624547667',                       'WhatsApp number (with country code)',   'contact'),
  ('contact.email',      'info@techtouchglobal.com',             'Public email',                          'contact'),
  ('contact.address_en', 'Dhaka, Bangladesh',                    'Office address (English)',              'contact'),
  ('contact.address_bn', 'ঢাকা, বাংলাদেশ',                       'Office address (Bangla)',               'contact'),
  ('social.facebook',    'https://facebook.com/techtouchglobal','Facebook URL',                          'social'),
  ('social.linkedin',    'https://linkedin.com/company/techtouchglobal','LinkedIn URL',                  'social'),
  ('social.youtube',     'https://youtube.com/@techtouchglobal', 'YouTube URL',                           'social'),
  ('maps.embed_url',     'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d233668.37!2d90.279!3d23.780!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhaka!5e0!3m2!1sen!2sbd!4v1720000000000', 'Google Maps iframe embed URL', 'general'),
  ('payments.bkash',     '01624547667',                          'bKash personal number',                 'payments'),
  ('payments.nagad',     '01713679302',                          'Nagad personal number',                 'payments'),
  ('payments.bank_account','2629101075832',                      'Bank account number',                   'payments'),
  ('payments.bank_name', 'PUBALI BANK',                          'Bank name',                             'payments'),
  ('payments.bank_routing','175680676',                          'Bank routing number',                   'payments'),
  ('seo.default_title',  'Tech Touch Global Services',           'Default <title>',                       'seo'),
  ('seo.default_description', 'Technology, Education & Global Business — One-Stop Solutions.', 'Default meta description', 'seo'),
  ('seo.keywords',       'software bangladesh, study abroad, ielts, visa, export import', 'Default keywords', 'seo')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. SITE CONTENT  (every editable string on the public site)
--    key = a stable dot-path identifier (e.g. home.hero.headline)
--    Body lives in value_en + value_bn so locale rendering is a column pick.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  key         TEXT PRIMARY KEY,
  value_en    TEXT NOT NULL DEFAULT '',
  value_bn    TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL DEFAULT 'text'   CHECK (kind IN ('text','rich','number')),
  group_name  TEXT NOT NULL DEFAULT 'home',  -- home | about | services | study_abroad | global
  description TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_site_content_updated ON public.site_content;
CREATE TRIGGER trg_site_content_updated
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed editable strings for HOME PAGE
INSERT INTO public.site_content (key, value_en, value_bn, group_name, kind, description) VALUES
  ('home.hero.eyebrow',
    'Bangladesh''s Premier Multi-Service Company',
    'বাংলাদেশের প্রিমিয়ার বহুমুখী সেবা কোম্পানি',
    'home', 'text', 'Hero eyebrow tag above the headline'),
  ('home.hero.headline_l1',  'Technology,',          'প্রযুক্তি,',                      'home','text','Hero line 1'),
  ('home.hero.headline_l2',  'Education &',          'শিক্ষা ও',                         'home','text','Hero line 2'),
  ('home.hero.headline_l3',  'Global Business',      'বৈশ্বিক ব্যবসা',                 'home','text','Hero line 3'),
  ('home.hero.headline_l4',  'One-Stop Solutions.',  'এক জায়গায় সব সমাধান।',          'home','text','Hero accent line'),
  ('home.hero.subheadline',
    'Tech Touch Global Services helps individuals and businesses with technology solutions, study abroad consultancy, visa support, travel services, startup investment guidance, and global trade support.',
    'টেক টাচ গ্লোবাল সার্ভিসেস প্রযুক্তি সমাধান, বিদেশে পড়াশোনার পরামর্শ, ভিসা সহায়তা, ভ্রমণ সেবা, স্টার্টআপ বিনিয়োগ এবং আন্তর্জাতিক বাণিজ্যে আপনাকে সহায়তা করে।',
    'home','rich','Hero subheadline'),
  ('home.hero.cta_primary',    'Get Free Consultation', 'বিনামূল্যে পরামর্শ নিন', 'home','text','Hero primary button label'),
  ('home.hero.cta_secondary',  'Explore Services',      'সেবা দেখুন',              'home','text','Hero secondary button label'),

  ('home.services.eyebrow',    'What we do',                          'আমরা কী করি',                    'home','text',''),
  ('home.services.headline_a', 'Seven services.',                     'সাতটি সেবা।',                     'home','text',''),
  ('home.services.headline_b', 'One trusted partner.',                'একজন বিশ্বস্ত অংশীদার।',         'home','text',''),
  ('home.services.intro',      'Choose a category to learn more about how we can help.','আমরা কীভাবে সাহায্য করতে পারি তা জানতে একটি বিভাগ নির্বাচন করুন।','home','text',''),

  ('home.why.eyebrow',         'Why we stand out',                    'কেন আমরা আলাদা',                 'home','text',''),
  ('home.why.headline',        'Why Choose Us',                       'কেন আমাদের বেছে নেবেন',         'home','text',''),

  ('home.testimonials.eyebrow','Testimonials',                        'প্রশংসাপত্র',                     'home','text',''),
  ('home.testimonials.headline','What Our Clients Say',               'আমাদের ক্লায়েন্টরা কী বলেন',     'home','text',''),

  ('home.cta.eyebrow',         'Free · No commitment',                'বিনামূল্যে · কোনো বাধ্যবাধকতা নেই','home','text',''),
  ('home.cta.title',           'Book Your Free Consultation Today',   'আজই বিনামূল্যে পরামর্শ নিন',     'home','text',''),
  ('home.cta.subtitle',        'Talk to our experts and get a personalized plan — completely free.','আমাদের বিশেষজ্ঞদের সাথে কথা বলুন এবং একটি ব্যক্তিগতকৃত পরিকল্পনা পান — সম্পূর্ণ বিনামূল্যে।','home','rich',''),
  ('home.cta.button',          'Get Free Consultation',               'বিনামূল্যে পরামর্শ নিন',         'home','text',''),
  ('home.cta.whatsapp',        'Chat on WhatsApp',                    'হোয়াটসঅ্যাপে চ্যাট করুন',       'home','text',''),

  ('about.title',              'About Tech Touch Global Services',    'টেক টাচ গ্লোবাল সার্ভিসেস সম্পর্কে','about','text',''),
  ('about.subtitle',
    'A global technology, education, travel, and business solutions company headquartered in Bangladesh.',
    'বাংলাদেশে অবস্থিত একটি বৈশ্বিক প্রযুক্তি, শিক্ষা, ভ্রমণ এবং ব্যবসায়িক সমাধান কোম্পানি।',
    'about','rich',''),
  ('about.mission.title',      'Our Mission',                         'আমাদের লক্ষ্য',                  'about','text',''),
  ('about.mission.body',
    'To empower individuals and businesses with world-class technology, education, and global trade solutions — delivered with integrity, expertise, and care.',
    'সততা, দক্ষতা এবং যত্নের সাথে ব্যক্তি ও ব্যবসাকে বিশ্বমানের প্রযুক্তি, শিক্ষা এবং বৈশ্বিক বাণিজ্য সমাধান দিয়ে ক্ষমতায়িত করা।',
    'about','rich',''),
  ('about.vision.title',       'Our Vision',                          'আমাদের দৃষ্টিভঙ্গি',             'about','text',''),
  ('about.vision.body',
    'To be the most trusted multi-sector consultancy in South Asia, connecting our clients to global opportunities.',
    'দক্ষিণ এশিয়ার সবচেয়ে বিশ্বস্ত বহু-খাতের পরামর্শ সংস্থা হওয়া, আমাদের ক্লায়েন্টদের বৈশ্বিক সুযোগের সাথে সংযুক্ত করা।',
    'about','rich','')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 3. HOME STATS  (the four-cell strip on the homepage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.home_stats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number_text   TEXT NOT NULL,
  label_en      TEXT NOT NULL,
  label_bn      TEXT NOT NULL DEFAULT '',
  hint_en       TEXT NOT NULL DEFAULT '',
  hint_bn       TEXT NOT NULL DEFAULT '',
  display_order INT  NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_home_stats_updated ON public.home_stats;
CREATE TRIGGER trg_home_stats_updated
  BEFORE UPDATE ON public.home_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults (only on first run when table empty)
INSERT INTO public.home_stats (number_text, label_en, label_bn, hint_en, hint_bn, display_order)
SELECT * FROM (VALUES
  ('500+', 'Clients served',   'সেবা পেয়েছেন',    'across Bangladesh & abroad','বাংলাদেশ ও বিদেশে',   1),
  ('20+',  'Countries',        'দেশ',             'study, visa, trade routes', 'অধ্যয়ন, ভিসা, বাণিজ্য', 2),
  ('95%',  'Visa success rate','ভিসা সাফল্যের হার', 'over five years running',   'পাঁচ বছরে',           3),
  ('5+',   'Years experience', 'বছরের অভিজ্ঞতা',    'and rapidly growing',       'দ্রুত বৃদ্ধি পাচ্ছে',    4)
) AS s
WHERE NOT EXISTS (SELECT 1 FROM public.home_stats);

-- ============================================================================
-- 4. WHY-CHOOSE-US ITEMS  (numbered feature list on homepage + about-style use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.why_choose_us_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en      TEXT NOT NULL,
  title_bn      TEXT NOT NULL DEFAULT '',
  body_en       TEXT NOT NULL DEFAULT '',
  body_bn       TEXT NOT NULL DEFAULT '',
  display_order INT  NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_why_choose_us_updated ON public.why_choose_us_items;
CREATE TRIGGER trg_why_choose_us_updated
  BEFORE UPDATE ON public.why_choose_us_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.why_choose_us_items (title_en, title_bn, body_en, body_bn, display_order)
SELECT * FROM (VALUES
  ('Multi-Sector Expertise', 'বহু-খাতের দক্ষতা',         'From tech to education to trade — our team covers every domain with deep knowledge.', 'প্রযুক্তি থেকে শিক্ষা থেকে বাণিজ্য — আমাদের দল প্রতিটি ক্ষেত্রে গভীর জ্ঞান রাখে।',1),
  ('Global Network',         'বৈশ্বিক নেটওয়ার্ক',         'Partnerships with universities, embassies, companies, and institutions worldwide.',   'বিশ্বজুড়ে বিশ্ববিদ্যালয়, দূতাবাস, কোম্পানি এবং প্রতিষ্ঠানের সাথে অংশীদারিত্ব।',2),
  ('Technology-Driven',      'প্রযুক্তি-চালিত',            'We use the latest tools and platforms to deliver fast, accurate results for clients.','আমরা সর্বশেষ সরঞ্জাম এবং প্ল্যাটফর্ম ব্যবহার করে দ্রুত, নির্ভুল ফলাফল দিই।',3),
  ('Free Consultation',      'বিনামূল্যে পরামর্শ',          'Every client starts with a free consultation — no cost, no obligation.',                'প্রতিটি ক্লায়েন্ট বিনামূল্যে পরামর্শ দিয়ে শুরু করেন।',4),
  ('Affordable Services',    'সাশ্রয়ী সেবা',              'Transparent pricing with no hidden fees. Quality service at competitive rates.',        'কোনো লুকানো ফি নেই। প্রতিযোগিতামূলক মূল্যে মানসম্পন্ন সেবা।',5),
  ('24/7 Support',           '২৪/৭ সহায়তা',              'Our team is available around the clock to answer your questions and concerns.',         'আমাদের দল আপনার প্রশ্ন ও উদ্বেগের জন্য সর্বক্ষণ উপলব্ধ।',6)
) AS s
WHERE NOT EXISTS (SELECT 1 FROM public.why_choose_us_items);

-- ============================================================================
-- 5. SERVICES  (the 7 categories on /services) + SERVICE_ITEMS  (sub-services)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,        -- tech | visa | ielts-pte | travel | investment | export-import | study-abroad
  title_en        TEXT NOT NULL,
  title_bn        TEXT NOT NULL DEFAULT '',
  intro_en        TEXT NOT NULL DEFAULT '',
  intro_bn        TEXT NOT NULL DEFAULT '',
  body_en         TEXT NOT NULL DEFAULT '',    -- long-form detail
  body_bn         TEXT NOT NULL DEFAULT '',
  icon_name       TEXT NOT NULL DEFAULT 'monitor',  -- lucide icon name
  accent          TEXT NOT NULL DEFAULT 'secondary' CHECK (accent IN ('primary','secondary','accent','gold')),
  display_order   INT  NOT NULL DEFAULT 0,
  published       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_services_updated ON public.services;
CREATE TRIGGER trg_services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.service_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id      UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  title_en        TEXT NOT NULL,
  title_bn        TEXT NOT NULL DEFAULT '',
  description_en  TEXT NOT NULL DEFAULT '',
  description_bn  TEXT NOT NULL DEFAULT '',
  icon_emoji      TEXT NOT NULL DEFAULT '🔹',
  display_order   INT  NOT NULL DEFAULT 0,
  published       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_slug         ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_published    ON public.services(published, display_order);
CREATE INDEX IF NOT EXISTS idx_service_items_service ON public.service_items(service_id, display_order);

-- Seed 7 categories
INSERT INTO public.services (slug, title_en, title_bn, intro_en, intro_bn, icon_name, accent, display_order, published) VALUES
  ('tech',          'Technology Solutions','প্রযুক্তি সমাধান','Software, web, mobile, AI, cloud and security — engineered end to end.', 'সফটওয়্যার, ওয়েব, মোবাইল, এআই, ক্লাউড এবং নিরাপত্তা — শুরু থেকে শেষ পর্যন্ত।','monitor',    'secondary', 1, true),
  ('study-abroad',  'Study Abroad',        'বিদেশে পড়াশোনা',  'Counseling, admissions and pre-departure for top universities abroad.',  'বিদেশের শীর্ষ বিশ্ববিদ্যালয়ের জন্য পরামর্শ, ভর্তি ও প্রস্তুতি।',                'graduation-cap','accent',  2, true),
  ('visa',          'Visa Support',        'ভিসা সহায়তা',     'Complete documentation and processing for every visa category.',         'প্রতিটি ভিসা ক্যাটাগরির জন্য সম্পূর্ণ ডকুমেন্টেশন ও প্রক্রিয়াকরণ।',              'file-text',  'secondary', 3, true),
  ('ielts-pte',     'IELTS / PTE Training','আইইএলটিএস / পিটিই প্রশিক্ষণ','Structured coaching that lifts your band score quickly and reliably.','দ্রুত ও নির্ভরযোগ্যভাবে আপনার ব্যান্ড স্কোর বাড়ানোর কাঠামোবদ্ধ কোচিং।',           'book-open',  'gold',      4, true),
  ('travel',        'Travel Services',     'ভ্রমণ সেবা',        'Fully managed travel arrangements for individuals, families and groups.','ব্যক্তি, পরিবার ও গ্রুপের জন্য সম্পূর্ণ পরিচালিত ভ্রমণ ব্যবস্থা।',             'plane',      'accent',    5, true),
  ('investment',    'Startup Investment',  'স্টার্টআপ বিনিয়োগ', 'Strategy, planning and investor introductions for ambitious founders.','উচ্চাকাঙ্ক্ষী প্রতিষ্ঠাতাদের জন্য কৌশল, পরিকল্পনা ও বিনিয়োগকারী পরিচিতি।',     'trending-up','secondary', 6, true),
  ('export-import', 'Export & Import',     'রপ্তানি ও আমদানি','Sourcing, documentation and logistics across global trade routes.',      'বৈশ্বিক বাণিজ্য রুট জুড়ে সোর্সিং, ডকুমেন্টেশন ও লজিস্টিক।',                  'globe',      'gold',      7, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed sub-items for Technology
WITH s AS (SELECT id FROM public.services WHERE slug='tech')
INSERT INTO public.service_items (service_id, title_en, title_bn, description_en, description_bn, icon_emoji, display_order)
SELECT s.id, v.t_en, v.t_bn, v.d_en, v.d_bn, v.icon, v.ord FROM s, (VALUES
  ('Website Development',  'ওয়েবসাইট ডেভেলপমেন্ট', 'Next.js, React, high-performance web apps.',         'নেক্সট.জেএস, রিঅ্যাক্ট, উচ্চ-পারফরম্যান্স ওয়েব অ্যাপ।','🌐', 1),
  ('Mobile Apps',          'মোবাইল অ্যাপ',           'iOS & Android with React Native / Flutter.',         'রিঅ্যাক্ট নেটিভ / ফ্লাটারে আইওএস ও অ্যান্ড্রয়েড।',     '📱', 2),
  ('Custom Software',      'কাস্টম সফটওয়্যার',         'ERP, CRM, SaaS platforms built to spec.',            'স্পেসিফিকেশন অনুযায়ী ইআরপি, সিআরএম, এসএএএস।',            '🖥️', 3),
  ('Cyber Security',       'সাইবার নিরাপত্তা',          'Audits, pen testing, threat monitoring.',            'অডিট, পেন টেস্টিং, থ্রেট মনিটরিং।',                    '🔐', 4),
  ('Cloud & DevOps',       'ক্লাউড ও ডেভঅপস',          'AWS, Azure, GCP · CI/CD pipelines.',                 'এডব্লিউএস, অ্যাজুর, জিসিপি · সিআই/সিডি পাইপলাইন।',       '☁️', 5),
  ('AI Solutions',         'এআই সমাধান',              'ML models, chatbots, process automation.',           'এমএল মডেল, চ্যাটবট, প্রক্রিয়া অটোমেশন।',                '🤖', 6),
  ('IT Consulting',        'আইটি পরামর্শ',             'Digital transformation & road-mapping.',             'ডিজিটাল রূপান্তর ও রোডম্যাপিং।',                       '💼', 7),
  ('Hardware & Networks',  'হার্ডওয়্যার ও নেটওয়ার্ক',   'Workstations, servers, network setup.',              'ওয়ার্কস্টেশন, সার্ভার, নেটওয়ার্ক সেটআপ।',               '🖨️', 8)
) AS v(t_en, t_bn, d_en, d_bn, icon, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = s.id);

-- Seed sub-items for Visa
WITH s AS (SELECT id FROM public.services WHERE slug='visa')
INSERT INTO public.service_items (service_id, title_en, title_bn, description_en, description_bn, icon_emoji, display_order)
SELECT s.id, v.t_en, v.t_bn, v.d_en, v.d_bn, v.icon, v.ord FROM s, (VALUES
  ('Student Visa',          'স্টুডেন্ট ভিসা',     'Complete support for student visa applications to UK, India, China, Malaysia and more.','যুক্তরাজ্য, ভারত, চীন, মালয়েশিয়াসহ স্টুডেন্ট ভিসায় সম্পূর্ণ সহায়তা।','🎓',1),
  ('Tourist Visa',          'ট্যুরিস্ট ভিসা',      'Tourist and holiday visa processing for individuals, families and groups.','ব্যক্তি, পরিবার ও গ্রুপের জন্য ট্যুরিস্ট ভিসা প্রক্রিয়াকরণ।','🏖️',2),
  ('Business Visa',         'বিজনেস ভিসা',         'Business visit visas for trade meetings, conferences and corporate trips.','ট্রেড মিটিং, সম্মেলন ও কর্পোরেট ট্রিপের জন্য বিজনেস ভিসা।','💼',3),
  ('SOP Writing',           'এসওপি লেখা',          'Professional Statement of Purpose writing by experienced consultants.','অভিজ্ঞ পরামর্শদাতাদের দ্বারা পেশাদার এসওপি লেখা।','📝',4),
  ('Interview Preparation', 'ইন্টারভিউ প্রস্তুতি',   'Mock interviews, coaching and preparation for embassy/consulate interviews.','মক ইন্টারভিউ ও এম্বাসি ইন্টারভিউ প্রস্তুতি।','🎤',5),
  ('Documentation Support', 'ডকুমেন্টেশন সহায়তা',   'Complete document checklist, verification and submission guidance.','সম্পূর্ণ ডকুমেন্ট চেকলিস্ট ও জমাদানের গাইডেন্স।','📁',6)
) AS v(t_en, t_bn, d_en, d_bn, icon, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = s.id);

-- Seed sub-items for Travel
WITH s AS (SELECT id FROM public.services WHERE slug='travel')
INSERT INTO public.service_items (service_id, title_en, title_bn, description_en, description_bn, icon_emoji, display_order)
SELECT s.id, v.t_en, v.t_bn, v.d_en, v.d_bn, v.icon, v.ord FROM s, (VALUES
  ('Flight Booking',     'ফ্লাইট বুকিং',     'Best price domestic and international flights with all major airlines.','সর্বনিম্ন মূল্যে আন্তর্জাতিক ও দেশীয় ফ্লাইট বুকিং।','✈️',1),
  ('Hotel Reservation',  'হোটেল রিজার্ভেশন',  'Hotels, resorts and guesthouses worldwide — from budget to luxury.','বিশ্বব্যাপী হোটেল, রিসোর্ট ও গেস্টহাউস।','🏨',2),
  ('Tour Packages',      'ট্যুর প্যাকেজ',       'Fully managed group and private tour packages.','সম্পূর্ণ পরিচালিত গ্রুপ ও প্রাইভেট ট্যুর।','🗺️',3),
  ('Holiday Planning',   'হলিডে প্ল্যানিং',    'Custom holiday itineraries tailored to you.','আপনার জন্য কাস্টম হলিডে আইটিনারারি।','🌴',4),
  ('Travel Insurance',   'ট্রাভেল ইন্স্যুরেন্স','Comprehensive travel insurance for all travelers.','সব ভ্রমণকারীর জন্য সম্পূর্ণ ট্রাভেল ইন্স্যুরেন্স।','🛡️',5)
) AS v(t_en, t_bn, d_en, d_bn, icon, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = s.id);

-- Seed sub-items for IELTS/PTE, Investment, Export-Import — abbreviated (admin can extend)
WITH s AS (SELECT id FROM public.services WHERE slug='ielts-pte')
INSERT INTO public.service_items (service_id, title_en, title_bn, description_en, description_bn, icon_emoji, display_order)
SELECT s.id, v.t_en, v.t_bn, v.d_en, v.d_bn, v.icon, v.ord FROM s, (VALUES
  ('Online Live Classes', 'অনলাইন লাইভ ক্লাস', 'Interactive online sessions with experienced IELTS and PTE trainers.','অভিজ্ঞ আইইএলটিএস ও পিটিই প্রশিক্ষকদের সাথে অনলাইন সেশন।','📡',1),
  ('Mock Tests',          'মক টেস্ট',           'Timed mock exams simulating real test conditions for all four modules.','চারটি মডিউলে বাস্তব পরীক্ষার অনুকরণে মক টেস্ট।','📋',2),
  ('Speaking Sessions',   'স্পিকিং সেশন',       '1-on-1 speaking practice with expert feedback to boost your score.','স্কোর বাড়ানোর জন্য বিশেষজ্ঞ ফিডব্যাকসহ ১-অন-১ স্পিকিং।','🎤',3),
  ('Writing Evaluation',  'রাইটিং মূল্যায়ন',     'Detailed feedback on writing tasks for IELTS and PTE.','আইইএলটিএস ও পিটিইর রাইটিং টাস্কে বিস্তারিত ফিডব্যাক।','✍️',4)
) AS v(t_en, t_bn, d_en, d_bn, icon, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = s.id);

WITH s AS (SELECT id FROM public.services WHERE slug='investment')
INSERT INTO public.service_items (service_id, title_en, title_bn, description_en, description_bn, icon_emoji, display_order)
SELECT s.id, v.t_en, v.t_bn, v.d_en, v.d_bn, v.icon, v.ord FROM s, (VALUES
  ('Startup Consulting',    'স্টার্টআপ পরামর্শ',     'End-to-end startup advisory from ideation to launch and beyond.','ধারণা থেকে লঞ্চ পর্যন্ত স্টার্টআপ পরামর্শ।','🚀',1),
  ('Business Planning',     'ব্যবসায়িক পরিকল্পনা', 'Comprehensive business plans, financial projections and market analysis.','সম্পূর্ণ ব্যবসায়িক পরিকল্পনা ও আর্থিক প্রক্ষেপণ।','📋',2),
  ('Investor Connection',   'বিনিয়োগকারী সংযোগ',   'Connecting startups with angel investors and venture capital networks.','অ্যাঞ্জেল ইনভেস্টর ও ভিসি নেটওয়ার্কে সংযোগ।','💰',3),
  ('Market Research',       'বাজার গবেষণা',         'In-depth market analysis, competitor research and opportunity assessment.','বাজার, প্রতিযোগী ও সুযোগ বিশ্লেষণ।','🔍',4)
) AS v(t_en, t_bn, d_en, d_bn, icon, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = s.id);

WITH s AS (SELECT id FROM public.services WHERE slug='export-import')
INSERT INTO public.service_items (service_id, title_en, title_bn, description_en, description_bn, icon_emoji, display_order)
SELECT s.id, v.t_en, v.t_bn, v.d_en, v.d_bn, v.icon, v.ord FROM s, (VALUES
  ('Supplier Sourcing',       'সাপ্লায়ার সোর্সিং',     'Find reliable suppliers and manufacturers worldwide.','বিশ্বব্যাপী নির্ভরযোগ্য সাপ্লায়ার খুঁজে দেওয়া।','🔍',1),
  ('Shipment Coordination',   'শিপমেন্ট সমন্বয়',       'Sea, air, and land freight coordination and tracking.','সমুদ্র, আকাশ ও স্থল মাল পরিবহন সমন্বয়।','🚢',2),
  ('Trade Documentation',     'ট্রেড ডকুমেন্টেশন',     'LC, BL, customs, COO and all trade document support.','এলসি, বিএল, কাস্টমস ও সমস্ত বাণিজ্য ডকুমেন্ট।','📄',3),
  ('International Trade Consulting','আন্তর্জাতিক বাণিজ্য পরামর্শ','Expert advice on trade regulations, tariffs and compliance.','বাণিজ্য বিধি, শুল্ক ও কমপ্লায়েন্স পরামর্শ।','🌍',4)
) AS v(t_en, t_bn, d_en, d_bn, icon, ord)
WHERE NOT EXISTS (SELECT 1 FROM public.service_items si WHERE si.service_id = s.id);

-- ============================================================================
-- 6. EXTEND EXISTING TABLES (idempotent column additions)
-- ============================================================================

-- testimonials: add display_order
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- payment_submissions: add screenshot upload + contact fields
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_name     TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_email    TEXT NOT NULL DEFAULT '';

-- gallery_items: add ordering
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- career_openings: add ordering + close status (active/closed for filtering)
ALTER TABLE public.career_openings ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.career_openings ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- study_countries: ordering + image upload column already present (image_url)
ALTER TABLE public.study_countries ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- blog_posts: add tags array + published_at + view_count for analytics
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS view_count   INT NOT NULL DEFAULT 0;

-- Inquiries: useful index for admin filtering
CREATE INDEX IF NOT EXISTS idx_inquiries_service ON public.inquiries(service);

-- Payment submissions: index by created date for admin sorting
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payment_submissions(created_at DESC);

-- Updated-at triggers on tables that already exist
DROP TRIGGER IF EXISTS trg_inquiries_updated ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON public.payment_submissions;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_posts_updated ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_study_countries_updated ON public.study_countries;
CREATE TRIGGER trg_study_countries_updated BEFORE UPDATE ON public.study_countries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chat_sessions_updated ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. ADMIN USERS  (lightweight registry; current cookie auth still works)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin','admin','editor')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

INSERT INTO public.admin_users (username, display_name, role) VALUES
  ('Tuhin', 'Tuhin (Owner)', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 8. ROW LEVEL SECURITY  (enable + policies)
-- ============================================================================

-- Read helper: only PUBLISHED rows are public-readable
ALTER TABLE public.site_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_stats           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.why_choose_us_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_openings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_countries      ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies for idempotency
DO $policies$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('site_settings','site_content','home_stats','why_choose_us_items',
                        'services','service_items','admin_users','inquiries','payment_submissions',
                        'blog_posts','gallery_items','career_openings','testimonials',
                        'chat_sessions','chat_messages','study_countries')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
  END LOOP;
END $policies$;

-- Service role has full power on everything (server-side admin routes)
CREATE POLICY "service_role_all_site_settings"      ON public.site_settings      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_site_content"       ON public.site_content       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_home_stats"         ON public.home_stats         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_why"                ON public.why_choose_us_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_services"           ON public.services           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_service_items"      ON public.service_items      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_admin_users"        ON public.admin_users        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_inquiries"          ON public.inquiries          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_payments"           ON public.payment_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_blog"               ON public.blog_posts         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_gallery"            ON public.gallery_items      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_careers"            ON public.career_openings    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_testimonials"       ON public.testimonials       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_chat_sessions"      ON public.chat_sessions      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_chat_messages"      ON public.chat_messages      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_countries"          ON public.study_countries    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read (anon) — CMS content always selectable
CREATE POLICY "anon_read_site_settings"      ON public.site_settings      FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_site_content"       ON public.site_content       FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_home_stats"         ON public.home_stats         FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_read_why"                ON public.why_choose_us_items FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_read_services"           ON public.services           FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_read_service_items"      ON public.service_items      FOR SELECT TO anon USING (published = true);

-- Public read for content marked published
CREATE POLICY "anon_read_published_posts"        ON public.blog_posts       FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_read_gallery"                ON public.gallery_items    FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_published_openings"     ON public.career_openings  FOR SELECT TO anon USING (published = true AND closed_at IS NULL);
CREATE POLICY "anon_read_published_testimonials" ON public.testimonials     FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_read_published_countries"    ON public.study_countries  FOR SELECT TO anon USING (published = true);

-- Public form submissions (insert only, no read of others)
CREATE POLICY "anon_insert_inquiry"  ON public.inquiries           FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_payment"  ON public.payment_submissions FOR INSERT TO anon WITH CHECK (true);

-- Chat: visitor needs to start a session and stream messages by session id (uuid acts as token)
CREATE POLICY "anon_insert_chat_session"   ON public.chat_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_read_chat_session"     ON public.chat_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_chat_message"   ON public.chat_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_read_chat_messages"    ON public.chat_messages FOR SELECT TO anon USING (true);

-- ============================================================================
-- 9. REALTIME PUBLICATION  (live chat)
-- ============================================================================
DO $rt$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions';
  END IF;
END $rt$;

-- ============================================================================
-- 10. STORAGE BUCKETS  (run manually if SQL execution can't access storage)
-- ============================================================================
-- Create a public 'media' bucket via Supabase Dashboard → Storage → New Bucket,
-- OR via this SQL (requires storage schema access):
--   INSERT INTO storage.buckets (id, name, public) VALUES ('media','media',true)
--   ON CONFLICT (id) DO NOTHING;
-- Folder structure used by the app:
--   media/blog/<post_slug>/cover.jpg
--   media/gallery/<id>.jpg
--   media/services/<slug>/icon.png
--   media/countries/<slug>/hero.jpg
--   media/payments/<submission_id>/receipt.jpg

INSERT INTO storage.buckets (id, name, public)
VALUES ('media','media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — anon can read public bucket; service role can write
DO $storage_pol$
BEGIN
  -- Drop existing policies before recreating
  DROP POLICY IF EXISTS "public_read_media"  ON storage.objects;
  DROP POLICY IF EXISTS "service_write_media" ON storage.objects;
  DROP POLICY IF EXISTS "anon_payment_upload" ON storage.objects;
END $storage_pol$;

CREATE POLICY "public_read_media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

CREATE POLICY "service_write_media"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

-- Anonymous customers can upload payment receipts (only to media/payments/*)
CREATE POLICY "anon_payment_upload"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'payments'
  );

-- ============================================================================
-- DONE
-- ============================================================================
-- Verify with:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
--   SELECT count(*) FROM public.services WHERE published=true;
--   SELECT key, value_en FROM public.site_content WHERE group_name='home' ORDER BY key;
