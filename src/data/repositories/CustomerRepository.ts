/**
 * CUSTOMER REPOSITORY
 * SQLite data access for customer management, instant search, and statement balance calculations.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';

export interface CustomerRecord {
  id: string;
  name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  country: string | null;
  tax_id: string | null;
  notes: string | null;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

export interface CustomerWithBalance extends CustomerRecord {
  total_invoiced_minor: number;
  total_paid_minor: number;
  outstanding_balance_minor: number;
}

export class CustomerRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  static async create(customer: {
    id?: string;
    name: string;
    businessName?: string | null;
    email?: string | null;
    phone?: string | null;
    billingAddress?: string | null;
    shippingAddress?: string | null;
    country?: string | null;
    taxId?: string | null;
    notes?: string | null;
  }): Promise<CustomerRecord> {
    const db = await this.getDb();
    const id = customer.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO customers (
        id, name, business_name, email, phone, billing_address, shipping_address, country, tax_id, notes, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
      [
        id,
        customer.name.trim(),
        customer.businessName?.trim() || null,
        customer.email?.trim() || null,
        customer.phone?.trim() || null,
        customer.billingAddress?.trim() || null,
        customer.shippingAddress?.trim() || null,
        customer.country?.trim() || null,
        customer.taxId?.trim() || null,
        customer.notes?.trim() || null,
        now,
        now,
      ]
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to create customer ${customer.name}`);
    }
    return created;
  }

  static async update(
    id: string,
    customer: {
      name: string;
      businessName?: string | null;
      email?: string | null;
      phone?: string | null;
      billingAddress?: string | null;
      shippingAddress?: string | null;
      country?: string | null;
      taxId?: string | null;
      notes?: string | null;
    }
  ): Promise<CustomerRecord> {
    const db = await this.getDb();
    const now = Date.now();

    await db.runAsync(
      `UPDATE customers SET
        name = ?,
        business_name = ?,
        email = ?,
        phone = ?,
        billing_address = ?,
        shipping_address = ?,
        country = ?,
        tax_id = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        customer.name.trim(),
        customer.businessName?.trim() || null,
        customer.email?.trim() || null,
        customer.phone?.trim() || null,
        customer.billingAddress?.trim() || null,
        customer.shippingAddress?.trim() || null,
        customer.country?.trim() || null,
        customer.taxId?.trim() || null,
        customer.notes?.trim() || null,
        now,
        id,
      ]
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Customer not found for id ${id}`);
    }
    return updated;
  }

  static async getById(id: string): Promise<CustomerRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<CustomerRecord>('SELECT * FROM customers WHERE id = ?;', [id]);
  }

  static async getWithBalance(id: string): Promise<CustomerWithBalance | null> {
    const db = await this.getDb();
    const customer = await this.getById(id);
    if (!customer) return null;

    const invoices = await db.getFirstAsync<{ sum_total: number }>(
      "SELECT COALESCE(SUM(total_minor), 0) AS sum_total FROM documents WHERE customer_id = ? AND doc_type = 'invoice' AND lifecycle_status = 'issued';",
      [id]
    );

    const payments = await db.getFirstAsync<{ sum_paid: number }>(
      "SELECT COALESCE(SUM(p.amount_minor), 0) AS sum_paid FROM payments p JOIN documents d ON p.invoice_id = d.id WHERE d.customer_id = ? AND d.doc_type = 'invoice' AND d.lifecycle_status = 'issued';",
      [id]
    );

    const totalInvoiced = invoices?.sum_total || 0;
    const totalPaid = payments?.sum_paid || 0;
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    return {
      ...customer,
      total_invoiced_minor: totalInvoiced,
      total_paid_minor: totalPaid,
      outstanding_balance_minor: outstanding,
    };
  }

  static async search(query: string = '', includeArchived: boolean = false): Promise<CustomerRecord[]> {
    const db = await this.getDb();
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (!includeArchived) {
      sql += ' AND is_archived = 0';
    }

    if (query.trim()) {
      sql += ' AND (name LIKE ? OR business_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const wild = `%${query.trim()}%`;
      params.push(wild, wild, wild, wild);
    }

    sql += ' ORDER BY name ASC;';
    return db.getAllAsync<CustomerRecord>(sql, params);
  }

  static async archive(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('UPDATE customers SET is_archived = 1, updated_at = ? WHERE id = ?;', [Date.now(), id]);
  }

  static async restore(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('UPDATE customers SET is_archived = 0, updated_at = ? WHERE id = ?;', [Date.now(), id]);
  }
}
