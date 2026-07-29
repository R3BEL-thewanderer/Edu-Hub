-- ============================================================
-- EduHub Migration 008: Subscriptions & Payments
-- ============================================================
-- Subscription tiers (free, premium, lifetime) and Razorpay
-- payment lifecycle (orders + transactions).
-- ============================================================

-- ─── Table: subscription_plans ───────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier          subscription_tier UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  price_inr     INTEGER NOT NULL,        -- amount in paise (4900 = ₹49)
  duration_days INTEGER,                 -- NULL for lifetime
  features      JSONB DEFAULT '{}',      -- flexible feature flags
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: payment_orders ───────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
  razorpay_order_id TEXT UNIQUE,
  amount            INTEGER NOT NULL,    -- paise
  currency          TEXT DEFAULT 'INR',
  status            payment_status DEFAULT 'created',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: payment_transactions ─────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature  TEXT,
  amount              INTEGER NOT NULL,  -- paise
  currency            TEXT DEFAULT 'INR',
  status              payment_status NOT NULL,
  method              TEXT,              -- upi, card, netbanking, wallet
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ─── Table: user_subscriptions ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id                UUID NOT NULL REFERENCES subscription_plans(id),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),
  started_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at             TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(user_id) WHERE status = 'active';
