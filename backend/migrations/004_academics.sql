-- ============================================================
-- EduHub Migration 004: Academic Structure
-- ============================================================
-- Normalized academic hierarchy:
-- academic_years → departments → semesters → subjects
-- ============================================================

-- ─── Table: academic_years ───────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label      TEXT UNIQUE NOT NULL,           -- e.g. '2025-26'
  start_year INTEGER NOT NULL,               -- e.g. 2025
  end_year   INTEGER NOT NULL,               -- e.g. 2026
  is_active  BOOLEAN DEFAULT false,          -- only one active at a time
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_year_range CHECK (end_year = start_year + 1)
);

-- Partial unique index: enforce at most one active academic year
CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_years_active
  ON academic_years (is_active) WHERE is_active = true;

-- ─── Table: departments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        department_code UNIQUE NOT NULL,
  name        TEXT NOT NULL,                 -- e.g. 'Information Technology'
  short_name  TEXT,                          -- e.g. 'IT'
  total_years INTEGER DEFAULT 4,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),

  -- Soft delete
  deleted_at  TIMESTAMPTZ,
  deleted_by  UUID
);

-- Now add the FK on staff_department_access that was deferred from 003
ALTER TABLE staff_department_access
  ADD CONSTRAINT fk_staff_dept_access_department
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- ─── Table: semesters ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semesters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  department_id    UUID REFERENCES departments(id) ON DELETE CASCADE,  -- NULL for FE common semesters
  number           INTEGER NOT NULL CHECK (number BETWEEN 1 AND 8),
  label            TEXT NOT NULL,            -- e.g. 'Semester 1'
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE (academic_year_id, department_id, number)
);

-- ─── Table: subjects ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id   UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,               -- e.g. 'PPS', 'BEE'
  name          TEXT NOT NULL,               -- e.g. 'PPS'
  full_name     TEXT,                        -- e.g. 'Programming & Problem Solving'
  icon          TEXT,                        -- emoji or icon identifier
  description   TEXT,
  credits       INTEGER,
  is_elective   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- Soft delete
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID,

  UNIQUE (semester_id, code)
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_department ON semesters(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_not_deleted ON subjects(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_not_deleted ON departments(id) WHERE deleted_at IS NULL;

-- ─── Function: get_active_academic_year ──────────────────────
CREATE OR REPLACE FUNCTION get_active_academic_year()
RETURNS academic_years
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT * FROM academic_years WHERE is_active = true LIMIT 1;
$$;

-- ─── Function: activate_academic_year ───────────────────────
-- Safely switches the active academic year in one atomic step.
-- Deactivates all, then activates the target — avoids unique
-- constraint violations on idx_academic_years_active.
CREATE OR REPLACE FUNCTION activate_academic_year(p_year_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate all years first
  UPDATE academic_years SET is_active = false WHERE is_active = true;

  -- Activate the target year
  UPDATE academic_years SET is_active = true WHERE id = p_year_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academic year with id % not found', p_year_id;
  END IF;
END;
$$;

-- ─── Trigger: subjects updated_at ────────────────────────────
CREATE TRIGGER subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
