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
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_name ON catalog_items(name);

-- 4. Number Sequences (Scoped per business profile)
CREATE TABLE IF NOT EXISTS number_sequences (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('invoice', 'estimate', 'receipt')),
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

-- 5. Documents (Invoices, Estimates, Receipts)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('invoice', 'estimate', 'receipt')),
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
  quantity_scaled INTEGER NOT NULL DEFAULT 10000,
  unit_name TEXT NOT NULL DEFAULT 'item',
  unit_price_minor INTEGER NOT NULL DEFAULT 0,
  line_total_minor INTEGER NOT NULL DEFAULT 0,
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

-- 8. Payments (Manual recorded payments)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other')),
  reference TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

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

-- 10. Settings (Key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 11. Migration History
CREATE TABLE IF NOT EXISTS migration_history (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL,
  checksum TEXT NOT NULL
);
`;
