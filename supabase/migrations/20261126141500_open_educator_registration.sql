CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role TEXT := COALESCE(new.raw_user_meta_data->>'role', 'adult');
  v_request_id UUID;
BEGIN
  IF v_role NOT IN ('child', 'adult', 'parent', 'educator') THEN
    RAISE EXCEPTION 'Unsupported account role.';
  END IF;

  IF v_role = 'child' THEN
    BEGIN
      v_request_id := NULLIF(new.raw_user_meta_data->>'guardian_access_request_id', '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'A verified guardian approval is required.';
    END;

    PERFORM 1
    FROM public.guardian_access_requests
    WHERE id = v_request_id
      AND lower(child_email) = lower(new.email)
      AND status = 'approved'
      AND access_code_expires_at > NOW()
      AND access_code_verified_at > NOW() - INTERVAL '10 minutes'
      AND claimed_by IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A verified guardian approval is required.';
    END IF;

    UPDATE public.guardian_access_requests
    SET status = 'used', claimed_by = new.id
    WHERE id = v_request_id;
  END IF;

  INSERT INTO public.profiles (
    id, email, name, role, avatar_url, points, streak, parent_consent_request_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    v_role,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    0,
    0,
    v_request_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    parent_consent_request_id = EXCLUDED.parent_consent_request_id,
    updated_at = NOW();

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_educator_google_signup(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'A verified Google user is required.';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The Google account profile could not be found.';
  END IF;

  IF v_role = 'educator' THEN
    RETURN TRUE;
  END IF;

  IF v_role <> 'adult' THEN
    RAISE EXCEPTION 'Only adult accounts can register as educators.';
  END IF;

  UPDATE public.profiles
  SET role = 'educator', updated_at = NOW()
  WHERE id = p_user_id
    AND role = 'adult';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The Google account could not be registered as an educator.';
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_educator_google_signup(p_user_id UUID, p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN public.complete_educator_google_signup(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_educator_google_signup(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_educator_google_signup(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_educator_google_signup(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_educator_google_signup(UUID, UUID) TO service_role;
