/**
 * SETTINGS REPOSITORY
 * Key-value persistent store backed by the SQLite settings table.
 */

import { DatabaseManager } from '../database/DatabaseManager';

export interface SettingRow {
  key: string;
  value: string;
  updated_at: number;
}

export class SettingsRepository {
  /**
   * Retrieves a setting value by key, or returns the provided default.
   */
  public static async get(key: string, defaultValue: string | null = null): Promise<string | null> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const row = await db.getFirstAsync<SettingRow>(
        'SELECT key, value, updated_at FROM settings WHERE key = ? LIMIT 1;',
        [key]
      );
      return row ? row.value : defaultValue;
    } catch (error) {
      console.warn(`[SettingsRepository] Failed to read key '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Sets or replaces a setting value.
   */
  public static async set(key: string, value: string): Promise<void> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at;`,
        [key, value, now]
      );
    } catch (error) {
      console.error(`[SettingsRepository] Failed to set key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Deletes a setting key.
   */
  public static async delete(key: string): Promise<void> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      await db.runAsync('DELETE FROM settings WHERE key = ?;', [key]);
    } catch (error) {
      console.error(`[SettingsRepository] Failed to delete key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Lists all stored settings as a key-value record.
   */
  public static async listAll(): Promise<Record<string, string>> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const rows = await db.getAllAsync<SettingRow>('SELECT key, value, updated_at FROM settings;');
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return result;
    } catch (error) {
      console.warn('[SettingsRepository] Failed to list settings:', error);
      return {};
    }
  }
}
