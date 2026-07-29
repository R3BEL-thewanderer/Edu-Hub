-- ============================================================
-- EduHub Migration 007: Mock Tests
-- ============================================================
-- Complete testing and assessment module with questions,
-- options, attempts, answers, and leaderboard.
-- ============================================================

-- ─── Table: mock_tests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_tests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id         UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_by         UUID NOT NULL REFERENCES profiles(id),
  title              TEXT NOT NULL,
  description        TEXT,
  duration_minutes   INTEGER NOT NULL,
  total_marks        INTEGER NOT NULL,
  pass_marks         INTEGER,
  is_published       BOOLEAN DEFAULT false,
  max_attempts       INTEGER DEFAULT 1,
  shuffle_questions  BOOLEAN DEFAULT true,
  show_answers_after BOOLEAN DEFAULT true,
  available_from     TIMESTAMPTZ,
  available_until    TIMESTAMPTZ,

  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now(),

  -- Soft delete
  deleted_at         TIMESTAMPTZ,
  deleted_by         UUID
);

-- ─── Table: mock_questions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id        UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  question_type  question_type NOT NULL DEFAULT 'mcq',
  question_text  TEXT NOT NULL,
  explanation    TEXT,                  -- shown after answer
  marks          INTEGER NOT NULL DEFAULT 1,
  negative_marks NUMERIC(3,2) DEFAULT 0,
  display_order  INTEGER,
  image_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: mock_options ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_options (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES mock_questions(id) ON DELETE CASCADE,
  option_text   TEXT NOT NULL,
  is_correct    BOOLEAN DEFAULT false,
  display_order INTEGER,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: mock_attempts ────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id           UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ DEFAULT now(),
  submitted_at      TIMESTAMPTZ,
  score             NUMERIC(6,2),
  total_correct     INTEGER DEFAULT 0,
  total_wrong       INTEGER DEFAULT 0,
  total_unanswered  INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  is_completed      BOOLEAN DEFAULT false
);

-- ─── Table: mock_answers ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES mock_attempts(id) ON DELETE CASCADE,
  question_id       UUID NOT NULL REFERENCES mock_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES mock_options(id),  -- NULL if unanswered
  short_answer_text TEXT,                                -- for short_answer type
  is_correct        BOOLEAN,
  marks_awarded     NUMERIC(5,2) DEFAULT 0,
  answered_at       TIMESTAMPTZ
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mock_tests_subject ON mock_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_creator ON mock_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_mock_tests_published ON mock_tests(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_mock_tests_not_deleted ON mock_tests(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mock_questions_test ON mock_questions(test_id, display_order);
CREATE INDEX IF NOT EXISTS idx_mock_options_question ON mock_options(question_id, display_order);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_test ON mock_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON mock_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_test_user ON mock_attempts(test_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mock_answers_attempt ON mock_answers(attempt_id);

-- ─── Function: get_mock_leaderboard ──────────────────────────
-- Parameterized replacement for the old mock_leaderboard VIEW.
-- Filters by test_id before aggregation so Postgres can use
-- idx_mock_attempts_test_user instead of scanning all attempts.
CREATE OR REPLACE FUNCTION get_mock_leaderboard(p_test_id UUID)
RETURNS TABLE (
  test_id           UUID,
  user_id           UUID,
  display_name      TEXT,
  avatar_url        TEXT,
  best_score        NUMERIC,
  best_time_seconds INTEGER,
  total_attempts    BIGINT,
  rank              BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ma.test_id,
    ma.user_id,
    p.display_name,
    p.avatar_url,
    MAX(ma.score)                AS best_score,
    MIN(ma.time_taken_seconds)   AS best_time_seconds,
    COUNT(ma.id)                 AS total_attempts,
    DENSE_RANK() OVER (
      ORDER BY MAX(ma.score) DESC, MIN(ma.time_taken_seconds) ASC
    )                            AS rank
  FROM mock_attempts ma
  JOIN profiles p ON p.id = ma.user_id
  WHERE ma.test_id = p_test_id
    AND ma.is_completed = true
  GROUP BY ma.test_id, ma.user_id, p.display_name, p.avatar_url;
$$;

-- ─── Trigger: mock_tests updated_at ──────────────────────────
CREATE TRIGGER mock_tests_updated_at
  BEFORE UPDATE ON mock_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
