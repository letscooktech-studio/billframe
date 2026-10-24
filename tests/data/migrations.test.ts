/**
 * DATABASE MIGRATIONS ENGINE TEST SUITE
 * Verifies sequential versioning, fresh install execution, incremental upgrade paths,
 * idempotency, tamper detection, and atomic rollback on failure.
 */

import { MigrationRunner } from '../../src/data/database/migrations/MigrationRunner';
import { MIGRATIONS } from '../../src/data/database/migrations/registry';
import { Migration } from '../../src/data/database/migrations/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Database Migrations Engine Tests', () => {
  let mockDb: ReturnType<typeof getMockDb>;

  beforeEach(() => {
    mockDb = getMockDb();
    mockDb.reset();
  });

  it('runs all sequential migrations on a fresh install', async () => {
    const newlyApplied = await MigrationRunner.runMigrationsAsync(mockDb as any);

    expect(newlyApplied.length).toBe(13);
    expect(newlyApplied[0].version).toBe(1);
    expect(newlyApplied[0].name).toBe('v1_baseline_tables');
    expect(newlyApplied[1].version).toBe(2);
    expect(newlyApplied[1].name).toBe('v2_document_expansion_and_audit');
    expect(newlyApplied[2].version).toBe(3);
    expect(newlyApplied[2].name).toBe('v3_expand_payments_forward_compatible');
    expect(newlyApplied[3].version).toBe(4);
    expect(newlyApplied[3].name).toBe('v4_workspace_preferences_and_feature_usage');
    expect(newlyApplied[4].version).toBe(5);
    expect(newlyApplied[4].name).toBe('v5_geography_and_onboarding_lifecycle');
    expect(newlyApplied[5].version).toBe(6);
    expect(newlyApplied[5].name).toBe('v6_tax_engine_and_country_packs');
    expect(newlyApplied[6].version).toBe(7);
    expect(newlyApplied[6].name).toBe('v7_upi_and_payment_connections');
    expect(newlyApplied[7].version).toBe(8);
    expect(newlyApplied[7].name).toBe('v8_sanitize_provider_connections_and_financial_entities');
    expect(newlyApplied[8].version).toBe(9);
    expect(newlyApplied[8].name).toBe('v9_document_studio_templates_and_custom_blocks');
    expect(newlyApplied[9].version).toBe(10);
    expect(newlyApplied[9].name).toBe('v10_universal_document_engine');
    expect(newlyApplied[10].version).toBe(11);
    expect(newlyApplied[10].name).toBe('v11_brand_kit_and_org_identity');
    expect(newlyApplied[11].version).toBe(12);
    expect(newlyApplied[11].name).toBe('v12_onboarding_v3_preferences');
    expect(newlyApplied[12].version).toBe(13);
    expect(newlyApplied[12].name).toBe('v13_ai_agent_and_task_ledger');

    const history = await MigrationRunner.getAppliedMigrationsAsync(mockDb as any);
    expect(history.length).toBe(13);
    expect(history[0].version).toBe(1);
    expect(history[1].version).toBe(2);
    expect(history[2].version).toBe(3);
    expect(history[3].version).toBe(4);
    expect(history[4].version).toBe(5);
    expect(history[5].version).toBe(6);
    expect(history[6].version).toBe(7);
    expect(history[7].version).toBe(8);
    expect(history[8].version).toBe(9);
    expect(history[9].version).toBe(10);
    expect(history[10].version).toBe(11);
    expect(history[11].version).toBe(12);
    expect(history[12].version).toBe(13);
  });

  it('is completely idempotent when run multiple times', async () => {
    // First run
    await MigrationRunner.runMigrationsAsync(mockDb as any);
    const initialHistory = await MigrationRunner.getAppliedMigrationsAsync(mockDb as any);

    // Second run
    const secondApplied = await MigrationRunner.runMigrationsAsync(mockDb as any);
    const postHistory = await MigrationRunner.getAppliedMigrationsAsync(mockDb as any);

    expect(secondApplied.length).toBe(0);
    expect(postHistory.length).toBe(initialHistory.length);
  });

  it('upgrades an existing database with previous versions already applied', async () => {
    // Simulate an existing database where version 1 and 2 were previously applied
    mockDb.state.migration_history.push(
      {
        version: 1,
        name: 'v1_baseline_tables',
        checksum: MIGRATIONS[0].checksum,
        applied_at: Date.now() - 100000,
      },
      {
        version: 2,
        name: 'v2_document_expansion_and_audit',
        checksum: MIGRATIONS[1].checksum,
        applied_at: Date.now() - 50000,
      }
    );

    // Also populate some existing customer and invoice records
    mockDb.state.customers.push({
      id: 'cust_pre',
      name: 'Pre-existing Client',
      is_archived: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    mockDb.state.documents.push({
      id: 'inv_pre',
      business_profile_id: 'biz_default',
      doc_type: 'invoice',
      document_number: 'INV-0001',
      total_minor: 15000,
      deposit_minor: 0,
      lifecycle_status: 'issued',
      is_archived: 0,
      issue_date: Date.now(),
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Run migration runner
    const newlyApplied = await MigrationRunner.runMigrationsAsync(mockDb as any);

    // Versions 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, and 13 should be applied
    expect(newlyApplied.length).toBe(11);
    expect(newlyApplied[0].version).toBe(3);
    expect(newlyApplied[0].name).toBe('v3_expand_payments_forward_compatible');
    expect(newlyApplied[1].version).toBe(4);
    expect(newlyApplied[1].name).toBe('v4_workspace_preferences_and_feature_usage');
    expect(newlyApplied[2].version).toBe(5);
    expect(newlyApplied[2].name).toBe('v5_geography_and_onboarding_lifecycle');
    expect(newlyApplied[3].version).toBe(6);
    expect(newlyApplied[3].name).toBe('v6_tax_engine_and_country_packs');
    expect(newlyApplied[4].version).toBe(7);
    expect(newlyApplied[4].name).toBe('v7_upi_and_payment_connections');
    expect(newlyApplied[5].version).toBe(8);
    expect(newlyApplied[5].name).toBe('v8_sanitize_provider_connections_and_financial_entities');
    expect(newlyApplied[6].version).toBe(9);
    expect(newlyApplied[6].name).toBe('v9_document_studio_templates_and_custom_blocks');
    expect(newlyApplied[7].version).toBe(10);
    expect(newlyApplied[7].name).toBe('v10_universal_document_engine');
    expect(newlyApplied[8].version).toBe(11);
    expect(newlyApplied[8].name).toBe('v11_brand_kit_and_org_identity');
    expect(newlyApplied[9].version).toBe(12);
    expect(newlyApplied[9].name).toBe('v12_onboarding_v3_preferences');
    expect(newlyApplied[10].version).toBe(13);
    expect(newlyApplied[10].name).toBe('v13_ai_agent_and_task_ledger');

    // Existing customer and invoice records must be completely intact
    expect(mockDb.state.customers.find((c) => c.id === 'cust_pre')).toBeDefined();
    expect(mockDb.state.documents.find((d) => d.id === 'inv_pre')).toBeDefined();
  });

  it('detects tamper/corruption when an applied migration checksum does not match', async () => {
    // Record version 1 with a corrupted/altered checksum
    mockDb.state.migration_history.push({
      version: 1,
      name: 'v1_baseline_tables',
      checksum: 'tampered_or_invalid_checksum_hash',
      applied_at: Date.now() - 100000,
    });

    await expect(MigrationRunner.runMigrationsAsync(mockDb as any)).rejects.toThrow(
      /Database migration integrity error: Migration version 1/
    );
  });

  it('rolls back transaction atomically if a migration fails during execution', async () => {
    // Apply baseline migration 1
    await MigrationRunner.runMigrationsAsync(mockDb as any, [MIGRATIONS[0]]);

    const historyBefore = await MigrationRunner.getAppliedMigrationsAsync(mockDb as any);
    expect(historyBefore.length).toBe(1);

    // Define a failing migration
    const failingMigration: Migration = {
      version: 2,
      name: 'v2_failing_migration',
      checksum: 'checksum_fail_test',
      up: async () => {
        throw new Error('Simulated disk/SQL error during migration DDL');
      },
    };

    const customRegistry: Migration[] = [MIGRATIONS[0], failingMigration];

    await expect(
      MigrationRunner.runMigrationsAsync(mockDb as any, customRegistry)
    ).rejects.toThrow(/Migration failed at version 2/);

    // Verify atomic rollback: version 2 was NOT recorded in migration_history
    const historyAfter = await MigrationRunner.getAppliedMigrationsAsync(mockDb as any);
    expect(historyAfter.length).toBe(1);
    expect(historyAfter[0].version).toBe(1);
  });

  it('safely handles migration execution when an active transaction is already open', async () => {
    // Simulate isInTransactionSync returning true
    (mockDb as any).isInTransactionSync = () => true;

    const newlyApplied = await MigrationRunner.runMigrationsAsync(mockDb as any, [MIGRATIONS[0]]);
    expect(newlyApplied.length).toBe(1);
    expect(newlyApplied[0].version).toBe(1);

    const history = await MigrationRunner.getAppliedMigrationsAsync(mockDb as any);
    expect(history.length).toBe(1);
  });

  it('safely recovers if withTransactionAsync throws nested transaction error', async () => {
    // Simulate withTransactionAsync throwing native SQLite nested transaction error
    mockDb.withTransactionAsync = async () => {
      throw new Error("Call to function 'NativeDatabase.execAsync' has been rejected. Caused by: cannot start a transaction within a transaction");
    };

    const newlyApplied = await MigrationRunner.runMigrationsAsync(mockDb as any, [MIGRATIONS[0]]);
    expect(newlyApplied.length).toBe(1);
    expect(newlyApplied[0].version).toBe(1);
  });
});
