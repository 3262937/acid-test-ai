
-- ============ credit_packages ============
CREATE TABLE public.credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('one_time','subscription')),
  tier TEXT,
  credits INT NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_packages TO anon, authenticated;
GRANT ALL ON public.credit_packages TO service_role;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages readable by anyone"
  ON public.credit_packages FOR SELECT
  TO anon, authenticated
  USING (active = true);

INSERT INTO public.credit_packages (id, name, description, kind, tier, credits, price_cents, sort_order) VALUES
  ('starter',    'Starter',   'For solo QAs',        'subscription', 'starter', 200,   1900,  10),
  ('hunter',     'Hunter',    'For small teams',     'subscription', 'hunter',  1000,  7900,  20),
  ('lab',        'Lab',       'For QA orgs',         'subscription', 'lab',     5000, 29900,  30),
  ('topup_100',  '100 credits',   'Top-up pack',     'one_time',     NULL,      100,   1200, 100),
  ('topup_500',  '500 credits',   'Top-up pack',     'one_time',     NULL,      500,   4900, 110),
  ('topup_2000', '2,000 credits', 'Top-up pack',     'one_time',     NULL,     2000,  16900, 120);

-- ============ stripe_customers ============
CREATE TABLE public.stripe_customers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stripe_customers TO authenticated;
GRANT ALL ON public.stripe_customers TO service_role;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own stripe customer"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============ credit_ledger ============
CREATE TABLE public.credit_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX credit_ledger_user_id_idx ON public.credit_ledger(user_id, created_at DESC);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own ledger"
  ON public.credit_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============ user_credits ============
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own balance"
  ON public.user_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sync balance from ledger inserts
CREATE OR REPLACE FUNCTION public.apply_ledger_to_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, updated_at)
  VALUES (NEW.user_id, NEW.delta, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_credits.balance + NEW.delta,
        updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_ledger_apply_balance
  AFTER INSERT ON public.credit_ledger
  FOR EACH ROW EXECUTE FUNCTION public.apply_ledger_to_balance();

-- Debit function used by app server code
CREATE OR REPLACE FUNCTION public.debit_credits(_amount INT, _reason TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _new_balance INT;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  INSERT INTO public.user_credits (user_id, balance) VALUES (_user, 0)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
    SET balance = balance - _amount, updated_at = now()
    WHERE user_id = _user AND balance >= _amount
    RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  -- Record ledger entry; skip the balance-apply trigger by using a marker
  INSERT INTO public.credit_ledger (user_id, delta, reason, metadata)
  VALUES (_user, -_amount, _reason, jsonb_build_object('skip_balance_trigger', true));

  RETURN _new_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.debit_credits(INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.debit_credits(INT, TEXT) TO authenticated;

-- Adjust trigger to skip when marker is present (debit_credits already updated balance)
CREATE OR REPLACE FUNCTION public.apply_ledger_to_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.metadata ? 'skip_balance_trigger') THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_credits (user_id, balance, updated_at)
  VALUES (NEW.user_id, NEW.delta, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_credits.balance + NEW.delta,
        updated_at = now();
  RETURN NEW;
END;
$$;
