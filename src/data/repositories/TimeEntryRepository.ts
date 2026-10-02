/**
 * TIME ENTRY REPOSITORY
 * Offline-first SQLite persistence for timesheets, hourly billing, and job labour costing.
 */

import { DatabaseManager } from '../database/DatabaseManager';

export interface TimeEntryRecord {
  id: string;
  business_profile_id: string;
  job_id: string | null;
  customer_id: string | null;
  worker_name: string;
  description: string;
  hours_scaled: number; // 1.0 hr = 10,000
  hourly_rate_minor: number;
  internal_cost_rate_minor: number;
  entry_date: number;
  is_billed: number;
  billed_invoice_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateTimeEntryInput {
  id?: string;
  businessProfileId?: string;
  jobId?: string | null;
  customerId?: string | null;
  workerName?: string;
  description: string;
  hoursScaled: number;
  hourlyRateMinor?: number;
  internalCostRateMinor?: number;
  entryDate?: number;
}

export class TimeEntryRepository {
  static async createTimeEntryAsync(input: CreateTimeEntryInput): Promise<TimeEntryRecord> {
    const db = await DatabaseManager.getDatabaseAsync();
    const id = input.id || `time_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const businessProfileId = input.businessProfileId || 'default_business_profile';

    await db.runAsync(
      `INSERT INTO time_entries (
        id, business_profile_id, job_id, customer_id, worker_name, description,
        hours_scaled, hourly_rate_minor, internal_cost_rate_minor, entry_date,
        is_billed, billed_invoice_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        businessProfileId,
        input.jobId || null,
        input.customerId || null,
        input.workerName || 'Default Worker',
        input.description.trim(),
        input.hoursScaled,
        input.hourlyRateMinor || 0,
        input.internalCostRateMinor || 0,
        input.entryDate || now,
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
      worker_name: input.workerName || 'Default Worker',
      description: input.description.trim(),
      hours_scaled: input.hoursScaled,
      hourly_rate_minor: input.hourlyRateMinor || 0,
      internal_cost_rate_minor: input.internalCostRateMinor || 0,
      entry_date: input.entryDate || now,
      is_billed: 0,
      billed_invoice_id: null,
      created_at: now,
      updated_at: now,
    };
  }

  static async listTimeEntriesByJobAsync(jobId: string): Promise<TimeEntryRecord[]> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getAllAsync<TimeEntryRecord>(
      'SELECT * FROM time_entries WHERE job_id = ? ORDER BY entry_date DESC;',
      [jobId]
    );
  }

  static async listAllTimeEntriesAsync(): Promise<TimeEntryRecord[]> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getAllAsync<TimeEntryRecord>(
      'SELECT * FROM time_entries ORDER BY entry_date DESC;'
    );
  }

  static async deleteTimeEntryAsync(id: string): Promise<void> {
    const db = await DatabaseManager.getDatabaseAsync();
    await db.runAsync('DELETE FROM time_entries WHERE id = ?;', [id]);
  }
}
