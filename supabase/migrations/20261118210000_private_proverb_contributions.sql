ALTER TABLE public.community_proverbs
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'Yorùbá';

ALTER TABLE public.community_proverbs
  ADD CONSTRAINT community_proverbs_supported_language
  CHECK (language IN ('Yorùbá', 'Igbo', 'Hausa', 'Swahili'));

ALTER TABLE public.community_proverbs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved proverbs" ON public.community_proverbs;
CREATE POLICY "Anyone can view approved proverbs"
  ON public.community_proverbs FOR SELECT
  USING (approved = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can submit proverbs" ON public.community_proverbs;
CREATE POLICY "Authenticated users can submit private proverbs"
  ON public.community_proverbs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND approved = false);
