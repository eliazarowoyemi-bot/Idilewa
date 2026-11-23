CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  age_group TEXT NOT NULL CHECK (age_group IN ('under_6', '6_8', '9_12', '13_17')),
  gender TEXT CHECK (gender IS NULL OR gender IN ('boy', 'girl', 'not_specified')),
  avatar TEXT NOT NULL DEFAULT 'a1' CHECK (avatar IN ('a1', 'a2', 'a3', 'a4')),
  preferred_languages TEXT[] NOT NULL CHECK (
    cardinality(preferred_languages) BETWEEN 1 AND 6
    AND preferred_languages <@ ARRAY['yoruba', 'igbo', 'hausa', 'pidgin', 'kiswahili', 'other']::TEXT[]
  ),
  learning_interests TEXT[] NOT NULL DEFAULT '{}'
    CHECK (learning_interests <@ ARRAY['stories', 'games', 'songs', 'arts_crafts']::TEXT[]),
  status TEXT NOT NULL DEFAULT 'pending_consent'
    CHECK (status IN ('pending_consent', 'active', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS children_parent_status_created_idx
  ON public.children (parent_user_id, status, created_at DESC);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.children FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;

CREATE POLICY "Parents can read their own child profiles"
  ON public.children FOR SELECT TO authenticated
  USING (
    parent_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'parent'
    )
  );

CREATE POLICY "Parents can update their own child details"
  ON public.children FOR UPDATE TO authenticated
  USING (
    parent_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'parent'
    )
  )
  WITH CHECK (
    parent_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'parent'
    )
  );

CREATE OR REPLACE FUNCTION public.protect_parent_managed_child()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() = OLD.parent_user_id
    AND (
      NEW.parent_user_id IS DISTINCT FROM OLD.parent_user_id
      OR NEW.status IS DISTINCT FROM OLD.status
    ) THEN
    RAISE EXCEPTION 'Child ownership and consent status can only be changed by the secure service.';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_parent_managed_child_before_update ON public.children;
CREATE TRIGGER protect_parent_managed_child_before_update
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.protect_parent_managed_child();

CREATE TABLE IF NOT EXISTS public.parent_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES public.children(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL CHECK (char_length(parent_name) BETWEEN 1 AND 100),
  parent_email TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('parent', 'legal_guardian', 'authorized_caregiver')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'withdrawn')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  privacy_policy_version TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  verification_token_hash TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_opt_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    parent_email = lower(parent_email)
    AND char_length(parent_email) <= 254
    AND parent_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

CREATE INDEX IF NOT EXISTS parent_consents_owner_status_idx
  ON public.parent_consents (parent_user_id, status, created_at DESC);

ALTER TABLE public.parent_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.parent_consents FROM anon, authenticated;
GRANT ALL ON public.parent_consents TO service_role;

CREATE OR REPLACE FUNCTION public.confirm_child_parental_consent(p_token_hash TEXT)
RETURNS TABLE (child_id UUID, parent_user_id UUID, child_name TEXT, parent_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_consent public.parent_consents%ROWTYPE;
  v_child_name TEXT;
BEGIN
  SELECT * INTO v_consent
  FROM public.parent_consents
  WHERE verification_token_hash = p_token_hash
    AND status = 'pending'
    AND token_expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT name INTO v_child_name
  FROM public.children
  WHERE id = v_consent.child_id
    AND parent_user_id = v_consent.parent_user_id
    AND status = 'pending_consent'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.parent_consents
  SET status = 'verified',
      consent_at = NOW(),
      verified_at = NOW()
  WHERE id = v_consent.id;

  UPDATE public.children
  SET status = 'active',
      updated_at = NOW()
  WHERE id = v_consent.child_id;

  RETURN QUERY SELECT v_consent.child_id, v_consent.parent_user_id, v_child_name, v_consent.parent_email;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_child_parental_consent(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_child_parental_consent(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.withdraw_child_parental_consent(
  p_child_id UUID,
  p_parent_user_id UUID
)
RETURNS TABLE (child_id UUID, child_name TEXT, parent_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_consent public.parent_consents%ROWTYPE;
  v_child_name TEXT;
BEGIN
  SELECT * INTO v_consent
  FROM public.parent_consents
  WHERE parent_consents.child_id = p_child_id
    AND parent_consents.parent_user_id = p_parent_user_id
    AND parent_consents.status IN ('pending', 'verified')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT name INTO v_child_name
  FROM public.children
  WHERE id = p_child_id
    AND parent_user_id = p_parent_user_id
    AND status IN ('pending_consent', 'active')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.parent_consents
  SET status = 'withdrawn',
      withdrawn_at = NOW()
  WHERE id = v_consent.id;

  UPDATE public.children
  SET status = 'withdrawn',
      updated_at = NOW()
  WHERE id = p_child_id;

  RETURN QUERY SELECT p_child_id, v_child_name, v_consent.parent_email;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_child_parental_consent(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_child_parental_consent(UUID, UUID) TO service_role;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'family')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('active', 'incomplete', 'incomplete_expired', 'trialing', 'past_due', 'unpaid', 'canceled', 'paused')
  ),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_parent_status_idx
  ON public.subscriptions (parent_user_id, status, current_period_end DESC);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon, authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

CREATE POLICY "Parents can read their own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (
    parent_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'parent'
    )
  );

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'family')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  currency TEXT NOT NULL DEFAULT 'ngn' CHECK (currency = 'ngn'),
  idempotency_key UUID,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'creating'
    CHECK (status IN ('creating', 'pending', 'succeeded', 'failed', 'cancelled', 'expired')),
  receipt_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (receipt_status IN ('pending', 'sending', 'sent', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_user_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_one_open_checkout_per_parent_idx
  ON public.payments (parent_user_id)
  WHERE status IN ('creating', 'pending');

CREATE INDEX IF NOT EXISTS payments_parent_created_idx
  ON public.payments (parent_user_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

CREATE POLICY "Parents can read their own payment history"
  ON public.payments FOR SELECT TO authenticated
  USING (
    parent_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'parent'
    )
  );

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_webhook_events FROM anon, authenticated;
GRANT ALL ON public.billing_webhook_events TO service_role;

CREATE OR REPLACE FUNCTION public.create_parent_managed_child(
  p_parent_user_id UUID,
  p_parent_email TEXT,
  p_child_name TEXT,
  p_age_group TEXT,
  p_gender TEXT,
  p_avatar TEXT,
  p_preferred_languages TEXT[],
  p_learning_interests TEXT[],
  p_parent_name TEXT,
  p_relationship TEXT,
  p_privacy_policy_version TEXT,
  p_terms_version TEXT,
  p_verification_token_hash TEXT,
  p_token_expires_at TIMESTAMPTZ,
  p_marketing_opt_in BOOLEAN,
  p_marketing_opt_in_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_limit INTEGER;
  v_profile_count BIGINT;
  v_child_id UUID;
BEGIN
  PERFORM 1
  FROM public.profiles
  WHERE id = p_parent_user_id
    AND role = 'parent'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PARENT_ACCOUNT_NOT_FOUND';
  END IF;

  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE parent_user_id = p_parent_user_id
      AND plan = 'family'
      AND status IN ('active', 'trialing')
  ) THEN 4 ELSE 1 END
  INTO v_profile_limit;

  SELECT
    (SELECT COUNT(*) FROM public.children
      WHERE parent_user_id = p_parent_user_id
        AND status IN ('pending_consent', 'active'))
    + (SELECT COUNT(DISTINCT claimed_by) FROM public.guardian_access_requests
      WHERE lower(parent_email) = p_parent_email
        AND status = 'used'
        AND claimed_by IS NOT NULL)
  INTO v_profile_count;

  IF v_profile_count >= v_profile_limit THEN
    RAISE EXCEPTION 'CHILD_PROFILE_LIMIT_REACHED:%', v_profile_limit;
  END IF;

  INSERT INTO public.children (
    parent_user_id, name, age_group, gender, avatar,
    preferred_languages, learning_interests, status
  ) VALUES (
    p_parent_user_id, p_child_name, p_age_group, p_gender, p_avatar,
    p_preferred_languages, p_learning_interests, 'pending_consent'
  )
  RETURNING id INTO v_child_id;

  INSERT INTO public.parent_consents (
    child_id, parent_user_id, parent_name, parent_email, relationship,
    status, privacy_policy_version, terms_version, verification_token_hash,
    token_expires_at, marketing_opt_in, marketing_opt_in_at
  ) VALUES (
    v_child_id, p_parent_user_id, p_parent_name, p_parent_email, p_relationship,
    'pending', p_privacy_policy_version, p_terms_version, p_verification_token_hash,
    p_token_expires_at, p_marketing_opt_in, p_marketing_opt_in_at
  );

  RETURN v_child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_parent_managed_child(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT, TEXT, TEXT,
  TEXT, TIMESTAMPTZ, BOOLEAN, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_parent_managed_child(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT, TEXT, TEXT,
  TEXT, TIMESTAMPTZ, BOOLEAN, TIMESTAMPTZ
) TO service_role;
