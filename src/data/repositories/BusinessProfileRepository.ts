/**
 * BUSINESS PROFILE REPOSITORY
 * Offline-first persistence for business profile settings, tax IDs, and default currencies.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { BusinessProfile } from '../../domain/profile/types';

export class BusinessProfileRepository {
  /**
   * Retrieves the current active business profile.
   */
  static async getActiveProfile(): Promise<BusinessProfile | null> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getFirstAsync<BusinessProfile>(
      'SELECT * FROM business_profiles WHERE is_active = 1 LIMIT 1;'
    );
  }

  /**
   * Retrieves profile by ID.
   */
  static async getById(id: string): Promise<BusinessProfile | null> {
    const db = await DatabaseManager.getDatabaseAsync();
    return await db.getFirstAsync<BusinessProfile>(
      'SELECT * FROM business_profiles WHERE id = ?;',
      [id]
    );
  }

  /**
   * Updates an existing profile.
   */
  static async updateProfile(profile: Partial<BusinessProfile> & { id: string }): Promise<void> {
    const db = await DatabaseManager.getDatabaseAsync();
    const now = Date.now();
    const country = profile.country_iso2 || profile.country || 'US';
    await db.runAsync(
      `UPDATE business_profiles SET
        name = ?, legal_name = ?, tax_id = ?, email = ?, phone = ?,
        address_line1 = ?, city = ?, state = ?, postal_code = ?,
        country = ?, country_iso2 = ?, subdivision_code = ?, subdivision_name = ?,
        phone_country_iso2 = ?, phone_e164 = ?,
        default_currency = ?, default_notes = ?,
        default_payment_terms = ?, updated_at = ?
      WHERE id = ?;`,
      [
        profile.name || '',
        profile.legal_name || null,
        profile.tax_id || null,
        profile.email || null,
        profile.phone || null,
        profile.address_line1 || null,
        profile.city || null,
        profile.state || null,
        profile.postal_code || null,
        country,
        country,
        profile.subdivision_code || null,
        profile.subdivision_name || profile.state || null,
        profile.phone_country_iso2 || null,
        profile.phone_e164 || null,
        profile.default_currency || 'USD',
        profile.default_notes || null,
        profile.default_payment_terms || null,
        now,
        profile.id,
      ]
    );
  }
}
