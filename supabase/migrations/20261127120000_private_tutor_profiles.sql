ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS teaching_focus TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS teaching_language TEXT NOT NULL DEFAULT 'yoruba',
  ADD COLUMN IF NOT EXISTS profile_avatar_path TEXT,
  ADD COLUMN IF NOT EXISTS profile_background_path TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_tutor_bio_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tutor_bio_length_check CHECK (char_length(bio) <= 500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_tutor_focus_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tutor_focus_length_check CHECK (char_length(teaching_focus) <= 240);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_tutor_language_format_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tutor_language_format_check CHECK (teaching_language ~ '^[a-z][a-z-]{1,39}$');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_tutor_avatar_path_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tutor_avatar_path_check CHECK (
        profile_avatar_path IS NULL
        OR profile_avatar_path ~ (
          '^' || id::text || '/avatar/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|jpg)$'
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_tutor_background_path_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tutor_background_path_check CHECK (
        profile_background_path IS NULL
        OR profile_background_path ~ (
          '^' || id::text || '/background/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|jpg)$'
        )
      );
  END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutor-profile-media',
  'tutor-profile-media',
  FALSE,
  2097152,
  ARRAY['image/webp', 'image/jpeg']::TEXT[]
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'tutor-profile-media' AND public IS TRUE
  ) THEN
    RAISE EXCEPTION 'The tutor-profile-media bucket must remain private.';
  END IF;
END;
$$;

UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg']::TEXT[]
WHERE id = 'tutor-profile-media' AND public IS FALSE;

DROP POLICY IF EXISTS "Educators can read their own tutor profile media" ON storage.objects;
CREATE POLICY "Educators can read their own tutor profile media"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'tutor-profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('avatar', 'background')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'educator'
    )
  );

DROP POLICY IF EXISTS "Educators can upload their own tutor profile media" ON storage.objects;
CREATE POLICY "Educators can upload their own tutor profile media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tutor-profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('avatar', 'background')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'educator'
    )
  );

DROP POLICY IF EXISTS "Educators can remove their own tutor profile media" ON storage.objects;
CREATE POLICY "Educators can remove their own tutor profile media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'tutor-profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('avatar', 'background')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'educator'
    )
  );
