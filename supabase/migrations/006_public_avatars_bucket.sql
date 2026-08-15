-- ============================================================
-- 006_public_avatars_bucket.sql – ช่วยที.com
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Fixes: Creates public 'avatars' Storage Bucket with RLS
-- ============================================================

-- 1. Ensure 'avatars' bucket exists and is PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public SELECT (read) on avatars bucket
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- 3. Allow authenticated users to INSERT their own avatar
CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Allow authenticated users to UPDATE (upsert) their own avatar
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Allow authenticated users to DELETE their own avatar
CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
