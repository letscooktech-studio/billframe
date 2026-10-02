/**
 * CATALOG REPOSITORY
 * SQLite persistence for products and services items.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';

export interface CatalogItemRecord {
  id: string;
  name: string;
  description: string | null;
  unit_price_minor: number;
  currency: string;
  unit_name: string;
  default_tax_rate_bp: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

export class CatalogRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  static async createItem(item: Parameters<typeof CatalogRepository.create>[0]) {
    return this.create(item);
  }

  static async listAllItems(includeArchived: boolean = false) {
    return this.search('', includeArchived);
  }

  static async create(item: {
    id?: string;
    name: string;
    description?: string | null;
    unitPriceMinor: bigint;
    currency: string;
    unitName?: string;
    defaultTaxRateBp?: number;
  }): Promise<CatalogItemRecord> {
    const db = await this.getDb();
    const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO catalog_items (
        id, name, description, unit_price_minor, currency, unit_name, default_tax_rate_bp, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
      [
        id,
        item.name.trim(),
        item.description?.trim() || null,
        Number(item.unitPriceMinor),
        item.currency.toUpperCase(),
        item.unitName?.trim() || 'item',
        item.defaultTaxRateBp || 0,
        now,
        now,
      ]
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to create catalog item ${item.name}`);
    }
    return created;
  }

  static async getById(id: string): Promise<CatalogItemRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<CatalogItemRecord>('SELECT * FROM catalog_items WHERE id = ?;', [id]);
  }

  static async search(query: string = '', includeArchived: boolean = false): Promise<CatalogItemRecord[]> {
    const db = await this.getDb();
    let sql = 'SELECT * FROM catalog_items WHERE 1=1';
    const params: any[] = [];

    if (!includeArchived) {
      sql += ' AND is_archived = 0';
    }

    if (query.trim()) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const wild = `%${query.trim()}%`;
      params.push(wild, wild);
    }

    sql += ' ORDER BY name ASC;';
    return db.getAllAsync<CatalogItemRecord>(sql, params);
  }

  static async archive(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('UPDATE catalog_items SET is_archived = 1, updated_at = ? WHERE id = ?;', [Date.now(), id]);
  }
}
