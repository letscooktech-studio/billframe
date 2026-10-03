/**
 * PAYMENT REFUND REPOSITORY
 * SQLite persistence for payment refunds with bidirectional updates to payment settlement state.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { AuditEventRepository } from './AuditEventRepository';

export type RefundStatus = 'completed' | 'pending' | 'failed';

export interface PaymentRefundRecord {
  id: string;
  business_profile_id: string;
  payment_id: string;
  invoice_id: string;
  refund_amount_minor: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  provider_refund_id: string | null;
  refund_date: number;
  created_at: number;
  updated_at: number;
}

export class PaymentRefundRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Records an immutable refund and updates the original payment's refund_state atomically.
   */
  static async recordRefund(params: {
    businessProfileId: string;
    paymentId: string;
    invoiceId: string;
    refundAmountMinor: bigint;
    currency: string;
    reason: string;
    providerRefundId?: string | null;
    refundDate?: number;
  }): Promise<PaymentRefundRecord> {
    const db = await this.getDb();
    const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const refundAmountNumber = Number(params.refundAmountMinor);

    const payment = await db.getFirstAsync<{ amount_minor: number; refunded_amount_minor: number }>(
      'SELECT amount_minor, refunded_amount_minor FROM payments WHERE id = ?;',
      [params.paymentId]
    );

    if (!payment) throw new Error('Original payment record not found.');

    const currentRefunded = payment.refunded_amount_minor || 0;
    const newRefundedTotal = currentRefunded + refundAmountNumber;

    if (newRefundedTotal > payment.amount_minor) {
      throw new Error(`Refund exceeds original payment. Max refundable: ${payment.amount_minor - currentRefunded}`);
    }

    const newRefundState = newRefundedTotal === payment.amount_minor ? 'full' : 'partial';

    await db.withTransactionAsync(async () => {
      // 1. Insert refund record
      await db.runAsync(
        `INSERT INTO payment_refunds (
          id, business_profile_id, payment_id, invoice_id, refund_amount_minor,
          currency, reason, status, provider_refund_id, refund_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?);`,
        [
          id,
          params.businessProfileId,
          params.paymentId,
          params.invoiceId,
          refundAmountNumber,
          params.currency,
          params.reason,
          params.providerRefundId || null,
          params.refundDate || now,
          now,
          now,
        ]
      );

      // 2. Update payment record
      await db.runAsync(
        'UPDATE payments SET refund_state = ?, refunded_amount_minor = ?, updated_at = ? WHERE id = ?;',
        [newRefundState, newRefundedTotal, now, params.paymentId]
      );
    });

    const record = await this.getById(id);
    if (!record) throw new Error('Failed to retrieve recorded refund.');

    await AuditEventRepository.logEvent({
      businessProfileId: params.businessProfileId,
      entityType: 'payment_refund',
      entityId: id,
      action: 'record_payment_refund',
      payload: {
        paymentId: params.paymentId,
        invoiceId: params.invoiceId,
        refundAmountMinor: refundAmountNumber,
      },
    });

    return record;
  }

  static async getById(id: string): Promise<PaymentRefundRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<PaymentRefundRecord>('SELECT * FROM payment_refunds WHERE id = ?;', [id]);
  }

  static async getByPaymentId(paymentId: string): Promise<PaymentRefundRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<PaymentRefundRecord>(
      'SELECT * FROM payment_refunds WHERE payment_id = ? ORDER BY refund_date DESC;',
      [paymentId]
    );
  }

  static async getByInvoiceId(invoiceId: string): Promise<PaymentRefundRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<PaymentRefundRecord>(
      'SELECT * FROM payment_refunds WHERE invoice_id = ? ORDER BY refund_date DESC;',
      [invoiceId]
    );
  }
}
