/**
 * DATABASE MANAGER
 * Initializes SQLite with WAL mode, foreign keys enforcement, and runs baseline schema DDL.
 */

import * as SQLite from 'expo-sqlite';
import { INITIAL_SCHEMA_SQL } from './schema';
import { DEFAULT_CURRENCY } from '../../domain/money/Currencies';
import { DEFAULT_SEQUENCE_CONFIGS } from '../../domain/numbering/SequenceEngine';

import { InMemorySQLiteDatabase } from './InMemoryDatabase';

export const DB_NAME = 'billframe.db';

export class DatabaseManager {
  private static instance: SQLite.SQLiteDatabase | null = null;
  private static webFallback: InMemorySQLiteDatabase | null = null;

  /**
   * Returns a singleton SQLite database connection.
   */
  static async getDatabaseAsync(): Promise<SQLite.SQLiteDatabase> {
    if (this.instance) {
      return this.instance;
    }

    const isWeb = typeof window !== 'undefined';
    if (isWeb) {
      if (!this.webFallback) {
        const memDb = new InMemorySQLiteDatabase();
        await this.initDatabaseAsync(memDb as any);
        this.webFallback = memDb;
      }
      return this.webFallback as any;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.initDatabaseAsync(db);
      this.instance = db;
      return db;
    } catch (err: any) {
      if (!this.webFallback) {
        const memDb = new InMemorySQLiteDatabase();
        await this.initDatabaseAsync(memDb as any);
        this.webFallback = memDb;
      }
      return this.webFallback as any;
    }
  }

  /**
   * Initializes database pragmas, creates tables, and seeds initial business profile and sequences.
   */
  static async initDatabaseAsync(db: SQLite.SQLiteDatabase): Promise<void> {
    // 1. Enable WAL mode and Foreign Keys (native SQLite resilience)
    try {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
    } catch {
      // Non-fatal on web WASM fallback
    }

    // 3. Execute baseline DDL
    await db.execAsync(INITIAL_SCHEMA_SQL);

    // 3.1 Incremental migrations for existing databases
    const incrementalColumns = [
      'ALTER TABLE documents ADD COLUMN job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL;',
      'ALTER TABLE documents ADD COLUMN po_number TEXT;',
      'ALTER TABLE documents ADD COLUMN payment_terms_preset TEXT;',
      'ALTER TABLE documents ADD COLUMN shipping_address TEXT;',
      'ALTER TABLE documents ADD COLUMN payment_instructions TEXT;',
      'ALTER TABLE documents ADD COLUMN internal_notes TEXT;',
      'ALTER TABLE documents ADD COLUMN deposit_minor INTEGER NOT NULL DEFAULT 0;',
      'ALTER TABLE documents ADD COLUMN signature_uri TEXT;',
      'ALTER TABLE documents ADD COLUMN signature_date INTEGER;',
      'ALTER TABLE document_items ADD COLUMN item_notes TEXT;',
    ];

    for (const ddl of incrementalColumns) {
      try {
        await db.execAsync(ddl);
      } catch {
        // Ignored if column already exists or on web fallback
      }
    }

    // 4. Ensure at least one active default business profile exists
    await this.seedDefaultBusinessProfileAsync(db);
  }

  /**
   * Seeds an initial default business profile and numbering sequences if table is empty.
   */
  private static async seedDefaultBusinessProfileAsync(db: SQLite.SQLiteDatabase): Promise<void> {
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM business_profiles LIMIT 1;');

    if (!existing) {
      const now = Date.now();
      const defaultProfileId = 'default_business_profile';

      await db.withTransactionAsync(async () => {
        // Insert initial profile
        await db.runAsync(
          `INSERT INTO business_profiles (
            id, name, country, default_currency, default_document_locale, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [defaultProfileId, 'My Business', 'US', DEFAULT_CURRENCY, 'en-US', 1, now, now]
        );

        // Insert initial numbering sequences for invoice, estimate, and receipt
        for (const docType of ['invoice', 'estimate', 'receipt'] as const) {
          const cfg = DEFAULT_SEQUENCE_CONFIGS[docType];
          await db.runAsync(
            `INSERT INTO number_sequences (
              id, business_profile_id, doc_type, prefix, next_sequence_number, suffix, padding, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              `seq_${defaultProfileId}_${docType}`,
              defaultProfileId,
              docType,
              cfg.prefix,
              1,
              cfg.suffix,
              cfg.padding,
              now,
            ]
          );
        }
      });
    }
  }

  /**
   * Closes active database connection (used primarily during backup restoration).
   */
  static async closeDatabaseAsync(): Promise<void> {
    if (this.instance) {
      await this.instance.closeAsync();
      this.instance = null;
    }
  }
}
