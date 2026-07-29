-- ============================================================
-- EduHub Migration 009: Analytics & Notifications
-- ============================================================
-- Engagement tracking, multi-channel notifications, activity
-- logs, and admin audit trail.
-- ============================================================

-- ─── Table: analytics_downloads ──────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_downloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id   UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  version_id    UUID REFERENCES material_versions(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: analytics_views ──────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_views (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id      UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  duration_seconds INTEGER,
  viewed_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: bookmarks ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, material_id)
);

-- ─── Table: user_progress ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  materials_viewed INTEGER DEFAULT 0,
  materials_total  INTEGER DEFAULT 0,
  completion_pct   NUMERIC(5,2) DEFAULT 0.00,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, subject_id)
);

-- ─── Table: recently_viewed ──────────────────────────────────
CREATE TABLE IF NOT EXISTS recently_viewed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, material_id)  -- upsert on re-view
);

-- ─── Table: notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  channel    notification_channel NOT NULL DEFAULT 'in_app',
  priority   notification_priority DEFAULT 'normal',
  title      TEXT NOT NULL,
  body       TEXT,
  action_url TEXT,
  metadata   JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT false,
  read_at    TIMESTAMPTZ,
  sent_at    TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: activity_logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,             -- e.g. 'login', 'download', 'submit_test'
  entity_type TEXT,                      -- e.g. 'material', 'mock_test', 'profile'
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: audit_logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,             -- e.g. 'approve_material', 'block_user'
  target_type TEXT NOT NULL,             -- e.g. 'profile', 'study_material'
  target_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  reason      TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analytics_downloads_user ON analytics_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_downloads_material ON analytics_downloads(material_id);
CREATE INDEX IF NOT EXISTS idx_analytics_views_user ON analytics_views(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_views_material ON analytics_views(material_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- ─── Trigger: increment_material_views ───────────────────────
-- When a view is recorded, increment the material's total_views.
CREATE OR REPLACE FUNCTION increment_material_views()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE study_materials
  SET total_views = total_views + 1
  WHERE id = NEW.material_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_views
  AFTER INSERT ON analytics_views
  FOR EACH ROW EXECUTE FUNCTION increment_material_views();

-- ─── Trigger: increment_material_downloads ───────────────────
CREATE OR REPLACE FUNCTION increment_material_downloads()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE study_materials
  SET total_downloads = total_downloads + 1
  WHERE id = NEW.material_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_downloads
  AFTER INSERT ON analytics_downloads
  FOR EACH ROW EXECUTE FUNCTION increment_material_downloads();
