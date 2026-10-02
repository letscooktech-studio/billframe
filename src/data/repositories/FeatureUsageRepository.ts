/**
 * FEATURE USAGE REPOSITORY
 * Tracks local execution frequency, recency, and dismissal signals
 * for deterministic on-device workspace prioritization.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { FeatureUsageRecord } from '../../domain/workspace/AdaptiveWorkspaceEngine';

export class FeatureUsageRepository {
  /**
   * Increments feature execution count and updates timestamp.
   */
  public static async recordUsageAsync(featureKey: string, businessId?: string): Promise<void> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO feature_usage (feature_key, use_count, last_used_at, dismiss_count, business_id)
         VALUES (?, 1, ?, 0, ?)
         ON CONFLICT(feature_key) DO UPDATE SET
           use_count = use_count + 1,
           last_used_at = excluded.last_used_at,
           business_id = COALESCE(excluded.business_id, business_id);`,
        [featureKey, now, businessId || null]
      );
    } catch {
      // Non-blocking telemetry
    }
  }

  /**
   * Increments dismissal count for recommended actions.
   */
  public static async recordDismissAsync(featureKey: string, businessId?: string): Promise<void> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const now = Date.now();

      await db.runAsync(
        `INSERT INTO feature_usage (feature_key, use_count, last_used_at, dismiss_count, business_id)
         VALUES (?, 0, ?, 1, ?)
         ON CONFLICT(feature_key) DO UPDATE SET
           dismiss_count = dismiss_count + 1,
           business_id = COALESCE(excluded.business_id, business_id);`,
        [featureKey, now, businessId || null]
      );
    } catch {
      // Non-blocking telemetry
    }
  }

  /**
   * Retrieves all feature usage records for the local business.
   */
  public static async getAllUsageAsync(businessId?: string): Promise<FeatureUsageRecord[]> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const rows = await db.getAllAsync<{
        feature_key: string;
        use_count: number;
        last_used_at: number;
        dismiss_count: number;
        business_id: string | null;
      }>(
        businessId
          ? 'SELECT feature_key, use_count, last_used_at, dismiss_count, business_id FROM feature_usage WHERE business_id = ? OR business_id IS NULL;'
          : 'SELECT feature_key, use_count, last_used_at, dismiss_count, business_id FROM feature_usage;',
        businessId ? [businessId] : []
      );

      return (rows || []).map((r) => ({
        featureKey: r.feature_key,
        useCount: r.use_count,
        lastUsedAt: r.last_used_at,
        dismissCount: r.dismiss_count,
        businessId: r.business_id || undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Resets all usage telemetry.
   */
  public static async resetUsageAsync(): Promise<void> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      await db.runAsync('DELETE FROM feature_usage;');
    } catch {
      // Ignore
    }
  }
}
