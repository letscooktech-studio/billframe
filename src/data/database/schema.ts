/**
 * SQLITE SCHEMA DEFINITION & DDL
 * Enforces composite business-profile scoped uniqueness, WAL mode, foreign keys,
 * and orthogonal lifecycle states.
 */

export const INITIAL_SCHEMA_SQL = `
-- Enforce Foreign Keys
PRAGMA foreign_keys = ON;

-- 1. Business Profiles (Supports single active in UI, multi-business ready in schema)
CREATE TABLE IF NOT EXISTS business_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  country_iso2 TEXT NOT NULL DEFAULT 'US',
  subdivision_code TEXT,
  subdivision_name TEXT,
  phone_country_iso2 TEXT,
  phone_e164 TEXT,
  upi_vpa TEXT,
  logo_uri TEXT,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  default_document_locale TEXT NOT NULL DEFAULT 'en-US',
  default_payment_terms TEXT,
  default_notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  country TEXT,
  subdivision_code TEXT,
  subdivision_name TEXT,
  is_business INTEGER NOT NULL DEFAULT 0,
  tax_id TEXT,
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_archived ON customers(is_archived);

-- 3. Catalog Items (Products & Services)
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit_name TEXT NOT NULL DEFAULT 'item',
  default_tax_rate_bp INTEGER NOT NULL DEFAULT 0,
  hsn_sac_code TEXT,
  item_type TEXT NOT NULL DEFAULT 'service',
  tax_category TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_name ON catalog_items(name);

-- 4. Number Sequences (Scoped per business profile)
CREATE TABLE IF NOT EXISTS number_sequences (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('invoice', 'estimate', 'receipt', 'credit_note', 'proforma', 'delivery_note', 'work_order', 'proposal', 'sow')),
  prefix TEXT NOT NULL,
  next_sequence_number INTEGER NOT NULL DEFAULT 1,
  suffix TEXT NOT NULL DEFAULT '',
  padding INTEGER NOT NULL DEFAULT 4,
  updated_at INTEGER NOT NULL,
  CONSTRAINT uq_seq_business_type UNIQUE(business_profile_id, doc_type)
);

-- 4.1 Jobs / Projects Entity
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  job_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  site_address TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'completed', 'canceled')) DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT uq_job_num UNIQUE(business_profile_id, job_number)
);

CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);

-- 5. Documents (Invoices, Estimates, Receipts, Credit Notes, Proformas, Delivery Notes, Work Orders, Proposals, SOWs)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('invoice', 'estimate', 'receipt', 'credit_note', 'proforma', 'delivery_note', 'work_order', 'proposal', 'sow')),
  sequence_number INTEGER,
  document_number TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
  lifecycle_status TEXT NOT NULL CHECK(lifecycle_status IN ('draft', 'issued', 'void', 'accepted', 'rejected', 'expired')),
  issue_date INTEGER NOT NULL,
  due_date INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'none' CHECK(discount_type IN ('none', 'fixed', 'percentage')),
  discount_value INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  tax_type TEXT NOT NULL DEFAULT 'none' CHECK(tax_type IN ('none', 'exclusive', 'inclusive')),
  tax_rate_bp INTEGER NOT NULL DEFAULT 0,
  tax_label TEXT NOT NULL DEFAULT 'Tax',
  total_minor INTEGER NOT NULL DEFAULT 0,
  deposit_minor INTEGER NOT NULL DEFAULT 0,
  po_number TEXT,
  payment_terms_preset TEXT,
  shipping_address TEXT,
  payment_instructions TEXT,
  notes TEXT,
  terms TEXT,
  internal_notes TEXT,
  signature_uri TEXT,
  signature_date INTEGER,
  place_of_supply TEXT,
  supply_type TEXT,
  reverse_charge INTEGER NOT NULL DEFAULT 0,
  payment_link_url TEXT,
  payment_link_id TEXT,
  parent_document_id TEXT REFERENCES documents(id),
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT uq_doc_business_type_num UNIQUE(business_profile_id, doc_type, document_number)
);

CREATE INDEX IF NOT EXISTS idx_docs_type_status ON documents(doc_type, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_docs_customer ON documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_docs_issue_date ON documents(issue_date);
CREATE INDEX IF NOT EXISTS idx_docs_job ON documents(job_id);

-- 6. Document Items (0..N items supported for draft autosave)
CREATE TABLE IF NOT EXISTS document_items (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  catalog_item_id TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  item_notes TEXT,
  category TEXT,
  hsn_sac_code TEXT,
  quantity_scaled INTEGER NOT NULL DEFAULT 10000,
  unit_name TEXT NOT NULL DEFAULT 'item',
  unit_price_minor INTEGER NOT NULL DEFAULT 0,
  internal_cost_minor INTEGER NOT NULL DEFAULT 0,
  line_total_minor INTEGER NOT NULL DEFAULT 0,
  tax_rate_bp INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  tax_type TEXT NOT NULL DEFAULT 'exclusive',
  tax_components_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_doc_items_doc_id ON document_items(document_id);

-- 7. Document Snapshots (Frozen upon issuance)
CREATE TABLE IF NOT EXISTS document_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  snapshot_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- 8. Payments (Manual & verified payment ledger entries)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other')),
  reference TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'refunded', 'reversed')),
  provider TEXT NOT NULL DEFAULT 'manual' CHECK(provider IN ('manual', 'direct_upi', 'razorpay', 'cashfree', 'stripe', 'other')),
  provider_payment_id TEXT,
  provider_order_id TEXT,
  verification_state TEXT NOT NULL DEFAULT 'manual_confirmed' CHECK(verification_state IN ('manual_confirmed', 'unverified', 'verified_webhook', 'verified_api', 'failed_verification')),
  verified_at INTEGER,
  settlement_state TEXT NOT NULL DEFAULT 'settled' CHECK(settlement_state IN ('settled', 'unsettled', 'not_applicable')),
  refund_state TEXT NOT NULL DEFAULT 'none' CHECK(refund_state IN ('none', 'partial', 'full')),
  refunded_amount_minor INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual_entry' CHECK(source IN ('manual_entry', 'quick_bill', 'invoice_payment', 'direct_qr', 'external_import')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);

-- 9. Receipts (Decoupled from invoice; 1 receipt per payment)
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  sequence_number INTEGER NOT NULL,
  receipt_number TEXT NOT NULL,
  receipt_snapshot_json TEXT NOT NULL,
  issue_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  CONSTRAINT uq_receipt_business_num UNIQUE(business_profile_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON receipts(invoice_id);

-- 10. Expenses (Direct job costs & business operating expenses)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('materials', 'labour', 'subcontractor', 'equipment', 'fuel', 'travel', 'permits', 'other')),
  description TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_date INTEGER NOT NULL,
  receipt_image_uri TEXT,
  is_billable INTEGER NOT NULL DEFAULT 0,
  is_billed INTEGER NOT NULL DEFAULT 0,
  billed_invoice_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_job ON expenses(job_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- 11. Time Tracking Entries (Timesheets for billing & job costing)
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  worker_name TEXT NOT NULL DEFAULT 'Default Worker',
  description TEXT NOT NULL,
  hours_scaled INTEGER NOT NULL DEFAULT 10000, -- 1.0 hours scaled by 10,000
  hourly_rate_minor INTEGER NOT NULL DEFAULT 0,
  internal_cost_rate_minor INTEGER NOT NULL DEFAULT 0,
  entry_date INTEGER NOT NULL,
  is_billed INTEGER NOT NULL DEFAULT 0,
  billed_invoice_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_job ON time_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_time_date ON time_entries(entry_date);

-- 12. Estimate Revisions (Full audit trail of change orders & revisions)
CREATE TABLE IF NOT EXISTS estimate_revisions (
  id TEXT PRIMARY KEY NOT NULL,
  estimate_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  change_notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estimate_rev ON estimate_revisions(estimate_id, revision_number);

-- 13. Settings (Key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 14. Migration History
CREATE TABLE IF NOT EXISTS migration_history (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

-- 15. Audit Events (Immutable audit log for financial and compliance integrity)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'user',
  payload_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);

-- 16. Workspace Preferences (Adaptive layout & user business configuration)
CREATE TABLE IF NOT EXISTS workspace_preferences (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL DEFAULT 'other',
  sales_type TEXT NOT NULL DEFAULT 'both',
  is_gst_registered INTEGER NOT NULL DEFAULT 0,
  track_inventory INTEGER NOT NULL DEFAULT 0,
  track_jobs INTEGER NOT NULL DEFAULT 0,
  partial_payments TEXT NOT NULL DEFAULT 'sometimes',
  recurring_billing INTEGER NOT NULL DEFAULT 0,
  adaptive_enabled INTEGER NOT NULL DEFAULT 1,
  layout_locked INTEGER NOT NULL DEFAULT 0,
  primary_modules_json TEXT NOT NULL DEFAULT '[]',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  onboarding_version INTEGER NOT NULL DEFAULT 1,
  onboarding_completed_at INTEGER,
  profile_version INTEGER NOT NULL DEFAULT 1,
  workspace_config_version INTEGER NOT NULL DEFAULT 1,
  geography_dataset_version TEXT NOT NULL DEFAULT '2026.01',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspace_profile ON workspace_preferences(business_profile_id);

-- 17. Feature Usage (Local on-device signals for deterministic workspace learning)
CREATE TABLE IF NOT EXISTS feature_usage (
  feature_key TEXT PRIMARY KEY NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at INTEGER NOT NULL DEFAULT 0,
  dismiss_count INTEGER NOT NULL DEFAULT 0,
  business_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_count ON feature_usage(use_count);
CREATE INDEX IF NOT EXISTS idx_feature_usage_last ON feature_usage(last_used_at);

-- 18. Countries Reference Table (ISO 3166-1 offline dataset)
CREATE TABLE IF NOT EXISTS countries (
  iso2 TEXT PRIMARY KEY NOT NULL,
  iso3 TEXT NOT NULL,
  name TEXT NOT NULL,
  calling_code TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  default_locale TEXT NOT NULL,
  subdivision_type TEXT NOT NULL DEFAULT 'State',
  tax_system_name TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  metadata_version TEXT NOT NULL DEFAULT '2026.01'
);

-- 19. Subdivisions Reference Table (ISO 3166-2 offline dataset)
CREATE TABLE IF NOT EXISTS subdivisions (
  code TEXT PRIMARY KEY NOT NULL,
  country_iso2 TEXT NOT NULL REFERENCES countries(iso2) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_code TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  metadata_version TEXT NOT NULL DEFAULT '2026.01'
);

CREATE INDEX IF NOT EXISTS idx_subdivisions_country ON subdivisions(country_iso2);
CREATE INDEX IF NOT EXISTS idx_subdivisions_country_name ON subdivisions(country_iso2, name);

-- 20. Document Tax Snapshots (Frozen tax audit ledger)
CREATE TABLE IF NOT EXISTS document_tax_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  tax_pack_id TEXT NOT NULL,
  tax_pack_version TEXT NOT NULL,
  place_of_supply TEXT,
  supply_type TEXT NOT NULL,
  reverse_charge INTEGER NOT NULL DEFAULT 0,
  tax_summary_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_tax_snapshots_doc ON document_tax_snapshots(document_id);

-- 21. Payment Provider Connections (Non-secret provider connection metadata)
CREATE TABLE IF NOT EXISTS payment_provider_connections (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('razorpay', 'cashfree', 'stripe', 'other')),
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK(status IN ('not_configured', 'sandbox', 'partner_approval_required', 'production_available', 'connected', 'suspended')),
  merchant_account_reference TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_testnet INTEGER NOT NULL DEFAULT 1,
  key_id TEXT,
  capabilities_json TEXT,
  last_synced_at INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT uq_provider_business UNIQUE(business_profile_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_provider_connections_bus ON payment_provider_connections(business_profile_id);

-- 22. Credit Notes (Immutable sales adjustment & tax correction document)
CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  original_invoice_id TEXT NOT NULL REFERENCES documents(id),
  credit_note_number TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  credit_amount_minor INTEGER NOT NULL,
  tax_amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  issue_date INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('issued', 'applied', 'refunded', 'void')),
  snapshot_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_customer ON credit_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON credit_notes(original_invoice_id);

-- 23. Customer Advances (Customer credit balance ledger)
CREATE TABLE IF NOT EXISTS customer_advances (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  original_amount_minor INTEGER NOT NULL,
  remaining_amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  payment_source TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  advance_date INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('available', 'partially_allocated', 'fully_allocated', 'refunded')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_advances_cust ON customer_advances(customer_id);

-- 24. Credit Allocations (Advance & Credit Note allocations against Invoices)
CREATE TABLE IF NOT EXISTS credit_allocations (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  customer_advance_id TEXT REFERENCES customer_advances(id) ON DELETE CASCADE,
  credit_note_id TEXT REFERENCES credit_notes(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  allocated_amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  allocated_at INTEGER NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_credit_allocations_inv ON credit_allocations(invoice_id);

-- 25. Payment Refunds (Immutable refunds linked to original payment)
CREATE TABLE IF NOT EXISTS payment_refunds (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  refund_amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('completed', 'pending', 'failed')),
  provider_refund_id TEXT,
  refund_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_pay ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_inv ON payment_refunds(invoice_id);

-- 26. Reminder Events (Accounts Receivable Collection Reminder History)
CREATE TABLE IF NOT EXISTS reminder_events (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  channel TEXT NOT NULL CHECK(channel IN ('whatsapp', 'sms', 'email', 'manual')),
  template TEXT NOT NULL CHECK(template IN ('friendly', 'firm', 'urgent', 'custom')),
  status TEXT NOT NULL CHECK(status IN ('opened_for_sending', 'sent', 'failed')),
  is_automated INTEGER NOT NULL DEFAULT 0,
  reminder_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_events_inv ON reminder_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_events_cust ON reminder_events(customer_id);

-- 27. Invoice Collection Metadata (Promise to Pay & Expected Dates)
CREATE TABLE IF NOT EXISTS invoice_collection_metadata (
  document_id TEXT PRIMARY KEY NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  expected_payment_date INTEGER,
  promise_to_pay_date INTEGER,
  collection_notes TEXT,
  updated_at INTEGER NOT NULL
);
`;

