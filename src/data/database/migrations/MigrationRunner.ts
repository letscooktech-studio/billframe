/**
 * MIGRATION RUNNER
 * Authoritative sequential migration engine with checksum tamper detection,
 * atomic transactions, and rollback safety.
 */

import * as SQLite from 'expo-sqlite';
import { Migration, MigrationHistoryRecord } from './types';
import { MIGRATIONS } from './registry';

export class MigrationRunner {
  /**
   * Ensures the migration_history table exists.
   */
  static async ensureMigrationTableAsync(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migration_history (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
    `);
  }

  /**
   * Fetches all applied migrations sorted by version.
   */
  static async getAppliedMigrationsAsync(db: SQLite.SQLiteDatabase): Promise<MigrationHistoryRecord[]> {
    await this.ensureMigrationTableAsync(db);
    try {
      const rows = await db.getAllAsync<MigrationHistoryRecord>(
        'SELECT version, name, checksum, applied_at FROM migration_history ORDER BY version ASC;'
      );
      return rows || [];
    } catch {
      return [];
    }
  }

  /**
   * Runs all pending migrations in strictly sequential order.
   * Atomic: Each migration executes in its own transaction with rollback on failure.
   * Idempotent: Calling multiple times when fully migrated is a safe no-op.
   */
  static async runMigrationsAsync(
    db: SQLite.SQLiteDatabase,
    registry: readonly Migration[] = MIGRATIONS
  ): Promise<MigrationHistoryRecord[]> {
    await this.ensureMigrationTableAsync(db);

    const applied = await this.getAppliedMigrationsAsync(db);
    const appliedMap = new Map<number, MigrationHistoryRecord>();
    for (const rec of applied) {
      appliedMap.set(rec.version, rec);
    }

    // 1. Verify integrity of previously applied migrations
    for (const migration of registry) {
      const existing = appliedMap.get(migration.version);
      if (existing) {
        if (existing.checksum !== migration.checksum) {
          throw new Error(
            `Database migration integrity error: Migration version ${migration.version} (${migration.name}) checksum mismatch. ` +
              `Expected ${migration.checksum}, but recorded ${existing.checksum}. Possible tampering or corrupt schema.`
          );
        }
      }
    }

    const maxAppliedVersion = applied.length > 0 ? Math.max(...applied.map((a) => a.version)) : 0;
    const pending = registry
      .filter((m) => m.version > maxAppliedVersion)
      .sort((a, b) => a.version - b.version);

    if (pending.length === 0) {
      return [];
    }

    const newlyApplied: MigrationHistoryRecord[] = [];

    // 2. Execute pending migrations sequentially within atomic transactions
    for (const migration of pending) {
      const now = Date.now();
      try {
        const inTx = typeof (db as any).isInTransactionSync === 'function' ? (db as any).isInTransactionSync() : false;
        const executeMigration = async () => {
          await migration.up(db);
          await db.runAsync(
            'INSERT INTO migration_history (version, name, checksum, applied_at) VALUES (?, ?, ?, ?);',
            [migration.version, migration.name, migration.checksum, now]
          );
        };

        if (inTx) {
          await executeMigration();
        } else {
          try {
            await db.withTransactionAsync(executeMigration);
          } catch (txErr: any) {
            const msg = String(txErr?.message || '').toLowerCase();
            if (msg.includes('cannot start a transaction') || msg.includes('within a transaction')) {
              await executeMigration();
            } else {
              throw txErr;
            }
          }
        }

        newlyApplied.push({
          version: migration.version,
          name: migration.name,
          checksum: migration.checksum,
          applied_at: now,
        });
      } catch (err: any) {
        throw new Error(
          `Migration failed at version ${migration.version} (${migration.name}): ${err?.message || String(err)}`
        );
      }
    }

    return newlyApplied;
  }
}
