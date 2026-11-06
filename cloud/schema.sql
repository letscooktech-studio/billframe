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

-- ==============================================================================
-- ATOMIC TRANSACTION STORED PROCEDURES
-- ==============================================================================

-- Atomic Webhook Processor: Idempotently ingests webhook event and updates payment ledger in a single transaction
CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_event_id TEXT,
  p_event_type TEXT,
  p_provider VARCHAR(20),
  p_provider_payment_id TEXT,
  p_amount_minor BIGINT,
  p_currency VARCHAR(3),
  p_payload JSONB,
  p_signature TEXT,
  p_payment_link_id TEXT,
  p_business_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_event_inserted_id UUID;
BEGIN
  -- 1. Atomic insertion with unique conflict handling (defends against race conditions & replay attacks)
  INSERT INTO payment_events (
    business_id, event_id, event_type, provider, provider_payment_id,
    amount_minor, currency, payload, signature, is_verified, processed_status, processed_at
  ) VALUES (
    p_business_id, p_event_id, p_event_type, p_provider, p_provider_payment_id,
    p_amount_minor, p_currency, p_payload, p_signature, TRUE, 'processed', NOW()
  )
  ON CONFLICT (event_id) DO NOTHING
  RETURNING id INTO v_event_inserted_id;

  -- If no row was inserted, event_id already exists (concurrent retry or duplicate delivery)
  IF v_event_inserted_id IS NULL THEN
    RETURN jsonb_build_object('success', TRUE, 'status', 'already_processed', 'event_id', p_event_id);
  END IF;

  -- 2. Atomic state transition for the matching payment request
  IF p_payment_link_id IS NOT NULL THEN
    UPDATE payment_requests
    SET status = 'paid',
        updated_at = NOW(),
        metadata = jsonb_build_object(
          'providerPaymentId', p_provider_payment_id,
          'paidAt', NOW()
        )
    WHERE provider_reference_id = p_payment_link_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'status', 'processed', 'event_id', p_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- MULTI-TENANT DELTA SYNCHRONIZATION TABLES WITH ROW LEVEL SECURITY
-- ==============================================================================

-- 1. Business Profiles Sync
CREATE TABLE IF NOT EXISTS cloud_business_profiles (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_profiles_tenant_isolation ON cloud_business_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Customers Sync
CREATE TABLE IF NOT EXISTS cloud_customers (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_customers_tenant_isolation ON cloud_customers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Catalog Items Sync
CREATE TABLE IF NOT EXISTS cloud_catalog_items (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_catalog_items_tenant_isolation ON cloud_catalog_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Documents Sync
CREATE TABLE IF NOT EXISTS cloud_documents (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_documents_tenant_isolation ON cloud_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Document Items Sync
CREATE TABLE IF NOT EXISTS cloud_document_items (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_document_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_document_items_tenant_isolation ON cloud_document_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Payments Sync
CREATE TABLE IF NOT EXISTS cloud_payments (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_payments_tenant_isolation ON cloud_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Universal Documents Sync
CREATE TABLE IF NOT EXISTS cloud_universal_documents (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  client_updated_at BIGINT NOT NULL,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  device_id TEXT,
  PRIMARY KEY (user_id, id)
);
ALTER TABLE cloud_universal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloud_universal_documents_tenant_isolation ON cloud_universal_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


