/**
 * DOCUMENT REPOSITORY
 * SQLite persistence, atomic sequence numbering on issuance, draft autosave,
 * immutable snapshot freezing, estimate conversion, payment status derivation,
 * duplicate document cloning, on-device estimate signatures, and PO/terms metadata.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { calculateDocument } from '../../domain/documents/DocumentCalculator';
import { validateForIssuance } from '../../domain/documents/DocumentStateMachine';
import { buildDocumentSnapshot } from '../../domain/documents/SnapshotBuilder';
import { formatDocumentNumber } from '../../domain/numbering/SequenceEngine';
import {
  DiscountType,
  DocumentCalculationOutput,
  DocumentLifecycleStatus,
  DocumentType,
  LineItemInput,
} from '../../domain/documents/types';
import { TaxType } from '../../domain/tax/TaxEngine';

export interface DocumentRow {
  id: string;
  business_profile_id: string;
  job_id: string | null;
  doc_type: DocumentType;
  sequence_number: number | null;
  document_number: string;
  customer_id: string | null;
  lifecycle_status: string;
  issue_date: number;
  due_date: number | null;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  discount_type: DiscountType;
  discount_value: number;
  tax_minor: number;
  tax_type: TaxType;
  tax_rate_bp: number;
  tax_label: string;
  total_minor: number;
  deposit_minor: number;
  po_number: string | null;
  payment_terms_preset: string | null;
  shipping_address: string | null;
  payment_instructions: string | null;
  notes: string | null;
  terms: string | null;
  internal_notes: string | null;
  signature_uri: string | null;
  signature_date: number | null;
  parent_document_id: string | null;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

export interface DocumentItemRow {
  id: string;
  document_id: string;
  catalog_item_id: string | null;
  description: string;
  item_notes: string | null;
  quantity_scaled: number;
  unit_name: string;
  unit_price_minor: number;
  line_total_minor: number;
  sort_order: number;
}

export interface FullDocument extends DocumentRow {
  customer_name?: string;
  customer_business_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_billing_address?: string | null;
  items: DocumentItemRow[];
  total_paid_minor: number;
  balance_minor: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  is_overdue: boolean;
  snapshot_json?: string | null;
}

export class DocumentRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Creates or autosaves a draft document.
   * Draft invariant: 0 items allowed, incomplete data allowed, temporary document_number assigned.
   */
  static async saveDraft(doc: {
    id?: string;
    businessProfileId?: string;
    jobId?: string | null;
    docType: DocumentType;
    customerId?: string | null;
    issueDate: number;
    dueDate?: number | null;
    currency: string;
    discountType?: DiscountType;
    discountValue?: bigint;
    taxType?: TaxType;
    taxRateBp?: bigint;
    taxLabel?: string;
    depositMinor?: bigint;
    poNumber?: string | null;
    paymentTermsPreset?: string | null;
    shippingAddress?: string | null;
    paymentInstructions?: string | null;
    notes?: string | null;
    terms?: string | null;
    internalNotes?: string | null;
    signatureUri?: string | null;
    signatureDate?: number | null;
    parentDocumentId?: string | null;
    items: LineItemInput[];
  }): Promise<FullDocument> {
    const db = await this.getDb();
    const id = doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    // 1. Resolve business profile
    let businessProfileId = doc.businessProfileId;
    if (!businessProfileId) {
      const profile = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM business_profiles WHERE is_active = 1 LIMIT 1;'
      );
      businessProfileId = profile?.id || 'default_business_profile';
    }

    // 2. Calculate values via pure domain engine
    const calc = calculateDocument({
      currency: doc.currency,
      items: doc.items,
      discountType: doc.discountType || 'none',
      discountValue: doc.discountValue || 0n,
      taxType: doc.taxType || 'none',
      taxRateBasisPoints: doc.taxRateBp || 0n,
      taxLabel: doc.taxLabel || 'Tax',
      depositMinor: doc.depositMinor || 0n,
      totalPaymentsMinor: 0n,
      dueDateTimestamp: doc.dueDate,
      currentTimestamp: now,
      lifecycleStatus: 'draft',
    });

    // Temporary draft number (e.g. DRAFT-1774704000)
    const draftNumber = `DRAFT-${id.slice(-6).toUpperCase()}`;

    await db.withTransactionAsync(async () => {
      // Upsert document
      await db.runAsync(
        `INSERT INTO documents (
          id, business_profile_id, job_id, doc_type, sequence_number, document_number, customer_id,
          lifecycle_status, issue_date, due_date, currency, subtotal_minor, discount_minor,
          discount_type, discount_value, tax_minor, tax_type, tax_rate_bp, tax_label,
          total_minor, deposit_minor, po_number, payment_terms_preset, shipping_address,
          payment_instructions, notes, terms, internal_notes, signature_uri, signature_date,
          parent_document_id, is_archived, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          customer_id = excluded.customer_id,
          job_id = excluded.job_id,
          issue_date = excluded.issue_date,
          due_date = excluded.due_date,
          currency = excluded.currency,
          subtotal_minor = excluded.subtotal_minor,
          discount_minor = excluded.discount_minor,
          discount_type = excluded.discount_type,
          discount_value = excluded.discount_value,
          tax_minor = excluded.tax_minor,
          tax_type = excluded.tax_type,
          tax_rate_bp = excluded.tax_rate_bp,
          tax_label = excluded.tax_label,
          total_minor = excluded.total_minor,
          deposit_minor = excluded.deposit_minor,
          po_number = excluded.po_number,
          payment_terms_preset = excluded.payment_terms_preset,
          shipping_address = excluded.shipping_address,
          payment_instructions = excluded.payment_instructions,
          notes = excluded.notes,
          terms = excluded.terms,
          internal_notes = excluded.internal_notes,
          signature_uri = excluded.signature_uri,
          signature_date = excluded.signature_date,
          updated_at = excluded.updated_at;`,
        [
          id,
          businessProfileId,
          doc.jobId || null,
          doc.docType,
          null, // Sequence number assigned only upon issuance
          draftNumber,
          doc.customerId || null,
          'draft',
          doc.issueDate,
          doc.dueDate || null,
          doc.currency.toUpperCase(),
          Number(calc.subtotal.amountMinor),
          Number(calc.discount.amountMinor),
          doc.discountType || 'none',
          Number(doc.discountValue || 0n),
          Number(calc.tax.amountMinor),
          doc.taxType || 'none',
          Number(doc.taxRateBp || 0n),
          doc.taxLabel || 'Tax',
          Number(calc.grandTotal.amountMinor),
          Number(calc.deposit.amountMinor),
          doc.poNumber?.trim() || null,
          doc.paymentTermsPreset || null,
          doc.shippingAddress?.trim() || null,
          doc.paymentInstructions?.trim() || null,
          doc.notes?.trim() || null,
          doc.terms?.trim() || null,
          doc.internalNotes?.trim() || null,
          doc.signatureUri || null,
          doc.signatureDate || null,
          doc.parentDocumentId || null,
          now,
          now,
        ]
      );

      // Replace items
      await db.runAsync('DELETE FROM document_items WHERE document_id = ?;', [id]);

      for (let i = 0; i < calc.items.length; i++) {
        const item = calc.items[i];
        const itemId = item.id.startsWith('item_') ? `ditem_${Date.now()}_${i}` : item.id;
        await db.runAsync(
          `INSERT INTO document_items (
            id, document_id, catalog_item_id, description, item_notes, quantity_scaled, unit_name,
            unit_price_minor, line_total_minor, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            itemId,
            id,
            null,
            item.description,
            item.itemNotes?.trim() || null,
            Number(item.quantityScaled),
            item.unitName,
            Number(item.unitPriceMinor),
            Number(item.lineTotalMinor),
            i,
          ]
        );
      }
    });

    const saved = await this.getById(id);
    if (!saved) {
      throw new Error(`Failed to save draft ${id}`);
    }
    return saved;
  }

  /**
   * Issues a document.
   * Atomically:
   * 1. Validates >= 1 line item and customer assignment.
   * 2. Allocates next monotonic sequence number (e.g. INV-0001, EST-0001).
   * 3. Freezes historical snapshot.
   * 4. Updates lifecycle_status to 'issued'.
   */
  static async issueDocument(id: string): Promise<FullDocument> {
    const db = await this.getDb();
    const doc = await this.getById(id);
    if (!doc) throw new Error(`Document not found: ${id}`);
    if (doc.lifecycle_status === 'issued') return doc;

    // Validate issuance constraints
    const validation = validateForIssuance({
      customerId: doc.customer_id,
      items: doc.items.map((i) => ({
        description: i.description,
        quantityScaled: BigInt(i.quantity_scaled),
        unitPriceMinor: BigInt(i.unit_price_minor),
      })),
      issueDateTimestamp: doc.issue_date,
      currency: doc.currency,
    });

    if (!validation.isValid) {
      throw new Error(validation.error || 'Document is not valid for issuance');
    }

    const now = Date.now();

    await db.withTransactionAsync(async () => {
      // 1. Fetch & increment sequence counter atomically
      const seq = await db.getFirstAsync<{
        id: string;
        prefix: string;
        next_sequence_number: number;
        suffix: string;
        padding: number;
      }>(
        'SELECT id, prefix, next_sequence_number, suffix, padding FROM number_sequences WHERE business_profile_id = ? AND doc_type = ?;',
        [doc.business_profile_id, doc.doc_type]
      );

      const prefix = seq?.prefix || (doc.doc_type === 'invoice' ? 'INV-' : 'EST-');
      const seqNum = seq?.next_sequence_number || 1;
      const padding = seq?.padding || 4;
      const suffix = seq?.suffix || '';

      const finalDocumentNumber = formatDocumentNumber(prefix, seqNum, padding, suffix);

      // Increment sequence table
      if (seq) {
        await db.runAsync(
          'UPDATE number_sequences SET next_sequence_number = next_sequence_number + 1, updated_at = ? WHERE id = ?;',
          [now, seq.id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO number_sequences (id, business_profile_id, doc_type, prefix, next_sequence_number, suffix, padding, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [`seq_${doc.business_profile_id}_${doc.doc_type}`, doc.business_profile_id, doc.doc_type, prefix, seqNum + 1, suffix, padding, now]
        );
      }

      // 2. Fetch seller and buyer data for snapshot
      const seller = await db.getFirstAsync<any>('SELECT * FROM business_profiles WHERE id = ?;', [doc.business_profile_id]);
      const buyer = await db.getFirstAsync<any>('SELECT * FROM customers WHERE id = ?;', [doc.customer_id]);

      // Calculate authoritative values
      const calc = calculateDocument({
        currency: doc.currency,
        items: doc.items.map((i) => ({
          id: i.id,
          description: i.description,
          itemNotes: i.item_notes,
          quantityScaled: BigInt(i.quantity_scaled),
          unitName: i.unit_name,
          unitPriceMinor: BigInt(i.unit_price_minor),
        })),
        discountType: doc.discount_type,
        discountValue: BigInt(doc.discount_value),
        taxType: doc.tax_type,
        taxRateBasisPoints: BigInt(doc.tax_rate_bp),
        taxLabel: doc.tax_label,
        depositMinor: BigInt(doc.deposit_minor || 0),
        totalPaymentsMinor: 0n,
        dueDateTimestamp: doc.due_date,
        currentTimestamp: now,
        lifecycleStatus: 'issued',
      });

      const snapshot = buildDocumentSnapshot(
        doc.id,
        finalDocumentNumber,
        doc.doc_type,
        doc.issue_date,
        doc.due_date,
        {
          businessProfileId: seller?.id || doc.business_profile_id,
          name: seller?.name || 'Business',
          legalName: seller?.legal_name,
          taxId: seller?.tax_id,
          email: seller?.email,
          phone: seller?.phone,
          addressLine1: seller?.address_line1,
          addressLine2: seller?.address_line2,
          city: seller?.city,
          state: seller?.state,
          postalCode: seller?.postal_code,
          country: seller?.country,
          logoUri: seller?.logo_uri,
          paymentInstructions: doc.payment_instructions || seller?.default_notes,
        },
        {
          customerId: buyer?.id || doc.customer_id!,
          name: buyer?.name || 'Customer',
          businessName: buyer?.business_name,
          email: buyer?.email,
          phone: buyer?.phone,
          billingAddress: buyer?.billing_address,
          shippingAddress: doc.shipping_address || buyer?.shipping_address,
          taxId: buyer?.tax_id,
          country: buyer?.country,
        },
        calc,
        doc.discount_type,
        BigInt(doc.discount_value),
        doc.tax_type,
        BigInt(doc.tax_rate_bp),
        doc.tax_label,
        doc.notes,
        doc.terms,
        {
          poNumber: doc.po_number,
          paymentTermsPreset: doc.payment_terms_preset,
          shippingAddress: doc.shipping_address,
          paymentInstructions: doc.payment_instructions,
          signatureUri: doc.signature_uri,
          signatureDate: doc.signature_date,
        }
      );

      // Save snapshot
      await db.runAsync(
        `INSERT INTO document_snapshots (id, document_id, snapshot_json, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(document_id) DO UPDATE SET snapshot_json = excluded.snapshot_json;`,
        [`snap_${doc.id}`, doc.id, JSON.stringify(snapshot), now]
      );

      // Update document to issued
      await db.runAsync(
        `UPDATE documents SET
          sequence_number = ?,
          document_number = ?,
          lifecycle_status = 'issued',
          updated_at = ?
         WHERE id = ?;`,
        [seqNum, finalDocumentNumber, now, doc.id]
      );
    });

    const issued = await this.getById(id);
    if (!issued) throw new Error(`Failed to reload issued document ${id}`);
    return issued;
  }

  /**
   * Accepts an estimate.
   */
  static async acceptEstimate(id: string): Promise<FullDocument> {
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE documents SET lifecycle_status = 'accepted', updated_at = ? WHERE id = ? AND doc_type = 'estimate';",
      [Date.now(), id]
    );
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Estimate not found: ${id}`);
    return updated;
  }

  /**
   * Accepts an estimate with an on-device digital signature.
   */
  static async acceptEstimateWithSignature(id: string, signatureUri: string): Promise<FullDocument> {
    const db = await this.getDb();
    const now = Date.now();
    await db.runAsync(
      "UPDATE documents SET lifecycle_status = 'accepted', signature_uri = ?, signature_date = ?, updated_at = ? WHERE id = ? AND doc_type = 'estimate';",
      [signatureUri, now, now, id]
    );
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Estimate not found: ${id}`);
    return updated;
  }

  /**
   * Rejects an estimate.
   */
  static async rejectEstimate(id: string): Promise<FullDocument> {
    const db = await this.getDb();
    await db.runAsync(
      "UPDATE documents SET lifecycle_status = 'rejected', updated_at = ? WHERE id = ? AND doc_type = 'estimate';",
      [Date.now(), id]
    );
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Estimate not found: ${id}`);
    return updated;
  }

  /**
   * Converts an Accepted Estimate into a New Invoice Draft.
   * Clones all items, customer, rates, discounts, taxes, notes, terms, PO number, shipping address.
   * Links parent_document_id. Leaves estimate intact.
   */
  static async convertEstimateToInvoice(estimateId: string): Promise<FullDocument> {
    const estimate = await this.getById(estimateId);
    if (!estimate) throw new Error(`Estimate not found for id ${estimateId}`);
    if (estimate.doc_type !== 'estimate') throw new Error('Source document must be an estimate');

    // Automatically mark estimate as accepted if currently issued
    if (estimate.lifecycle_status === 'issued') {
      await this.acceptEstimate(estimateId);
    }

    // Save as new invoice draft
    const newInvoice = await this.saveDraft({
      businessProfileId: estimate.business_profile_id,
      jobId: estimate.job_id,
      docType: 'invoice',
      customerId: estimate.customer_id,
      issueDate: Date.now(),
      dueDate: estimate.due_date,
      currency: estimate.currency,
      discountType: estimate.discount_type,
      discountValue: BigInt(estimate.discount_value),
      taxType: estimate.tax_type,
      taxRateBp: BigInt(estimate.tax_rate_bp),
      taxLabel: estimate.tax_label,
      depositMinor: BigInt(estimate.deposit_minor || 0),
      poNumber: estimate.po_number,
      paymentTermsPreset: estimate.payment_terms_preset,
      shippingAddress: estimate.shipping_address,
      paymentInstructions: estimate.payment_instructions,
      notes: estimate.notes,
      terms: estimate.terms,
      internalNotes: estimate.internal_notes,
      parentDocumentId: estimate.id,
      items: estimate.items.map((i) => ({
        description: i.description,
        itemNotes: i.item_notes,
        quantityScaled: BigInt(i.quantity_scaled),
        unitName: i.unit_name,
        unitPriceMinor: BigInt(i.unit_price_minor),
      })),
    });

    return newInvoice;
  }

  /**
   * Duplicates an existing document into a fresh editable draft.
   */
  static async duplicateDocument(sourceDocId: string): Promise<FullDocument> {
    const src = await this.getById(sourceDocId);
    if (!src) throw new Error(`Document not found: ${sourceDocId}`);

    return this.saveDraft({
      businessProfileId: src.business_profile_id,
      jobId: src.job_id,
      docType: src.doc_type,
      customerId: src.customer_id,
      issueDate: Date.now(),
      dueDate: src.due_date ? Date.now() + Math.max(0, src.due_date - src.issue_date) : null,
      currency: src.currency,
      discountType: src.discount_type,
      discountValue: BigInt(src.discount_value),
      taxType: src.tax_type,
      taxRateBp: BigInt(src.tax_rate_bp),
      taxLabel: src.tax_label,
      depositMinor: 0n, // Deposit is reset on duplicate
      poNumber: src.po_number,
      paymentTermsPreset: src.payment_terms_preset,
      shippingAddress: src.shipping_address,
      paymentInstructions: src.payment_instructions,
      notes: src.notes,
      terms: src.terms,
      internalNotes: src.internal_notes,
      items: src.items.map((i) => ({
        description: i.description,
        itemNotes: i.item_notes,
        quantityScaled: BigInt(i.quantity_scaled),
        unitName: i.unit_name,
        unitPriceMinor: BigInt(i.unit_price_minor),
      })),
    });
  }

  /**
   * Retrieves a full document with customer, line items, and authoritative balance derived from payments and deposits.
   */
  static async getById(id: string): Promise<FullDocument | null> {
    const db = await this.getDb();

    const doc = await db.getFirstAsync<any>(
      `SELECT d.*, c.name AS customer_name, c.business_name AS customer_business_name,
              c.email AS customer_email, c.phone AS customer_phone, c.billing_address AS customer_billing_address,
              s.snapshot_json
       FROM documents d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN document_snapshots s ON d.id = s.document_id
       WHERE d.id = ?;`,
      [id]
    );

    if (!doc) return null;

    const items = await db.getAllAsync<DocumentItemRow>(
      'SELECT * FROM document_items WHERE document_id = ? ORDER BY sort_order ASC;',
      [id]
    );

    // Payments are authoritative for paid totals and balance
    const paymentsRow = await db.getFirstAsync<{ sum_paid: number }>(
      'SELECT COALESCE(SUM(amount_minor), 0) AS sum_paid FROM payments WHERE invoice_id = ?;',
      [id]
    );

    const totalPaid = paymentsRow?.sum_paid || 0;
    const deposit = doc.deposit_minor || 0;
    const totalCredits = totalPaid + deposit;
    const balance = Math.max(0, doc.total_minor - totalCredits);

    let paymentStatus: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';
    if (totalCredits >= doc.total_minor && doc.total_minor > 0) {
      paymentStatus = 'paid';
    } else if (totalCredits > 0) {
      paymentStatus = 'partially_paid';
    }

    const now = Date.now();
    const isOverdue = Boolean(
      doc.due_date && now > doc.due_date && balance > 0 && doc.lifecycle_status === 'issued'
    );

    return {
      ...doc,
      items,
      total_paid_minor: totalPaid,
      balance_minor: balance,
      payment_status: paymentStatus,
      is_overdue: isOverdue,
    };
  }

  /**
   * Voids an issued document. Preserves record for legal and audit compliance.
   */
  static async voidDocument(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync("UPDATE documents SET lifecycle_status = 'void', updated_at = ? WHERE id = ?;", [
      Date.now(),
      id,
    ]);
  }

  /**
   * Deletes a draft document. Prohibited for issued documents.
   */
  static async deleteDraft(id: string): Promise<void> {
    const db = await this.getDb();
    const doc = await this.getById(id);
    if (!doc) return;
    if (doc.lifecycle_status !== 'draft') {
      throw new Error('Only draft documents may be deleted. Issued documents must be voided.');
    }
    await db.runAsync('DELETE FROM documents WHERE id = ?;', [id]);
  }
}
