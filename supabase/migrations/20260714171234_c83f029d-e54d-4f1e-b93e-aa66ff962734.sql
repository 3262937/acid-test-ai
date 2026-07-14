CREATE TABLE public.user_github_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_full_name text NOT NULL,
  branch text NOT NULL DEFAULT 'main',
  base_path text NOT NULL DEFAULT 'acidtest-suites/',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_github_settings TO authenticated;
GRANT ALL ON public.user_github_settings TO service_role;

ALTER TABLE public.user_github_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own GitHub settings"
ON public.user_github_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_github_settings_updated_at
BEFORE UPDATE ON public.user_github_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();