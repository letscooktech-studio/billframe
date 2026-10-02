/**
 * AUDIT EVENT REPOSITORY
 * Immutable append-only audit trail for financial transactions, document lifecycle
 * state changes, and compliance events.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';

export interface AuditEventRecord {
  id: string;
  business_profile_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  payload_json: string | null;
  created_at: number;
}

export class AuditEventRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Appends an immutable audit event to the ledger.
   */
  static async logEvent(event: {
    businessProfileId?: string;
    entityType: string;
    entityId: string;
    action: string;
    actor?: string;
    payload?: any;
  }): Promise<void> {
    try {
      const db = await this.getDb();
      let profileId = event.businessProfileId;

      if (!profileId) {
        const profile = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM business_profiles WHERE is_active = 1 LIMIT 1;'
        );
        profileId = profile?.id || 'default_business_profile';
      }

      const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();
      const payloadJson = event.payload ? JSON.stringify(event.payload) : null;

      await db.runAsync(
        `INSERT INTO audit_events (
          id, business_profile_id, entity_type, entity_id, action, actor, payload_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          profileId,
          event.entityType,
          event.entityId,
          event.action,
          event.actor || 'user',
          payloadJson,
          now,
        ]
      );
    } catch {
      // Audit logging should never crash the primary operation if an error occurs
    }
  }

  /**
   * Retrieves all audit events for a specific entity in chronological order.
   */
  static async getEventsForEntity(entityType: string, entityId: string): Promise<AuditEventRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<AuditEventRecord>(
      'SELECT * FROM audit_events WHERE entity_type = ? AND entity_id = ? ORDER BY created_at ASC;',
      [entityType, entityId]
    );
  }

  /**
   * Lists the most recent audit events across all entities.
   */
  static async listRecentEvents(limit: number = 50): Promise<AuditEventRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<AuditEventRecord>(
      'SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?;',
      [limit]
    );
  }
}
