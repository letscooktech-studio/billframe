/**
 * SUPABASE CLOUD SYNC SERVICE — BILLFRAME
 * Local-First, Bidirectional Delta Synchronization.
 * 
 * Key Principles:
 * 1. 100% Local-First: Local SQLite is always the instant source of truth.
 * 2. Zero-Locking Offline Mode: If offline or unconfigured, the app works seamlessly with 0 errors.
 * 3. Strict Tenant Isolation: Requires valid authenticated user session JWT (no anon-key bearer tokens).
 * 4. SQL Injection & Schema Defense: Strictly allowlists columns prior to local SQLite persistence.
 * 5. Safe LWW Upsert: Uses timestamp-based updates rather than destructive INSERT OR REPLACE (preserves foreign keys).
 * 6. Native REST (Zero heavy SDK dependencies).
 */

import { DatabaseManager } from '../../data/database/DatabaseManager';
import { SupabaseSyncConfigService } from './SupabaseSyncConfig';
import { SyncResult } from './types';

export const TABLES_TO_SYNC = [
  { local: 'business_profiles', cloud: 'cloud_business_profiles', pk: 'id' },
  { local: 'customers', cloud: 'cloud_customers', pk: 'id' },
  { local: 'catalog_items', cloud: 'cloud_catalog_items', pk: 'id' },
  { local: 'documents', cloud: 'cloud_documents', pk: 'id' },
  { local: 'document_items', cloud: 'cloud_document_items', pk: 'id' },
  { local: 'payments', cloud: 'cloud_payments', pk: 'id' },
  { local: 'universal_documents', cloud: 'cloud_universal_documents', pk: 'id' },
];

/**
 * Strict Column Allowlist per Table
 * Rejects any arbitrary column names from network payloads to prevent SQL injection or schema disruption.
 */
export const TABLE_COLUMN_ALLOWLIST: Record<string, Set<string>> = {
  business_profiles: new Set([
    'id', 'name', 'legal_name', 'email', 'phone', 'address_street', 'address_city',
    'address_state', 'address_postal_code', 'address_country', 'tax_id', 'currency',
    'logo_uri', 'signature_uri', 'invoice_prefix', 'next_invoice_number',
    'terms_and_conditions', 'bank_account_details', 'created_at', 'updated_at'
  ]),
  customers: new Set([
    'id', 'business_id', 'name', 'email', 'phone', 'address_street', 'address_city',
    'address_state', 'address_postal_code', 'address_country', 'tax_id', 'created_at', 'updated_at'
  ]),
  catalog_items: new Set([
    'id', 'business_id', 'name', 'description', 'unit_price_minor', 'currency',
    'tax_rate_basis_points', 'hsn_sac_code', 'sku', 'unit', 'created_at', 'updated_at'
  ]),
  documents: new Set([
    'id', 'business_id', 'customer_id', 'doc_type', 'document_number', 'issue_date',
    'due_date', 'status', 'currency', 'subtotal_minor', 'tax_total_minor',
    'discount_total_minor', 'grand_total_minor', 'balance_due_minor', 'notes',
    'terms', 'payment_details', 'created_at', 'updated_at'
  ]),
  document_items: new Set([
    'id', 'document_id', 'item_id', 'name', 'description', 'quantity',
    'unit_price_minor', 'tax_rate_basis_points', 'tax_amount_minor',
    'total_amount_minor', 'created_at', 'updated_at'
  ]),
  payments: new Set([
    'id', 'document_id', 'amount_minor', 'currency', 'payment_method',
    'payment_date', 'reference_number', 'notes', 'created_at', 'updated_at'
  ]),
  universal_documents: new Set([
    'id', 'business_id', 'doc_type', 'document_title', 'document_number',
    'party_role', 'party_name', 'counterparty_json', 'items_json', 'totals_json',
    'metadata_json', 'status', 'created_at', 'updated_at'
  ]),
};

export class SupabaseSyncService {
  /**
   * Executes a full bidirectional delta-sync cycle between local SQLite and Supabase
   */
  static async sync(): Promise<SyncResult> {
    const config = await SupabaseSyncConfigService.getConfig();

    // 1. If cloud sync is not configured, operate seamlessly in local-first mode
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return {
        success: true,
        status: 'idle',
        pushedCount: 0,
        pulledCount: 0,
        conflictsResolved: 0,
        syncedAt: Date.now(),
        errors: [],
        message: 'Cloud Sync is inactive. Local-First SQLite mode is operating normally.',
      };
    }

    // 2. Strict tenant authentication: require authenticated user JWT and user ID
    // Disallows anonymous key fallback as bearer token or hardcoded mock user IDs
    if (!config.authToken || !config.userId) {
      return {
        success: false,
        status: 'error',
        pushedCount: 0,
        pulledCount: 0,
        conflictsResolved: 0,
        syncedAt: Date.now(),
        errors: ['Missing authenticated user session (JWT). Anonymous sync is disallowed for tenant isolation.'],
        message: 'Authentication required for cloud synchronization. Please log in with an authenticated account.',
      };
    }

    const cleanUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
    const apiKey = config.supabaseAnonKey.trim();
    const bearerToken = config.authToken.trim();
    const userId = config.userId.trim();

    const errors: string[] = [];
    let pushedCount = 0;
    let pulledCount = 0;
    let conflictsResolved = 0;
    const now = Date.now();

    try {
      const db = await DatabaseManager.getDatabaseAsync();

      // ── PHASE 1: PUSH LOCAL RECORDS TO CLOUD ──
      for (const mapping of TABLES_TO_SYNC) {
        try {
          const localRows: any[] = await db.getAllAsync(`SELECT * FROM ${mapping.local};`);

          if (localRows && localRows.length > 0) {
            const cloudPayload = localRows.map((row) => ({
              id: String(row[mapping.pk] || row.id),
              user_id: userId,
              data: row,
              client_updated_at: row.updated_at ? Number(row.updated_at) : now,
              is_deleted: false,
              device_id: 'client_local',
            }));

            // Chunk in batches of 50
            const chunkSize = 50;
            for (let i = 0; i < cloudPayload.length; i += chunkSize) {
              const chunk = cloudPayload.slice(i, i + chunkSize);

              const response = await fetch(`${cleanUrl}/rest/v1/${mapping.cloud}?on_conflict=user_id,id`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: apiKey,
                  Authorization: `Bearer ${bearerToken}`,
                  Prefer: 'resolution=merge-duplicates,return=minimal',
                },
                body: JSON.stringify(chunk),
              });

              if (response.ok || response.status === 201 || response.status === 204) {
                pushedCount += chunk.length;
              } else {
                const text = await response.text();
                errors.push(`Push failed for ${mapping.cloud} (HTTP ${response.status}): ${text.slice(0, 100)}`);
              }
            }
          }
        } catch (tableErr: any) {
          if (!tableErr.message?.includes('no such table')) {
            errors.push(`Table ${mapping.local} push error: ${tableErr.message}`);
          }
        }
      }

      // ── PHASE 2: PULL REMOTE RECORDS FROM CLOUD ──
      for (const mapping of TABLES_TO_SYNC) {
        try {
          let url = `${cleanUrl}/rest/v1/${mapping.cloud}?user_id=eq.${encodeURIComponent(userId)}&select=*`;
          if (config.lastSyncedAt) {
            const iso = new Date(config.lastSyncedAt).toISOString();
            url += `&server_updated_at=gt.${encodeURIComponent(iso)}`;
          }

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${bearerToken}`,
            },
          });

          if (response.ok) {
            const remoteRows: any[] = await response.json();
            const allowedCols = TABLE_COLUMN_ALLOWLIST[mapping.local];

            if (Array.isArray(remoteRows) && remoteRows.length > 0 && allowedCols) {
              for (const remote of remoteRows) {
                if (remote.data && typeof remote.data === 'object') {
                  const dataObj = remote.data;
                  // Filter strictly allowlisted columns passing identifier regex
                  const validKeys = Object.keys(dataObj).filter(
                    (k) => allowedCols.has(k) && /^[a-zA-Z0-9_]+$/.test(k)
                  );

                  if (validKeys.length > 0 && validKeys.includes(mapping.pk)) {
                    const pkVal = dataObj[mapping.pk];
                    const remoteUpdatedAt = Number(dataObj.updated_at || remote.client_updated_at || 0);

                    // Check existing local row to prevent destructive overwrite and foreign key deletion
                    const existingRow: any = await db.getFirstAsync(
                      `SELECT ${mapping.pk}, updated_at FROM ${mapping.local} WHERE ${mapping.pk} = ?;`,
                      [pkVal]
                    );

                    if (existingRow) {
                      const localUpdatedAt = Number(existingRow.updated_at || 0);
                      // Last-Write-Wins: update only if remote timestamp is strictly newer
                      if (remoteUpdatedAt > localUpdatedAt) {
                        const updateCols = validKeys.filter((k) => k !== mapping.pk);
                        if (updateCols.length > 0) {
                          const setClause = updateCols.map((c) => `${c} = ?`).join(', ');
                          const updateValues = [...updateCols.map((c) => dataObj[c]), pkVal];
                          await db.runAsync(
                            `UPDATE ${mapping.local} SET ${setClause} WHERE ${mapping.pk} = ?;`,
                            updateValues
                          );
                          pulledCount++;
                          conflictsResolved++;
                        }
                      }
                    } else {
                      // Safe new record insertion
                      const placeholders = validKeys.map(() => '?').join(', ');
                      const insertValues = validKeys.map((k) => dataObj[k]);
                      await db.runAsync(
                        `INSERT INTO ${mapping.local} (${validKeys.join(', ')}) VALUES (${placeholders});`,
                        insertValues
                      );
                      pulledCount++;
                    }
                  }
                }
              }
            }
          } else {
            const text = await response.text();
            errors.push(`Pull failed for ${mapping.cloud} (HTTP ${response.status}): ${text.slice(0, 100)}`);
          }
        } catch (pullErr: any) {
          errors.push(`Table ${mapping.cloud} pull error: ${pullErr.message}`);
        }
      }

      // Update last synced timestamp
      await SupabaseSyncConfigService.saveConfig({ lastSyncedAt: now });

      return {
        success: errors.length === 0,
        status: errors.length === 0 ? 'success' : 'error',
        pushedCount,
        pulledCount,
        conflictsResolved,
        syncedAt: now,
        errors,
        message:
          errors.length === 0
            ? `Sync completed. ${pushedCount} pushed, ${pulledCount} pulled.`
            : `Sync completed with ${errors.length} notice(s).`,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        pushedCount,
        pulledCount,
        conflictsResolved,
        syncedAt: now,
        errors: [err.message || 'Unknown network error'],
        message: `Sync failed: ${err.message || 'Network unreachable'}`,
      };
    }
  }
}
