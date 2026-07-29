-- ============================================================
-- EduHub Migration 005: Study Materials
-- ============================================================
-- Unified material storage replacing old `files` + `videos`.
-- Supports version-based approval workflow, ratings, and
-- soft delete.
-- ============================================================

-- ─── Table: study_materials ──────────────────────────────────
CREATE TABLE IF NOT EXISTS study_materials (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id         UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  material_type      material_type NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  uploaded_by        UUID NOT NULL REFERENCES profiles(id),
  is_official        BOOLEAN DEFAULT false, -- faculty uploads = official

  -- Points to the current approved version
  current_version_id UUID,                  -- FK added after material_versions exists

  -- Aggregated stats (updated by triggers)
  total_downloads    INTEGER DEFAULT 0,
  total_views        INTEGER DEFAULT 0,
  average_rating     NUMERIC(3,2) DEFAULT 0.00,
  rating_count       INTEGER DEFAULT 0,

  -- Timestamps
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now(),

  -- Soft delete
  deleted_at         TIMESTAMPTZ,
  deleted_by         UUID
);

-- ─── Table: material_versions ────────────────────────────────
CREATE TABLE IF NOT EXISTS material_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL DEFAULT 1,

  -- Storage
  storage_bucket  TEXT DEFAULT 'eduhub-notes',
  storage_path    TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type       TEXT,
  checksum_sha256 TEXT,

  -- Video-specific fields
  youtube_url     TEXT,
  duration        TEXT,
  thumbnail_url   TEXT,

  -- PYQ-specific
  exam_year       TEXT,

  -- Version metadata
  change_summary  TEXT,                     -- what changed from previous version
  uploaded_by     UUID NOT NULL REFERENCES profiles(id),
  is_current      BOOLEAN DEFAULT false,    -- only one per material
  approval_status approval_status DEFAULT 'pending',

  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (material_id, version_number)
);

-- Add the deferred FK from study_materials → material_versions
ALTER TABLE study_materials
  ADD CONSTRAINT fk_materials_current_version
  FOREIGN KEY (current_version_id) REFERENCES material_versions(id)
  ON DELETE SET NULL;

-- ─── Table: material_reviews ─────────────────────────────────
CREATE TABLE IF NOT EXISTS material_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id   UUID NOT NULL REFERENCES material_versions(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES profiles(id),
  status       approval_status NOT NULL,
  review_notes TEXT,
  reviewed_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (version_id, reviewer_id)
);

-- ─── Table: material_ratings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS material_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (material_id, user_id)
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_materials_subject ON study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON study_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON study_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_not_deleted ON study_materials(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_material_versions_material ON material_versions(material_id);
CREATE INDEX IF NOT EXISTS idx_material_versions_current ON material_versions(material_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_material_versions_status ON material_versions(approval_status);
CREATE INDEX IF NOT EXISTS idx_material_reviews_version ON material_reviews(version_id);
CREATE INDEX IF NOT EXISTS idx_material_ratings_material ON material_ratings(material_id);
CREATE INDEX IF NOT EXISTS idx_material_ratings_user ON material_ratings(user_id);

-- ─── Trigger: on_material_approved ───────────────────────────
-- When a review is inserted with status 'approved', update the
-- version's is_current flag and the parent material's pointer.
CREATE OR REPLACE FUNCTION on_material_review_approved()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_material_id UUID;
BEGIN
  -- Only act on approved reviews
  IF NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;

  -- Get the material_id for this version
  SELECT material_id INTO v_material_id
  FROM material_versions
  WHERE id = NEW.version_id;

  -- Update the version's approval_status
  UPDATE material_versions
  SET approval_status = 'approved'
  WHERE id = NEW.version_id;

  -- Remove is_current from all other versions of this material
  UPDATE material_versions
  SET is_current = false
  WHERE material_id = v_material_id
    AND id != NEW.version_id;

  -- Set the newly approved version as current
  UPDATE material_versions
  SET is_current = true
  WHERE id = NEW.version_id;

  -- Update the parent material's pointer
  UPDATE study_materials
  SET current_version_id = NEW.version_id,
      updated_at = now()
  WHERE id = v_material_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_material_review_approved
  AFTER INSERT ON material_reviews
  FOR EACH ROW EXECUTE FUNCTION on_material_review_approved();

-- ─── Trigger: on_material_rejected ───────────────────────────
-- When a review is inserted with status 'rejected', update the
-- version's approval_status.
CREATE OR REPLACE FUNCTION on_material_review_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status != 'rejected' THEN
    RETURN NEW;
  END IF;

  UPDATE material_versions
  SET approval_status = 'rejected'
  WHERE id = NEW.version_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_material_review_rejected
  AFTER INSERT ON material_reviews
  FOR EACH ROW EXECUTE FUNCTION on_material_review_rejected();

-- ─── Trigger: update_material_rating_stats ───────────────────
-- On INSERT: performs incremental stat update (lightweight).
-- On UPDATE/DELETE: performs full recomputation (rare operations).
CREATE OR REPLACE FUNCTION update_material_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_material_id UUID;
  v_old_count   INTEGER;
  v_old_avg     NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incremental update: avoids costly aggregate recomputation
    UPDATE study_materials
    SET rating_count   = rating_count + 1,
        average_rating = ROUND(
          ((average_rating * rating_count) + NEW.rating)::NUMERIC / (rating_count + 1),
          2
        ),
        updated_at = now()
    WHERE id = NEW.material_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Full recomputation on DELETE (rare)
    UPDATE study_materials
    SET average_rating = COALESCE((
          SELECT ROUND(AVG(rating)::NUMERIC, 2)
          FROM material_ratings
          WHERE material_id = OLD.material_id
        ), 0),
        rating_count = (
          SELECT COUNT(*)
          FROM material_ratings
          WHERE material_id = OLD.material_id
        ),
        updated_at = now()
    WHERE id = OLD.material_id;

    RETURN OLD;

  ELSE -- UPDATE
    v_material_id := NEW.material_id;

    UPDATE study_materials
    SET average_rating = COALESCE((
          SELECT ROUND(AVG(rating)::NUMERIC, 2)
          FROM material_ratings
          WHERE material_id = v_material_id
        ), 0),
        updated_at = now()
    WHERE id = v_material_id;

    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_material_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON material_ratings
  FOR EACH ROW EXECUTE FUNCTION update_material_rating_stats();

-- ─── Trigger: study_materials updated_at ─────────────────────
CREATE TRIGGER study_materials_updated_at
  BEFORE UPDATE ON study_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER material_ratings_updated_at
  BEFORE UPDATE ON material_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
