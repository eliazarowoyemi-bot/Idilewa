CREATE TABLE IF NOT EXISTS public.family_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_role TEXT NOT NULL CHECK (owner_role IN ('child', 'adult')),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  language TEXT NOT NULL CHECK (language IN ('Yorùbá', 'Igbo', 'Hausa', 'Kiswahili', 'Nigerian Pidgin', 'English')),
  points INTEGER NOT NULL DEFAULT 20 CHECK (points BETWEEN 0 AND 500),
  due_at TIMESTAMPTZ,
  repeat_rule TEXT NOT NULL DEFAULT 'None' CHECK (repeat_rule IN ('None', 'Daily', 'Weekly')),
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'submitted', 'completed')),
  feedback TEXT CHECK (feedback IS NULL OR char_length(feedback) <= 500),
  minutes_tracked INTEGER NOT NULL DEFAULT 0 CHECK (minutes_tracked BETWEEN 0 AND 100000),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (owner_role <> 'adult' OR parent_id = child_id)
);

CREATE INDEX IF NOT EXISTS family_tasks_parent_created_idx
  ON public.family_tasks (parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS family_tasks_child_status_idx
  ON public.family_tasks (child_id, status, created_at DESC);

ALTER TABLE public.family_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family_tasks FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.family_tasks TO service_role;

CREATE TABLE IF NOT EXISTS public.family_reward_settings (
  parent_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points_per_minute INTEGER NOT NULL DEFAULT 5 CHECK (points_per_minute BETWEEN 1 AND 100),
  daily_limit INTEGER NOT NULL DEFAULT 30 CHECK (daily_limit BETWEEN 0 AND 240),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.family_reward_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family_reward_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.family_reward_settings TO service_role;

CREATE TABLE IF NOT EXISTS public.family_reward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_code TEXT NOT NULL CHECK (reward_code IN ('play', 'screen', 'story', 'family')),
  name TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0),
  extra_minutes INTEGER NOT NULL DEFAULT 0 CHECK (extra_minutes BETWEEN 0 AND 240),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS family_rewards_parent_created_idx
  ON public.family_reward_requests (parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS family_rewards_child_created_idx
  ON public.family_reward_requests (child_id, created_at DESC);

ALTER TABLE public.family_reward_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family_reward_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.family_reward_requests TO service_role;

CREATE OR REPLACE FUNCTION public.is_verified_family_child(
  p_parent_id UUID,
  p_child_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS parent
    JOIN public.guardian_access_requests AS guardian
      ON lower(guardian.parent_email) = lower(parent.email)
    JOIN public.profiles AS child
      ON child.id = guardian.claimed_by
     AND child.parent_consent_request_id = guardian.id
    WHERE parent.id = p_parent_id
      AND parent.role = 'parent'
      AND child.id = p_child_id
      AND child.role = 'child'
      AND guardian.status = 'used'
  );
$$;

CREATE OR REPLACE FUNCTION public.transition_family_task(
  p_task_id UUID,
  p_user_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_task public.family_tasks%ROWTYPE;
  v_minutes INTEGER;
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  SELECT * INTO v_task
  FROM public.family_tasks
  WHERE id = p_task_id AND child_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
  END IF;
  IF v_task.owner_role = 'child' THEN
    IF v_role <> 'child' OR NOT public.is_verified_family_child(v_task.parent_id, p_user_id) THEN
      RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
    END IF;
  ELSIF v_task.owner_role = 'adult' THEN
    IF v_role <> 'adult' OR v_task.parent_id <> p_user_id THEN
      RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
    END IF;
  ELSE
    RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
  END IF;

  IF p_action = 'start' THEN
    IF v_task.status = 'assigned' THEN
      UPDATE public.family_tasks
      SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
      WHERE id = v_task.id
      RETURNING * INTO v_task;
    ELSIF v_task.status = 'in_progress' AND v_task.started_at IS NULL THEN
      UPDATE public.family_tasks
      SET started_at = NOW(), updated_at = NOW()
      WHERE id = v_task.id
      RETURNING * INTO v_task;
    ELSE
      RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
    END IF;
  ELSIF p_action = 'pause' THEN
    IF v_task.owner_role <> 'child' OR v_task.status <> 'in_progress' OR v_task.started_at IS NULL THEN
      RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
    END IF;
    v_minutes := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - v_task.started_at)) / 60)::INTEGER);
    UPDATE public.family_tasks
    SET started_at = NULL, minutes_tracked = minutes_tracked + v_minutes, updated_at = NOW()
    WHERE id = v_task.id
    RETURNING * INTO v_task;
  ELSIF p_action = 'submit' THEN
    IF v_task.owner_role <> 'child' OR v_task.status NOT IN ('assigned', 'in_progress') THEN
      RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
    END IF;
    v_minutes := CASE
      WHEN v_task.started_at IS NULL THEN 0
      ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - v_task.started_at)) / 60)::INTEGER)
    END;
    UPDATE public.family_tasks
    SET status = 'submitted',
        submitted_at = NOW(),
        started_at = NULL,
        minutes_tracked = minutes_tracked + v_minutes,
        updated_at = NOW()
    WHERE id = v_task.id
    RETURNING * INTO v_task;
  ELSIF p_action = 'complete' THEN
    IF v_task.owner_role <> 'adult' OR v_task.status NOT IN ('assigned', 'in_progress') THEN
      RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
    END IF;
    v_minutes := CASE
      WHEN v_task.started_at IS NULL THEN 0
      ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - v_task.started_at)) / 60)::INTEGER)
    END;
    UPDATE public.family_tasks
    SET status = 'completed',
        completed_at = NOW(),
        started_at = NULL,
        minutes_tracked = minutes_tracked + v_minutes,
        updated_at = NOW()
    WHERE id = v_task.id
    RETURNING * INTO v_task;
  ELSE
    RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
  END IF;

  RETURN jsonb_build_object(
    'id', v_task.id,
    'status', v_task.status,
    'minutesTracked', v_task.minutes_tracked,
    'startedAt', v_task.started_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_family_task(
  p_task_id UUID,
  p_parent_id UUID,
  p_decision TEXT,
  p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_task public.family_tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task
  FROM public.family_tasks
  WHERE id = p_task_id AND parent_id = p_parent_id AND owner_role = 'child'
  FOR UPDATE;
  IF NOT FOUND OR NOT public.is_verified_family_child(p_parent_id, v_task.child_id) THEN
    RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
  END IF;
  IF v_task.status <> 'submitted' THEN
    RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
  END IF;

  IF p_decision = 'approve' THEN
    UPDATE public.family_tasks
    SET status = 'completed', feedback = NULL, completed_at = NOW(), updated_at = NOW()
    WHERE id = v_task.id
    RETURNING * INTO v_task;
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + v_task.points, updated_at = NOW()
    WHERE id = v_task.child_id AND role = 'child'
      AND parent_consent_request_id = (
        SELECT id FROM public.guardian_access_requests
        WHERE claimed_by = v_task.child_id AND status = 'used'
          AND lower(parent_email) = lower((SELECT email FROM public.profiles WHERE id = p_parent_id))
      );
    IF NOT FOUND THEN
      RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
    END IF;
  ELSIF p_decision = 'revise' AND p_feedback IS NOT NULL AND char_length(btrim(p_feedback)) BETWEEN 1 AND 500 THEN
    UPDATE public.family_tasks
    SET status = 'assigned', feedback = btrim(p_feedback), submitted_at = NULL, started_at = NULL, updated_at = NOW()
    WHERE id = v_task.id
    RETURNING * INTO v_task;
  ELSE
    RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
  END IF;

  RETURN jsonb_build_object(
    'id', v_task.id,
    'status', v_task.status,
    'pointsAwarded', CASE WHEN p_decision = 'approve' THEN v_task.points ELSE 0 END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_family_reward(
  p_parent_id UUID,
  p_child_id UUID,
  p_reward_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_name TEXT;
  v_points INTEGER;
  v_minutes INTEGER;
  v_points_per_minute INTEGER;
  v_balance INTEGER;
  v_reward public.family_reward_requests%ROWTYPE;
BEGIN
  IF NOT public.is_verified_family_child(p_parent_id, p_child_id) THEN
    RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
  END IF;
  SELECT COALESCE(points_per_minute, 5) INTO v_points_per_minute
  FROM public.family_reward_settings
  WHERE parent_id = p_parent_id;
  v_points_per_minute := COALESCE(v_points_per_minute, 5);
  CASE p_reward_code
    WHEN 'play' THEN v_name := 'Extra playtime'; v_points := 15 * v_points_per_minute; v_minutes := 15;
    WHEN 'screen' THEN v_name := 'Extra screen time'; v_points := 20 * v_points_per_minute; v_minutes := 20;
    WHEN 'story' THEN v_name := 'Choose a story'; v_points := 40; v_minutes := 0;
    WHEN 'family' THEN v_name := 'Choose a family activity'; v_points := 75; v_minutes := 0;
    ELSE RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
  END CASE;

  SELECT COALESCE(points, 0) INTO v_balance
  FROM public.profiles
  WHERE id = p_child_id AND role = 'child'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAMILY_ACCESS_DENIED'; END IF;
  IF v_balance < v_points THEN RAISE EXCEPTION 'FAMILY_INSUFFICIENT_POINTS'; END IF;

  UPDATE public.profiles SET points = v_balance - v_points, updated_at = NOW()
  WHERE id = p_child_id AND role = 'child';
  INSERT INTO public.family_reward_requests
    (parent_id, child_id, reward_code, name, points, extra_minutes)
  VALUES (p_parent_id, p_child_id, p_reward_code, v_name, v_points, v_minutes)
  RETURNING * INTO v_reward;

  RETURN jsonb_build_object(
    'id', v_reward.id,
    'name', v_reward.name,
    'points', v_reward.points,
    'extraMinutes', v_reward.extra_minutes,
    'status', v_reward.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_family_reward(
  p_reward_id UUID,
  p_parent_id UUID,
  p_decision TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_reward public.family_reward_requests%ROWTYPE;
  v_daily_limit INTEGER;
  v_approved_minutes INTEGER;
BEGIN
  SELECT * INTO v_reward
  FROM public.family_reward_requests
  WHERE id = p_reward_id AND parent_id = p_parent_id
  FOR UPDATE;
  IF NOT FOUND OR NOT public.is_verified_family_child(p_parent_id, v_reward.child_id) THEN
    RAISE EXCEPTION 'FAMILY_ACCESS_DENIED';
  END IF;
  IF v_reward.status <> 'pending' THEN
    RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
  END IF;

  IF p_decision = 'approve' THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_parent_id::TEXT), hashtext(v_reward.child_id::TEXT));
    SELECT COALESCE(daily_limit, 30) INTO v_daily_limit
    FROM public.family_reward_settings WHERE parent_id = p_parent_id;
    v_daily_limit := COALESCE(v_daily_limit, 30);
    SELECT COALESCE(SUM(extra_minutes), 0) INTO v_approved_minutes
    FROM public.family_reward_requests
    WHERE child_id = v_reward.child_id AND status = 'approved'
      AND decided_at >= date_trunc('day', NOW());
    IF v_reward.extra_minutes > 0 AND v_approved_minutes + v_reward.extra_minutes > v_daily_limit THEN
      RAISE EXCEPTION 'FAMILY_DAILY_LIMIT';
    END IF;
    UPDATE public.family_reward_requests
    SET status = 'approved', decided_at = NOW()
    WHERE id = v_reward.id
    RETURNING * INTO v_reward;
  ELSIF p_decision = 'reject' THEN
    UPDATE public.family_reward_requests
    SET status = 'rejected', decided_at = NOW()
    WHERE id = v_reward.id
    RETURNING * INTO v_reward;
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + v_reward.points, updated_at = NOW()
    WHERE id = v_reward.child_id AND role = 'child';
    IF NOT FOUND THEN RAISE EXCEPTION 'FAMILY_ACCESS_DENIED'; END IF;
  ELSE
    RAISE EXCEPTION 'FAMILY_TASK_CONFLICT';
  END IF;

  RETURN jsonb_build_object('id', v_reward.id, 'status', v_reward.status);
END;
$$;

REVOKE ALL ON FUNCTION public.transition_family_task(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decide_family_task(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.request_family_reward(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decide_family_reward(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_verified_family_child(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_family_task(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decide_family_task(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.request_family_reward(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decide_family_reward(UUID, UUID, TEXT) TO service_role;
