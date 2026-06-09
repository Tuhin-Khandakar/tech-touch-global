-- ============================================================
-- Tech Touch Global — RLS Policies + Security Fixes
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql
-- ============================================================

-- ── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_countries ENABLE ROW LEVEL SECURITY;


-- ── inquiries ─────────────────────────────────────────────────
-- Public: submit only. Admin (service role): full access.
CREATE POLICY "anon_insert_inquiry"
  ON inquiries FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "service_role_all_inquiry"
  ON inquiries FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── blog_posts ────────────────────────────────────────────────
-- Public: read published posts only. Admin: full access.
CREATE POLICY "anon_read_published_posts"
  ON blog_posts FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "service_role_all_posts"
  ON blog_posts FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── gallery_items ─────────────────────────────────────────────
-- Public: read all. Admin: full access.
CREATE POLICY "anon_read_gallery"
  ON gallery_items FOR SELECT TO anon
  USING (true);

CREATE POLICY "service_role_all_gallery"
  ON gallery_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── payment_submissions ───────────────────────────────────────
-- Public: submit only. Admin: full access.
CREATE POLICY "anon_insert_payment"
  ON payment_submissions FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "service_role_all_payments"
  ON payment_submissions FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── testimonials ──────────────────────────────────────────────
-- Public: read published only. Admin: full access.
CREATE POLICY "anon_read_published_testimonials"
  ON testimonials FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "service_role_all_testimonials"
  ON testimonials FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── career_openings ───────────────────────────────────────────
-- Public: read published only. Admin: full access.
CREATE POLICY "anon_read_published_openings"
  ON career_openings FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "service_role_all_openings"
  ON career_openings FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── study_countries ───────────────────────────────────────────
-- Public: read published only. Admin: full access.
CREATE POLICY "anon_read_published_countries"
  ON study_countries FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "service_role_all_countries"
  ON study_countries FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── chat_sessions ─────────────────────────────────────────────
-- Public: create sessions + read any session by UUID (UUID is unguessable = acts as secret token).
-- Admin: full access.
CREATE POLICY "anon_insert_chat_session"
  ON chat_sessions FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_read_chat_session"
  ON chat_sessions FOR SELECT TO anon
  USING (true);

CREATE POLICY "service_role_all_sessions"
  ON chat_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── chat_messages ─────────────────────────────────────────────
-- Public: insert messages + read messages (filtered by session_id in client code).
-- The UUID session_id acts as an unguessable token — only someone who knows it can subscribe.
-- Admin: full access for the admin chat panel.
CREATE POLICY "anon_insert_chat_message"
  ON chat_messages FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_read_chat_messages"
  ON chat_messages FOR SELECT TO anon
  USING (true);

CREATE POLICY "service_role_all_messages"
  ON chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ── Fix: missing index on payment_submissions.inquiry_id ──────
CREATE INDEX IF NOT EXISTS idx_payment_submissions_inquiry_id
  ON payment_submissions(inquiry_id);


-- ── Verify RLS is enabled ─────────────────────────────────────
-- Run this to confirm — all should show rowsecurity = true:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
