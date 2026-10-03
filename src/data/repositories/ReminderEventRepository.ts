/**
 * REMINDER EVENT & COLLECTION METADATA REPOSITORY
 * SQLite persistence for collection reminder histories and promise-to-pay tracking.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';

export interface ReminderEventRecord {
  id: string;
  business_profile_id: string;
  invoice_id: string;
  customer_id: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'manual';
  template: 'friendly' | 'firm' | 'urgent' | 'custom';
  status: 'opened_for_sending' | 'sent' | 'failed';
  is_automated: number;
  reminder_date: number;
  created_at: number;
}

export interface InvoiceCollectionMetadataRecord {
  document_id: string;
  expected_payment_date: number | null;
  promise_to_pay_date: number | null;
  collection_notes: string | null;
  updated_at: number;
}

export class ReminderEventRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  static async logReminder(input: {
    businessProfileId: string;
    invoiceId: string;
    customerId: string;
    channel: 'whatsapp' | 'sms' | 'email' | 'manual';
    template: 'friendly' | 'firm' | 'urgent' | 'custom';
    status?: 'opened_for_sending' | 'sent' | 'failed';
    isAutomated?: boolean;
    reminderDate?: number;
  }): Promise<ReminderEventRecord> {
    const db = await this.getDb();
    const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO reminder_events (
        id, business_profile_id, invoice_id, customer_id, channel, template,
        status, is_automated, reminder_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.businessProfileId,
        input.invoiceId,
        input.customerId,
        input.channel,
        input.template,
        input.status || 'sent',
        input.isAutomated ? 1 : 0,
        input.reminderDate || now,
        now,
      ]
    );

    return {
      id,
      business_profile_id: input.businessProfileId,
      invoice_id: input.invoiceId,
      customer_id: input.customerId,
      channel: input.channel,
      template: input.template,
      status: input.status || 'sent',
      is_automated: input.isAutomated ? 1 : 0,
      reminder_date: input.reminderDate || now,
      created_at: now,
    };
  }

  static async getRemindersForInvoice(invoiceId: string): Promise<ReminderEventRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<ReminderEventRecord>(
      'SELECT * FROM reminder_events WHERE invoice_id = ? ORDER BY reminder_date DESC;',
      [invoiceId]
    );
  }

  static async savePromiseToPay(params: {
    documentId: string;
    promiseToPayDate: number | null;
    expectedPaymentDate?: number | null;
    collectionNotes?: string | null;
  }): Promise<void> {
    const db = await this.getDb();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO invoice_collection_metadata (
        document_id, expected_payment_date, promise_to_pay_date, collection_notes, updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        expected_payment_date = excluded.expected_payment_date,
        promise_to_pay_date = excluded.promise_to_pay_date,
        collection_notes = excluded.collection_notes,
        updated_at = excluded.updated_at;`,
      [
        params.documentId,
        params.expectedPaymentDate || null,
        params.promiseToPayDate,
        params.collectionNotes || null,
        now,
      ]
    );
  }

  static async getCollectionMetadata(documentId: string): Promise<InvoiceCollectionMetadataRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<InvoiceCollectionMetadataRecord>(
      'SELECT * FROM invoice_collection_metadata WHERE document_id = ?;',
      [documentId]
    );
  }
}
