/**
 * DATABASE MANAGER
 * Initializes SQLite with WAL mode, foreign keys enforcement, and runs baseline schema DDL.
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { INITIAL_SCHEMA_SQL } from './schema';
import { DEFAULT_CURRENCY } from '../../domain/money/Currencies';
import { DEFAULT_SEQUENCE_CONFIGS } from '../../domain/numbering/SequenceEngine';

import { InMemorySQLiteDatabase } from './InMemoryDatabase';

import { MigrationRunner } from './migrations/MigrationRunner';

export const DB_NAME = 'billframe.db';

export class DatabaseManager {
  private static instance: SQLite.SQLiteDatabase | null = null;
  private static initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private static webFallback: InMemorySQLiteDatabase | null = null;

  /**
   * Returns a singleton SQLite database connection.
   * Concurrency-safe: shares a single initialization promise across all concurrent callers.
   */
  static async getDatabaseAsync(): Promise<SQLite.SQLiteDatabase> {
    if (this.instance) {
      return this.instance;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const isWeb = Platform.OS === 'web';
      if (isWeb) {
        if (!this.webFallback) {
          const memDb = new InMemorySQLiteDatabase();
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              const saved = window.localStorage.getItem('billframe_web_db_state');
              if (saved) {
                const parsed = JSON.parse(saved);
                memDb.state = { ...memDb.state, ...parsed };
              }
            } catch {}
          }
          await this.initDatabaseAsync(memDb as any);
          this.webFallback = memDb;

          if (typeof window !== 'undefined' && window.localStorage && typeof setInterval !== 'undefined') {
            setInterval(() => {
              try {
                if (DatabaseManager.webFallback) {
                  window.localStorage.setItem('billframe_web_db_state', JSON.stringify(DatabaseManager.webFallback.state));
                }
              } catch {}
            }, 1000);
          }
        }
        return this.webFallback as any;
      }

      try {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await this.initDatabaseAsync(db);
        this.instance = db;
        return db;
      } catch (err: any) {
        console.error('[DatabaseManager] Critical SQLite initialization failure:', err);
        this.initPromise = null;
        if (Platform.OS === 'web') {
          if (!this.webFallback) {
            const memDb = new InMemorySQLiteDatabase();
            await this.initDatabaseAsync(memDb as any);
            this.webFallback = memDb;
          }
          return this.webFallback as any;
        }
        throw new Error(`Failed to initialize persistent SQLite database (${DB_NAME}): ${err?.message || String(err)}`);
      }
    })();

    return this.initPromise;
  }

  /**
   * Initializes database pragmas, creates tables, and runs sequential versioned migrations.
   */
  static async initDatabaseAsync(db: SQLite.SQLiteDatabase): Promise<void> {
    // 1. Enable WAL mode and Foreign Keys (native SQLite resilience)
    try {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
    } catch {
      // Non-fatal on web WASM fallback
    }

    // 2. Execute sequential, checksum-verified, atomic migrations
    await MigrationRunner.runMigrationsAsync(db);

    // 3. Ensure at least one active default business profile exists and has all sequences
    await this.seedDefaultBusinessProfileAsync(db);
  }

  /**
   * Seeds an initial default business profile and numbering sequences if table is empty.
   */
  private static async seedDefaultBusinessProfileAsync(db: SQLite.SQLiteDatabase): Promise<void> {
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM business_profiles LIMIT 1;');
    const now = Date.now();
    const defaultProfileId = existing?.id || 'default_business_profile';

    if (!existing) {
      const inTx = typeof (db as any).isInTransactionSync === 'function' ? (db as any).isInTransactionSync() : false;
      const seedAction = async () => {
        // Insert initial profile
        await db.runAsync(
          `INSERT INTO business_profiles (
            id, name, country, default_currency, default_document_locale, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [defaultProfileId, 'My Business', 'US', DEFAULT_CURRENCY, 'en-US', 1, now, now]
        );

        // Insert initial numbering sequences
        for (const [docType, cfg] of Object.entries(DEFAULT_SEQUENCE_CONFIGS)) {
          await db.runAsync(
            `INSERT OR IGNORE INTO number_sequences (
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
      };

      if (inTx) {
        await seedAction();
      } else {
        try {
          await db.withTransactionAsync(seedAction);
        } catch (txErr: any) {
          const msg = String(txErr?.message || '').toLowerCase();
          if (msg.includes('cannot start a transaction') || msg.includes('within a transaction')) {
            await seedAction();
          } else {
            throw txErr;
          }
        }
      }
    } else {
      // Ensure any newly added doc_types have sequence records
      for (const [docType, cfg] of Object.entries(DEFAULT_SEQUENCE_CONFIGS)) {
        await db.runAsync(
          `INSERT OR IGNORE INTO number_sequences (
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
    }
  }

  /**
   * Closes active database connection (used primarily during backup restoration).
   */
  static async closeDatabaseAsync(): Promise<void> {
    this.initPromise = null;
    if (this.instance) {
      await this.instance.closeAsync();
      this.instance = null;
    }
    this.webFallback = null;
  }
}
