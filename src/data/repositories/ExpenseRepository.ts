/**
 * EXPENSE REPOSITORY
 * Offline-first SQLite persistence for job costs and operating expenses.
 * Enables contractor job costing and net profit analytics.
 */

import { DatabaseManager } from '../database/DatabaseManager';

export type ExpenseCategory =
  | 'materials'
  | 'labour'
  | 'subcontractor'
  | 'equipment'
  | 'fuel'
  | 'travel'
  | 'permits'
  | 'other';

export interface ExpenseRecord {
  id: string;
  business_profile_id: string;
  job_id: string | null;
  customer_id: string | null;
  category: ExpenseCategory;
  description: string;
  amount_minor: number;
  currency: string;
  expense_date: number;
  receipt_image_uri: string | null;
  is_billable: number;
  is_billed: number;
  billed_invoice_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateExpenseInput {
  id?: string;
  businessProfileId?: string;
  jobId?: string | null;
  customerId?: string | null;
  category: ExpenseCategory;
  description: string;
  amountMinor: number;
  currency?: string;
  expenseDate?: number;
  receiptImageUri?: string | null;
  isBillable?: boolean;
}

export class ExpenseRepository {
  /**
   * Records a new expense linked to an optional job or customer.
   */
  static async createExpenseAsync(input: CreateExpenseInput): Promise<ExpenseRecord> {
    const db = await DatabaseManager.getDatabaseAsync();
    const id = input.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const profile = await db.getFirstAsync<{ id: string; default_currency: string }>(
      'SELECT id, default_currency FROM business_profiles WHERE is_active = 1 LIMIT 1;'
    );
    const businessProfileId = input.businessProfileId || profile?.id || 'default_business_profile';
    const currency = input.currency || profile?.default_currency || 'INR';
    const expenseDate = input.expenseDate || now;
    const isBillable = input.isBillable ? 1 : 0;

    await db.runAsync(
      `INSERT INTO expenses (
        id, business_profile_id, job_id, customer_id, category, description,
        amount_minor, currency, expense_date, receipt_image_uri, is_billable,
        is_billed, billed_invoice_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        businessProfileId,
        input.jobId || null,
        input.customerId || null,
        input.category,
        input.description.trim(),
        input.amountMinor,
        currency,
        expenseDate,
        input.receiptImageUri || null,
        isBillable,
        0,
        null,
        now,
        now,
      ]
    );

    return {
      id,
      business_profile_id: businessProfileId,
      job_id: input.jobId || null,
      customer_id: input.customerId || null,
      category: input.category,
      description: input.description.trim(),
      amount_minor: input.amountMinor,
      currency,
      expense_date: expenseDate,
      receipt_image_uri: input.receiptImageUri || null,
      is_billable: isBillable,
      is_billed: 0,
      billed_invoice_id: null,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Retrieves an expense by its unique identifier.
   */
  static async getExpenseByIdAsync(id: string): Promise<ExpenseRecord | null> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getFirstAsync<ExpenseRecord>('SELECT * FROM expenses WHERE id = ?;', [id]);
  }

  /**
   * Lists all expenses associated with a specific job.
   */
  static async listExpensesByJobAsync(jobId: string): Promise<ExpenseRecord[]> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getAllAsync<ExpenseRecord>(
      'SELECT * FROM expenses WHERE job_id = ? ORDER BY expense_date DESC;',
      [jobId]
    );
  }

  /**
   * Lists all expenses ordered chronologically.
   */
  static async listAllExpensesAsync(): Promise<ExpenseRecord[]> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getAllAsync<ExpenseRecord>(
      'SELECT * FROM expenses ORDER BY expense_date DESC;'
    );
  }

  /**
   * Calculates sum of expenses incurred for a specific job.
   */
  static async getJobExpenseTotalAsync(jobId: string): Promise<number> {
    const db = await DatabaseManager.getDatabaseAsync();
    const result = await db.getFirstAsync<{ total_expenses: number | null }>(
      'SELECT SUM(amount_minor) as total_expenses FROM expenses WHERE job_id = ?;',
      [jobId]
    );
    return result?.total_expenses || 0;
  }

  /**
   * Deletes an expense record.
   */
  static async deleteExpenseAsync(id: string): Promise<void> {
    const db = await DatabaseManager.getDatabaseAsync();
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
  }
}
