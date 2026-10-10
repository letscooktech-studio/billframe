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
  document_tax_snapshots: any[];
  payment_provider_connections: any[];
  credit_notes: any[];
  customer_advances: any[];
  credit_allocations: any[];
  payment_refunds: any[];
  reminder_events: any[];
  invoice_collection_metadata: any[];
  template_definitions: any[];
  template_customizations: any[];
  template_assignments: any[];
  custom_field_definitions: any[];
  custom_block_definitions: any[];
  custom_document_types: any[];
  document_instances: any[];
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
    document_tax_snapshots: [],
    payment_provider_connections: [],
    credit_notes: [],
    customer_advances: [],
    credit_allocations: [],
    payment_refunds: [],
    reminder_events: [],
    invoice_collection_metadata: [],
    template_definitions: [],
    template_customizations: [],
    template_assignments: [],
    custom_field_definitions: [],
    custom_block_definitions: [],
    custom_document_types: [],
    document_instances: [],
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
      document_tax_snapshots: [],
      payment_provider_connections: [],
      credit_notes: [],
      customer_advances: [],
      credit_allocations: [],
      payment_refunds: [],
      reminder_events: [],
      invoice_collection_metadata: [],
      template_definitions: [],
      template_customizations: [],
      template_assignments: [],
      custom_field_definitions: [],
      custom_block_definitions: [],
      custom_document_types: [],
      document_instances: [],
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
        if (params.length >= 35) {
          const [
            name, legalName, taxId, email, phone, addr1, city, stateVal, postal,
            country, countryIso2, subCode, subName, phoneIso2, phoneE164, upiVpa,
            website, tagline, signatoryName, signatoryTitle,
            bankName, bankAcct, bankIfsc, bankBranch, bankAcctType,
            headerStyle, footSig, footStamp, footAddr,
            curr, docLocale, notes, terms, logoUri, updated_at
          ] = params;
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
            upi_vpa: upiVpa,
            website,
            tagline,
            signatory_name: signatoryName,
            signatory_title: signatoryTitle,
            bank_name: bankName,
            bank_account_number: bankAcct,
            bank_ifsc: bankIfsc,
            bank_branch: bankBranch,
            bank_account_type: bankAcctType,
            header_style: headerStyle,
            footer_show_signature: footSig,
            footer_show_stamp: footStamp,
            footer_show_address: footAddr,
            default_currency: curr,
            default_document_locale: docLocale,
            default_notes: notes,
            default_payment_terms: terms,
            logo_uri: logoUri,
            updated_at,
          });
        } else if (params.length >= 21) {
          const [name, legalName, taxId, email, phone, addr1, city, stateVal, postal, country, countryIso2, subCode, subName, phoneIso2, phoneE164, upiVpa, curr, notes, terms, updated_at] = params;
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
            upi_vpa: upiVpa,
            default_currency: curr,
            default_notes: notes,
            default_payment_terms: terms,
            updated_at,
          });
        } else if (params.length >= 19) {
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
      } else if (s.includes('ON CONFLICT') || s.includes('DO UPDATE')) {
        exists.next_sequence_number = next_sequence_number;
        exists.updated_at = updated_at;
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

    if (s.startsWith('UPDATE number_sequences SET next_sequence_number = ?')) {
      const [nextSeq, updated_at, id] = params;
      const seq = this.state.number_sequences.find((x) => x.id === id);
      if (seq) {
        seq.next_sequence_number = Number(nextSeq);
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
        const existing = this.state.documents[existingIndex];
        this.state.documents[existingIndex] = {
          ...existing,
          ...docData,
          sequence_number: existing.sequence_number ?? docData.sequence_number,
          document_number: existing.sequence_number ? existing.document_number : docData.document_number,
          lifecycle_status: existing.lifecycle_status !== 'draft' ? existing.lifecycle_status : docData.lifecycle_status,
          created_at: existing.created_at,
        };
      } else {
        this.state.documents.push(docData);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 10. Documents Update to Issued
    if (s.includes('UPDATE documents SET') && s.includes("lifecycle_status = 'issued'")) {
      const id = params[params.length - 1];
      const hasBusinessProfile = s.includes('business_profile_id = ?');
      const offset = hasBusinessProfile ? 1 : 0;
      const seqNum = params[offset];
      const finalDocNum = params[offset + 1];
      const updated_at = params[params.length - 2];
      const doc = this.state.documents.find((d) => d.id === id);
      if (doc) {
        if (hasBusinessProfile) {
          doc.business_profile_id = params[0];
        }
        doc.sequence_number = seqNum;
        doc.document_number = finalDocNum;
        doc.lifecycle_status = 'issued';
        doc.updated_at = updated_at;
        if (s.includes('place_of_supply = ?')) {
          doc.place_of_supply = params[offset + 2];
          doc.supply_type = params[offset + 3];
          doc.reverse_charge = params[offset + 4];
        }
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

    // 15.1 Document Tax Snapshots Upsert
    if (s.startsWith('INSERT INTO document_tax_snapshots') || s.startsWith('INSERT OR REPLACE INTO document_tax_snapshots')) {
      const [id, document_id, tax_pack_id, tax_pack_version, place_of_supply, supply_type, reverse_charge, tax_summary_json, created_at] = params;
      const idx = this.state.document_tax_snapshots.findIndex((snap) => snap.document_id === document_id);
      const rec = { id, document_id, tax_pack_id, tax_pack_version, place_of_supply, supply_type, reverse_charge, tax_summary_json, created_at };
      if (idx >= 0) {
        this.state.document_tax_snapshots[idx] = rec;
      } else {
        this.state.document_tax_snapshots.push(rec);
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
      const id = params[0];
      const business_profile_id = params[1];
      const business_type = params[2];
      const sales_type = params[3];
      const is_gst_registered = params[4];
      const track_inventory = params[5];
      const track_jobs = params[6];
      const partial_payments = params[7];
      const recurring_billing = params[8];
      const adaptive_enabled = params[9];
      const layout_locked = params[10];
      const primary_modules_json = params[11];
      const onboarding_completed = params[12];
      const onboarding_version = params[13];
      const onboarding_completed_at = params[14];
      const profile_version = params[15];
      const workspace_config_version = params[16];
      const geography_dataset_version = params[17];
      const primary_intent = params[18] ?? 'business_documents';
      const favorite_document_types_json = params[19] ?? '[]';
      const selected_document_families_json = params[20] ?? '[]';
      const onboarding_state = params[21] ?? 'not_started';
      const onboarding_step = params[22] ?? 1;
      const created_at = params[23] ?? Date.now();
      const updated_at = params[24] ?? Date.now();

      const idx = this.state.workspace_preferences.findIndex((w) => w.id === id);
      const record = {
        id,
        business_profile_id,
        business_type,
        sales_type,
        is_gst_registered,
        track_inventory,
        track_jobs,
        partial_payments,
        recurring_billing,
        adaptive_enabled,
        layout_locked,
        primary_modules_json,
        onboarding_completed,
        onboarding_version,
        onboarding_completed_at,
        profile_version,
        workspace_config_version,
        geography_dataset_version,
        primary_intent,
        favorite_document_types_json,
        selected_document_families_json,
        onboarding_state,
        onboarding_step,
        created_at,
        updated_at,
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

    // 28. Payment Provider Connections Upsert
    if (s.includes('INTO payment_provider_connections')) {
      const busId = params[1];
      const provider = params[2];
      const idx = this.state.payment_provider_connections.findIndex(
        (c) => c.business_profile_id === busId && c.provider === provider
      );
      let rec: any;
      if (params.length >= 13) {
        const [id, business_profile_id, prov, status, merchant_account_reference, is_active, is_testnet, key_id, capabilities_json, last_synced_at, metadata_json, created_at, updated_at] = params;
        rec = { id, business_profile_id, provider: prov, status, merchant_account_reference, is_active, is_testnet, key_id, capabilities_json, last_synced_at, metadata_json, created_at, updated_at };
      } else {
        const [id, business_profile_id, prov, is_active, is_testnet, key_id, webhook_secret, metadata_json, created_at, updated_at] = params;
        rec = { id, business_profile_id, provider: prov, status: is_testnet ? 'sandbox' : 'partner_approval_required', merchant_account_reference: null, is_active, is_testnet, key_id, capabilities_json: null, last_synced_at: null, metadata_json, created_at, updated_at };
      }
      if (idx >= 0) this.state.payment_provider_connections[idx] = rec;
      else this.state.payment_provider_connections.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 29. Credit Notes Insert / Upsert
    if (s.includes('INTO credit_notes')) {
      const [id, business_profile_id, customer_id, original_invoice_id, credit_note_number, reason, credit_amount_minor, tax_amount_minor, currency, issue_date, status, snapshot_json, created_at, updated_at] = params;
      const idx = this.state.credit_notes.findIndex((cn) => cn.id === id);
      const rec = { id, business_profile_id, customer_id, original_invoice_id, credit_note_number, reason, credit_amount_minor, tax_amount_minor, currency, issue_date, status, snapshot_json, created_at, updated_at };
      if (idx >= 0) this.state.credit_notes[idx] = rec;
      else this.state.credit_notes.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 30. Customer Advances Insert / Upsert
    if (s.includes('INTO customer_advances')) {
      const [id, business_profile_id, customer_id, original_amount_minor, remaining_amount_minor, currency, payment_source, reference, notes, advance_date, status, created_at, updated_at] = params;
      const idx = this.state.customer_advances.findIndex((ca) => ca.id === id);
      const rec = { id, business_profile_id, customer_id, original_amount_minor, remaining_amount_minor, currency, payment_source, reference, notes, advance_date, status, created_at, updated_at };
      if (idx >= 0) this.state.customer_advances[idx] = rec;
      else this.state.customer_advances.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 31. Credit Allocations Insert
    if (s.includes('INTO credit_allocations')) {
      const [id, business_profile_id, customer_advance_id, credit_note_id, invoice_id, allocated_amount_minor, currency, allocated_at, notes] = params;
      this.state.credit_allocations.push({ id, business_profile_id, customer_advance_id, credit_note_id, invoice_id, allocated_amount_minor, currency, allocated_at, notes });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 32. Payment Refunds Insert / Upsert
    if (s.includes('INTO payment_refunds')) {
      const [id, business_profile_id, payment_id, invoice_id, refund_amount_minor, currency, reason, status, provider_refund_id, refund_date, created_at, updated_at] = params;
      const idx = this.state.payment_refunds.findIndex((pr) => pr.id === id);
      const rec = { id, business_profile_id, payment_id, invoice_id, refund_amount_minor, currency, reason, status, provider_refund_id, refund_date, created_at, updated_at };
      if (idx >= 0) this.state.payment_refunds[idx] = rec;
      else this.state.payment_refunds.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 33. Reminder Events Insert
    if (s.includes('INTO reminder_events')) {
      const [id, business_profile_id, invoice_id, customer_id, channel, template, status, is_automated, reminder_date, created_at] = params;
      this.state.reminder_events.push({ id, business_profile_id, invoice_id, customer_id, channel, template, status, is_automated, reminder_date, created_at });
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 34. Invoice Collection Metadata Upsert
    if (s.includes('INTO invoice_collection_metadata')) {
      const [document_id, expected_payment_date, promise_to_pay_date, collection_notes, updated_at] = params;
      const idx = this.state.invoice_collection_metadata.findIndex((m) => m.document_id === document_id);
      const rec = { document_id, expected_payment_date, promise_to_pay_date, collection_notes, updated_at };
      if (idx >= 0) this.state.invoice_collection_metadata[idx] = rec;
      else this.state.invoice_collection_metadata.push(rec);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 35. Payment Provider Connections Toggle/Update
    if (s.startsWith('UPDATE payment_provider_connections SET')) {
      const [is_active, updated_at, busId, provider] = params;
      const conn = this.state.payment_provider_connections.find(
        (c) => c.business_profile_id === busId && c.provider === provider
      );
      if (conn) {
        conn.is_active = is_active;
        conn.updated_at = updated_at;
      }
      return { lastInsertRowId: 0, changes: conn ? 1 : 0 };
    }

    // 36. Payment Provider Connections Delete
    if (s.startsWith('DELETE FROM payment_provider_connections')) {
      const [busId, provider] = params;
      this.state.payment_provider_connections = this.state.payment_provider_connections.filter(
        (c) => !(c.business_profile_id === busId && c.provider === provider)
      );
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 26. Delete feature usage
    if (s.startsWith('DELETE FROM feature_usage')) {
      this.state.feature_usage = [];
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 27. Template definitions insert
    if (s.includes('INTO template_definitions')) {
      const [code, name, description, category, default_config_json, is_system, created_at, updated_at] = params;
      const existing = this.state.template_definitions.find((t) => t.code === code);
      if (!existing) {
        this.state.template_definitions.push({
          code, name, description, category, thumbnail_uri: null, default_config_json, is_system, created_at, updated_at
        });
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 28. Template customizations insert or update
    if (s.includes('INTO template_customizations')) {
      const [
        id, template_code, business_profile_id, brand_color, secondary_color,
        font_family, logo_position, show_logo, show_tax_breakdown, show_payment_qr,
        show_signature, show_terms, custom_declaration, custom_footer_notes,
        column_visibility_json, updated_at
      ] = params;
      const idx = this.state.template_customizations.findIndex(
        (c) => c.template_code === template_code && c.business_profile_id === business_profile_id
      );
      const record = {
        id, template_code, business_profile_id, brand_color, secondary_color,
        font_family, logo_position, show_logo, show_tax_breakdown, show_payment_qr,
        show_signature, show_terms, custom_declaration, custom_footer_notes,
        column_visibility_json, updated_at
      };
      if (idx >= 0) {
        this.state.template_customizations[idx] = record;
      } else {
        this.state.template_customizations.push(record);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 29. Template assignments insert or update
    if (s.includes('INTO template_assignments')) {
      const [id, business_profile_id, doc_type, template_code, updated_at] = params;
      const idx = this.state.template_assignments.findIndex(
        (a) => a.business_profile_id === business_profile_id && a.doc_type === doc_type
      );
      const record = { id, business_profile_id, doc_type, template_code, updated_at };
      if (idx >= 0) {
        this.state.template_assignments[idx] = record;
      } else {
        this.state.template_assignments.push(record);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 30. Custom document types insert or update
    if (s.includes('INTO custom_document_types')) {
      const [id, business_profile_id, code, name, doc_class, category, description, icon, schema_json, default_template, is_system, created_at, updated_at] = params;
      const idx = this.state.custom_document_types.findIndex((t) => t.id === id || (t.business_profile_id === business_profile_id && t.code === code));
      const record = { id, business_profile_id, code, name, doc_class, category, description, icon, schema_json, default_template, is_system: Number(is_system) || 0, created_at, updated_at };
      if (idx >= 0) {
        this.state.custom_document_types[idx] = record;
      } else {
        this.state.custom_document_types.push(record);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 31. Custom document types delete
    if (s.startsWith('DELETE FROM custom_document_types WHERE id = ?')) {
      const [id] = params;
      this.state.custom_document_types = this.state.custom_document_types.filter((t) => t.id !== id);
      return { lastInsertRowId: 0, changes: 1 };
    }

    // 32. Document instances insert or update
    if (s.includes('INTO document_instances')) {
      const [id, business_profile_id, type_id, doc_class, document_number, title, status, issue_date, party_name, party_details_json, content_json, template_code, branding_json, created_at, updated_at] = params;
      const idx = this.state.document_instances.findIndex((d) => d.id === id);
      const record = { id, business_profile_id, type_id, doc_class, document_number, title, status, issue_date, party_name, party_details_json, content_json, template_code, branding_json, created_at, updated_at };
      if (idx >= 0) {
        this.state.document_instances[idx] = record;
      } else {
        this.state.document_instances.push(record);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 33. Document instances delete
    if (s.startsWith('DELETE FROM document_instances WHERE id = ?')) {
      const [id] = params;
      this.state.document_instances = this.state.document_instances.filter((d) => d.id !== id);
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
    const s = sql.trim();

    // Template assignment
    if (s.includes('FROM template_assignments WHERE business_profile_id = ? AND doc_type = ?')) {
      const [busId, docType] = params;
      return (this.state.template_assignments.find(
        (a) => a.business_profile_id === busId && a.doc_type === docType
      ) as T) || null;
    }

    // Template customization
    if (s.includes('FROM template_customizations WHERE business_profile_id = ? AND template_code = ?')) {
      const [busId, code] = params;
      return (this.state.template_customizations.find(
        (c) => c.business_profile_id === busId && c.template_code === code
      ) as T) || null;
    }

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

    // Document Tax Snapshot
    if (s.includes('FROM document_tax_snapshots WHERE document_id = ?')) {
      const [docId] = params;
      return (this.state.document_tax_snapshots.find((t) => t.document_id === docId) as T) || null;
    }

    // Payments sum for invoice
    if (s.includes('SUM(amount_minor)') && s.includes('WHERE invoice_id = ?')) {
      const [invoiceId] = params;
      const sum = this.state.payments
        .filter((p) => p.invoice_id === invoiceId)
        .reduce((acc, curr) => acc + curr.amount_minor, 0);
      return { sum_paid: sum } as T;
    }

    // Max sequence number for profile and doc_type
    if (s.includes('SELECT MAX(sequence_number) AS max_seq FROM documents')) {
      const [profileId, docType] = params;
      const matching = this.state.documents.filter(
        (d) => d.business_profile_id === profileId && d.doc_type === docType
      );
      const maxSeq = matching.reduce((max, d) => Math.max(max, d.sequence_number || 0), 0);
      return ({ max_seq: maxSeq } as unknown as T);
    }

    // Document uniqueness collision check
    if (s.includes('FROM documents WHERE business_profile_id = ? AND doc_type = ? AND document_number = ?')) {
      const [profileId, docType, docNum, excludeId] = params;
      const found = this.state.documents.find(
        (d) => d.business_profile_id === profileId && d.doc_type === docType && d.document_number === docNum && d.id !== excludeId
      );
      return (found ? ({ id: found.id } as T) : null);
    }

    // Document ID lookup by document_number
    if (s.includes('FROM documents WHERE document_number = ?')) {
      const [docNum] = params;
      const found = this.state.documents.find((d) => d.document_number === docNum);
      return (found ? { id: found.id } : null) as T;
    }

    // Single payment
    if (s.startsWith('SELECT * FROM payments WHERE id = ?;')) {
      const [id] = params;
      return (this.state.payments.find((p) => p.id === id) as T) || null;
    }

    // Single payment by provider_payment_id
    if (s.includes('FROM payments WHERE provider_payment_id = ?')) {
      const [providerPaymentId] = params;
      return (this.state.payments.find((p) => p.provider_payment_id === providerPaymentId) as T) || null;
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

    // Payment provider connection
    if (s.includes('FROM payment_provider_connections WHERE business_profile_id = ? AND provider = ?')) {
      const [busId, prov] = params;
      return (this.state.payment_provider_connections.find(
        (c) => c.business_profile_id === busId && c.provider === prov
      ) as T) || null;
    }

    // Credit Note by ID
    if (s.startsWith('SELECT * FROM credit_notes WHERE id = ?')) {
      const [id] = params;
      return (this.state.credit_notes.find((c) => c.id === id) as T) || null;
    }

    // Customer Advance by ID
    if (s.startsWith('SELECT * FROM customer_advances WHERE id = ?')) {
      const [id] = params;
      return (this.state.customer_advances.find((a) => a.id === id) as T) || null;
    }

    // Payment Refund by ID
    if (s.startsWith('SELECT * FROM payment_refunds WHERE id = ?')) {
      const [id] = params;
      return (this.state.payment_refunds.find((r) => r.id === id) as T) || null;
    }

    // Invoice Collection Metadata
    if (s.includes('FROM invoice_collection_metadata WHERE document_id = ?')) {
      const [docId] = params;
      return (this.state.invoice_collection_metadata.find((m) => m.document_id === docId) as T) || null;
    }

    // Custom Document Type by ID or Code
    if (s.includes('FROM custom_document_types WHERE id = ?')) {
      const [id] = params;
      return (this.state.custom_document_types.find((t) => t.id === id) as T) || null;
    }
    if (s.includes('FROM custom_document_types WHERE code = ?')) {
      const [code] = params;
      return (this.state.custom_document_types.find((t) => t.code === code) as T) || null;
    }

    // Document Instance by ID
    if (s.includes('FROM document_instances WHERE id = ?')) {
      const [id] = params;
      return (this.state.document_instances.find((d) => d.id === id) as T) || null;
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

    // Credit Notes
    if (s.includes('FROM credit_notes')) {
      if (s.includes('WHERE original_invoice_id = ?')) {
        return this.state.credit_notes.filter((c) => c.original_invoice_id === params[0]) as T[];
      }
      if (s.includes('WHERE customer_id = ?')) {
        return this.state.credit_notes.filter((c) => c.customer_id === params[0]) as T[];
      }
      return this.state.credit_notes.slice() as T[];
    }

    // Customer Advances
    if (s.includes('FROM customer_advances')) {
      if (s.includes('WHERE customer_id = ?')) {
        return this.state.customer_advances.filter((a) => a.customer_id === params[0]) as T[];
      }
      return this.state.customer_advances.slice() as T[];
    }

    // Credit Allocations
    if (s.includes('FROM credit_allocations')) {
      if (s.includes('WHERE invoice_id = ?')) {
        return this.state.credit_allocations.filter((a) => a.invoice_id === params[0]) as T[];
      }
      if (s.includes('WHERE customer_advance_id = ?')) {
        return this.state.credit_allocations.filter((a) => a.customer_advance_id === params[0]) as T[];
      }
      if (s.includes('WHERE credit_note_id = ?')) {
        return this.state.credit_allocations.filter((a) => a.credit_note_id === params[0]) as T[];
      }
      return this.state.credit_allocations.slice() as T[];
    }

    // Payment Refunds
    if (s.includes('FROM payment_refunds')) {
      if (s.includes('WHERE invoice_id = ?')) {
        return this.state.payment_refunds.filter((r) => r.invoice_id === params[0]) as T[];
      }
      if (s.includes('WHERE payment_id = ?')) {
        return this.state.payment_refunds.filter((r) => r.payment_id === params[0]) as T[];
      }
      return this.state.payment_refunds.slice() as T[];
    }

    // Reminder Events
    if (s.includes('FROM reminder_events')) {
      if (s.includes('WHERE invoice_id = ?')) {
        return this.state.reminder_events.filter((r) => r.invoice_id === params[0]) as T[];
      }
      if (s.includes('WHERE customer_id = ?')) {
        return this.state.reminder_events.filter((r) => r.customer_id === params[0]) as T[];
      }
      return this.state.reminder_events.slice() as T[];
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

    // Receipts for documents listing
    if (s.includes('FROM receipts')) {
      return this.state.receipts.map((r) => {
        const inv = this.state.documents.find((d) => d.id === r.invoice_id);
        const cust = inv ? this.state.customers.find((c) => c.id === inv.customer_id) : null;
        const pay = this.state.payments.find((p) => p.id === r.payment_id);
        return {
          id: r.id,
          doc_type: 'receipt',
          document_number: r.receipt_number,
          customer_name: cust?.name || 'Customer',
          total_minor: pay?.amount_minor || 0,
          balance_minor: 0,
          currency: inv?.currency || 'USD',
          lifecycle_status: 'paid',
          issue_date: r.issue_date,
        };
      }) as T[];
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
      if (s.includes('doc_type IN')) {
        const inMatch = s.match(/doc_type\s+IN\s*\(([^)]+)\)/i);
        if (inMatch) {
          const types = inMatch[1].split(',').map((t) => t.trim().replace(/'/g, ''));
          docs = docs.filter((d) => types.includes(d.doc_type));
        }
      } else if (s.includes("doc_type = 'invoice'")) {
        docs = docs.filter((d) => d.doc_type === 'invoice');
      } else if (s.includes('doc_type = ?')) {
        const typeParam = params.find((p) => typeof p === 'string' && ['invoice', 'estimate', 'receipt', 'credit_note', 'proforma', 'delivery_note', 'work_order'].includes(p));
        if (typeParam) {
          docs = docs.filter((d) => d.doc_type === typeParam);
        }
      }
      if (s.includes("lifecycle_status = 'issued'")) {
        docs = docs.filter((d) => d.lifecycle_status === 'issued');
      } else if (s.includes('lifecycle_status = ?')) {
        const statusParam = params.find((p) => typeof p === 'string' && ['draft', 'issued', 'void', 'accepted', 'rejected', 'expired'].includes(p));
        if (statusParam) {
          docs = docs.filter((d) => d.lifecycle_status === statusParam);
        }
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

    // Payment provider connections
    if (s.includes('FROM payment_provider_connections WHERE business_profile_id = ?')) {
      const [busId] = params;
      return (this.state.payment_provider_connections.filter(
        (c) => c.business_profile_id === busId
      ) as unknown as T[]);
    }

    // Template definitions
    if (s.includes('FROM template_definitions')) {
      return this.state.template_definitions.slice() as T[];
    }

    // Template customizations
    if (s.includes('FROM template_customizations')) {
      if (params.length > 0) {
        return this.state.template_customizations.filter((c) => c.business_profile_id === params[0]) as T[];
      }
      return this.state.template_customizations.slice() as T[];
    }

    // Template assignments
    if (s.includes('FROM template_assignments')) {
      if (params.length > 0) {
        return this.state.template_assignments.filter((a) => a.business_profile_id === params[0]) as T[];
      }
      return this.state.template_assignments.slice() as T[];
    }

    // Custom document types
    if (s.includes('FROM custom_document_types')) {
      if (s.includes('WHERE business_profile_id = ? OR is_system = 1')) {
        const [busId] = params;
        return this.state.custom_document_types.filter(
          (t) => t.business_profile_id === busId || t.is_system === 1 || t.business_profile_id === 'system'
        ) as T[];
      }
      return this.state.custom_document_types.slice() as T[];
    }

    // Document instances
    if (s.includes('FROM document_instances')) {
      let insts = this.state.document_instances.slice();
      if (params.length > 0) {
        const busId = params[0];
        insts = insts.filter((d) => d.business_profile_id === busId);
      }
      return insts.sort((a, b) => (b.issue_date || 0) - (a.issue_date || 0)) as T[];
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
