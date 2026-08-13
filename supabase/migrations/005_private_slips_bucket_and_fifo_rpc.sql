-- ============================================================
-- 005_private_slips_bucket_and_fifo_rpc.sql – ช่วยที.com
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Fixes: Private Storage Bucket, Storage RLS, & Atomic 30-Slip FIFO Cap RPC
-- ============================================================

-- 1. Ensure slips bucket exists and is PRIVATE
INSERT INTO storage.buckets (id, name, public)
VALUES ('slips', 'slips', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Storage RLS Policies for slips bucket
-- Allow authenticated users to SELECT (download) their own files
CREATE POLICY "slips_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'slips' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to INSERT (upload) files into their own folder
CREATE POLICY "slips_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'slips' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to DELETE files from their own folder
CREATE POLICY "slips_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'slips' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Atomic FIFO Cap RPC
-- Enforces a strict 30-slip limit per user on the DB server-side
-- Derives user identity strictly from auth.uid()
CREATE OR REPLACE FUNCTION enforce_my_slip_cap(
  p_max_slips INT DEFAULT 30
)
RETURNS TABLE(
  deleted_id UUID,
  deleted_storage_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  WITH excess_slips AS (
    SELECT id, storage_path
    FROM slips
    WHERE user_id = v_user_id
    ORDER BY created_at DESC, id DESC
    OFFSET GREATEST(p_max_slips, 0)
  ),
  deleted_rows AS (
    DELETE FROM slips
    WHERE id IN (
      SELECT id FROM excess_slips
    )
    RETURNING id, storage_path
  )
  SELECT
    deleted_rows.id,
    deleted_rows.storage_path
  FROM deleted_rows;
END;
$$;

-- Grant execution to authenticated users
REVOKE EXECUTE ON FUNCTION enforce_my_slip_cap(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION enforce_my_slip_cap(INT) TO authenticated;
