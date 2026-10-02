/**
 * MIGRATION ENGINE TYPE DEFINITIONS
 * Enforces sequential versions, checksum verification, atomic transactions, and rollback safety.
 */

import * as SQLite from 'expo-sqlite';

export interface Migration {
  /** Unique sequential positive integer version (1, 2, 3...) */
  readonly version: number;
  /** Human-readable descriptive name */
  readonly name: string;
  /** SHA-256 integrity checksum of the migration definition */
  readonly checksum: string;
  /** Forward migration execution */
  readonly up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

export interface MigrationHistoryRecord {
  version: number;
  name: string;
  checksum: string;
  applied_at: number;
}
