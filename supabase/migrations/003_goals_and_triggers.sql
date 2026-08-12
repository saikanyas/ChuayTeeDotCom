-- ============================================================
-- 003_goals_and_triggers.sql  –  ช่วยที.com
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. GOALS TABLE
CREATE TABLE IF NOT EXISTS goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  target_amount   NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount  NUMERIC(15,2) DEFAULT 0 CHECK (current_amount >= 0),
  color           TEXT DEFAULT '#FF3478',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_select" ON goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "goals_insert" ON goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "goals_update" ON goals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "goals_delete" ON goals FOR DELETE USING (user_id = auth.uid());

-- 2. ACCOUNT BALANCE TRIGGERS

CREATE OR REPLACE FUNCTION apply_balance_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION revert_balance_on_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.account_id IS NOT NULL THEN
    IF OLD.type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION adjust_balance_on_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.account_id IS NOT NULL THEN
    IF OLD.type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_balance_on_insert ON transactions;
DROP TRIGGER IF EXISTS trg_balance_on_delete ON transactions;
DROP TRIGGER IF EXISTS trg_balance_on_update ON transactions;

CREATE TRIGGER trg_balance_on_insert
  AFTER INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION apply_balance_on_insert();
CREATE TRIGGER trg_balance_on_delete
  AFTER DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION revert_balance_on_delete();
CREATE TRIGGER trg_balance_on_update
  AFTER UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION adjust_balance_on_update();
