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
  {
    version: 6,
    name: 'v6_tax_engine_and_country_packs',
    checksum: 'c6e43187a552fb821034f89d34208a689e4726bf69dc7268d0bb9930f305c6a1',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Expand customers table with tax & subdivision attributes
      await addColumnIfNotExistsAsync(db, 'customers', 'subdivision_code', 'subdivision_code TEXT');
      await addColumnIfNotExistsAsync(db, 'customers', 'subdivision_name', 'subdivision_name TEXT');
      await addColumnIfNotExistsAsync(db, 'customers', 'is_business', 'is_business INTEGER NOT NULL DEFAULT 0');

      // 2. Expand catalog_items with HSN/SAC and tax attributes
      await addColumnIfNotExistsAsync(db, 'catalog_items', 'hsn_sac_code', 'hsn_sac_code TEXT');
      await addColumnIfNotExistsAsync(db, 'catalog_items', 'item_type', "item_type TEXT NOT NULL DEFAULT 'service'");
      await addColumnIfNotExistsAsync(db, 'catalog_items', 'tax_category', 'tax_category TEXT');

      // 3. Expand documents with tax decision attributes
      await addColumnIfNotExistsAsync(db, 'documents', 'place_of_supply', 'place_of_supply TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'supply_type', 'supply_type TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'reverse_charge', 'reverse_charge INTEGER NOT NULL DEFAULT 0');

      // 4. Expand document_items with HSN/SAC and line tax attributes
      await addColumnIfNotExistsAsync(db, 'document_items', 'hsn_sac_code', 'hsn_sac_code TEXT');
      await addColumnIfNotExistsAsync(db, 'document_items', 'tax_rate_bp', 'tax_rate_bp INTEGER NOT NULL DEFAULT 0');
      await addColumnIfNotExistsAsync(db, 'document_items', 'tax_minor', 'tax_minor INTEGER NOT NULL DEFAULT 0');
      await addColumnIfNotExistsAsync(db, 'document_items', 'tax_type', "tax_type TEXT NOT NULL DEFAULT 'exclusive'");
      await addColumnIfNotExistsAsync(db, 'document_items', 'tax_components_json', 'tax_components_json TEXT');

      // 5. Create document_tax_snapshots table
      await db.execAsync(`
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
      `);
    },
  },
  {
    version: 7,
    name: 'v7_upi_and_payment_connections',
    checksum: '1ab6a8bb2eb7edc01f304e5c826bbc3687f05d789f189c64f39a77f92acf4fec',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Add upi_vpa to business_profiles
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'upi_vpa', 'upi_vpa TEXT');

      // 2. Add payment_link_url and payment_link_id to documents
      await addColumnIfNotExistsAsync(db, 'documents', 'payment_link_url', 'payment_link_url TEXT');
      await addColumnIfNotExistsAsync(db, 'documents', 'payment_link_id', 'payment_link_id TEXT');

      // 3. Create payment_provider_connections table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_provider_connections (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          provider TEXT NOT NULL CHECK(provider IN ('razorpay', 'cashfree', 'stripe', 'other')),
          is_active INTEGER NOT NULL DEFAULT 1,
          is_testnet INTEGER NOT NULL DEFAULT 1,
          key_id TEXT NOT NULL,
          webhook_secret TEXT,
          metadata_json TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_provider_business UNIQUE(business_profile_id, provider)
        );

        CREATE INDEX IF NOT EXISTS idx_provider_connections_bus ON payment_provider_connections(business_profile_id);
      `);
    },
  },
  {
    version: 8,
    name: 'v8_sanitize_provider_connections_and_financial_entities',
    checksum: 'e8acb1060166fa6cb0db792fd2dce3d66620cbc7c1c0955efff26b520959988d',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Expand payment_provider_connections table with non-secret partner/status attributes
      await addColumnIfNotExistsAsync(db, 'payment_provider_connections', 'status', "status TEXT NOT NULL DEFAULT 'not_configured'");
      await addColumnIfNotExistsAsync(db, 'payment_provider_connections', 'merchant_account_reference', 'merchant_account_reference TEXT');
      await addColumnIfNotExistsAsync(db, 'payment_provider_connections', 'capabilities_json', 'capabilities_json TEXT');
      await addColumnIfNotExistsAsync(db, 'payment_provider_connections', 'last_synced_at', 'last_synced_at INTEGER');

      // 2. Create financial completeness tables (Credit Notes, Customer Advances, Allocations, Refunds, Reminders)
      await db.execAsync(`
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
      `);
    },
  },
  {
    version: 9,
    name: 'v9_document_studio_templates_and_custom_blocks',
    checksum: '35eebc03ac38864e2fee17b0ba1326a007d63ac30939d8e12583942ae133a4e7',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Template Definitions Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS template_definitions (
          code TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          thumbnail_uri TEXT,
          default_config_json TEXT NOT NULL,
          is_system INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS template_customizations (
          id TEXT PRIMARY KEY NOT NULL,
          template_code TEXT NOT NULL REFERENCES template_definitions(code) ON DELETE CASCADE,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          brand_color TEXT NOT NULL DEFAULT '#171717',
          secondary_color TEXT NOT NULL DEFAULT '#6B6B6B',
          font_family TEXT NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
          logo_position TEXT NOT NULL DEFAULT 'left',
          show_logo INTEGER NOT NULL DEFAULT 1,
          show_tax_breakdown INTEGER NOT NULL DEFAULT 1,
          show_payment_qr INTEGER NOT NULL DEFAULT 1,
          show_signature INTEGER NOT NULL DEFAULT 1,
          show_terms INTEGER NOT NULL DEFAULT 1,
          custom_declaration TEXT,
          custom_footer_notes TEXT,
          column_visibility_json TEXT NOT NULL DEFAULT '{}',
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_template_profile UNIQUE(template_code, business_profile_id)
        );

        CREATE TABLE IF NOT EXISTS template_assignments (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          doc_type TEXT NOT NULL,
          template_code TEXT NOT NULL REFERENCES template_definitions(code) ON DELETE RESTRICT,
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_assignment_profile_type UNIQUE(business_profile_id, doc_type)
        );

        CREATE TABLE IF NOT EXISTS custom_field_definitions (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          field_key TEXT NOT NULL,
          label TEXT NOT NULL,
          data_type TEXT NOT NULL,
          default_value TEXT,
          is_required INTEGER NOT NULL DEFAULT 0,
          print_visibility INTEGER NOT NULL DEFAULT 1,
          allowed_doc_types_json TEXT NOT NULL DEFAULT '[]',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_custom_field UNIQUE(business_profile_id, field_key)
        );

        CREATE TABLE IF NOT EXISTS custom_block_definitions (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          block_name TEXT NOT NULL,
          block_type TEXT NOT NULL,
          fields_json TEXT NOT NULL DEFAULT '[]',
          allowed_doc_types_json TEXT NOT NULL DEFAULT '[]',
          section_placement TEXT NOT NULL DEFAULT 'body',
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_template_custom_bus ON template_customizations(business_profile_id);
        CREATE INDEX IF NOT EXISTS idx_template_assign_bus ON template_assignments(business_profile_id);
      `);

      // 2. Seed System Template Definitions
      const systemTemplates = [
        { code: 'standard', name: 'Standard Corporate', description: 'Clean, balanced corporate hierarchy suitable for B2B and professional services.', category: 'general', color: '#171717', secondary: '#6B6B6B' },
        { code: 'executive', name: 'Executive Ink', description: 'Deep navy accents, structured summary card, and prominent payment block.', category: 'corporate', color: '#102A43', secondary: '#2563EB' },
        { code: 'compact', name: 'Commerce Compact', description: 'Space-efficient, high-density format designed for wholesale and multi-item orders.', category: 'pos', color: '#1E293B', secondary: '#475569' },
        { code: 'modern', name: 'Modern Editorial', description: 'Contemporary typography, generous whitespace, and sleek horizontal dividers.', category: 'creative', color: '#2563EB', secondary: '#64748B' },
        { code: 'minimal', name: 'Monochrome Minimal', description: 'Pure black-and-white elegance with zero printer ink waste and razor-sharp contrast.', category: 'general', color: '#000000', secondary: '#333333' },
        { code: 'ledger_navy', name: 'Ledger Navy', description: 'Deep navy and precise blue accents optimized for GST invoices and statements.', category: 'corporate', color: '#102A43', secondary: '#2563EB' },
        { code: 'executive_ink', name: 'Executive Ink Black', description: 'High-contrast black, white, and hairline dividers for corporate contracts.', category: 'corporate', color: '#111827', secondary: '#475569' },
        { code: 'architectural_grid', name: 'Architectural Grid', description: 'Strong measurement columns and technical alignment for contractors and engineers.', category: 'technical', color: '#1C1917', secondary: '#57534E' },
        { code: 'modern_editorial', name: 'Modern Editorial Slate', description: 'Refined typography and minimal horizontal rules for agencies and consultants.', category: 'creative', color: '#263445', secondary: '#64748B' },
        { code: 'commerce_compact', name: 'Commerce High-Density', description: 'High-density item columns and compact row height for wholesale distribution.', category: 'pos', color: '#0F172A', secondary: '#334155' },
        { code: 'service_record', name: 'Service Record Sheet', description: 'Distinct technician, asset reference, and labor/materials sections.', category: 'service', color: '#1E3A8A', secondary: '#3B82F6' },
        { code: 'monochrome_minimal', name: 'Pure Monochrome', description: 'Zero ink waste, high readability for field printing and thermal replication.', category: 'general', color: '#000000', secondary: '#404040' },
      ];

      const now = Date.now();
      for (const t of systemTemplates) {
        await db.runAsync(
          `INSERT OR IGNORE INTO template_definitions (
             code, name, description, category, thumbnail_uri, default_config_json, is_system, created_at, updated_at
           ) VALUES (?, ?, ?, ?, NULL, ?, 1, ?, ?);`,
          [t.code, t.name, t.description, t.category, JSON.stringify({ brandColor: t.color, secondaryColor: t.secondary }), now, now]
        );
      }
    },
  },
  {
    version: 10,
    name: 'v10_universal_document_engine',
    checksum: 'b94e72f105829a3e61839db084c67104e689320d75a1478201b5634d2890aef4',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Create custom_document_types and document_instances tables
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS custom_document_types (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL,
          code TEXT NOT NULL,
          name TEXT NOT NULL,
          doc_class TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          schema_json TEXT NOT NULL,
          default_template TEXT NOT NULL DEFAULT 'letterhead',
          is_system INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          CONSTRAINT uq_doctype_code UNIQUE(business_profile_id, code)
        );

        CREATE TABLE IF NOT EXISTS document_instances (
          id TEXT PRIMARY KEY NOT NULL,
          business_profile_id TEXT NOT NULL,
          type_id TEXT NOT NULL,
          doc_class TEXT NOT NULL,
          document_number TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          issue_date INTEGER NOT NULL,
          party_name TEXT,
          party_details_json TEXT,
          content_json TEXT NOT NULL,
          template_code TEXT NOT NULL DEFAULT 'letterhead',
          branding_json TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_doc_instances_bus ON document_instances(business_profile_id);
        CREATE INDEX IF NOT EXISTS idx_doc_instances_type ON document_instances(type_id);
        CREATE INDEX IF NOT EXISTS idx_doc_instances_status ON document_instances(status);
        CREATE INDEX IF NOT EXISTS idx_custom_doc_types_bus ON custom_document_types(business_profile_id);
      `);

      // 2. Seed system templates for letterhead and work orders into template_definitions
      const now = Date.now();
      const studioTemplates = [
        { code: 'letterhead', name: 'Executive Letterhead', description: 'Clean letterhead layout with header crest, candidate/recipient card, narrative body, and dual signatures.', category: 'corporate', color: '#0F172A', secondary: '#2563EB' },
        { code: 'work_order', name: 'Operations Job Card', description: 'Technical operational layout with site details, scheduled milestones, task checklists, and supervisor authorization.', category: 'technical', color: '#1E293B', secondary: '#F59E0B' },
        { code: 'custom_studio', name: 'Universal Studio Preset', description: 'Dynamic multi-section layout adapting to arbitrary custom fields and tables.', category: 'general', color: '#111827', secondary: '#4F46E5' },
      ];

      for (const t of studioTemplates) {
        await db.runAsync(
          `INSERT OR IGNORE INTO template_definitions (
             code, name, description, category, thumbnail_uri, default_config_json, is_system, created_at, updated_at
           ) VALUES (?, ?, ?, ?, NULL, ?, 1, ?, ?);`,
          [t.code, t.name, t.description, t.category, JSON.stringify({ brandColor: t.color, secondaryColor: t.secondary }), now, now]
        );
      }
    },
  },
  {
    version: 11,
    name: 'v11_brand_kit_and_org_identity',
    checksum: 'c2e45bf9a1352e85059d04ba42e2a8647008ff773b185b3b3cbcead1bf167909',
    up: async (db: SQLite.SQLiteDatabase) => {
      // 1. Safely extend business_profiles with brand kit & banking fields
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'website', 'website TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'tagline', 'tagline TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'signatory_name', 'signatory_name TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'signatory_title', 'signatory_title TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'bank_name', 'bank_name TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'bank_account_number', 'bank_account_number TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'bank_ifsc', 'bank_ifsc TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'bank_branch', 'bank_branch TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'bank_account_type', 'bank_account_type TEXT');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'header_style', "header_style TEXT DEFAULT 'modern'");
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'footer_show_signature', 'footer_show_signature INTEGER DEFAULT 1');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'footer_show_stamp', 'footer_show_stamp INTEGER DEFAULT 1');
      await addColumnIfNotExistsAsync(db, 'business_profiles', 'footer_show_address', 'footer_show_address INTEGER DEFAULT 1');
    },
  },
  {
    version: 12,
    name: 'v12_onboarding_v3_preferences',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Safely extend workspace_preferences for Onboarding 3.0 intent and document favorites
      await addColumnIfNotExistsAsync(
        db,
        'workspace_preferences',
        'primary_intent',
        "primary_intent TEXT NOT NULL DEFAULT 'business_documents'"
      );
      await addColumnIfNotExistsAsync(
        db,
        'workspace_preferences',
        'favorite_document_types_json',
        "favorite_document_types_json TEXT NOT NULL DEFAULT '[]'"
      );
      await addColumnIfNotExistsAsync(
        db,
        'workspace_preferences',
        'selected_document_families_json',
        "selected_document_families_json TEXT NOT NULL DEFAULT '[]'"
      );
      await addColumnIfNotExistsAsync(
        db,
        'workspace_preferences',
        'onboarding_state',
        "onboarding_state TEXT NOT NULL DEFAULT 'not_started'"
      );
      await addColumnIfNotExistsAsync(
        db,
        'workspace_preferences',
        'onboarding_step',
        'onboarding_step INTEGER NOT NULL DEFAULT 1'
      );
    },
  },
  {
    version: 13,
    name: 'v13_ai_agent_and_task_ledger',
    checksum: 'a8f4c2e71d934bb1823ef05492167d4e3cb09918237582918274619385019283',
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          active_draft_json TEXT,
          is_archived INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_messages (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          reasoning_trace TEXT,
          document_draft_json TEXT,
          task_steps_json TEXT,
          quick_actions_json TEXT,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (session_id) REFERENCES ai_sessions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_ai_messages_ts ON ai_messages(timestamp);

        CREATE TABLE IF NOT EXISTS agent_tasks (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_agent_tasks_session ON agent_tasks(session_id);
        CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);

        CREATE TABLE IF NOT EXISTS agent_events (
          id TEXT PRIMARY KEY NOT NULL,
          task_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          label TEXT NOT NULL,
          status TEXT NOT NULL,
          payload_json TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_agent_events_task ON agent_events(task_id);

        CREATE TABLE IF NOT EXISTS agent_proposals (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT,
          action_type TEXT NOT NULL,
          tier INTEGER NOT NULL DEFAULT 3,
          status TEXT NOT NULL DEFAULT 'pending',
          target_id TEXT,
          payload_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          executed_at INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_agent_proposals_status ON agent_proposals(status);

        CREATE TABLE IF NOT EXISTS recommendation_entries (
          id TEXT PRIMARY KEY NOT NULL,
          rule_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          severity TEXT NOT NULL DEFAULT 'info',
          entity_type TEXT,
          entity_id TEXT,
          action_label TEXT,
          action_payload_json TEXT,
          is_dismissed INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_recommendations_dismissed ON recommendation_entries(is_dismissed);
      `);
    },
  },
];
