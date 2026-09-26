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
      const [name, legalName, taxId, email, phone, addr1, city, stateVal, postal, country, curr, notes, terms, updated_at, id] = params;
      const p = this.state.business_profiles.find((b) => b.id === id);
      if (p) {
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
      return { lastInsertRowId: 1, changes: 1 };
    }

    // 3. Number Sequences Insert
    if (s.startsWith('INSERT INTO number_sequences')) {
      const [id, business_profile_id, doc_type, prefix, next_sequence_number, suffix, padding, updated_at] = params;
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
      const [id, name, business_name, email, phone, billing_address, shipping_address, country, tax_id, notes, is_archived, created_at, updated_at] = params;
      this.state.customers.push({
        id,
        name,
        business_name,
        email,
        phone,
        billing_address,
        shipping_address,
        country,
        tax_id,
        notes,
        is_archived: is_archived || 0,
        created_at,
        updated_at,
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
      const [id, name, description, unit_price_minor, currency, unit_name, default_tax_rate_bp, is_archived, created_at, updated_at] = params;
      this.state.catalog_items.push({
        id,
        name,
        description,
        unit_price_minor,
        currency,
        unit_name,
        default_tax_rate_bp,
        is_archived: is_archived || 0,
        created_at,
        updated_at,
      });
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
      const [
        id, business_profile_id, job_id, doc_type, sequence_number, document_number, customer_id,
        lifecycle_status, issue_date, due_date, currency, subtotal_minor, discount_minor,
        discount_type, discount_value, tax_minor, tax_type, tax_rate_bp, tax_label,
        total_minor, deposit_minor, po_number, payment_terms_preset, shipping_address,
        payment_instructions, notes, terms, internal_notes, signature_uri, signature_date,
        parent_document_id, is_archived, created_at, updated_at,
      ] = params;

      const existingIndex = this.state.documents.findIndex((d) => d.id === id);
      const docData = {
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
        is_archived: is_archived || 0,
        created_at,
        updated_at,
      };

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
      const [id, document_id, catalog_item_id, description, item_notes, quantity_scaled, unit_name, unit_price_minor, line_total_minor, sort_order] = params;
      this.state.document_items.push({
        id,
        document_id,
        catalog_item_id,
        description,
        item_notes: item_notes || null,
        quantity_scaled,
        unit_name,
        unit_price_minor,
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
        created_at,
      });
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

    // Job count
    if (s.includes('FROM jobs WHERE business_profile_id = ?')) {
      const [profileId] = params;
      const cnt = this.state.jobs.filter((j) => j.business_profile_id === profileId).length;
      return ({ cnt } as unknown as T);
    }

    return null;
  }

  async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
    const s = sql.trim();

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

    // Number sequences
    if (s.includes('FROM number_sequences WHERE business_profile_id = ?')) {
      const [profileId] = params;
      return this.state.number_sequences.filter((n) => n.business_profile_id === profileId) as T[];
    }

    // Jobs for customer
    if (s.includes('FROM jobs WHERE customer_id = ?')) {
      const [custId] = params;
      return this.state.jobs
        .filter((j) => j.customer_id === custId)
        .sort((a, b) => b.created_at - a.created_at) as T[];
    }

    // Jobs with summary join
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
