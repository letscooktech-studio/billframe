/**
 * TAX SNAPSHOT REPOSITORY
 * Immutable persistence of document tax audit decisions and multi-component breakdowns.
 * Guarantees that historical invoices never change even if country tax laws evolve.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { DocumentTaxSummary, SupplyType } from '../../domain/tax/TaxTypes';

export interface DocumentTaxSnapshotRecord {
  id: string;
  document_id: string;
  tax_pack_id: string;
  tax_pack_version: string;
  place_of_supply: string;
  supply_type: SupplyType;
  reverse_charge: number;
  tax_summary_json: string;
  created_at: number;
}

export class TaxSnapshotRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Saves or freezes the tax calculation snapshot for an issued document.
   */
  static async saveTaxSnapshot(
    documentId: string,
    taxSummary: DocumentTaxSummary
  ): Promise<DocumentTaxSnapshotRecord> {
    const db = await this.getDb();
    const id = `taxsnap_${documentId}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO document_tax_snapshots (
        id, document_id, tax_pack_id, tax_pack_version, place_of_supply,
        supply_type, reverse_charge, tax_summary_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        tax_pack_id = excluded.tax_pack_id,
        tax_pack_version = excluded.tax_pack_version,
        place_of_supply = excluded.place_of_supply,
        supply_type = excluded.supply_type,
        reverse_charge = excluded.reverse_charge,
        tax_summary_json = excluded.tax_summary_json;`,
      [
        id,
        documentId,
        taxSummary.packId,
        taxSummary.packVersion,
        taxSummary.placeOfSupply,
        taxSummary.supplyType,
        taxSummary.reverseCharge ? 1 : 0,
        JSON.stringify(taxSummary, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
        now,
      ]
    );

    const record = await this.getByDocumentId(documentId);
    if (!record) {
      throw new Error(`Failed to retrieve saved tax snapshot for document ${documentId}`);
    }
    return record;
  }

  /**
   * Retrieves the tax snapshot for a document.
   */
  static async getByDocumentId(documentId: string): Promise<DocumentTaxSnapshotRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<DocumentTaxSnapshotRecord>(
      'SELECT * FROM document_tax_snapshots WHERE document_id = ?;',
      [documentId]
    );
  }

  /**
   * Deletes tax snapshot (e.g. if draft deleted).
   */
  static async deleteByDocumentId(documentId: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM document_tax_snapshots WHERE document_id = ?;', [documentId]);
  }
}
