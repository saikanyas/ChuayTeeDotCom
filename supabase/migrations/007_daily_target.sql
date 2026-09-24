-- Persist each user's daily spending target in their existing profile row.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_target NUMERIC(15,2) NOT NULL DEFAULT 0
  CHECK (daily_target >= 0);
