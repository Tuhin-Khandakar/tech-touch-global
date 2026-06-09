-- Tech Touch Global Services — Supabase Schema
-- Run this in your Supabase SQL editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  excerpt_bn TEXT,
  content TEXT NOT NULL DEFAULT '',
  content_bn TEXT,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  author TEXT NOT NULL DEFAULT 'Admin',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Items
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_bn TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Submissions
CREATE TABLE IF NOT EXISTS payment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  amount TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'bank')),
  transaction_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT,
  role TEXT NOT NULL DEFAULT '',
  role_bn TEXT,
  content TEXT NOT NULL,
  content_bn TEXT,
  avatar TEXT DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  service TEXT NOT NULL DEFAULT 'general',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Openings
CREATE TABLE IF NOT EXISTS career_openings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_bn TEXT,
  department TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'full-time' CHECK (type IN ('full-time', 'part-time', 'internship', 'remote')),
  location TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
  description TEXT NOT NULL DEFAULT '',
  description_bn TEXT,
  requirements TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_name TEXT NOT NULL,
  visitor_email TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Countries (for dynamic CMS control)
CREATE TABLE IF NOT EXISTS study_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  flag_emoji TEXT NOT NULL DEFAULT '🌍',
  image_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  description_bn TEXT,
  tuition_range TEXT NOT NULL DEFAULT '',
  scholarship_info TEXT NOT NULL DEFAULT '',
  visa_process TEXT NOT NULL DEFAULT '',
  intake_dates TEXT NOT NULL DEFAULT '',
  job_opportunities TEXT NOT NULL DEFAULT '',
  top_universities TEXT[] NOT NULL DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 4 initial countries
INSERT INTO study_countries (slug, name, name_bn, flag_emoji, description, tuition_range, scholarship_info, visa_process, intake_dates, job_opportunities, top_universities, published)
VALUES
  ('uk', 'United Kingdom', 'যুক্তরাজ্য', '🇬🇧', 'The UK is home to some of the world''s top universities including Oxford, Cambridge, and Imperial College London.', '£10,000 – £38,000 per year', 'Chevening Scholarships, Commonwealth Scholarships available.', 'Apply online for UK Student Visa. Need CAS number, proof of funds, IELTS 5.5+.', 'Primary: September. Secondary: January.', 'Graduate Route visa allows 2 years post-study work.', ARRAY['University of Oxford', 'University of Cambridge', 'Imperial College London', 'UCL', 'King''s College London'], true),
  ('india', 'India', 'ভারত', '🇮🇳', 'India offers high-quality education at affordable costs with world-class IITs and IIMs.', '₹50,000 – ₹5,00,000 per year', 'ICCR Scholarships for foreign students available.', 'Apply for India Student Visa (S Visa). Need admission letter and financial proof.', 'Main intake: July/August.', 'Growing tech sector and strong startup ecosystem.', ARRAY['IIT Bombay', 'IIT Delhi', 'IIM Ahmedabad', 'University of Delhi', 'BITS Pilani'], true),
  ('china', 'China', 'চীন', '🇨🇳', 'China has emerged as a major destination with excellent universities and generous government scholarships.', '¥20,000 – ¥80,000 per year', 'Chinese Government Scholarship (CSC) covers full tuition, accommodation and monthly stipend.', 'Apply for X1 (long-term) Student Visa. Need JW201/JW202 form.', 'Primary: September. Secondary: March.', 'Growing demand for professionals with China exposure.', ARRAY['Peking University', 'Tsinghua University', 'Fudan University', 'Shanghai Jiao Tong University'], true),
  ('malaysia', 'Malaysia', 'মালয়েশিয়া', '🇲🇾', 'Malaysia offers quality education in English at very affordable costs in a Muslim-majority country.', 'RM 12,000 – RM 50,000 per year', 'Malaysian International Scholarship (MIS) and university scholarships available.', 'Apply for Student Pass through EMGS. Straightforward process.', 'Multiple intakes: January, May, September, November.', 'International job market, growing tech and financial sectors.', ARRAY['University of Malaya', 'UTM', 'UiTM', 'Taylor''s University', 'HELP University'], true)
ON CONFLICT (slug) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- Row Level Security (RLS) — disable for server-side service role key access
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE career_openings DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_countries DISABLE ROW LEVEL SECURITY;

-- Enable realtime for chat (Supabase dashboard: Database > Replication > enable for chat_messages)
-- Or run:
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
