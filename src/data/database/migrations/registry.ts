/**
 * MIGRATION REGISTRY
 * Monotonically increasing, checksummed migrations for Billframe.
 */

import * as SQLite from 'expo-sqlite';
import { Migration } from './types';

/**
 * Safely adds a column to an SQLite table if it does not already exist.
 * Uses PRAGMA table_info inspection.
 */
async function addColumnIfNotExistsAsync(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string
): Promise<void> {
  try {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
    if (cols && cols.length > 0) {
      const exists = cols.some((c) => c.name.toLowerCase() === columnName.toLowerCase());
      if (exists) return;
    }
  } catch {
    // If PRAGMA not supported in mock/environment, attempt ALTER TABLE directly
  }

  try {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition};`);
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    if (!msg.includes('duplicate column') && !msg.includes('already exists')) {
      throw err;
    }
  }
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'v1_baseline_tables',
    checksum: '6e0f488661858066f284e314643df6b359f1be0e6eaeb2491fa5c26bdf3b584a',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Baseline DDL creating the core entity tables
      await db.execAsync(`
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

        CREATE TABLE IF NOT EXISTS number_sequences (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          doc_type TEXT NOT NULL CHECK(doc_type IN ('invoice', 'estimate', 'receipt', 'credit_note', 'proforma', 'delivery_note', 'work_order')),
          prefix TEXT NOT NULL,
          next_sequence_number INTEGER NOT NULL DEFAULT 1,
          suffix TEXT NOT NULL DEFAULT '',
          padding INTEGER NOT NULL DEFAULT 4,
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_seq_business_type UNIQUE(business_profile_id, doc_type)
        );

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

        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
          doc_type TEXT NOT NULL CHECK(doc_type IN ('invoice', 'estimate', 'receipt', 'credit_note', 'proforma', 'delivery_note', 'work_order')),
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
          notes TEXT,
          terms TEXT,
          parent_document_id TEXT REFERENCES documents(id),
          is_archived INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_doc_business_type_num UNIQUE(business_profile_id, doc_type, document_number)
        );

        CREATE INDEX IF NOT EXISTS idx_docs_type_status ON documents(doc_type, lifecycle_status);
        CREATE INDEX IF NOT EXISTS idx_docs_customer ON documents(customer_id);
        CREATE INDEX IF NOT EXISTS idx_docs_issue_date ON documents(issue_date);

        CREATE TABLE IF NOT EXISTS document_items (
          id TEXT PRIMARY KEY NOT NULL,
          document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          catalog_item_id TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,
          description TEXT NOT NULL,
          quantity_scaled INTEGER NOT NULL DEFAULT 10000,
          unit_name TEXT NOT NULL DEFAULT 'item',
          unit_price_minor INTEGER NOT NULL DEFAULT 0,
          line_total_minor INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_doc_items_doc_id ON document_items(document_id);

        CREATE TABLE IF NOT EXISTS document_snapshots (
          id TEXT PRIMARY KEY NOT NULL,
          document_id TEXT NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
          snapshot_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

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

        CREATE TABLE IF NOT EXISTS time_entries (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
          job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
          customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
          worker_name TEXT NOT NULL DEFAULT 'Default Worker',
          description TEXT NOT NULL,
          hours_scaled INTEGER NOT NULL DEFAULT 10000,
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

        CREATE TABLE IF NOT EXISTS estimate_revisions (
          id TEXT PRIMARY KEY NOT NULL,
          estimate_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          revision_number INTEGER NOT NULL,
          snapshot_json TEXT NOT NULL,
          change_notes TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_estimate_rev ON estimate_revisions(estimate_id, revision_number);

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    name: 'v2_document_expansion_and_audit',
    checksum: '68962be9cb44331070fa67f082e5b77c5c0f99767756f7ef57d7286377501b1b',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Expand documents table
      await addColumnIfNotExistsAsync(db, 'documents', 'job_id', 'job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL');
      await addColumnIfNotExistsAsync(db, 'documents', 'po_number', 'po_number TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'payment_terms_preset', 'payment_terms_preset TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'shipping_address', 'shipping_address TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'payment_instructions', 'payment_instructions TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'internal_notes', 'internal_notes TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'deposit_minor', 'deposit_minor INTEGER NOT NULL DEFAULT 0');
      await addColumnIfNotExistsAsync(db, 'documents', 'signature_uri', 'signature_uri TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'signature_date', 'signature_date INTEGER');

      // 2. Expand document_items table
      await addColumnIfNotExistsAsync(db, 'document_items', 'item_notes', 'item_notes TEXT');
      await addColumnIfNotExistsAsync(db, 'document_items', 'internal_cost_minor', 'internal_cost_minor INTEGER NOT NULL DEFAULT 0');
      await addColumnIfNotExistsAsync(db, 'document_items', 'category', 'category TEXT');

      // 3. Create audit_events table & indexes
      await db.execAsync(`
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
        CREATE INDEX IF NOT EXISTS idx_docs_job ON documents(job_id);
      `);
    },
  },
  {
    version: 3,
    name: 'v3_expand_payments_forward_compatible',
    checksum: 'a8726588fbc8d31481a578ba3c7809a4714db2543e0d866a152e7be59dc32062',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Expand payments table with forward-compatible verification, status, and settlement fields
      await addColumnIfNotExistsAsync(db, 'payments', 'status', "status TEXT NOT NULL DEFAULT 'completed'");
      await addColumnIfNotExistsAsync(db, 'payments', 'provider', "provider TEXT NOT NULL DEFAULT 'manual'");
      await addColumnIfNotExistsAsync(db, 'payments', 'provider_payment_id', 'provider_payment_id TEXT');
      await addColumnIfNotExistsAsync(db, 'payments', 'provider_order_id', 'provider_order_id TEXT');
      await addColumnIfNotExistsAsync(db, 'payments', 'verification_state', "verification_state TEXT NOT NULL DEFAULT 'manual_confirmed'");
      await addColumnIfNotExistsAsync(db, 'payments', 'verified_at', 'verified_at INTEGER');
      await addColumnIfNotExistsAsync(db, 'payments', 'settlement_state', "settlement_state TEXT NOT NULL DEFAULT 'settled'");
      await addColumnIfNotExistsAsync(db, 'payments', 'refund_state', "refund_state TEXT NOT NULL DEFAULT 'none'");
      await addColumnIfNotExistsAsync(db, 'payments', 'refunded_amount_minor', 'refunded_amount_minor INTEGER NOT NULL DEFAULT 0');
      await addColumnIfNotExistsAsync(db, 'payments', 'source', "source TEXT NOT NULL DEFAULT 'manual_entry'");
      await addColumnIfNotExistsAsync(db, 'payments', 'updated_at', 'updated_at INTEGER NOT NULL DEFAULT 0');

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
      `);
    },
  },
  {
    version: 4,
    name: 'v4_workspace_preferences_and_feature_usage',
    checksum: '086b81a017787a7e889ae24411ae876a82f13e319e78f45ed107fc12e1d60779',
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
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
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_workspace_profile ON workspace_preferences(business_profile_id);

        CREATE TABLE IF NOT EXISTS feature_usage (
          feature_key TEXT PRIMARY KEY NOT NULL,
          use_count INTEGER NOT NULL DEFAULT 0,
          last_used_at INTEGER NOT NULL DEFAULT 0,
          dismiss_count INTEGER NOT NULL DEFAULT 0,
          business_id TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_feature_usage_count ON feature_usage(use_count);
        CREATE INDEX IF NOT EXISTS idx_feature_usage_last ON feature_usage(last_used_at);
      `);
    },
  },
  {
    version: 5,
    name: 'v5_geography_and_onboarding_lifecycle',
    checksum: 'df46bed1b901ec46fe934c50c3d032b28e7986113969eb67754f9b01e6540b28',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Create countries & subdivisions reference tables
      await db.execAsync(`
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
      `);

      // 2. Expand business_profiles with geography & canonical phone columns
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'country_iso2', "country_iso2 TEXT NOT NULL DEFAULT 'US'");
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'subdivision_code', 'subdivision_code TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'subdivision_name', 'subdivision_name TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'phone_country_iso2', 'phone_country_iso2 TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'phone_e164', 'phone_e164 TEXT');

      // 3. Expand workspace_preferences with lifecycle versioning
      await addColumnIfNotExistsAsync(db, 'workspace_preferences', 'onboarding_version', 'onboarding_version INTEGER NOT NULL DEFAULT 1');
      await addColumnIfNotExistsAsync(db, 'workspace_preferences', 'onboarding_completed_at', 'onboarding_completed_at INTEGER');
      await addColumnIfNotExistsAsync(db, 'workspace_preferences', 'profile_version', 'profile_version INTEGER NOT NULL DEFAULT 1');
      await addColumnIfNotExistsAsync(db, 'workspace_preferences', 'workspace_config_version', 'workspace_config_version INTEGER NOT NULL DEFAULT 1');
      await addColumnIfNotExistsAsync(db, 'workspace_preferences', 'geography_dataset_version', "geography_dataset_version TEXT NOT NULL DEFAULT '2026.01'");

      // 4. Populate countries dataset
      const { COUNTRIES } = await import('../../geography/countries');
      for (const c of COUNTRIES) {
        await db.runAsync(
          `INSERT OR REPLACE INTO countries (
            iso2, iso3, name, calling_code, currency_code, currency_symbol,
            default_locale, subdivision_type, tax_system_name, active, metadata_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            c.iso2,
            c.iso3,
            c.name,
            c.callingCode,
            c.currencyCode,
            c.currencySymbol,
            c.defaultLocale,
            c.subdivisionType,
            c.taxSystemName || null,
            c.active ? 1 : 0,
            c.metadataVersion,
          ]
        );
      }

      // 5. Populate subdivisions dataset
      const { SUBDIVISIONS } = await import('../../geography/subdivisions');
      for (const s of SUBDIVISIONS) {
        await db.runAsync(
          `INSERT OR REPLACE INTO subdivisions (
            code, country_iso2, name, type, parent_code, active, metadata_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            s.code,
            s.countryIso2,
            s.name,
            s.type,
            s.parentCode || null,
            s.active ? 1 : 0,
            s.metadataVersion,
          ]
        );
      }

      // 6. Safe existing user synchronization
      try {
        await db.runAsync("UPDATE business_profiles SET country_iso2 = country WHERE country_iso2 IS NULL OR country_iso2 = 'US';");
      } catch {
        // Non-blocking
      }

      try {
        const docCount = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM documents;');
        const custCount = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM customers;');
        if ((docCount?.cnt || 0) > 0 || (custCount?.cnt || 0) > 0) {
          await db.runAsync(
            `UPDATE workspace_preferences SET
               onboarding_completed = 1,
               onboarding_completed_at = strftime('%s','now') * 1000
             WHERE onboarding_completed = 0;`
          );
        }
      } catch {
        // Non-blocking
      }
    },
  },
];
