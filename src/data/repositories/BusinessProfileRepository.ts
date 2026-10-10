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
    let profile = await db.getFirstAsync<BusinessProfile>(
      'SELECT * FROM business_profiles WHERE is_active = 1 LIMIT 1;'
    );
    if (!profile) {
      profile = await db.getFirstAsync<BusinessProfile>(
        'SELECT * FROM business_profiles ORDER BY created_at ASC LIMIT 1;'
      );
      if (profile) {
        await db.runAsync('UPDATE business_profiles SET is_active = 1 WHERE id = ?;', [profile.id]);
      }
    }
    if (!profile) {
      const now = Date.now();
      const defaultId = 'default_business_profile';
      await db.runAsync(
        `INSERT INTO business_profiles (
          id, name, country, default_currency, default_document_locale, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
        [defaultId, 'My Business', 'IN', 'INR', 'en-IN', now, now]
      );
      profile = await db.getFirstAsync<BusinessProfile>(
        'SELECT * FROM business_profiles WHERE id = ?;',
        [defaultId]
      );
    }
    return profile;
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
    const existing = (await this.getById(profile.id)) || (await this.getActiveProfile());
    const merged = { ...existing, ...profile };
    const now = Date.now();
    const country = merged.country_iso2 || merged.country || 'IN';
    const profileId = existing?.id || profile.id || 'default_business_profile';

    await db.runAsync(
      `UPDATE business_profiles SET
        name = ?, legal_name = ?, tax_id = ?, email = ?, phone = ?,
        address_line1 = ?, city = ?, state = ?, postal_code = ?,
        country = ?, country_iso2 = ?, subdivision_code = ?, subdivision_name = ?,
        phone_country_iso2 = ?, phone_e164 = ?, upi_vpa = ?,
        website = ?, tagline = ?, signatory_name = ?, signatory_title = ?,
        bank_name = ?, bank_account_number = ?, bank_ifsc = ?, bank_branch = ?, bank_account_type = ?,
        header_style = ?, footer_show_signature = ?, footer_show_stamp = ?, footer_show_address = ?,
        default_currency = ?, default_document_locale = ?, default_notes = ?,
        default_payment_terms = ?, logo_uri = ?, is_active = 1, updated_at = ?
      WHERE id = ?;`,
      [
        merged.name || 'My Business',
        merged.legal_name || null,
        merged.tax_id || null,
        merged.email || null,
        merged.phone || null,
        merged.address_line1 || null,
        merged.city || null,
        merged.state || null,
        merged.postal_code || null,
        country,
        country,
        merged.subdivision_code || null,
        merged.subdivision_name || merged.state || null,
        merged.phone_country_iso2 || null,
        merged.phone_e164 || null,
        merged.upi_vpa || null,
        merged.website || null,
        merged.tagline || null,
        merged.signatory_name || null,
        merged.signatory_title || null,
        merged.bank_name || null,
        merged.bank_account_number || null,
        merged.bank_ifsc || null,
        merged.bank_branch || null,
        merged.bank_account_type || null,
        merged.header_style || 'modern',
        merged.footer_show_signature !== false ? 1 : 0,
        merged.footer_show_stamp !== false ? 1 : 0,
        merged.footer_show_address !== false ? 1 : 0,
        merged.default_currency || 'INR',
        merged.default_document_locale || (country === 'IN' ? 'en-IN' : 'en-US'),
        merged.default_notes || null,
        merged.default_payment_terms || null,
        merged.logo_uri || null,
        now,
        profileId,
      ]
    );
  }
}
