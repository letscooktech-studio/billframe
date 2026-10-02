/**
 * PAYMENT & RECEIPT REPOSITORY
 * Authoritative payment records, overpayment rejection, and atomic receipt creation.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { DocumentRepository } from './DocumentRepository';
import { AuditEventRepository } from './AuditEventRepository';
import { formatDocumentNumber } from '../../domain/numbering/SequenceEngine';

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount_minor: number;
  currency: string;
  payment_date: number;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'reversed';
  provider: 'manual' | 'direct_upi' | 'razorpay' | 'cashfree' | 'stripe' | 'other';
  provider_payment_id: string | null;
  provider_order_id: string | null;
  verification_state: 'manual_confirmed' | 'unverified' | 'verified_webhook' | 'verified_api' | 'failed_verification';
  verified_at: number | null;
  settlement_state: 'settled' | 'unsettled' | 'not_applicable';
  refund_state: 'none' | 'partial' | 'full';
  refunded_amount_minor: number;
  source: 'manual_entry' | 'quick_bill' | 'invoice_payment' | 'direct_qr' | 'external_import';
  created_at: number;
  updated_at: number;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amountMinor: bigint;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  paymentDate?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'reversed';
  provider?: 'manual' | 'direct_upi' | 'razorpay' | 'cashfree' | 'stripe' | 'other';
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  verificationState?: 'manual_confirmed' | 'unverified' | 'verified_webhook' | 'verified_api' | 'failed_verification';
  verifiedAt?: number | null;
  settlementState?: 'settled' | 'unsettled' | 'not_applicable';
  refundState?: 'none' | 'partial' | 'full';
  refundedAmountMinor?: bigint;
  source?: 'manual_entry' | 'quick_bill' | 'invoice_payment' | 'direct_qr' | 'external_import';
}

export interface ReceiptRecord {
  id: string;
  business_profile_id: string;
  payment_id: string;
  invoice_id: string;
  sequence_number: number;
  receipt_number: string;
  receipt_snapshot_json: string;
  issue_date: number;
  created_at: number;
}

export class PaymentRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Records a payment against an invoice with overpayment guard and atomic receipt issuance.
   */
  static async recordPayment(input: RecordPaymentInput): Promise<{ payment: PaymentRecord; receipt: ReceiptRecord }> {
    const db = await this.getDb();
    const invoice = await DocumentRepository.getById(input.invoiceId);
    if (!invoice) throw new Error(`Invoice not found for id ${input.invoiceId}`);
    if (invoice.lifecycle_status !== 'issued') {
      throw new Error(`Payments can only be recorded on issued invoices. Current status: ${invoice.lifecycle_status}`);
    }

    if (input.amountMinor <= 0n) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const currentBalance = BigInt(invoice.balance_minor);
    if (input.amountMinor > currentBalance) {
      throw new Error(
        `Payment amount (${input.amountMinor}) exceeds remaining invoice balance (${currentBalance}). Overpayment is prohibited.`
      );
    }

    const now = Date.now();
    const paymentDate = input.paymentDate || now;
    const paymentId = `pay_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptId = `rec_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const status = input.status || 'completed';
    const provider = input.provider || 'manual';
    const providerPaymentId = input.providerPaymentId || null;
    const providerOrderId = input.providerOrderId || null;
    const verificationState = input.verificationState || 'manual_confirmed';
    const verifiedAt = input.verifiedAt || (verificationState === 'manual_confirmed' ? now : null);
    const settlementState = input.settlementState || 'settled';
    const refundState = input.refundState || 'none';
    const refundedAmountMinor = input.refundedAmountMinor ? Number(input.refundedAmountMinor) : 0;
    const source = input.source || 'manual_entry';

    let createdPayment!: PaymentRecord;
    let createdReceipt!: ReceiptRecord;

    await db.withTransactionAsync(async () => {
      // 1. Insert payment record with forward-compatible verification and provider fields
      await db.runAsync(
        `INSERT INTO payments (
          id, invoice_id, amount_minor, currency, payment_date, payment_method, reference, notes,
          status, provider, provider_payment_id, provider_order_id, verification_state, verified_at,
          settlement_state, refund_state, refunded_amount_minor, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          paymentId,
          invoice.id,
          Number(input.amountMinor),
          invoice.currency,
          paymentDate,
          input.paymentMethod,
          input.reference?.trim() || null,
          input.notes?.trim() || null,
          status,
          provider,
          providerPaymentId,
          providerOrderId,
          verificationState,
          verifiedAt,
          settlementState,
          refundState,
          refundedAmountMinor,
          source,
          now,
          now,
        ]
      );

      // 2. Fetch and increment receipt sequence counter atomically
      const seq = await db.getFirstAsync<{
        id: string;
        prefix: string;
        next_sequence_number: number;
        suffix: string;
        padding: number;
      }>(
        'SELECT id, prefix, next_sequence_number, suffix, padding FROM number_sequences WHERE business_profile_id = ? AND doc_type = ?;',
        [invoice.business_profile_id, 'receipt']
      );

      const prefix = seq?.prefix || 'RCP-';
      const seqNum = seq?.next_sequence_number || 1;
      const padding = seq?.padding || 4;
      const suffix = seq?.suffix || '';

      const receiptNumber = formatDocumentNumber(prefix, seqNum, padding, suffix);

      // Increment sequence
      if (seq) {
        await db.runAsync(
          'UPDATE number_sequences SET next_sequence_number = next_sequence_number + 1, updated_at = ? WHERE id = ?;',
          [now, seq.id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO number_sequences (id, business_profile_id, doc_type, prefix, next_sequence_number, suffix, padding, updated_at)
           VALUES (?, ?, 'receipt', ?, ?, ?, ?, ?);`,
          [`seq_${invoice.business_profile_id}_receipt`, invoice.business_profile_id, prefix, seqNum + 1, suffix, padding, now]
        );
      }

      // 3. Build receipt snapshot
      const remainingBalance = currentBalance - input.amountMinor;
      const receiptSnapshot = {
        receiptNumber,
        paymentDate,
        amountMinor: input.amountMinor.toString(),
        currency: invoice.currency,
        paymentMethod: input.paymentMethod,
        reference: input.reference || null,
        notes: input.notes || null,
        invoiceReference: {
          id: invoice.id,
          number: invoice.document_number,
          totalMinor: invoice.total_minor.toString(),
          remainingBalanceMinor: remainingBalance.toString(),
        },
        seller: {
          businessProfileId: invoice.business_profile_id,
        },
        buyer: {
          customerId: invoice.customer_id,
          name: invoice.customer_name,
          businessName: invoice.customer_business_name,
        },
        frozenAt: now,
      };

      // 4. Insert receipt
      await db.runAsync(
        `INSERT INTO receipts (
          id, business_profile_id, payment_id, invoice_id, sequence_number, receipt_number, receipt_snapshot_json, issue_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          receiptId,
          invoice.business_profile_id,
          paymentId,
          invoice.id,
          seqNum,
          receiptNumber,
          JSON.stringify(receiptSnapshot),
          paymentDate,
          now,
        ]
      );
    });

    createdPayment = (await db.getFirstAsync<PaymentRecord>('SELECT * FROM payments WHERE id = ?;', [paymentId]))!;
    createdReceipt = (await db.getFirstAsync<ReceiptRecord>('SELECT * FROM receipts WHERE id = ?;', [receiptId]))!;

    await AuditEventRepository.logEvent({
      businessProfileId: invoice.business_profile_id,
      entityType: 'payment',
      entityId: paymentId,
      action: 'record_payment',
      payload: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.document_number,
        amountMinor: Number(input.amountMinor),
        paymentMethod: input.paymentMethod,
        receiptNumber: createdReceipt.receipt_number,
      },
    });

    return { payment: createdPayment, receipt: createdReceipt };
  }

  static async getPaymentsForInvoice(invoiceId: string): Promise<PaymentRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<PaymentRecord>(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date ASC, created_at ASC;',
      [invoiceId]
    );
  }

  static async getReceiptsForInvoice(invoiceId: string): Promise<ReceiptRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<ReceiptRecord>(
      'SELECT * FROM receipts WHERE invoice_id = ? ORDER BY issue_date ASC, created_at ASC;',
      [invoiceId]
    );
  }

  static async getReceiptById(receiptId: string): Promise<ReceiptRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<ReceiptRecord>('SELECT * FROM receipts WHERE id = ?;', [receiptId]);
  }
}
