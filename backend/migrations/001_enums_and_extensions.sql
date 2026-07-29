-- ============================================================
-- EduHub Migration 001: Enums & Extensions
-- ============================================================
-- Foundation layer — all custom ENUM types and PostgreSQL
-- extensions must exist before any table references them.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram index for future full-text search

-- ─── ENUM: user_role ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'faculty',
    'content_manager',
    'student'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: department_code ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE department_code AS ENUM (
    'ITC',   -- Information Technology
    'CE',    -- Computer Engineering
    'EXTC',  -- Electronics & Telecommunication
    'ME',    -- Mechanical Engineering
    'CSE',   -- Computer Science & Engineering
    'AI',    -- Artificial Intelligence & Data Science
    'EE'     -- Electrical Engineering
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: material_type ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE material_type AS ENUM (
    'pdf',
    'notes',
    'pyq',
    'video',
    'flashcard',
    'cheatsheet'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: approval_status ──────────────────────────────────
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: subscription_tier ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'free',
    'premium',
    'lifetime'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: payment_status ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'created',
    'authorized',
    'captured',
    'failed',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: question_type ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM (
    'mcq',
    'true_false',
    'short_answer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: notification_type ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'system',
    'content',
    'payment',
    'ai',
    'academic',
    'mock_test'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: notification_channel ─────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'in_app',
    'email',
    'push'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: notification_priority ────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── ENUM: ai_provider ─────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE ai_provider AS ENUM (
    'nvidia',
    'gemini'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
