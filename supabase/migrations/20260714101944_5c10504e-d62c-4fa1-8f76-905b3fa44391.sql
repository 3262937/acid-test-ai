
-- api_keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  prefix text NOT NULL,
  last4 text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX api_keys_user_id_idx ON public.api_keys(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own api keys" ON public.api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own api keys" ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own api keys" ON public.api_keys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own api keys" ON public.api_keys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- api_usage
CREATE TABLE public.api_usage (
  id bigserial PRIMARY KEY,
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  status_code int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_usage_user_created_idx ON public.api_usage(user_id, created_at DESC);
CREATE INDEX api_usage_key_created_idx ON public.api_usage(api_key_id, created_at DESC);

GRANT SELECT ON public.api_usage TO authenticated;
GRANT ALL ON public.api_usage TO service_role;

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own api usage" ON public.api_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
