-- ============================================================
-- 004_fix_permissions.sql  –  ช่วยที.com
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Fixes: "permission denied for table accounts" error
-- ============================================================

-- 1. Grant schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant table access to authenticated role (protected by RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Grant sequence access
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 4. Explicit grants on all tables
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.slips TO authenticated;
GRANT ALL ON TABLE public.goals TO authenticated;
GRANT ALL ON TABLE public.notification_settings TO authenticated;

-- 5. Enable RLS on all tables to ensure row-level security is enforced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
