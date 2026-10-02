/**
 * IN-MEMORY SQLITE MOCK FOR JEST
 * Implements expo-sqlite database interface with full in-memory tables,
 * transactions, rollback capability, and query execution for all Billframe repositories.
 */

export interface MockDbState {
  business_profiles: any[];
  customers: any[];
  jobs: any[];
  catalog_items: any[];
  number_sequences: any[];
  documents: any[];
  document_items: any[];
  document_snapshots: any[];
  payments: any[];
  receipts: any[];
  expenses: any[];
  time_entries: any[];
  estimate_revisions: any[];
  audit_events: any[];
  migration_history: any[];
  workspace_preferences: any[];
  feature_usage: any[];
  countries: any[];
  subdivisions: any[];
}

export class MockSQLiteDatabase {
  state: MockDbState = {
    business_profiles: [],
    customers: [],
    jobs: [],
    catalog_items: [],
    number_sequences: [],
    documents: [],
    document_items: [],
    document_snapshots: [],
    payments: [],
    receipts: [],
    expenses: [],
    time_entries: [],
    estimate_revisions: [],
    audit_events: [],
    migration_history: [],
    workspace_preferences: [],
    feature_usage: [],
    countries: [],
    subdivisions: [],
  };

  reset() {
    this.state = {
      business_profiles: [],
      customers: [],
      jobs: [],
      catalog_items: [],
      number_sequences: [],
      documents: [],
      document_items: [],
      document_snapshots: [],
      payments: [],
      receipts: [],
      expenses: [],
      time_entries: [],
      estimate_revisions: [],
      audit_events: [],
      migration_history: [],
      workspace_preferences: [],
      feature_usage: [],
      countries: [],
      subdivisions: [],
    };
  }

  async execAsync(sql: string): Promise<void> {
    // Pragmas and DDL are acknowledged
    return;
  }

  async withTransactionAsync<T>(action: () => Promise<T>): Promise<T> {
    // Deep clone state for atomic rollback on exception
    const backup = JSON.stringify(this.state);
    try {
      return await action();
    } catch (err) {
      this.state = JSON.parse(backup);
      throw err;
    }
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const s = sql.trim();

    // 1. Business Profiles Insert
    if (s.startsWith('INSERT INTO business_profiles')) {
      const [id, name, country, default_currency, default_document_locale, is_active, created_at, updated_at] = params;
      this.state.business_profiles.push({
        id,
        name,
        country,
        default_currency,
        default_document_locale,
        is_active,
        created_at,
        updated_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 2. Business Profiles Update
    if (s.startsWith('UPDATE business_profiles SET')) {
      const id = params[params.length - 1];
      const p = this.state.business_profiles.find((b) => b.id === id);
      if (p) {
        if (params.length >= 20) {
          const [name, legalName, taxId, email, phone, addr1, city, stateVal, postal, country, countryIso2, subCode, subName, phoneIso2, phoneE164, curr, notes, terms, updated_at] = params;
          Object.assign(p, {
            name,
            legal_name: legalName,
            tax_id: taxId,
            email,
            phone,
            address_line1: addr1,
            city,
            state: stateVal,
            postal_code: postal,
            country,
            country_iso2: countryIso2,
            subdivision_code: subCode,
            subdivision_name: subName,
            phone_country_iso2: phoneIso2,
            phone_e164: phoneE164,
            default_currency: curr,
            default_notes: notes,
            default_payment_terms: terms,
            updated_at,
          });
        } else {
          const [name, legalName, taxId, email, phone, addr1, city, stateVal, postal, country, curr, notes, terms, updated_at] = params;
          Object.assign(p, {
            name,
            legal_name: legalName,
            tax_id: taxId,
            email,
            phone,
            address_line1: addr1,
            city,
            state: stateVal,
            postal_code: postal,
            country,
            default_currency: curr,
            default_notes: notes,
            default_payment_terms: terms,
            updated_at,
          });
        }
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 3. Number Sequences Insert
    if (s.startsWith('INSERT INTO number_sequences') || s.startsWith('INSERT OR IGNORE INTO number_sequences')) {
      const [id, business_profile_id, doc_type, prefix, next_sequence_number, suffix, padding, updated_at] = params;
      const exists = this.state.number_sequences.find((n) => n.business_profile_id === business_profile_id && n.doc_type === doc_type);
      if (!exists) {
        this.state.number_sequences.push({
          id,
          business_profile_id,
          doc_type,
          prefix,
          next_sequence_number,
          suffix,
          padding,
          updated_at,
        });
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    // 4. Number Sequences Update
    if (s.startsWith('UPDATE number_sequences SET next_sequence_number = next_sequence_number + 1')) {
      const [updated_at, id] = params;
      const seq = this.state.number_sequences.find((x) => x.id === id);
      if (seq) {
        seq.next_sequence_number += 1;
        seq.updated_at = updated_at;
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (s.startsWith('UPDATE number_sequences SET prefix = ?')) {
      const [prefix, updated_at, profileId, docType] = params;
      const seq = this.state.number_sequences.find((x) => x.business_profile_id === profileId && x.doc_type === docType);
      if (seq) {
        seq.prefix = prefix;
        seq.updated_at = updated_at;
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 5. Customers Insert
    if (s.startsWith('INSERT INTO customers')) {
      // CustomerRepository.create uses 12 params (is_archived is literal 0 in SQL).
      // BackupManager restore uses 13 params (is_archived is a bound param).
      let id: string, name: string, business_name: any, email: any, phone: any,
          billing_address: any, shipping_address: any, country: any, tax_id: any,
          notes: any, is_archived: number, created_at: number, updated_at: number;

      if (params.length === 12) {
        // Create path: no is_archived param
        [id, name, business_name, email, phone, billing_address, shipping_address,
          country, tax_id, notes, created_at, updated_at] = params;
        is_archived = 0;
      } else {
        // Restore path: is_archived is bound
        [id, name, business_name, email, phone, billing_address, shipping_address,
          country, tax_id, notes, is_archived, created_at, updated_at] = params;
        is_archived = is_archived || 0;
      }

      this.state.customers.push({
        id, name, business_name, email, phone,
        billing_address, shipping_address, country, tax_id, notes,
        is_archived, created_at, updated_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 6. Customers Update
    if (s.startsWith('UPDATE customers SET')) {
      const [name, business_name, email, phone, billing_address, shipping_address, country, tax_id, notes, updated_at, id] = params;
      const cust = this.state.customers.find((c) => c.id === id);
      if (cust) {
        Object.assign(cust, {
          name,
          business_name,
          email,
          phone,
          billing_address,
          shipping_address,
          country,
          tax_id,
          notes,
          updated_at,
        });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 7. Catalog Items Insert
    if (s.startsWith('INSERT INTO catalog_items')) {
      if (params.length === 9) {
        // Path A: CatalogRepository.create() binds 9 parameters; is_archived is SQL literal 0
        const [id, name, description, unit_price_minor, currency, unit_name, default_tax_rate_bp, created_at, updated_at] = params;
        this.state.catalog_items.push({
          id,
          name,
          description,
          unit_price_minor,
          currency,
          unit_name,
          default_tax_rate_bp,
          is_archived: 0,
          created_at,
          updated_at,
        });
      } else {
        // Path B: BackupManager restore binds all 10 parameters
        const [id, name, description, unit_price_minor, currency, unit_name, default_tax_rate_bp, is_archived, created_at, updated_at] = params;
        this.state.catalog_items.push({
          id,
          name,
          description,
          unit_price_minor,
          currency,
          unit_name,
          default_tax_rate_bp,
          is_archived: Number(is_archived) || 0,
          created_at,
          updated_at,
        });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // Jobs Insert
    if (s.startsWith('INSERT INTO jobs')) {
      const [id, business_profile_id, customer_id, job_number, title, description, site_address, status, created_at, updated_at] = params;
      this.state.jobs.push({
        id,
        business_profile_id,
        customer_id,
        job_number,
        title,
        description,
        site_address,
        status: status || 'active',
        created_at,
        updated_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // Jobs Update
    if (s.startsWith('UPDATE jobs SET')) {
      const [title, description, site_address, status, updated_at, id] = params;
      const job = this.state.jobs.find((j) => j.id === id);
      if (job) {
        Object.assign(job, {
          title,
          description,
          site_address,
          status,
          updated_at,
        });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 8. Catalog Items Archive
    if (s.startsWith('UPDATE catalog_items SET is_archived = 1')) {
      const [updated_at, id] = params;
      const cat = this.state.catalog_items.find((c) => c.id === id);
      if (cat) {
        cat.is_archived = 1;
        cat.updated_at = updated_at;
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 9. Documents Upsert
    if (s.startsWith('INSERT INTO documents')) {
      let docData: any;
      if (params.length === 33) {
        // Path A: DocumentRepository.saveDraft() binds 33 parameters (is_archived is SQL literal 0)
        const [
          id, business_profile_id, job_id, doc_type, sequence_number, document_number, customer_id,
          lifecycle_status, issue_date, due_date, currency, subtotal_minor, discount_minor,
          discount_type, discount_value, tax_minor, tax_type, tax_rate_bp, tax_label,
          total_minor, deposit_minor, po_number, payment_terms_preset, shipping_address,
          payment_instructions, notes, terms, internal_notes, signature_uri, signature_date,
          parent_document_id, created_at, updated_at,
        ] = params;

        docData = {
          id,
          business_profile_id,
          job_id: job_id || null,
          doc_type,
          sequence_number,
          document_number,
          customer_id,
          lifecycle_status,
          issue_date,
          due_date,
          currency,
          subtotal_minor,
          discount_minor,
          discount_type,
          discount_value,
          tax_minor,
          tax_type,
          tax_rate_bp,
          tax_label,
          total_minor,
          deposit_minor: deposit_minor || 0,
          po_number: po_number || null,
          payment_terms_preset: payment_terms_preset || null,
          shipping_address: shipping_address || null,
          payment_instructions: payment_instructions || null,
          notes,
          terms,
          internal_notes: internal_notes || null,
          signature_uri: signature_uri || null,
          signature_date: signature_date || null,
          parent_document_id,
          is_archived: 0,
          created_at,
          updated_at,
        };
      } else {
        // Path B: BackupManager restore binds all 34 parameters
        const [
          id, business_profile_id, job_id, doc_type, sequence_number, document_number, customer_id,
          lifecycle_status, issue_date, due_date, currency, subtotal_minor, discount_minor,
          discount_type, discount_value, tax_minor, tax_type, tax_rate_bp, tax_label,
          total_minor, deposit_minor, po_number, payment_terms_preset, shipping_address,
          payment_instructions, notes, terms, internal_notes, signature_uri, signature_date,
          parent_document_id, is_archived, created_at, updated_at,
        ] = params;

        docData = {
          id,
          business_profile_id,
          job_id: job_id || null,
          doc_type,
          sequence_number,
          document_number,
          customer_id,
          lifecycle_status,
          issue_date,
          due_date,
          currency,
          subtotal_minor,
          discount_minor,
          discount_type,
          discount_value,
          tax_minor,
          tax_type,
          tax_rate_bp,
          tax_label,
          total_minor,
          deposit_minor: deposit_minor || 0,
          po_number: po_number || null,
          payment_terms_preset: payment_terms_preset || null,
          shipping_address: shipping_address || null,
          payment_instructions: payment_instructions || null,
          notes,
          terms,
          internal_notes: internal_notes || null,
          signature_uri: signature_uri || null,
          signature_date: signature_date || null,
          parent_document_id,
          is_archived: Number(is_archived) || 0,
          created_at,
          updated_at,
        };
      }

      const existingIndex = this.state.documents.findIndex((d) => d.id === docData.id);
      if (existingIndex >= 0) {
        this.state.documents[existingIndex] = {
          ...this.state.documents[existingIndex],
          ...docData,
          created_at: this.state.documents[existingIndex].created_at,
        };
      } else {
        this.state.documents.push(docData);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 10. Documents Update to Issued
    if (s.includes('UPDATE documents SET') && s.includes("lifecycle_status = 'issued'")) {
      const [seqNum, finalDocNum, updated_at, id] = params;
      const doc = this.state.documents.find((d) => d.id === id);
      if (doc) {
        doc.sequence_number = seqNum;
        doc.document_number = finalDocNum;
        doc.lifecycle_status = 'issued';
        doc.updated_at = updated_at;
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (s.includes('signature_uri = ?')) {
      const [signatureUri, signatureDate, updated_at, id] = params;
      const doc = this.state.documents.find((d) => d.id === id);
      if (doc) {
        doc.lifecycle_status = 'accepted';
        doc.signature_uri = signatureUri;
        doc.signature_date = signatureDate;
        doc.updated_at = updated_at;
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 11. Documents Update Lifecycle Status (accepted / rejected / void)
    if (s.includes('UPDATE documents SET lifecycle_status =')) {
      const match = s.match(/lifecycle_status = '(\w+)'/);
      const status = match ? match[1] : 'void';
      const [updated_at, id] = params;
      const doc = this.state.documents.find((d) => d.id === id);
      if (doc) {
        doc.lifecycle_status = status;
        doc.updated_at = updated_at;
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 12. Documents Delete Draft
    if (s.startsWith('DELETE FROM documents WHERE id = ?;')) {
      const [id] = params;
      this.state.documents = this.state.documents.filter((d) => d.id !== id);
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 13. Document Items Delete
    if (s.startsWith('DELETE FROM document_items WHERE document_id = ?;')) {
      const [docId] = params;
      this.state.document_items = this.state.document_items.filter((i) => i.document_id !== docId);
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 14. Document Items Insert
    if (s.startsWith('INSERT INTO document_items')) {
      let id, document_id, catalog_item_id, description, item_notes, category, quantity_scaled, unit_name, unit_price_minor, internal_cost_minor, line_total_minor, sort_order;
      if (params.length >= 12) {
        [id, document_id, catalog_item_id, description, item_notes, category, quantity_scaled, unit_name, unit_price_minor, internal_cost_minor, line_total_minor, sort_order] = params;
      } else {
        [id, document_id, catalog_item_id, description, item_notes, quantity_scaled, unit_name, unit_price_minor, line_total_minor, sort_order] = params;
        category = null;
        internal_cost_minor = 0;
      }
      this.state.document_items.push({
        id,
        document_id,
        catalog_item_id,
        description,
        item_notes: item_notes || null,
        category: category || null,
        quantity_scaled,
        unit_name,
        unit_price_minor,
        internal_cost_minor: internal_cost_minor || 0,
        line_total_minor,
        sort_order,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 15. Document Snapshots Upsert
    if (s.startsWith('INSERT INTO document_snapshots')) {
      const [id, document_id, snapshot_json, created_at] = params;
      const idx = this.state.document_snapshots.findIndex((snap) => snap.document_id === document_id);
      if (idx >= 0) {
        this.state.document_snapshots[idx].snapshot_json = snapshot_json;
      } else {
        this.state.document_snapshots.push({ id, document_id, snapshot_json, created_at });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 16. Payments Insert
    if (s.startsWith('INSERT INTO payments')) {
      if (params.length === 20) {
        const [
          id, invoice_id, amount_minor, currency, payment_date, payment_method, reference, notes,
          status, provider, provider_payment_id, provider_order_id, verification_state, verified_at,
          settlement_state, refund_state, refunded_amount_minor, source, created_at, updated_at
        ] = params;
        this.state.payments.push({
          id,
          invoice_id,
          amount_minor,
          currency,
          payment_date,
          payment_method,
          reference,
          notes,
          status,
          provider,
          provider_payment_id,
          provider_order_id,
          verification_state,
          verified_at,
          settlement_state,
          refund_state,
          refunded_amount_minor,
          source,
          created_at,
          updated_at,
        });
      } else {
        const [id, invoice_id, amount_minor, currency, payment_date, payment_method, reference, notes, created_at] = params;
        this.state.payments.push({
          id,
          invoice_id,
          amount_minor,
          currency,
          payment_date,
          payment_method,
          reference,
          notes,
          status: 'completed',
          provider: 'manual',
          provider_payment_id: null,
          provider_order_id: null,
          verification_state: 'manual_confirmed',
          verified_at: payment_date,
          settlement_state: 'settled',
          refund_state: 'none',
          refunded_amount_minor: 0,
          source: 'manual_entry',
          created_at,
          updated_at: created_at,
        });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 16.1 Migration History Insert
    if (s.startsWith('INSERT INTO migration_history')) {
      const [version, name, checksum, applied_at] = params;
      this.state.migration_history.push({ version, name, checksum, applied_at });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 17. Receipts Insert
    if (s.startsWith('INSERT INTO receipts')) {
      const [id, business_profile_id, payment_id, invoice_id, sequence_number, receipt_number, receipt_snapshot_json, issue_date, created_at] = params;
      this.state.receipts.push({
        id,
        business_profile_id,
        payment_id,
        invoice_id,
        sequence_number,
        receipt_number,
        receipt_snapshot_json,
        issue_date,
        created_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 18. Expenses Insert
    if (s.startsWith('INSERT INTO expenses')) {
      const [id, business_profile_id, job_id, customer_id, category, description, amount_minor, currency, expense_date, receipt_image_uri, is_billable, is_billed, billed_invoice_id, created_at, updated_at] = params;
      this.state.expenses.push({
        id,
        business_profile_id,
        job_id: job_id || null,
        customer_id: customer_id || null,
        category,
        description,
        amount_minor,
        currency,
        expense_date,
        receipt_image_uri: receipt_image_uri || null,
        is_billable: is_billable || 0,
        is_billed: is_billed || 0,
        billed_invoice_id: billed_invoice_id || null,
        created_at,
        updated_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 19. Expenses Delete
    if (s.startsWith('DELETE FROM expenses WHERE id = ?;')) {
      const [id] = params;
      this.state.expenses = this.state.expenses.filter((e) => e.id !== id);
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 20. Time Entries Insert
    if (s.startsWith('INSERT INTO time_entries')) {
      const [id, business_profile_id, job_id, customer_id, worker_name, description, hours_scaled, hourly_rate_minor, internal_cost_rate_minor, entry_date, is_billed, billed_invoice_id, created_at, updated_at] = params;
      this.state.time_entries.push({
        id,
        business_profile_id,
        job_id: job_id || null,
        customer_id: customer_id || null,
        worker_name,
        description,
        hours_scaled,
        hourly_rate_minor,
        internal_cost_rate_minor,
        entry_date,
        is_billed: is_billed || 0,
        billed_invoice_id: billed_invoice_id || null,
        created_at,
        updated_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 21. Time Entries Delete
    if (s.startsWith('DELETE FROM time_entries WHERE id = ?;')) {
      const [id] = params;
      this.state.time_entries = this.state.time_entries.filter((t) => t.id !== id);
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 22. Estimate Revisions Insert
    if (s.startsWith('INSERT INTO estimate_revisions')) {
      const [id, estimate_id, revision_number, snapshot_json, change_notes, created_at] = params;
      this.state.estimate_revisions.push({
        id,
        estimate_id,
        revision_number,
        snapshot_json,
        change_notes: change_notes || null,
        created_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 23. Audit Events Insert
    if (s.startsWith('INSERT INTO audit_events')) {
      const [id, business_profile_id, entity_type, entity_id, action, actor, payload_json, created_at] = params;
      this.state.audit_events.push({
        id,
        business_profile_id,
        entity_type,
        entity_id,
        action,
        actor,
        payload_json,
        created_at,
      });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 24. Workspace Preferences Upsert
    if (s.startsWith('INSERT INTO workspace_preferences')) {
      const [
        id, business_profile_id, business_type, sales_type,
        is_gst_registered, track_inventory, track_jobs,
        partial_payments, recurring_billing, adaptive_enabled,
        layout_locked, primary_modules_json, onboarding_completed,
        created_at, updated_at
      ] = params;

      const idx = this.state.workspace_preferences.findIndex((w) => w.id === id);
      const record = {
        id, business_profile_id, business_type, sales_type,
        is_gst_registered, track_inventory, track_jobs,
        partial_payments, recurring_billing, adaptive_enabled,
        layout_locked, primary_modules_json, onboarding_completed,
        created_at, updated_at
      };
      if (idx >= 0) {
        this.state.workspace_preferences[idx] = record;
      } else {
        this.state.workspace_preferences.push(record);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 25. Feature Usage Upsert
    if (s.startsWith('INSERT INTO feature_usage')) {
      const [feature_key, last_used_at, business_id] = params;
      const existing = this.state.feature_usage.find((f) => f.feature_key === feature_key);
      const isDismiss = s.includes('dismiss_count = dismiss_count + 1');
      if (existing) {
        if (isDismiss) {
          existing.dismiss_count += 1;
        } else {
          existing.use_count += 1;
        }
        existing.last_used_at = last_used_at;
        if (business_id) existing.business_id = business_id;
      } else {
        this.state.feature_usage.push({
          feature_key,
          use_count: isDismiss ? 0 : 1,
          last_used_at,
          dismiss_count: isDismiss ? 1 : 0,
          business_id: business_id || null,
        });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 26. Countries Upsert
    if (s.includes('INTO countries')) {
      const [iso2, iso3, name, calling_code, currency_code, currency_symbol, default_locale, subdivision_type, tax_system_name, active, metadata_version] = params;
      const idx = this.state.countries.findIndex((c) => c.iso2 === iso2);
      const rec = { iso2, iso3, name, calling_code, currency_code, currency_symbol, default_locale, subdivision_type, tax_system_name, active, metadata_version };
      if (idx >= 0) this.state.countries[idx] = rec;
      else this.state.countries.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 27. Subdivisions Upsert
    if (s.includes('INTO subdivisions')) {
      const [code, country_iso2, name, type, parent_code, active, metadata_version] = params;
      const idx = this.state.subdivisions.findIndex((sub) => sub.code === code);
      const rec = { code, country_iso2, name, type, parent_code, active, metadata_version };
      if (idx >= 0) this.state.subdivisions[idx] = rec;
      else this.state.subdivisions.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 26. Delete feature usage
    if (s.startsWith('DELETE FROM feature_usage')) {
      this.state.feature_usage = [];
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    const s = sql.trim();

    // Business Profile
    if (s.includes('FROM business_profiles')) {
      if (params.length > 0) {
        return (this.state.business_profiles.find((b) => b.id === params[0]) as T) || null;
      }
      return (this.state.business_profiles[0] as T) || null;
    }

    // Number Sequence
    if (s.includes('FROM number_sequences WHERE business_profile_id = ? AND doc_type = ?')) {
      const [profileId, docType] = params;
      return (this.state.number_sequences.find((n) => n.business_profile_id === profileId && n.doc_type === docType) as T) || null;
    }

    // Customer
    if (s.startsWith('SELECT * FROM customers WHERE id = ?')) {
      const [id] = params;
      return (this.state.customers.find((c) => c.id === id) as T) || null;
    }

    // Document with Customer Join
    if (s.includes('FROM documents d') && s.includes('WHERE d.id = ?')) {
      const [id] = params;
      const doc = this.state.documents.find((d) => d.id === id);
      if (!doc) return null;
      const cust = this.state.customers.find((c) => c.id === doc.customer_id);
      const snap = this.state.document_snapshots.find((sn) => sn.document_id === doc.id);
      return {
        ...doc,
        customer_name: cust?.name,
        customer_business_name: cust?.business_name,
        customer_email: cust?.email,
        customer_phone: cust?.phone,
        customer_billing_address: cust?.billing_address,
        snapshot_json: snap?.snapshot_json || null,
      } as T;
    }

    // Payments sum for invoice
    if (s.includes('SUM(amount_minor)') && s.includes('WHERE invoice_id = ?')) {
      const [invoiceId] = params;
      const sum = this.state.payments
        .filter((p) => p.invoice_id === invoiceId)
        .reduce((acc, curr) => acc + curr.amount_minor, 0);
      return { sum_paid: sum } as T;
    }

    // Single payment
    if (s.startsWith('SELECT * FROM payments WHERE id = ?;')) {
      const [id] = params;
      return (this.state.payments.find((p) => p.id === id) as T) || null;
    }

    // Single receipt
    if (s.startsWith('SELECT * FROM receipts WHERE id = ?;')) {
      const [id] = params;
      return (this.state.receipts.find((r) => r.id === id) as T) || null;
    }

    // Single catalog item
    if (s.startsWith('SELECT * FROM catalog_items WHERE id = ?;')) {
      const [id] = params;
      return (this.state.catalog_items.find((c) => c.id === id) as T) || null;
    }

    // Single job
    if (s.startsWith('SELECT * FROM jobs WHERE id = ?;')) {
      const [id] = params;
      return (this.state.jobs.find((j) => j.id === id) as T) || null;
    }

    // Single expense
    if (s.startsWith('SELECT * FROM expenses WHERE id = ?;')) {
      const [id] = params;
      return (this.state.expenses.find((e) => e.id === id) as T) || null;
    }

    // Total expenses for job
    if (s.includes('SUM(amount_minor)') && s.includes('FROM expenses WHERE job_id = ?')) {
      const [jobId] = params;
      const sum = this.state.expenses
        .filter((e) => e.job_id === jobId)
        .reduce((acc, curr) => acc + curr.amount_minor, 0);
      return { total_expenses: sum } as T;
    }

    // Total all expenses
    if (s.includes('SUM(amount_minor)') && s.includes('FROM expenses') && !s.includes('WHERE')) {
      const sum = this.state.expenses.reduce((acc, curr) => acc + curr.amount_minor, 0);
      return { total_expenses: sum } as T;
    }

    // Single time entry
    if (s.startsWith('SELECT * FROM time_entries WHERE id = ?;')) {
      const [id] = params;
      return (this.state.time_entries.find((t) => t.id === id) as T) || null;
    }

    // Job count
    if (s.includes('FROM jobs WHERE business_profile_id = ?')) {
      const [profileId] = params;
      const cnt = this.state.jobs.filter((j) => j.business_profile_id === profileId).length;
      return ({ cnt } as unknown as T);
    }

    // Monthly payments sum
    if (s.includes('FROM payments') && s.includes('payment_date >= ?')) {
      const [since] = params;
      const sum_paid = this.state.payments
        .filter((p) => p.payment_date >= since && (!p.status || p.status === 'completed') && (!p.refund_state || p.refund_state !== 'full'))
        .reduce((acc, p) => acc + (p.amount_minor || 0) - (p.refunded_amount_minor || 0), 0);
      return ({ sum_paid } as unknown as T);
    }

    // Workspace preferences
    if (s.includes('FROM workspace_preferences WHERE business_profile_id = ?')) {
      const [profileId] = params;
      return (this.state.workspace_preferences.find((w) => w.business_profile_id === profileId) as T) || null;
    }

    return null;
  }

  async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    const s = sql.trim();

    // PRAGMA table_info check
    if (s.startsWith('PRAGMA table_info')) {
      return [] as T[];
    }

    // Migration history
    if (s.includes('FROM migration_history')) {
      return this.state.migration_history.slice().sort((a, b) => a.version - b.version) as T[];
    }

    // Feature usage
    if (s.includes('FROM feature_usage')) {
      if (params.length > 0) {
        return this.state.feature_usage.filter((f) => f.business_id === params[0] || !f.business_id) as T[];
      }
      return this.state.feature_usage.slice() as T[];
    }

    // Document Items
    if (s.includes('FROM document_items WHERE document_id = ?')) {
      const [docId] = params;
      return this.state.document_items
        .filter((i) => i.document_id === docId)
        .sort((a, b) => a.sort_order - b.sort_order) as T[];
    }

    // Payments for invoice
    if (s.includes('FROM payments WHERE invoice_id = ?')) {
      const [invoiceId] = params;
      return this.state.payments
        .filter((p) => p.invoice_id === invoiceId)
        .sort((a, b) => a.payment_date - b.payment_date) as T[];
    }

    // Receipts for invoice
    if (s.includes('FROM receipts WHERE invoice_id = ?')) {
      const [invoiceId] = params;
      return this.state.receipts
        .filter((r) => r.invoice_id === invoiceId)
        .sort((a, b) => a.issue_date - b.issue_date) as T[];
    }

    // Customers search
    if (s.includes('FROM customers')) {
      return this.state.customers.filter((c) => c.is_archived === 0) as T[];
    }

    // Catalog search
    if (s.includes('FROM catalog_items')) {
      return this.state.catalog_items.filter((c) => c.is_archived === 0) as T[];
    }

    // Expenses for job
    if (s.includes('FROM expenses WHERE job_id = ?')) {
      const [jobId] = params;
      return this.state.expenses
        .filter((e) => e.job_id === jobId)
        .sort((a, b) => b.expense_date - a.expense_date) as T[];
    }

    // All expenses
    if (s.includes('FROM expenses')) {
      return this.state.expenses
        .sort((a, b) => b.expense_date - a.expense_date) as T[];
    }

    // Time entries for job
    if (s.includes('FROM time_entries WHERE job_id = ?')) {
      const [jobId] = params;
      return this.state.time_entries
        .filter((t) => t.job_id === jobId)
        .sort((a, b) => b.entry_date - a.entry_date) as T[];
    }

    // All time entries
    if (s.includes('FROM time_entries')) {
      return this.state.time_entries
        .sort((a, b) => b.entry_date - a.entry_date) as T[];
    }

    // Estimate revisions
    if (s.includes('FROM estimate_revisions WHERE estimate_id = ?')) {
      const [estimateId] = params;
      return this.state.estimate_revisions
        .filter((r) => r.estimate_id === estimateId)
        .sort((a, b) => b.revision_number - a.revision_number) as T[];
    }

    // Number sequences
    if (s.includes('FROM number_sequences WHERE business_profile_id = ?')) {
      const [profileId] = params;
      return this.state.number_sequences.filter((n) => n.business_profile_id === profileId) as T[];
    }

    // Jobs with summary join (must precede FROM documents check because it contains a subquery FROM documents)
    if (s.includes('FROM jobs j') && s.includes('JOIN customers c')) {
      const status = params.length > 0 ? params[0] : null;
      let matched = this.state.jobs;
      if (status) {
        matched = matched.filter((j) => j.status === status);
      }
      return matched.map((j) => {
        const cust = this.state.customers.find((c) => c.id === j.customer_id);
        const docs = this.state.documents.filter(
          (d) => d.job_id === j.id && d.doc_type === 'invoice' && d.lifecycle_status !== 'draft'
        );
        const totalInvoiced = docs.reduce((acc, d) => acc + (d.total_minor || 0), 0);
        const totalPaid = this.state.payments
          .filter((p) => docs.some((d) => d.id === p.invoice_id))
          .reduce((acc, p) => acc + (p.amount_minor || 0), 0);
        return {
          ...j,
          customer_name: cust?.name || '',
          customer_business_name: cust?.business_name || null,
          customer_email: cust?.email || null,
          customer_phone: cust?.phone || null,
          total_invoiced_minor: totalInvoiced,
          total_paid_minor: totalPaid,
          balance_minor: Math.max(0, totalInvoiced - totalPaid),
        };
      }) as T[];
    }

    // Documents query with optional customer join
    if (s.includes('FROM documents')) {
      let docs = this.state.documents.filter((d) => d.is_archived === 0);
      if (s.includes("doc_type = 'invoice'")) {
        docs = docs.filter((d) => d.doc_type === 'invoice');
      }
      if (s.includes("lifecycle_status = 'issued'")) {
        docs = docs.filter((d) => d.lifecycle_status === 'issued');
      }
      return docs
        .map((d) => {
          const cust = this.state.customers.find((c) => c.id === d.customer_id);
          const paymentsForDoc = this.state.payments.filter((p) => p.invoice_id === d.id);
          const totalPaid = paymentsForDoc.reduce((acc, p) => acc + (p.amount_minor || 0), 0);
          return {
            ...d,
            customer_name: cust?.name || null,
            total_paid_minor: totalPaid,
          };
        })
        .sort((a, b) => (b.issue_date || 0) - (a.issue_date || 0)) as T[];
    }

    // Jobs for customer
    if (s.includes('FROM jobs WHERE customer_id = ?')) {
      const [custId] = params;
      return this.state.jobs
        .filter((j) => j.customer_id === custId)
        .sort((a, b) => b.created_at - a.created_at) as T[];
    }

    // Audit events for entity
    if (s.includes('FROM audit_events WHERE entity_type = ? AND entity_id = ?')) {
      const [entityType, entityId] = params;
      return this.state.audit_events
        .filter((a) => a.entity_type === entityType && a.entity_id === entityId)
        .sort((a, b) => a.created_at - b.created_at) as T[];
    }

    // All recent audit events
    if (s.includes('FROM audit_events')) {
      const limit = params.length > 0 ? Number(params[0]) : 50;
      return this.state.audit_events
        .slice()
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit) as T[];
    }

    return [];
  }

  async closeAsync(): Promise<void> {
    return;
  }
}

const mockDb = new MockSQLiteDatabase();

export async function openDatabaseAsync(name: string): Promise<MockSQLiteDatabase> {
  return mockDb;
}

export function getMockDb(): MockSQLiteDatabase {
  return mockDb;
}
