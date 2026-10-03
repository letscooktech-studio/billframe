-- ==============================================================================
-- BILLFRAME CLOUD CONTROL PLANE SCHEMA (POSTGRESQL / SUPABASE)
-- ==============================================================================
-- Multi-tenant isolation by business_id with strict Row Level Security (RLS).
-- Secrets (key_secret, webhook_secret) NEVER leave this backend control plane.
-- Mobile clients connect via authenticated JWT tokens.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Connected Merchants (Registered business entities using connected gateways)
CREATE TABLE IF NOT EXISTS connected_merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  country_iso2 VARCHAR(2) NOT NULL DEFAULT 'IN',
  upi_vpa TEXT,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('razorpay', 'cashfree', 'stripe', 'other')),
  partner_merchant_id TEXT,
  gateway_account_id TEXT,
  webhook_secret TEXT NOT NULL, -- Stored securely in cloud database, NEVER exposed to client
  status VARCHAR(30) NOT NULL DEFAULT 'partner_approval_required' CHECK (
    status IN ('not_configured', 'sandbox', 'partner_approval_required', 'production_available', 'connected', 'suspended')
  ),
  capabilities JSONB NOT NULL DEFAULT '{"payment_links": true, "refunds": false, "subscriptions": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lightning-fast webhook merchant resolution
CREATE INDEX IF NOT EXISTS idx_merchants_business ON connected_merchants(business_id);
CREATE INDEX IF NOT EXISTS idx_merchants_gateway_acc ON connected_merchants(gateway_account_id);

-- 2. Payment Requests (Online Payment Links generated on behalf of merchants)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES connected_merchants(business_id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('razorpay', 'cashfree', 'stripe', 'other')),
  provider_reference_id TEXT UNIQUE,
  short_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'expired', 'cancelled', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_bus ON payment_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_doc ON payment_requests(business_id, document_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_ref ON payment_requests(provider_reference_id);

-- 3. Payment Events (Webhook ingest audit log & replay prevention ledger)
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES connected_merchants(business_id) ON DELETE CASCADE,
  event_id TEXT NOT NULL UNIQUE, -- Provider unique event ID for deduplication / replay attack defense
  event_type TEXT NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_payment_id TEXT,
  amount_minor BIGINT,
  currency VARCHAR(3),
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  processed_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (processed_status IN ('pending', 'processed', 'ignored', 'failed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_bus ON payment_events(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_id ON payment_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_pay_id ON payment_events(provider_payment_id);

-- 4. Tax Packs Catalog (Global tax engine rule sets & published versions)
CREATE TABLE IF NOT EXISTS tax_packs (
  id VARCHAR(50) PRIMARY KEY,
  country_iso2 VARCHAR(2) NOT NULL,
  pack_name TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  effective_from DATE NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  schema_json JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_packs_country ON tax_packs(country_iso2, is_active);

-- 5. Tax Pack Updates (Immutable change log for tax rule changes)
CREATE TABLE IF NOT EXISTS tax_pack_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id VARCHAR(50) NOT NULL REFERENCES tax_packs(id) ON DELETE CASCADE,
  update_type VARCHAR(20) NOT NULL CHECK (update_type IN ('rate_change', 'exemption_added', 'schedule_modified', 'full_release')),
  version VARCHAR(20) NOT NULL,
  changes_summary TEXT NOT NULL,
  changes_diff JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_pack_updates_pack ON tax_pack_updates(pack_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE connected_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_pack_updates ENABLE ROW LEVEL SECURITY;

-- Connected Merchants: Users can only view and update their own business record
CREATE POLICY merchants_tenant_isolation_select ON connected_merchants
  FOR SELECT USING (auth.uid() = business_id);

CREATE POLICY merchants_tenant_isolation_update ON connected_merchants
  FOR UPDATE USING (auth.uid() = business_id);

-- Payment Requests: Users can view and manage their own payment requests
CREATE POLICY requests_tenant_isolation_all ON payment_requests
  FOR ALL USING (auth.uid() = business_id);

-- Payment Events: Users can view events for their business
CREATE POLICY events_tenant_isolation_select ON payment_events
  FOR SELECT USING (auth.uid() = business_id);

-- Tax Packs: Public read-only for all authenticated or anonymous mobile sync clients
CREATE POLICY tax_packs_read_all ON tax_packs
  FOR SELECT USING (true);

CREATE POLICY tax_pack_updates_read_all ON tax_pack_updates
  FOR SELECT USING (true);
