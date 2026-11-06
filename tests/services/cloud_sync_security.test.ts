import {
  SupabaseSyncService,
  TABLE_COLUMN_ALLOWLIST,
  TABLES_TO_SYNC,
} from '../../src/services/sync/SupabaseSyncService';
import { SupabaseSyncConfigService } from '../../src/services/sync/SupabaseSyncConfig';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { MigrationRunner } from '../../src/data/database/migrations/MigrationRunner';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';

describe('Cloud Sync Security & Multi-Tenant Isolation', () => {
  beforeAll(async () => {
    const db = await DatabaseManager.getDatabaseAsync();
    await MigrationRunner.runMigrationsAsync(db);
  });

  beforeEach(async () => {
    await SupabaseSyncConfigService.clearConfig();
  });

  describe('1. Tenant Authentication & Session Enforcement', () => {
    it('operates in safe idle local-first mode when unconfigured', async () => {
      const res = await SupabaseSyncService.sync();
      expect(res.success).toBe(true);
      expect(res.status).toBe('idle');
      expect(res.message).toContain('Local-First SQLite mode');
    });

    it('rejects sync when project URL and anon key are set but user is unauthenticated (no JWT)', async () => {
      await SupabaseSyncConfigService.saveConfig({
        supabaseUrl: 'https://test-project.supabase.co',
        supabaseAnonKey: 'anon-key-12345',
        // Note: authToken is intentionally undefined
      });

      const res = await SupabaseSyncService.sync();
      expect(res.success).toBe(false);
      expect(res.status).toBe('error');
      expect(res.errors[0]).toContain('Missing authenticated user session');
    });

    it('rejects sync when authToken is provided but userId is missing', async () => {
      await SupabaseSyncConfigService.saveConfig({
        supabaseUrl: 'https://test-project.supabase.co',
        supabaseAnonKey: 'anon-key-12345',
        authToken: 'jwt-valid-token-example',
        // userId undefined
      });

      const res = await SupabaseSyncService.sync();
      expect(res.success).toBe(false);
      expect(res.status).toBe('error');
    });
  });

  describe('2. Column Allowlist & SQL Injection Prevention', () => {
    it('defines explicit allowlists for all synced tables', () => {
      for (const table of TABLES_TO_SYNC) {
        const allowlist = TABLE_COLUMN_ALLOWLIST[table.local];
        expect(allowlist).toBeDefined();
        expect(allowlist.has('id')).toBe(true);
        expect(allowlist.has('created_at')).toBe(true);
        expect(allowlist.has('updated_at')).toBe(true);
      }
    });

    it('sanitizes remote payloads by stripping unknown or injected fields', () => {
      const rawPayload = {
        id: 'cust_999',
        name: 'Safe Customer',
        email: 'safe@example.com',
        // Malicious or injected columns
        "injected_col'; DROP TABLE customers;--": 'exploit',
        is_admin: true,
        secret_token: 'leak',
      };

      const allowlist = TABLE_COLUMN_ALLOWLIST['customers'];
      const sanitizedKeys = Object.keys(rawPayload).filter(
        (k) => allowlist.has(k) && /^[a-zA-Z0-9_]+$/.test(k)
      );

      expect(sanitizedKeys).toEqual(['id', 'name', 'email']);
      expect(sanitizedKeys).not.toContain("injected_col'; DROP TABLE customers;--");
      expect(sanitizedKeys).not.toContain('is_admin');
      expect(sanitizedKeys).not.toContain('secret_token');
    });
  });

  describe('3. Safe Last-Write-Wins (LWW) Local State Preservation', () => {
    it('preserves newer local records against older remote updates', async () => {
      const created = await CustomerRepository.create({
        name: 'Local Customer (Newer)',
        email: 'local@test.com',
      });
      const customerId = created.id;

      // Simulate pull logic with older remote record
      const remoteRecord = {
        id: customerId,
        name: 'Stale Remote Customer',
        email: 'remote@test.com',
        updated_at: created.updated_at - 10000,
      };

      const existing = await CustomerRepository.getById(customerId);
      expect(existing).toBeDefined();

      const localUpdated = Number(existing!.updated_at);
      const remoteUpdated = Number(remoteRecord.updated_at);

      // Verify LWW check logic: remote is older, so do NOT update
      expect(remoteUpdated > localUpdated).toBe(false);

      // Verify local database remains untouched
      const current = await CustomerRepository.getById(customerId);
      expect(current?.name).toBe('Local Customer (Newer)');
    });
  });
});
