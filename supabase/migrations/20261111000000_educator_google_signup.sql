ALTER TABLE public.guardian_rate_limit_events
  DROP CONSTRAINT IF EXISTS guardian_rate_limit_events_action_check;

ALTER TABLE public.guardian_rate_limit_events
  ADD CONSTRAINT guardian_rate_limit_events_action_check
  CHECK (action IN (
    'request', 'verify', 'request_ip', 'verify_ip', 'approve_ip',
    'educator_verify', 'educator_verify_ip',
    'educator_connection_request', 'educator_connection_request_ip',
    'educator_connection_decision_ip', 'auth_email_code', 'auth_email_code_ip',
    'educator_google_signup', 'educator_google_signup_ip'
  ));

CREATE OR REPLACE FUNCTION public.guardian_rate_limit(
  p_bucket_hash TEXT,
  p_action TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  IF p_action NOT IN (
    'request', 'verify', 'request_ip', 'verify_ip', 'approve_ip',
    'educator_verify', 'educator_verify_ip',
    'educator_connection_request', 'educator_connection_request_ip',
    'educator_connection_decision_ip', 'auth_email_code', 'auth_email_code_ip',
    'educator_google_signup', 'educator_google_signup_ip'
  ) OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN FALSE;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_action), hashtext(p_bucket_hash));
  SELECT COUNT(*) INTO v_attempts
  FROM public.guardian_rate_limit_events
  WHERE bucket_hash = p_bucket_hash
    AND action = p_action
    AND created_at > NOW() - make_interval(secs => p_window_seconds);

  IF v_attempts >= p_limit THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.guardian_rate_limit_events (bucket_hash, action)
  VALUES (p_bucket_hash, p_action);
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.guardian_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardian_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_educator_google_signup(
  p_user_id UUID,
  p_invite_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_redeemed_invite UUID;
BEGIN
  IF p_user_id IS NULL OR p_invite_id IS NULL THEN
    RAISE EXCEPTION 'A verified Google user and educator invitation are required.';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The Google account profile could not be found.';
  END IF;

  IF v_role = 'educator' THEN
    PERFORM 1
    FROM public.educator_invites
    WHERE id = p_invite_id
      AND redeemed_by = p_user_id
      AND redeemed_at IS NOT NULL;
    RETURN FOUND;
  END IF;

  IF v_role <> 'adult' THEN
    RAISE EXCEPTION 'Only adult accounts can register as educators.';
  END IF;

  UPDATE public.educator_invites
  SET redeemed_by = p_user_id, redeemed_at = NOW()
  WHERE id = p_invite_id
    AND expires_at > NOW()
    AND redeemed_by IS NULL
    AND redeemed_at IS NULL
  RETURNING id INTO v_redeemed_invite;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A valid, unused educator invitation is required.';
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

REVOKE ALL ON FUNCTION public.complete_educator_google_signup(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_educator_google_signup(UUID, UUID) TO service_role;
