CREATE TABLE public.saved_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  framework TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_tests_user ON public.saved_tests(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_tests TO authenticated;
GRANT ALL ON public.saved_tests TO service_role;
ALTER TABLE public.saved_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own saved tests" ON public.saved_tests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);