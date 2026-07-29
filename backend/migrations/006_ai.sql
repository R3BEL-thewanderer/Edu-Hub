-- ============================================================
-- EduHub Migration 006: AI Tutor Infrastructure
-- ============================================================
-- AI access tiers, daily usage tracking, chat sessions,
-- chat messages with token tracking, and 2-day retention.
-- ============================================================

-- ─── Table: ai_access_tiers ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_access_tiers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier                subscription_tier UNIQUE NOT NULL,
  daily_message_limit INTEGER NOT NULL,
  daily_token_limit   INTEGER,
  allowed_providers   ai_provider[] DEFAULT ARRAY['nvidia']::ai_provider[],
  context_window_size INTEGER DEFAULT 4096,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: ai_usage_daily ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_used INTEGER DEFAULT 0,
  tokens_used   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, usage_date)
);

-- ─── Table: ai_chat_sessions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title           TEXT,
  provider        ai_provider,
  total_messages  INTEGER DEFAULT 0,
  total_tokens    INTEGER DEFAULT 0,

  created_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),

  -- Soft delete
  deleted_at      TIMESTAMPTZ
);

-- ─── Table: ai_chat_messages ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  sources     TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_user_date ON ai_usage_daily(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_subject ON ai_chat_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_not_deleted ON ai_chat_sessions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_chat_messages(created_at);

-- ─── Trigger: increment_ai_usage ─────────────────────────────
-- After a message is inserted, update session stats and daily usage.
CREATE OR REPLACE FUNCTION increment_ai_usage()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tokens  INTEGER;
BEGIN
  -- Get user_id from the session
  SELECT user_id INTO v_user_id
  FROM ai_chat_sessions
  WHERE id = NEW.session_id;

  v_tokens := COALESCE(NEW.tokens_used, 0);

  -- Update session totals
  UPDATE ai_chat_sessions
  SET total_messages = total_messages + 1,
      total_tokens = total_tokens + v_tokens,
      last_message_at = now()
  WHERE id = NEW.session_id;

  -- Upsert daily usage
  INSERT INTO ai_usage_daily (user_id, usage_date, messages_used, tokens_used)
  VALUES (v_user_id, CURRENT_DATE, 1, v_tokens)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    messages_used = ai_usage_daily.messages_used + 1,
    tokens_used = ai_usage_daily.tokens_used + EXCLUDED.tokens_used;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_ai_usage
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW EXECUTE FUNCTION increment_ai_usage();

-- ─── Function: cleanup_old_ai_messages ───────────────────────
-- Deletes chat messages older than 2 days.
-- Should be called by pg_cron or application scheduler.
CREATE OR REPLACE FUNCTION cleanup_old_ai_messages()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM ai_chat_messages
  WHERE created_at < now() - INTERVAL '2 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ─── Function: owns_ai_session ─────────────────────────────
-- SECURITY DEFINER: bypasses RLS on ai_chat_sessions to avoid
-- nested IN-subqueries in ai_chat_messages RLS.
CREATE OR REPLACE FUNCTION owns_ai_session(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM ai_chat_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  );
$$;

-- ─── Function: reset_daily_ai_usage ──────────────────────────
-- Cleans up usage records older than 7 days.
CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM ai_usage_daily
  WHERE usage_date < CURRENT_DATE - 7;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
