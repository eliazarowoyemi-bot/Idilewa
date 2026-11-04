-- Additive schema for the multilingual visual-coding studio.
-- Existing profile fields, roles, and account-security triggers remain in place.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT;

UPDATE public.profiles
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('child', 'adult', 'parent', 'educator', 'institution', 'student', 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.starter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('Translation Sandbox', 'Animation', 'Games', 'Culture')),
  thumbnail_url TEXT,
  default_blocks_json JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(default_blocks_json) = 'array'),
  default_assets_json JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(default_assets_json) = 'array'),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.starter_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'My new project' CHECK (char_length(title) BETWEEN 1 AND 120),
  workspace_blocks_json JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(workspace_blocks_json) = 'array'),
  stage_assets_json JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(stage_assets_json) = 'array'),
  thumbnail_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_projects_owner_updated_idx
  ON public.user_projects (user_id, updated_at DESC);

ALTER TABLE public.starter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published starter templates are visible to everyone"
  ON public.starter_templates;
CREATE POLICY "Published starter templates are visible to everyone"
  ON public.starter_templates FOR SELECT
  USING (
    is_published
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create starter templates" ON public.starter_templates;
CREATE POLICY "Admins can create starter templates"
  ON public.starter_templates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update starter templates" ON public.starter_templates;
CREATE POLICY "Admins can update starter templates"
  ON public.starter_templates FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete starter templates" ON public.starter_templates;
CREATE POLICY "Admins can delete starter templates"
  ON public.starter_templates FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Learners can view their own projects" ON public.user_projects;
CREATE POLICY "Learners can view their own projects"
  ON public.user_projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners can create their own projects" ON public.user_projects;
CREATE POLICY "Learners can create their own projects"
  ON public.user_projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners can update their own projects" ON public.user_projects;
CREATE POLICY "Learners can update their own projects"
  ON public.user_projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners can delete their own projects" ON public.user_projects;
CREATE POLICY "Learners can delete their own projects"
  ON public.user_projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_studio_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS starter_templates_updated_at ON public.starter_templates;
CREATE TRIGGER starter_templates_updated_at
  BEFORE UPDATE ON public.starter_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_studio_updated_at();

DROP TRIGGER IF EXISTS user_projects_updated_at ON public.user_projects;
CREATE TRIGGER user_projects_updated_at
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_studio_updated_at();

GRANT SELECT ON public.starter_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.starter_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_projects TO authenticated;

INSERT INTO public.starter_templates
  (id, title, description, category, default_blocks_json, default_assets_json, is_published)
VALUES
  (
    'a0e7f60b-4806-4ff1-9000-000000000001',
    'Say hello in Yorùbá',
    'Meet a new friend and let them greet you in Yorùbá.',
    'Translation Sandbox',
    '[{"id":"10000000-0000-4000-8000-000000000001","type":"when_flag_clicked","inputs":{},"children":[]},{"id":"10000000-0000-4000-8000-000000000002","type":"say_message","inputs":{"text":"Hello!"},"children":[]},{"id":"10000000-0000-4000-8000-000000000003","type":"translate_text","inputs":{"text":"Hello!","targetLanguage":"yo"},"children":[]},{"id":"10000000-0000-4000-8000-000000000004","type":"display_speech_bubble","inputs":{"text":"Hello!","targetLanguage":"yo"},"children":[]},{"id":"10000000-0000-4000-8000-000000000005","type":"speak_text","inputs":{"text":"","targetLanguage":"yo"},"children":[]}]'::jsonb,
    '[{"name":"Ayo","kind":"sprite","icon":"🧑🏿‍🚀"},{"name":"Sunshine","kind":"backdrop","icon":"🌤️"}]'::jsonb,
    TRUE
  ),
  (
    'a0e7f60b-4806-4ff1-9000-000000000002',
    'A little greeting dance',
    'Translate a greeting, then make your character dance.',
    'Animation',
    '[{"id":"20000000-0000-4000-8000-000000000001","type":"when_flag_clicked","inputs":{},"children":[]},{"id":"20000000-0000-4000-8000-000000000002","type":"translate_text","inputs":{"text":"Good morning","targetLanguage":"ig"},"children":[]},{"id":"20000000-0000-4000-8000-000000000003","type":"display_speech_bubble","inputs":{"text":"Good morning","targetLanguage":"ig"},"children":[]},{"id":"20000000-0000-4000-8000-000000000004","type":"repeat_times","inputs":{"times":4},"children":[{"id":"20000000-0000-4000-8000-000000000005","type":"move_steps","inputs":{"steps":18},"children":[]},{"id":"20000000-0000-4000-8000-000000000006","type":"turn_degrees","inputs":{"degrees":45},"children":[]}] }]'::jsonb,
    '[{"name":"Ayo","kind":"sprite","icon":"🧑🏿‍🚀"},{"name":"Village path","kind":"backdrop","icon":"🌿"}]'::jsonb,
    TRUE
  ),
  (
    'a0e7f60b-4806-4ff1-9000-000000000003',
    'Storytime: a clever tortoise',
    'Add a line of dialogue and share a tiny folktale.',
    'Culture',
    '[{"id":"30000000-0000-4000-8000-000000000001","type":"when_flag_clicked","inputs":{},"children":[]},{"id":"30000000-0000-4000-8000-000000000002","type":"say_message","inputs":{"text":"Once upon a time, a clever tortoise set off to visit a friend."},"children":[]},{"id":"30000000-0000-4000-8000-000000000003","type":"translate_text","inputs":{"text":"Thank you","targetLanguage":"ha"},"children":[]},{"id":"30000000-0000-4000-8000-000000000004","type":"display_speech_bubble","inputs":{"text":"Thank you","targetLanguage":"ha"},"children":[]},{"id":"30000000-0000-4000-8000-000000000005","type":"speak_text","inputs":{"text":"","targetLanguage":"ha"},"children":[]}]'::jsonb,
    '[{"name":"Tortoise","kind":"sprite","icon":"🐢"},{"name":"Story grove","kind":"backdrop","icon":"🌳"}]'::jsonb,
    TRUE
  ),
  (
    'a0e7f60b-4806-4ff1-9000-000000000004',
    'Pidgin phrase explorer',
    'Explore a friendly greeting and hear it spoken aloud.',
    'Translation Sandbox',
    '[{"id":"40000000-0000-4000-8000-000000000001","type":"when_flag_clicked","inputs":{},"children":[]},{"id":"40000000-0000-4000-8000-000000000002","type":"translate_text","inputs":{"text":"Hello","targetLanguage":"pcm"},"children":[]},{"id":"40000000-0000-4000-8000-000000000003","type":"display_speech_bubble","inputs":{"text":"Hello","targetLanguage":"pcm"},"children":[]},{"id":"40000000-0000-4000-8000-000000000004","type":"speak_text","inputs":{"text":"","targetLanguage":"pcm"},"children":[]}]'::jsonb,
    '[{"name":"Ayo","kind":"sprite","icon":"🧑🏿‍🚀"},{"name":"Sunny day","kind":"backdrop","icon":"☀️"}]'::jsonb,
    TRUE
  ),
  (
    'a0e7f60b-4806-4ff1-9000-000000000005',
    'Swahili story spark',
    'Start a story in English, then translate the greeting.',
    'Culture',
    '[{"id":"50000000-0000-4000-8000-000000000001","type":"when_flag_clicked","inputs":{},"children":[]},{"id":"50000000-0000-4000-8000-000000000002","type":"say_message","inputs":{"text":"Welcome, friend!"},"children":[]},{"id":"50000000-0000-4000-8000-000000000003","type":"translate_text","inputs":{"text":"Welcome","targetLanguage":"sw"},"children":[]},{"id":"50000000-0000-4000-8000-000000000004","type":"display_speech_bubble","inputs":{"text":"Welcome","targetLanguage":"sw"},"children":[]}]'::jsonb,
    '[{"name":"Storyteller","kind":"sprite","icon":"🧑🏿‍🎨"},{"name":"Baobab","kind":"backdrop","icon":"🌳"}]'::jsonb,
    TRUE
  ),
  (
    'a0e7f60b-4806-4ff1-9000-000000000006',
    'Move, turn, repeat',
    'Build your first loop with a few bright steps.',
    'Games',
    '[{"id":"60000000-0000-4000-8000-000000000001","type":"when_flag_clicked","inputs":{},"children":[]},{"id":"60000000-0000-4000-8000-000000000002","type":"repeat_times","inputs":{"times":6},"children":[{"id":"60000000-0000-4000-8000-000000000003","type":"move_steps","inputs":{"steps":20},"children":[]},{"id":"60000000-0000-4000-8000-000000000004","type":"turn_degrees","inputs":{"degrees":60},"children":[]}]},{"id":"60000000-0000-4000-8000-000000000005","type":"say_message","inputs":{"text":"You made a pattern!"},"children":[]}]'::jsonb,
    '[{"name":"Ayo","kind":"sprite","icon":"🧑🏿‍🚀"},{"name":"Play field","kind":"backdrop","icon":"🏞️"}]'::jsonb,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;
