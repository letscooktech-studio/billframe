/**
 * CREDIT NOTE REPOSITORY
 * SQLite persistence for immutable credit notes linked to original invoices.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { CreditNoteStatus } from '../../domain/credit/CreditNoteEngine';
import { AuditEventRepository } from './AuditEventRepository';

export interface CreditNoteRecord {
  id: string;
  business_profile_id: string;
  customer_id: string;
  original_invoice_id: string;
  credit_note_number: string;
  reason: string;
  credit_amount_minor: number;
  tax_amount_minor: number;
  currency: string;
  issue_date: number;
  status: CreditNoteStatus;
  snapshot_json: string;
  created_at: number;
  updated_at: number;
}

export interface CreateCreditNoteRecordInput {
  id?: string;
  businessProfileId: string;
  customerId: string;
  originalInvoiceId: string;
  creditNoteNumber: string;
  reason: string;
  creditAmountMinor: bigint;
  taxAmountMinor?: bigint;
  currency: string;
  issueDate?: number;
  status?: CreditNoteStatus;
  snapshot?: any;
}

export class CreditNoteRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  static async create(input: CreateCreditNoteRecordInput): Promise<CreditNoteRecord> {
    const db = await this.getDb();
    const id = input.id || `cn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const issueDate = input.issueDate || now;
    const taxAmountMinor = input.taxAmountMinor ? Number(input.taxAmountMinor) : 0;
    const creditAmountMinor = Number(input.creditAmountMinor);
    const status: CreditNoteStatus = input.status || 'issued';
    const snapshotJson = JSON.stringify(input.snapshot || {
      originalInvoiceId: input.originalInvoiceId,
      creditNoteNumber: input.creditNoteNumber,
      amountMinor: creditAmountMinor,
      reason: input.reason,
    });

    await db.runAsync(
      `INSERT INTO credit_notes (
        id, business_profile_id, customer_id, original_invoice_id, credit_note_number,
        reason, credit_amount_minor, tax_amount_minor, currency, issue_date, status,
        snapshot_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.businessProfileId,
        input.customerId,
        input.originalInvoiceId,
        input.creditNoteNumber,
        input.reason,
        creditAmountMinor,
        taxAmountMinor,
        input.currency,
        issueDate,
        status,
        snapshotJson,
        now,
        now,
      ]
    );

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to retrieve newly created credit note.');

    await AuditEventRepository.logEvent({
      businessProfileId: input.businessProfileId,
      entityType: 'credit_note',
      entityId: id,
      action: 'create_credit_note',
      payload: {
        creditNoteNumber: input.creditNoteNumber,
        originalInvoiceId: input.originalInvoiceId,
        creditAmountMinor,
      },
    });

    return record;
  }

  static async getById(id: string): Promise<CreditNoteRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<CreditNoteRecord>('SELECT * FROM credit_notes WHERE id = ?;', [id]);
  }

  static async getByInvoiceId(invoiceId: string): Promise<CreditNoteRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<CreditNoteRecord>(
      'SELECT * FROM credit_notes WHERE original_invoice_id = ? ORDER BY issue_date DESC;',
      [invoiceId]
    );
  }

  static async getByCustomerId(customerId: string): Promise<CreditNoteRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<CreditNoteRecord>(
      'SELECT * FROM credit_notes WHERE customer_id = ? ORDER BY issue_date DESC;',
      [customerId]
    );
  }
}
