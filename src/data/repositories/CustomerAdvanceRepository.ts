/**
 * CUSTOMER ADVANCE & CREDIT ALLOCATION REPOSITORY
 * SQLite persistence for customer prepayments, advance balances, and invoice allocations.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { AuditEventRepository } from './AuditEventRepository';

export type CustomerAdvanceStatus = 'available' | 'partially_allocated' | 'fully_allocated' | 'refunded';

export interface CustomerAdvanceRecord {
  id: string;
  business_profile_id: string;
  customer_id: string;
  original_amount_minor: number;
  remaining_amount_minor: number;
  currency: string;
  payment_source: string;
  reference: string | null;
  notes: string | null;
  advance_date: number;
  status: CustomerAdvanceStatus;
  created_at: number;
  updated_at: number;
}

export interface CreditAllocationRecord {
  id: string;
  business_profile_id: string;
  customer_advance_id: string | null;
  credit_note_id: string | null;
  invoice_id: string;
  allocated_amount_minor: number;
  currency: string;
  allocated_at: number;
  notes: string | null;
}

export class CustomerAdvanceRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Records a new advance prepayment received from a customer.
   */
  static async recordAdvance(input: {
    businessProfileId: string;
    customerId: string;
    amountMinor: bigint;
    currency: string;
    paymentSource: string;
    reference?: string | null;
    notes?: string | null;
    advanceDate?: number;
  }): Promise<CustomerAdvanceRecord> {
    const db = await this.getDb();
    const id = `adv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const amountMinor = Number(input.amountMinor);

    await db.runAsync(
      `INSERT INTO customer_advances (
        id, business_profile_id, customer_id, original_amount_minor, remaining_amount_minor,
        currency, payment_source, reference, notes, advance_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?);`,
      [
        id,
        input.businessProfileId,
        input.customerId,
        amountMinor,
        amountMinor,
        input.currency,
        input.paymentSource,
        input.reference || null,
        input.notes || null,
        input.advanceDate || now,
        now,
        now,
      ]
    );

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to record customer advance.');

    await AuditEventRepository.logEvent({
      businessProfileId: input.businessProfileId,
      entityType: 'customer_advance',
      entityId: id,
      action: 'record_customer_advance',
      payload: {
        customerId: input.customerId,
        amountMinor,
      },
    });

    return record;
  }

  static async getById(id: string): Promise<CustomerAdvanceRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<CustomerAdvanceRecord>(
      'SELECT * FROM customer_advances WHERE id = ?;',
      [id]
    );
  }

  static async getByCustomerId(customerId: string): Promise<CustomerAdvanceRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<CustomerAdvanceRecord>(
      'SELECT * FROM customer_advances WHERE customer_id = ? ORDER BY advance_date DESC;',
      [customerId]
    );
  }

  /**
   * Allocates an advance balance to reduce an invoice's outstanding balance.
   */
  static async allocateAdvanceToInvoice(params: {
    businessProfileId: string;
    customerAdvanceId: string;
    invoiceId: string;
    allocatedAmountMinor: bigint;
    currency: string;
    notes?: string | null;
  }): Promise<CreditAllocationRecord> {
    const db = await this.getDb();
    const advance = await this.getById(params.customerAdvanceId);
    if (!advance) throw new Error('Customer advance not found.');

    const allocateNumber = Number(params.allocatedAmountMinor);
    if (allocateNumber <= 0 || allocateNumber > advance.remaining_amount_minor) {
      throw new Error(`Invalid allocation amount: max available is ${advance.remaining_amount_minor}`);
    }

    const allocId = `alloc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const newRemaining = advance.remaining_amount_minor - allocateNumber;
    const newStatus: CustomerAdvanceStatus = newRemaining === 0 ? 'fully_allocated' : 'partially_allocated';

    await db.withTransactionAsync(async () => {
      // 1. Insert allocation record
      await db.runAsync(
        `INSERT INTO credit_allocations (
          id, business_profile_id, customer_advance_id, credit_note_id, invoice_id,
          allocated_amount_minor, currency, allocated_at, notes
        ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?);`,
        [
          allocId,
          params.businessProfileId,
          params.customerAdvanceId,
          params.invoiceId,
          allocateNumber,
          params.currency,
          now,
          params.notes || null,
        ]
      );

      // 2. Update remaining advance balance
      await db.runAsync(
        'UPDATE customer_advances SET remaining_amount_minor = ?, status = ?, updated_at = ? WHERE id = ?;',
        [newRemaining, newStatus, now, params.customerAdvanceId]
      );
    });

    return {
      id: allocId,
      business_profile_id: params.businessProfileId,
      customer_advance_id: params.customerAdvanceId,
      credit_note_id: null,
      invoice_id: params.invoiceId,
      allocated_amount_minor: allocateNumber,
      currency: params.currency,
      allocated_at: now,
      notes: params.notes || null,
    };
  }

  static async getAllocationsForInvoice(invoiceId: string): Promise<CreditAllocationRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<CreditAllocationRecord>(
      'SELECT * FROM credit_allocations WHERE invoice_id = ? ORDER BY allocated_at ASC;',
      [invoiceId]
    );
  }
}
