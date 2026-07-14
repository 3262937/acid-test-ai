
-- Credits balance per user
CREATE TABLE public.credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credits TO authenticated;
GRANT ALL ON public.credits TO service_role;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own credits" ON public.credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ledger for audit + idempotency
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own ledger" ON public.credit_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX credit_ledger_user_idx ON public.credit_ledger(user_id, created_at DESC);

-- Atomic consume: returns new balance, or -1 if insufficient
CREATE OR REPLACE FUNCTION public.consume_credit(_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  INSERT INTO public.credits(user_id, balance) VALUES (uid, 0)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credits
     SET balance = balance - _amount, updated_at = now()
   WHERE user_id = uid AND balance >= _amount
   RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    RETURN -1;
  END IF;

  INSERT INTO public.credit_ledger(user_id, delta, reason)
    VALUES (uid, -_amount, 'generation');

  RETURN new_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_credit(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_credit(integer) TO authenticated;

-- Add credits (service-role only). Idempotent via idempotency_key.
CREATE OR REPLACE FUNCTION public.add_credits(_user_id uuid, _amount integer, _reason text, _idempotency_key text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
  inserted uuid;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  INSERT INTO public.credit_ledger(user_id, delta, reason, idempotency_key)
    VALUES (_user_id, _amount, _reason, _idempotency_key)
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO inserted;

  IF inserted IS NULL THEN
    SELECT balance INTO new_balance FROM public.credits WHERE user_id = _user_id;
    RETURN COALESCE(new_balance, 0);
  END IF;

  INSERT INTO public.credits(user_id, balance) VALUES (_user_id, _amount)
    ON CONFLICT (user_id) DO UPDATE SET balance = public.credits.balance + _amount, updated_at = now()
    RETURNING balance INTO new_balance;

  RETURN new_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.add_credits(uuid, integer, text, text) FROM public;

-- Extend handle_new_user to seed 3 welcome credits.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, 3)
    ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_ledger (user_id, delta, reason, idempotency_key)
    VALUES (NEW.id, 3, 'welcome_bonus', 'welcome:' || NEW.id::text)
    ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger might not exist yet on auth.users. Create if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill existing users with a starting balance of 3.
INSERT INTO public.credits (user_id, balance)
  SELECT id, 3 FROM auth.users
  ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.credit_ledger (user_id, delta, reason, idempotency_key)
  SELECT id, 3, 'welcome_bonus', 'welcome:' || id::text FROM auth.users
  ON CONFLICT (idempotency_key) DO NOTHING;
