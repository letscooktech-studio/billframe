/**
 * CLOUD SYNC TYPES — BILLFRAME
 * Defines configuration, delta payloads, and sync lifecycle results.
 */

export type SyncStatusState = 'idle' | 'syncing' | 'success' | 'error';

export interface CloudSyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  authToken?: string; // Authenticated user session JWT (never use public anon key as bearer token)
  userId?: string;
  autoSync: boolean;
  lastSyncedAt?: number;
}

export interface SyncResult {
  success: boolean;
  status: SyncStatusState;
  pushedCount: number;
  pulledCount: number;
  conflictsResolved: number;
  syncedAt: number;
  errors: string[];
  message: string;
}

export interface CloudDeltaPayload {
  table: string;
  records: Record<string, any>[];
  deletedIds: string[];
}
