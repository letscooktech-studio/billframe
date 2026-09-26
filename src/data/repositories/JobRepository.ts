/**
 * JOB REPOSITORY
 * SQLite persistence for customer jobs / projects (e.g. contracting projects, client deliverables).
 * Provides sequential job numbering, customer association, project lifecycle ('active' | 'completed' | 'cancelled'),
 * job site addresses, and aggregate billing summaries (total billed, total received, remaining balance).
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';

export interface JobRecord {
  id: string;
  business_profile_id: string;
  customer_id: string;
  job_number: string;
  title: string;
  description: string | null;
  site_address: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: number;
  updated_at: number;
}

export interface JobWithCustomer extends JobRecord {
  customer_name: string;
  customer_business_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  total_invoiced_minor: number;
  total_paid_minor: number;
  balance_minor: number;
}

export class JobRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Creates a new job/project.
   * Allocates sequential job number if not provided.
   */
  static async create(job: {
    id?: string;
    businessProfileId?: string;
    customerId: string;
    title: string;
    description?: string | null;
    siteAddress?: string | null;
    jobNumber?: string;
  }): Promise<JobRecord> {
    const db = await this.getDb();
    const id = job.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    let businessProfileId = job.businessProfileId;
    if (!businessProfileId) {
      const profile = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM business_profiles WHERE is_active = 1 LIMIT 1;'
      );
      businessProfileId = profile?.id || 'default_business_profile';
    }

    let jobNumber = job.jobNumber?.trim();
    if (!jobNumber) {
      // Find count of existing jobs to allocate JOB-0001, JOB-0002...
      const countRow = await db.getFirstAsync<{ cnt: number }>(
        'SELECT COUNT(*) AS cnt FROM jobs WHERE business_profile_id = ?;',
        [businessProfileId]
      );
      const nextSeq = (countRow?.cnt || 0) + 1;
      jobNumber = `JOB-${String(nextSeq).padStart(4, '0')}`;
    }

    await db.runAsync(
      `INSERT INTO jobs (
        id, business_profile_id, customer_id, job_number, title, description, site_address, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        businessProfileId,
        job.customerId,
        jobNumber,
        job.title.trim(),
        job.description?.trim() || null,
        job.siteAddress?.trim() || null,
        'active',
        now,
        now,
      ]
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to create job: ${job.title}`);
    }
    return created;
  }

  /**
   * Updates job metadata or status.
   */
  static async update(
    id: string,
    updates: {
      title?: string;
      description?: string | null;
      siteAddress?: string | null;
      status?: 'active' | 'completed' | 'cancelled';
    }
  ): Promise<JobRecord> {
    const db = await this.getDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Job not found: ${id}`);

    const now = Date.now();
    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const description = updates.description !== undefined ? (updates.description?.trim() || null) : existing.description;
    const siteAddress = updates.siteAddress !== undefined ? (updates.siteAddress?.trim() || null) : existing.site_address;
    const status = updates.status !== undefined ? updates.status : existing.status;

    await db.runAsync(
      `UPDATE jobs SET
        title = ?,
        description = ?,
        site_address = ?,
        status = ?,
        updated_at = ?
       WHERE id = ?;`,
      [title, description, siteAddress, status, now, id]
    );

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Job not found after update: ${id}`);
    return updated;
  }

  /**
   * Retrieves a job by ID.
   */
  static async getById(id: string): Promise<JobRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<JobRecord>('SELECT * FROM jobs WHERE id = ?;', [id]);
  }

  /**
   * Lists all jobs for a specific customer.
   */
  static async listByCustomer(customerId: string): Promise<JobRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<JobRecord>(
      'SELECT * FROM jobs WHERE customer_id = ? ORDER BY created_at DESC;',
      [customerId]
    );
  }

  /**
   * Lists active jobs with customer details and billing summary.
   */
  static async listWithSummary(status?: 'active' | 'completed' | 'cancelled'): Promise<JobWithCustomer[]> {
    const db = await this.getDb();
    let sql = `
      SELECT j.*,
             c.name AS customer_name,
             c.business_name AS customer_business_name,
             c.email AS customer_email,
             c.phone AS customer_phone,
             COALESCE((
               SELECT SUM(total_minor)
               FROM documents d
               WHERE d.job_id = j.id AND d.doc_type = 'invoice' AND d.lifecycle_status != 'draft' AND d.is_archived = 0
             ), 0) AS total_invoiced_minor,
             COALESCE((
               SELECT SUM(p.amount_minor)
               FROM payments p
               JOIN documents d ON p.invoice_id = d.id
               WHERE d.job_id = j.id
             ), 0) AS total_paid_minor
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
    `;

    const params: any[] = [];
    if (status) {
      sql += ' WHERE j.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY j.created_at DESC;';

    const rows = await db.getAllAsync<any>(sql, params);

    return rows.map((r) => {
      const invoiced = r.total_invoiced_minor || 0;
      const paid = r.total_paid_minor || 0;
      const balance = Math.max(0, invoiced - paid);
      return {
        ...r,
        total_invoiced_minor: invoiced,
        total_paid_minor: paid,
        balance_minor: balance,
      };
    });
  }
}
