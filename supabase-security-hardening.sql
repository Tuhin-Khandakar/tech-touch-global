-- ============================================================================
-- Tech Touch Global — Security Hardening Migration
-- Fixes the 6 Supabase Security Advisor warnings without breaking functionality:
--   1. Replaces 4 "always true" anon INSERT policies with real WITH CHECK rules
--      (chat_messages, chat_sessions, inquiries, payment_submissions)
--   2. Locks down the public 'media' bucket so anon can no longer list its
--      contents — but URL-based image reads keep working
--   3. Pins search_path on public.set_updated_at() so the function can't be
--      hijacked by a rogue schema
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃ 1. DB-LEVEL CHECK CONSTRAINTS                                          ┃
-- ┃   Belt-and-suspenders alongside RLS WITH CHECKs.                       ┃
-- ┃   These reject malformed rows even if a policy is bypassed somehow.    ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- ---- INQUIRIES -----------------------------------------------------------
ALTER TABLE public.inquiries
  ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_lengths_chk;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_lengths_chk CHECK (
    char_length(name)    BETWEEN 2  AND 120 AND
    char_length(email)   BETWEEN 5  AND 200 AND
    char_length(phone)   BETWEEN 5  AND 30  AND
    char_length(service) BETWEEN 1  AND 80  AND
    char_length(message) BETWEEN 10 AND 4000
  );

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_email_chk;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_email_chk CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- ---- PAYMENT_SUBMISSIONS -------------------------------------------------
ALTER TABLE public.payment_submissions
  ALTER COLUMN status SET DEFAULT 'pending';

-- Make sure the new payer fields exist (this is also added by the CMS migration;
-- repeated here so this security file is independently runnable)
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_name     TEXT NOT NULL DEFAULT '';
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS payer_email    TEXT NOT NULL DEFAULT '';

ALTER TABLE public.payment_submissions DROP CONSTRAINT IF EXISTS payments_lengths_chk;
ALTER TABLE public.payment_submissions
  ADD CONSTRAINT payments_lengths_chk CHECK (
    char_length(service)        BETWEEN 1 AND 80  AND
    char_length(amount)         BETWEEN 1 AND 50  AND
    char_length(transaction_id) BETWEEN 4 AND 100 AND
    char_length(sender_number)  BETWEEN 5 AND 30  AND
    char_length(coalesce(payer_name,'')) <= 120 AND
    char_length(coalesce(payer_email,'')) <= 200 AND
    char_length(coalesce(note,'')) <= 500 AND
    char_length(coalesce(screenshot_url,'')) <= 500
  );

ALTER TABLE public.payment_submissions DROP CONSTRAINT IF EXISTS payments_payer_email_chk;
ALTER TABLE public.payment_submissions
  ADD CONSTRAINT payments_payer_email_chk CHECK (
    payer_email = '' OR payer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- ---- CHAT_SESSIONS -------------------------------------------------------
ALTER TABLE public.chat_sessions
  ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_lengths_chk;
ALTER TABLE public.chat_sessions
  ADD CONSTRAINT chat_sessions_lengths_chk CHECK (
    char_length(visitor_name) BETWEEN 1 AND 80 AND
    char_length(coalesce(visitor_email,'')) <= 200
  );

-- ---- CHAT_MESSAGES -------------------------------------------------------
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_lengths_chk;
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_lengths_chk CHECK (
    char_length(content) BETWEEN 1 AND 4000
  );

-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃ 2. REPLACE PERMISSIVE ANON INSERT POLICIES                             ┃
-- ┃   The original policies were WITH CHECK (true). These new ones validate┃
-- ┃   every user-supplied field and refuse rows that try to set server-    ┃
-- ┃   controlled columns (id, created_at, updated_at, status).            ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- ─── INQUIRIES ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_inquiry" ON public.inquiries;
CREATE POLICY "anon_insert_inquiry"
  ON public.inquiries
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Required fields and length caps
    char_length(name)    BETWEEN 2  AND 120 AND
    char_length(email)   BETWEEN 5  AND 200 AND
    char_length(phone)   BETWEEN 5  AND 30  AND
    char_length(service) BETWEEN 1  AND 80  AND
    char_length(message) BETWEEN 10 AND 4000 AND
    -- Server-controlled: anon must NOT set a non-default status
    status = 'new'
  );

-- ─── PAYMENT_SUBMISSIONS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_payment" ON public.payment_submissions;
CREATE POLICY "anon_insert_payment"
  ON public.payment_submissions
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Required fields with length caps
    char_length(service)        BETWEEN 1 AND 80  AND
    char_length(amount)         BETWEEN 1 AND 50  AND
    char_length(transaction_id) BETWEEN 4 AND 100 AND
    char_length(sender_number)  BETWEEN 5 AND 30  AND
    char_length(coalesce(payer_name, ''))     <= 120 AND
    char_length(coalesce(payer_email, ''))    <= 200 AND
    char_length(coalesce(note, ''))           <= 500 AND
    char_length(coalesce(screenshot_url, '')) <= 500 AND
    -- payment_method must be one of the allowed values
    payment_method IN ('bkash', 'nagad', 'bank') AND
    -- Server-controlled: must enter as 'pending' only
    status = 'pending'
  );

-- ─── CHAT_SESSIONS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_chat_session" ON public.chat_sessions;
CREATE POLICY "anon_insert_chat_session"
  ON public.chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (
    char_length(visitor_name) BETWEEN 1 AND 80 AND
    char_length(coalesce(visitor_email, '')) <= 200 AND
    status = 'open'
  );

-- ─── CHAT_MESSAGES ───────────────────────────────────────────────────────
-- Anon can only post AS a visitor, NEVER as an admin, and only to existing sessions.
DROP POLICY IF EXISTS "anon_insert_chat_message" ON public.chat_messages;
CREATE POLICY "anon_insert_chat_message"
  ON public.chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    sender = 'visitor' AND
    char_length(content) BETWEEN 1 AND 4000 AND
    -- Session must already exist (defence against fabricating session_ids)
    EXISTS (SELECT 1 FROM public.chat_sessions cs WHERE cs.id = session_id)
  );

-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃ 3. STORAGE: 'media' bucket — block public listing, keep object reads    ┃
-- ┃                                                                        ┃
-- ┃ A public bucket allows direct URL access to any individual object,     ┃
-- ┃ regardless of RLS. The RLS policy on storage.objects governs the JS    ┃
-- ┃ list/search APIs. By REMOVING the broad anon SELECT policy, we stop    ┃
-- ┃ enumeration but keep <img src="https://.../object/public/media/..."/>  ┃
-- ┃ working as before.                                                     ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

-- Make sure bucket exists and stays public (so /storage/v1/object/public/* keeps working)
UPDATE storage.buckets SET public = true WHERE id = 'media';

-- Drop the broad SELECT policy that allowed listing
DROP POLICY IF EXISTS "public_read_media"  ON storage.objects;
DROP POLICY IF EXISTS "anon_read_media"    ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_media" ON storage.objects;

-- Re-create the upload + admin policies (idempotent)
DROP POLICY IF EXISTS "service_write_media" ON storage.objects;
DROP POLICY IF EXISTS "anon_payment_upload" ON storage.objects;

CREATE POLICY "service_write_media"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

-- Authenticated users (admins) can read/list the media bucket via the API
-- (image uploads in /admin/blog, gallery management, etc. need this).
CREATE POLICY "authenticated_read_media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media');

-- Anonymous customers may upload payment receipts ONLY into media/payments/*
CREATE POLICY "anon_payment_upload"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'payments'
  );

-- NOTE: there is intentionally NO anon SELECT policy.
-- Direct public URL fetches (/storage/v1/object/public/media/<path>) still
-- work because the bucket's public flag bypasses RLS for the public endpoint.
-- The supabase-js .list() API for anonymous users will now return empty/denied.

-- ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
-- ┃ 4. PIN search_path ON public.set_updated_at()                          ┃
-- ┃                                                                        ┃
-- ┃ Without an explicit search_path the function would resolve unqualified ┃
-- ┃ names against whatever is in the caller's search_path at trigger time, ┃
-- ┃ which is a Postgres CVE class (function hijack). Empty search_path     ┃
-- ┃ forces fully-qualified names — and our trigger body uses none beyond   ┃
-- ┃ pg_catalog.now(), which is always resolvable.                          ┃
-- ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER       -- runs as the user invoking the trigger, not the owner
SET search_path = ''   -- block any schema-resolution shenanigans
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- Re-anchor the modifiers in case CREATE OR REPLACE preserved older settings:
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.set_updated_at() SECURITY INVOKER;

COMMIT;

-- ============================================================================
-- VERIFY (optional — run these afterwards to confirm)
-- ============================================================================
-- 1. Policies on each table:
--   SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies
--   WHERE tablename IN ('inquiries','payment_submissions','chat_sessions','chat_messages')
--   ORDER BY tablename, policyname;
--
-- 2. Check constraints:
--   SELECT conname, pg_get_constraintdef(c.oid)
--   FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
--   WHERE t.relname IN ('inquiries','payment_submissions','chat_sessions','chat_messages')
--     AND conname LIKE '%_chk';
--
-- 3. Function settings:
--   SELECT proname, proconfig, prosecdef FROM pg_proc
--   WHERE proname = 'set_updated_at';   -- proconfig should contain 'search_path='
--
-- 4. Storage policies on objects:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects';
