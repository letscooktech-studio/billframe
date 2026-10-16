/**
 * DOCUMENT REPOSITORY
 * SQLite persistence, atomic sequence numbering on issuance, draft autosave,
 * immutable snapshot freezing, estimate conversion, payment status derivation,
 * duplicate document cloning, on-device estimate signatures, and PO/terms metadata.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { BusinessProfileRepository } from './BusinessProfileRepository';
import { calculateDocument } from '../../domain/documents/DocumentCalculator';
import { validateForIssuance } from '../../domain/documents/DocumentStateMachine';
import { buildDocumentSnapshot } from '../../domain/documents/SnapshotBuilder';
import { formatDocumentNumber } from '../../domain/numbering/SequenceEngine';
import { AuditEventRepository } from './AuditEventRepository';
import { calculateDocumentBalance } from '../../domain/accounting/BalanceEngine';
import { DocumentTypeRegistry } from '../../domain/documents/DocumentTypeRegistry';
import {
  DiscountType,
  DocumentCalculationOutput,
  DocumentLifecycleStatus,
  DocumentType,
  LineItemInput,
} from '../../domain/documents/types';
import { TaxType } from '../../domain/tax/TaxEngine';

function toBigIntSafe(val: any, fallback = 0n): bigint {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') {
    if (isNaN(val)) return fallback;
    return BigInt(Math.round(val));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    const num = Number(trimmed);
    if (!isNaN(num)) return BigInt(Math.round(num));
  }
  return fallback;
}

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
  place_of_supply?: string | null;
  supply_type?: string | null;
  reverse_charge?: number | boolean;
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
  category?: string | null;
  hsn_sac_code?: string | null;
  hsn_sac?: string | null;
  quantity_scaled: number;
  unit_name: string;
  unit_price_minor: number;
  internal_cost_minor?: number;
  line_total_minor: number;
  tax_rate_bp?: number;
  tax_minor?: number;
  tax_type?: string;
  tax_components_json?: string | null;
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
  tax_summary?: any | null;
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
    if (!businessProfileId || businessProfileId === 'default_business_profile') {
      const activeProf = await BusinessProfileRepository.getActiveProfile();
      businessProfileId = activeProf?.id || 'default_business_profile';
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
          doc_type = excluded.doc_type,
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
            id, document_id, catalog_item_id, description, item_notes, category, quantity_scaled, unit_name,
            unit_price_minor, internal_cost_minor, line_total_minor, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            itemId,
            id,
            null,
            item.description,
            item.itemNotes?.trim() || null,
            item.category || null,
            Number(item.quantityScaled),
            item.unitName,
            Number(item.unitPriceMinor),
            Number(item.internalCostMinor || 0n),
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
        quantityScaled: toBigIntSafe(i.quantity_scaled, 10000n),
        unitPriceMinor: toBigIntSafe(i.unit_price_minor, 0n),
      })),
      issueDateTimestamp: doc.issue_date,
      currency: doc.currency,
    });

    if (!validation.isValid) {
      throw new Error(validation.error || 'Document is not valid for issuance');
    }

    const now = Date.now();

    // Resolve active business profile if doc is on default or missing
    let activeProfileId = doc.business_profile_id;
    if (!activeProfileId || activeProfileId === 'default_business_profile') {
      const activeProf = await BusinessProfileRepository.getActiveProfile();
      activeProfileId = activeProf?.id || 'default_business_profile';
    }

    let finalAllocatedDocNumber = '';
    let allocatedSeqNum = 1;

    await db.withTransactionAsync(async () => {
      // 1. Fetch sequence settings for this profile and doc_type
      const seq = await db.getFirstAsync<{
        id: string;
        prefix: string;
        next_sequence_number: number;
        suffix: string;
        padding: number;
      }>(
        'SELECT id, prefix, next_sequence_number, suffix, padding FROM number_sequences WHERE business_profile_id = ? AND doc_type = ?;',
        [activeProfileId, doc.doc_type]
      );

      const docDef = DocumentTypeRegistry.get(doc.doc_type);
      const defaultPrefix = docDef?.defaultPrefix || (doc.doc_type === 'invoice' ? 'INV-' : doc.doc_type === 'estimate' ? 'EST-' : 'DOC-');
      const prefix = seq?.prefix || defaultPrefix;
      const padding = seq?.padding || 4;
      const suffix = seq?.suffix || '';

      // Determine highest sequence_number across existing documents for this profile and doc_type
      const maxDocRow = await db.getFirstAsync<{ max_seq: number | null }>(
        'SELECT MAX(sequence_number) AS max_seq FROM documents WHERE business_profile_id = ? AND doc_type = ?;',
        [activeProfileId, doc.doc_type]
      );

      let candidateSeq = Math.max(
        seq?.next_sequence_number || 1,
        (maxDocRow?.max_seq ?? 0) + 1
      );

      // Monotonic collision guard: loop check to guarantee document_number uniqueness under SQLite UNIQUE constraint
      let candidateDocNumber = formatDocumentNumber(prefix, candidateSeq, padding, suffix);
      while (true) {
        const existingDoc = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM documents WHERE business_profile_id = ? AND doc_type = ? AND document_number = ? AND id != ?;',
          [activeProfileId, doc.doc_type, candidateDocNumber, doc.id]
        );
        if (!existingDoc) {
          break;
        }
        candidateSeq++;
        candidateDocNumber = formatDocumentNumber(prefix, candidateSeq, padding, suffix);
      }

      allocatedSeqNum = candidateSeq;
      finalAllocatedDocNumber = candidateDocNumber;

      // Increment sequence table to candidateSeq + 1
      if (seq) {
        await db.runAsync(
          'UPDATE number_sequences SET next_sequence_number = ?, updated_at = ? WHERE id = ?;',
          [allocatedSeqNum + 1, now, seq.id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO number_sequences (id, business_profile_id, doc_type, prefix, next_sequence_number, suffix, padding, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(business_profile_id, doc_type) DO UPDATE SET
             next_sequence_number = excluded.next_sequence_number,
             updated_at = excluded.updated_at;`,
          [`seq_${activeProfileId}_${doc.doc_type}`, activeProfileId, doc.doc_type, prefix, allocatedSeqNum + 1, suffix, padding, now]
        );
      }

      // 2. Fetch seller and buyer data for snapshot
      const seller = await db.getFirstAsync<any>('SELECT * FROM business_profiles WHERE id = ?;', [activeProfileId]);
      const buyer = await db.getFirstAsync<any>('SELECT * FROM customers WHERE id = ?;', [doc.customer_id]);

      // Calculate authoritative values
      const calc = calculateDocument({
        currency: doc.currency,
        items: doc.items.map((i) => ({
          id: i.id,
          description: i.description,
          itemNotes: i.item_notes,
          quantityScaled: toBigIntSafe(i.quantity_scaled, 10000n),
          unitName: i.unit_name,
          unitPriceMinor: toBigIntSafe(i.unit_price_minor, 0n),
          hsnSacCode: i.hsn_sac_code || null,
          taxRateBasisPoints: i.tax_rate_bp ? toBigIntSafe(i.tax_rate_bp, 0n) : undefined,
          taxType: (i.tax_type as any) || doc.tax_type,
        })),
        discountType: doc.discount_type,
        discountValue: toBigIntSafe(doc.discount_value, 0n),
        taxType: doc.tax_type,
        taxRateBasisPoints: toBigIntSafe(doc.tax_rate_bp, 0n),
        taxLabel: doc.tax_label,
        depositMinor: toBigIntSafe(doc.deposit_minor || 0, 0n),
        totalPaymentsMinor: 0n,
        dueDateTimestamp: doc.due_date,
        currentTimestamp: now,
        lifecycleStatus: 'issued',
        taxContext: {
          businessProfile: {
            countryIso2: seller?.country_iso2 || seller?.country || 'US',
            subdivisionCode: seller?.subdivision_code,
            taxId: seller?.tax_id,
            isTaxRegistered: Boolean(seller?.tax_id),
          },
          customer: buyer ? {
            countryIso2: buyer.country || seller?.country_iso2 || 'US',
            subdivisionCode: buyer.subdivision_code,
            taxId: buyer.tax_id,
            isBusiness: Boolean(buyer.is_business || buyer.tax_id),
          } : null,
        },
      });

      const snapshot = buildDocumentSnapshot(
        doc.id,
        finalAllocatedDocNumber,
        doc.doc_type,
        doc.issue_date,
        doc.due_date,
        {
          businessProfileId: seller?.id || activeProfileId,
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
        toBigIntSafe(doc.discount_value, 0n),
        doc.tax_type,
        toBigIntSafe(doc.tax_rate_bp, 0n),
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
        [`snap_${doc.id}`, doc.id, JSON.stringify(snapshot, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)), now]
      );

      // Save frozen tax snapshot if taxSummary generated
      if (calc.taxSummary) {
        await db.runAsync(
          `INSERT INTO document_tax_snapshots (
            id, document_id, tax_pack_id, tax_pack_version, place_of_supply,
            supply_type, reverse_charge, tax_summary_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(document_id) DO UPDATE SET
            tax_pack_id = excluded.tax_pack_id,
            tax_pack_version = excluded.tax_pack_version,
            place_of_supply = excluded.place_of_supply,
            supply_type = excluded.supply_type,
            reverse_charge = excluded.reverse_charge,
            tax_summary_json = excluded.tax_summary_json;`,
          [
            `taxsnap_${doc.id}`,
            doc.id,
            calc.taxSummary.packId || 'tax_standard',
            calc.taxSummary.packVersion || '1.0.0',
            calc.taxSummary.placeOfSupply || null,
            calc.taxSummary.supplyType || 'intra_state',
            calc.taxSummary.reverseCharge ? 1 : 0,
            JSON.stringify(calc.taxSummary, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
            now,
          ]
        );
      }

      // Update document to issued
      await db.runAsync(
        `UPDATE documents SET
          business_profile_id = ?,
          sequence_number = ?,
          document_number = ?,
          lifecycle_status = 'issued',
          place_of_supply = ?,
          supply_type = ?,
          reverse_charge = ?,
          updated_at = ?
         WHERE id = ?;`,
        [
          activeProfileId,
          allocatedSeqNum,
          finalAllocatedDocNumber,
          calc.taxSummary?.placeOfSupply || null,
          calc.taxSummary?.supplyType || null,
          calc.taxSummary?.reverseCharge ? 1 : 0,
          now,
          doc.id,
        ]
      );
    });

    const issued = await this.getById(id);
    if (!issued) throw new Error(`Failed to reload issued document ${id}`);

    await AuditEventRepository.logEvent({
      businessProfileId: issued.business_profile_id,
      entityType: 'document',
      entityId: issued.id,
      action: 'issue',
      payload: {
        documentNumber: issued.document_number,
        docType: issued.doc_type,
        totalMinor: issued.total_minor,
      },
    });

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

    await AuditEventRepository.logEvent({
      businessProfileId: updated.business_profile_id,
      entityType: 'document',
      entityId: updated.id,
      action: 'accept_estimate',
      payload: { documentNumber: updated.document_number },
    });

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

    await AuditEventRepository.logEvent({
      businessProfileId: updated.business_profile_id,
      entityType: 'document',
      entityId: updated.id,
      action: 'accept_estimate_with_signature',
      payload: { documentNumber: updated.document_number },
    });

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

    await AuditEventRepository.logEvent({
      businessProfileId: updated.business_profile_id,
      entityType: 'document',
      entityId: updated.id,
      action: 'reject_estimate',
      payload: { documentNumber: updated.document_number },
    });

    return updated;
  }

  /**
   * Generalized Document Transition & Lineage Engine.
   * Converts any compatible source document into a target document type:
   * - estimate / proposal -> invoice
   * - proposal -> sow | invoice
   * - sow -> invoice
   * - invoice -> delivery_note | receipt | credit_note | proforma
   *
   * Atomically preserves:
   * - parent_document_id lineage link
   * - customer assignment & shipping address
   * - all line items (descriptions, quantities, units, rates)
   * - currency, discounts, taxes, PO number
   * - audit event tracking
   */
  static async convertDocument(sourceId: string, targetType: DocumentType): Promise<FullDocument> {
    const source = await this.getById(sourceId);
    if (!source) throw new Error(`Source document not found for id ${sourceId}`);

    // Automatically mark estimate or proposal as accepted if currently issued
    if ((source.doc_type === 'estimate' || (source.doc_type as string) === 'proposal') && source.lifecycle_status === 'issued') {
      await this.acceptEstimate(sourceId);
    }

    // Save as new target document draft
    const newDoc = await this.saveDraft({
      businessProfileId: source.business_profile_id,
      jobId: source.job_id,
      docType: targetType,
      customerId: source.customer_id,
      issueDate: Date.now(),
      dueDate: targetType === 'invoice' ? source.due_date : null,
      currency: source.currency,
      discountType: source.discount_type,
      discountValue: toBigIntSafe(source.discount_value, 0n),
      taxType: source.tax_type,
      taxRateBp: toBigIntSafe(source.tax_rate_bp, 0n),
      taxLabel: source.tax_label,
      depositMinor: toBigIntSafe(source.deposit_minor || 0, 0n),
      poNumber: source.po_number,
      paymentTermsPreset: targetType === 'invoice' ? source.payment_terms_preset : undefined,
      shippingAddress: source.shipping_address,
      paymentInstructions: source.payment_instructions,
      notes: source.notes,
      terms: source.terms,
      internalNotes: source.internal_notes,
      parentDocumentId: source.id,
      items: source.items.map((i) => ({
        description: i.description,
        itemNotes: i.item_notes,
        quantityScaled: toBigIntSafe(i.quantity_scaled, 10000n),
        unitName: i.unit_name,
        unitPriceMinor: toBigIntSafe(i.unit_price_minor, 0n),
      })),
    });

    const action =
      source.doc_type === 'estimate' && targetType === 'invoice'
        ? 'convert_estimate_to_invoice'
        : `convert_${source.doc_type}_to_${targetType}`;

    await AuditEventRepository.logEvent({
      businessProfileId: newDoc.business_profile_id,
      entityType: 'document',
      entityId: newDoc.id,
      action,
      payload: {
        sourceId: source.id,
        sourceNumber: source.document_number,
        sourceType: source.doc_type,
        targetId: newDoc.id,
        targetType: targetType,
      },
    });

    return newDoc;
  }

  /**
   * Converts an Accepted Estimate into a New Invoice Draft.
   * Clones all items, customer, rates, discounts, taxes, notes, terms, PO number, shipping address.
   * Links parent_document_id. Leaves estimate intact.
   */
  static async convertEstimateToInvoice(estimateId: string): Promise<FullDocument> {
    return this.convertDocument(estimateId, 'invoice');
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
      discountValue: toBigIntSafe(src.discount_value, 0n),
      taxType: src.tax_type,
      taxRateBp: toBigIntSafe(src.tax_rate_bp, 0n),
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
        quantityScaled: toBigIntSafe(i.quantity_scaled, 10000n),
        unitName: i.unit_name,
        unitPriceMinor: toBigIntSafe(i.unit_price_minor, 0n),
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

    // Authoritative balance calculation via canonical BalanceEngine
    const paymentRows = await db.getAllAsync<{
      amount_minor: number;
      status?: string | null;
      refund_state?: string | null;
      refunded_amount_minor?: number | null;
    }>(
      'SELECT amount_minor, status, refund_state, refunded_amount_minor FROM payments WHERE invoice_id = ?;',
      [id]
    );

    const balanceResult = calculateDocumentBalance({
      grandTotalMinor: toBigIntSafe(doc.total_minor, 0n),
      depositMinor: toBigIntSafe(doc.deposit_minor, 0n),
      payments: paymentRows.map((p) => ({
        amountMinor: toBigIntSafe(p.amount_minor, 0n),
        status: p.status,
        refundState: p.refund_state,
        refundedAmountMinor: p.refunded_amount_minor ? toBigIntSafe(p.refunded_amount_minor, 0n) : 0n,
      })),
    });

    const totalPaid = Number(balanceResult.validPaymentsMinor);
    const balance = Number(balanceResult.balanceMinor);
    const paymentStatus = balanceResult.paymentStatus;

    const taxSnap = await db.getFirstAsync<{ tax_summary_json: string }>(
      'SELECT tax_summary_json FROM document_tax_snapshots WHERE document_id = ?;',
      [id]
    );

    let taxSummary = null;
    if (taxSnap?.tax_summary_json) {
      try {
        taxSummary = JSON.parse(taxSnap.tax_summary_json);
      } catch {
        taxSummary = null;
      }
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
      tax_summary: taxSummary,
    };
  }

  /**
   * Retrieves a full document by document_number (e.g. INV-0001).
   */
  static async getByDocumentNumber(docNumber: string): Promise<FullDocument | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM documents WHERE document_number = ?;',
      [docNumber]
    );
    if (!row) return null;
    return this.getById(row.id);
  }

  /**
   * Authoritative calculation of home dashboard overview metrics.
   * Canonical formula:
   * balance = document total - valid deposits applied - successful payment allocations + applicable refunds/reversals.
   *
   * Only issued invoices with remaining balance > 0 contribute to outstanding.
   */
  static async getHomeDashboardMetricsAsync(): Promise<{
    outstandingMinor: bigint;
    paidThisMonthMinor: bigint;
    overdueInvoicesCount: number;
    overdueMinor: bigint;
  }> {
    const db = await this.getDb();

    // 1. Fetch all issued, unarchived invoices
    const issuedInvoices = await db.getAllAsync<{
      id: string;
      total_minor: number;
      deposit_minor: number;
      due_date: number | null;
    }>(
      `SELECT id, total_minor, deposit_minor, due_date
       FROM documents
       WHERE doc_type IN ('invoice', 'tax_invoice', 'bill_of_supply', 'export_invoice')
         AND lifecycle_status = 'issued'
         AND is_archived = 0;`
    );

    const now = Date.now();
    let outstandingMinor = 0n;
    let overdueMinor = 0n;
    let overdueCount = 0;

    for (const inv of issuedInvoices) {
      const paymentRows = await db.getAllAsync<{
        amount_minor: number;
        status?: string | null;
        refund_state?: string | null;
        refunded_amount_minor?: number | null;
      }>(
        'SELECT amount_minor, status, refund_state, refunded_amount_minor FROM payments WHERE invoice_id = ?;',
        [inv.id]
      );

      const bal = calculateDocumentBalance({
        grandTotalMinor: toBigIntSafe(inv.total_minor, 0n),
        depositMinor: toBigIntSafe(inv.deposit_minor, 0n),
        payments: paymentRows.map((p) => ({
          amountMinor: toBigIntSafe(p.amount_minor, 0n),
          status: p.status,
          refundState: p.refund_state,
          refundedAmountMinor: p.refunded_amount_minor ? toBigIntSafe(p.refunded_amount_minor, 0n) : 0n,
        })),
      });

      if (bal.balanceMinor > 0n) {
        outstandingMinor += bal.balanceMinor;
        if (inv.due_date && now > inv.due_date) {
          overdueMinor += bal.balanceMinor;
          overdueCount += 1;
        }
      }
    }

    // 2. Paid this month: sum of completed, unrefunded payments recorded in current calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthPayments = await db.getFirstAsync<{ sum_paid: number }>(
      `SELECT COALESCE(SUM(amount_minor - COALESCE(refunded_amount_minor, 0)), 0) AS sum_paid
       FROM payments
       WHERE payment_date >= ?
         AND (status IS NULL OR status = 'completed')
         AND (refund_state IS NULL OR refund_state != 'full');`,
      [startOfMonth.getTime()]
    );

    const paidThisMonthMinor = toBigIntSafe(monthPayments?.sum_paid, 0n);

    return {
      outstandingMinor,
      paidThisMonthMinor,
      overdueInvoicesCount: overdueCount,
      overdueMinor,
    };
  }

  /**
   * Retrieves all issued, unarchived invoices with balances and customer details for Collections & Aging.
   */
  static async getIssuedInvoicesForAgingAsync(): Promise<import('../../domain/collections/AgingEngine').RawInvoiceForAging[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT d.id, d.document_number, d.customer_id, d.issue_date, d.due_date,
              d.total_minor, d.deposit_minor, d.currency,
              c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
       FROM documents d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.doc_type IN ('invoice', 'tax_invoice', 'bill_of_supply', 'export_invoice')
         AND d.lifecycle_status = 'issued'
         AND d.is_archived = 0
       ORDER BY d.issue_date DESC;`
    );

    const result: import('../../domain/collections/AgingEngine').RawInvoiceForAging[] = [];

    for (const r of rows) {
      const paymentRows = await db.getAllAsync<{
        amount_minor: number;
        status?: string | null;
        refund_state?: string | null;
        refunded_amount_minor?: number | null;
      }>(
        'SELECT amount_minor, status, refund_state, refunded_amount_minor FROM payments WHERE invoice_id = ?;',
        [r.id]
      );

      const bal = calculateDocumentBalance({
        grandTotalMinor: toBigIntSafe(r.total_minor, 0n),
        depositMinor: toBigIntSafe(r.deposit_minor, 0n),
        payments: paymentRows.map((p) => ({
          amountMinor: toBigIntSafe(p.amount_minor, 0n),
          status: p.status,
          refundState: p.refund_state,
          refundedAmountMinor: p.refunded_amount_minor ? toBigIntSafe(p.refunded_amount_minor, 0n) : 0n,
        })),
      });

      if (bal.balanceMinor > 0n) {
        result.push({
          id: r.id,
          document_number: r.document_number,
          customer_id: r.customer_id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          customer_email: r.customer_email,
          issue_date: r.issue_date,
          due_date: r.due_date,
          total_minor: r.total_minor,
          balance_minor: bal.balanceMinor,
          currency: r.currency || 'USD',
        });
      }
    }

    return result;
  }

  /**
   * Voids an issued document. Preserves record for legal and audit compliance.
   */
  static async voidDocument(id: string): Promise<void> {
    const db = await this.getDb();
    const doc = await this.getById(id);
    await db.runAsync("UPDATE documents SET lifecycle_status = 'void', updated_at = ? WHERE id = ?;", [
      Date.now(),
      id,
    ]);

    if (doc) {
      await AuditEventRepository.logEvent({
        businessProfileId: doc.business_profile_id,
        entityType: 'document',
        entityId: doc.id,
        action: 'void',
        payload: { documentNumber: doc.document_number, docType: doc.doc_type },
      });
    }
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
