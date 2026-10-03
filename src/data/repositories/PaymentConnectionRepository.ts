/**
 * PAYMENT PROVIDER CONNECTION REPOSITORY
 * Manages configuration and credentials for integrated online payment gateways (Razorpay, Stripe, etc.)
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { PaymentGatewayId } from '../../domain/payments/providers/PaymentProviderTypes';
import { AuditEventRepository } from './AuditEventRepository';

export type PaymentConnectionStatus =
  | 'not_configured'
  | 'sandbox'
  | 'partner_approval_required'
  | 'production_available'
  | 'connected'
  | 'suspended';

export interface PaymentProviderConnectionRecord {
  id: string;
  business_profile_id: string;
  provider: PaymentGatewayId;
  status: PaymentConnectionStatus;
  merchant_account_reference: string | null;
  is_active: number; // 0 or 1
  is_testnet: number; // 0 or 1
  key_id?: string | null;
  capabilities_json?: string | null;
  last_synced_at?: number | null;
  metadata_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface UpsertConnectionInput {
  businessProfileId: string;
  provider: PaymentGatewayId;
  status?: PaymentConnectionStatus;
  merchantAccountReference?: string | null;
  keyId?: string | null;
  isActive?: boolean;
  isTestnet?: boolean;
  capabilities?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export class PaymentConnectionRepository {
  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Retrieves connection config for a specific provider and business profile.
   */
  static async getConnection(
    businessProfileId: string,
    provider: PaymentGatewayId
  ): Promise<PaymentProviderConnectionRecord | null> {
    const db = await this.getDb();
    return db.getFirstAsync<PaymentProviderConnectionRecord>(
      'SELECT * FROM payment_provider_connections WHERE business_profile_id = ? AND provider = ?;',
      [businessProfileId, provider]
    );
  }

  /**
   * Retrieves all registered gateway connections for a business profile.
   */
  static async getAllConnections(
    businessProfileId: string
  ): Promise<PaymentProviderConnectionRecord[]> {
    const db = await this.getDb();
    return db.getAllAsync<PaymentProviderConnectionRecord>(
      'SELECT * FROM payment_provider_connections WHERE business_profile_id = ? ORDER BY created_at ASC;',
      [businessProfileId]
    );
  }

  /**
   * Upserts a payment provider connection atomically without client-side secrets.
   */
  static async upsertConnection(
    input: UpsertConnectionInput
  ): Promise<PaymentProviderConnectionRecord> {
    const db = await this.getDb();
    const now = Date.now();
    const id = `conn_${input.businessProfileId}_${input.provider}`;
    const isActive = input.isActive !== undefined ? (input.isActive ? 1 : 0) : 1;
    const isTestnet = input.isTestnet !== undefined ? (input.isTestnet ? 1 : 0) : 1;
    const status = input.status || (isTestnet ? 'sandbox' : 'partner_approval_required');
    const keyId = input.keyId ? input.keyId.trim() : null;
    const merchantRef = input.merchantAccountReference ? input.merchantAccountReference.trim() : null;
    const capabilitiesJson = input.capabilities ? JSON.stringify(input.capabilities) : null;
    const metaJson = input.metadata ? JSON.stringify(input.metadata) : null;

    await db.runAsync(
      `INSERT INTO payment_provider_connections (
        id, business_profile_id, provider, status, merchant_account_reference, is_active, is_testnet, key_id, capabilities_json, last_synced_at, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(business_profile_id, provider) DO UPDATE SET
        status = excluded.status,
        merchant_account_reference = excluded.merchant_account_reference,
        is_active = excluded.is_active,
        is_testnet = excluded.is_testnet,
        key_id = excluded.key_id,
        capabilities_json = excluded.capabilities_json,
        last_synced_at = excluded.last_synced_at,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at;`,
      [
        id,
        input.businessProfileId,
        input.provider,
        status,
        merchantRef,
        isActive,
        isTestnet,
        keyId,
        capabilitiesJson,
        now,
        metaJson,
        now,
        now,
      ]
    );

    const saved = await this.getConnection(input.businessProfileId, input.provider);
    if (!saved) throw new Error(`Failed to save payment connection for ${input.provider}`);

    await AuditEventRepository.logEvent({
      businessProfileId: input.businessProfileId,
      entityType: 'payment_connection',
      entityId: saved.id,
      action: 'upsert_payment_connection',
      payload: {
        provider: input.provider,
        status,
        isActive: Boolean(isActive),
        isTestnet: Boolean(isTestnet),
        keyIdPrefix: keyId ? keyId.slice(0, 8) : null,
      },
    });

    return saved;
  }

  /**
   * Toggles active state of a connection.
   */
  static async toggleActive(
    businessProfileId: string,
    provider: PaymentGatewayId,
    isActive: boolean
  ): Promise<void> {
    const db = await this.getDb();
    const now = Date.now();
    await db.runAsync(
      'UPDATE payment_provider_connections SET is_active = ?, updated_at = ? WHERE business_profile_id = ? AND provider = ?;',
      [isActive ? 1 : 0, now, businessProfileId, provider]
    );
  }

  /**
   * Deletes a payment provider connection.
   */
  static async deleteConnection(
    businessProfileId: string,
    provider: PaymentGatewayId
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      'DELETE FROM payment_provider_connections WHERE business_profile_id = ? AND provider = ?;',
      [businessProfileId, provider]
    );
  }
}
