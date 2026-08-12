-- ============================================================
-- 001_schema.sql  –  ช่วยที.com Thai Personal Finance PWA
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

-- profiles: one-to-one with auth.users
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  default_currency TEXT DEFAULT 'THB',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- accounts: bank accounts, wallets, cash
CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('cash','bank','savings','ewallet')),
  balance     NUMERIC(15,2) DEFAULT 0,
  bank_name   TEXT,
  color       TEXT DEFAULT '#FF3478',
  icon        TEXT DEFAULT 'wallet',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- categories: default (user_id NULL) + custom (user_id set)
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  name_th     TEXT,
  type        TEXT NOT NULL CHECK (type IN ('income','expense')),
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- slips: OCR results (declared before transactions for FK)
CREATE TABLE slips (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path       TEXT NOT NULL,
  ocr_raw_text       TEXT,
  detected_bank      TEXT,
  extracted_amount   NUMERIC(15,2),
  extracted_date     DATE,
  extracted_time     TIME,
  reference_number   TEXT,
  sender_name        TEXT,
  receiver_name      TEXT,
  confidence         NUMERIC(3,2),
  processing_status  TEXT DEFAULT 'pending'
    CHECK (processing_status IN ('pending','processing','completed','failed')),
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- transactions
CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  type             TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount           NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description      TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_time TIME,
  slip_id          UUID,
  source           TEXT DEFAULT 'manual' CHECK (source IN ('manual','slip_scan')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions
  ADD CONSTRAINT fk_slip
  FOREIGN KEY (slip_id) REFERENCES slips(id) ON DELETE SET NULL;

-- notification_settings
CREATE TABLE notification_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled           BOOLEAN DEFAULT false,
  reminder_time     TIME DEFAULT '20:00',
  timezone          TEXT DEFAULT 'Asia/Bangkok',
  push_subscription JSONB,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_accounts_user_id        ON accounts(user_id);
CREATE INDEX idx_categories_user_id      ON categories(user_id);
CREATE INDEX idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX idx_transactions_date       ON transactions(transaction_date);
CREATE INDEX idx_slips_user_id           ON slips(user_id);
CREATE INDEX idx_slips_status            ON slips(processing_status);
CREATE INDEX idx_notification_user_id    ON notification_settings(user_id);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE slips                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (id = auth.uid());

-- accounts
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (user_id = auth.uid());

-- categories: own rows OR global defaults
CREATE POLICY "categories_select" ON categories FOR SELECT
  USING (user_id = auth.uid() OR is_default = true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (user_id = auth.uid());

-- transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (user_id = auth.uid());

-- slips
CREATE POLICY "slips_select" ON slips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "slips_insert" ON slips FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "slips_update" ON slips FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "slips_delete" ON slips FOR DELETE USING (user_id = auth.uid());

-- notification_settings
CREATE POLICY "notif_select" ON notification_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON notification_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_update" ON notification_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_delete" ON notification_settings FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- TRIGGERS
-- ────────────────────────────────────────────────────────────

-- 1. Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Auto-create notification_settings on profile insert
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();
