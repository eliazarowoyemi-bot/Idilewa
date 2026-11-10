CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('yo', 'ig', 'ha', 'sw', 'pcm')),
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_updated_idx
  ON public.ai_conversations (user_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ai_conversations_id_user_id_idx
  ON public.ai_conversations (id, user_id);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can view their own AI conversations"
  ON public.ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can create their own AI conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can update their own AI conversations"
  ON public.ai_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete their own AI conversations"
  ON public.ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_conversation_message_owner_fk
    FOREIGN KEY (conversation_id, user_id)
    REFERENCES public.ai_conversations(id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ai_conversation_messages_history_idx
  ON public.ai_conversation_messages (conversation_id, user_id, created_at);

ALTER TABLE public.ai_conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own AI conversation messages" ON public.ai_conversation_messages;
CREATE POLICY "Users can read their own AI conversation messages"
  ON public.ai_conversation_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own AI messages" ON public.ai_conversation_messages;
CREATE POLICY "Users can add their own AI messages"
  ON public.ai_conversation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'user'
    AND EXISTS (
      SELECT 1
      FROM public.ai_conversations conversation
      WHERE conversation.id = conversation_id
        AND conversation.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.ai_language_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL CHECK (language_code IN ('yo', 'ig', 'ha', 'sw', 'pcm')),
  category TEXT NOT NULL CHECK (category IN (
    'vocabulary', 'translation', 'grammar', 'pronunciation',
    'conversation', 'culture', 'exercise', 'correction'
  )),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
  source_name TEXT NOT NULL CHECK (char_length(source_name) BETWEEN 1 AND 160),
  source_url TEXT CHECK (
    source_url IS NULL
    OR (char_length(source_url) <= 1000 AND source_url ~* '^https://[^[:space:]]+$')
  ),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  embedding extensions.vector(768),
  search_document TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, ''))
  ) STORED,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT approved_knowledge_has_review
    CHECK (review_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS ai_language_knowledge_search_idx
  ON public.ai_language_knowledge USING GIN (search_document);
CREATE INDEX IF NOT EXISTS ai_language_knowledge_vector_idx
  ON public.ai_language_knowledge USING hnsw (embedding extensions.vector_cosine_ops)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_language_knowledge_language_status_idx
  ON public.ai_language_knowledge (language_code, review_status);

ALTER TABLE public.ai_language_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners can read approved language knowledge" ON public.ai_language_knowledge;
CREATE POLICY "Learners can read approved language knowledge"
  ON public.ai_language_knowledge FOR SELECT
  USING (
    review_status = 'approved'
    OR EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = auth.uid() AND profile.role = 'educator'
    )
  );

DROP POLICY IF EXISTS "Educators can add language knowledge" ON public.ai_language_knowledge;
CREATE POLICY "Educators can add language knowledge"
  ON public.ai_language_knowledge FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND review_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = auth.uid() AND profile.role = 'educator'
    )
  );

DROP POLICY IF EXISTS "Educators can review language knowledge" ON public.ai_language_knowledge;
CREATE POLICY "Educators can review language knowledge"
  ON public.ai_language_knowledge FOR UPDATE
  USING (
    review_status = 'pending'
    AND created_by IS DISTINCT FROM auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = auth.uid() AND profile.role = 'educator'
    )
  )
  WITH CHECK (
    review_status IN ('approved', 'rejected')
    AND created_by IS DISTINCT FROM auth.uid()
    AND reviewed_by = auth.uid()
    AND reviewed_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = auth.uid() AND profile.role = 'educator'
    )
  );

REVOKE ALL ON public.ai_language_knowledge FROM anon;
REVOKE UPDATE ON public.ai_language_knowledge FROM anon, authenticated;
GRANT SELECT, INSERT ON public.ai_language_knowledge TO authenticated;
GRANT UPDATE (review_status, reviewed_by, reviewed_at, updated_at)
  ON public.ai_language_knowledge TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_language_knowledge TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated, service_role;
GRANT SELECT, INSERT ON public.ai_conversation_messages TO authenticated;
GRANT SELECT, INSERT ON public.ai_conversation_messages TO service_role;

CREATE OR REPLACE FUNCTION public.search_ai_language_knowledge(
  p_language_code TEXT,
  p_query_text TEXT,
  p_query_embedding extensions.vector(768) DEFAULT NULL,
  p_match_count INTEGER DEFAULT 4
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source_name TEXT,
  source_url TEXT,
  score REAL
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT knowledge.id,
         knowledge.title,
         knowledge.content,
         knowledge.source_name,
         knowledge.source_url,
         CASE
           WHEN p_query_embedding IS NOT NULL AND knowledge.embedding IS NOT NULL
             THEN (1 - (knowledge.embedding <=> p_query_embedding))::REAL
           ELSE ts_rank(knowledge.search_document, websearch_to_tsquery('simple', p_query_text))
         END AS score
  FROM public.ai_language_knowledge AS knowledge
  WHERE knowledge.language_code = p_language_code
    AND knowledge.review_status = 'approved'
    AND (
      (p_query_embedding IS NOT NULL AND knowledge.embedding IS NOT NULL)
      OR knowledge.search_document @@ websearch_to_tsquery('simple', p_query_text)
    )
  ORDER BY score DESC, knowledge.updated_at DESC
  LIMIT LEAST(GREATEST(p_match_count, 1), 10);
$$;

REVOKE ALL ON FUNCTION public.search_ai_language_knowledge(TEXT, TEXT, extensions.vector, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_ai_language_knowledge(TEXT, TEXT, extensions.vector, INTEGER) TO service_role;

CREATE TABLE IF NOT EXISTS public.ai_conversation_rate_limits (
  bucket_hash TEXT PRIMARY KEY CHECK (char_length(bucket_hash) = 64),
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_conversation_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_ai_conversation_rate_limit(
  p_bucket_hash TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_count INTEGER;
BEGIN
  IF p_bucket_hash !~ '^[a-f0-9]{64}$'
    OR p_max_requests < 1
    OR p_window_seconds < 1 THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.ai_conversation_rate_limits
  WHERE window_started_at < v_now - INTERVAL '1 day';

  INSERT INTO public.ai_conversation_rate_limits (
    bucket_hash, window_started_at, request_count, updated_at
  )
  VALUES (p_bucket_hash, v_now, 1, v_now)
  ON CONFLICT (bucket_hash) DO UPDATE SET
    window_started_at = CASE
      WHEN public.ai_conversation_rate_limits.window_started_at
        <= v_now - make_interval(secs => p_window_seconds) THEN v_now
      ELSE public.ai_conversation_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN public.ai_conversation_rate_limits.window_started_at
        <= v_now - make_interval(secs => p_window_seconds) THEN 1
      ELSE public.ai_conversation_rate_limits.request_count + 1
    END,
    updated_at = v_now
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_conversation_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_conversation_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.ai_conversation_rate_limits TO service_role;
