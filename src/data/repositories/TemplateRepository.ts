/**
 * TEMPLATE REPOSITORY
 * SQLite persistence for Document Studio template definitions,
 * per-profile customizations, document assignments, and brand styling.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { TemplateCustomization, PdfTemplateType } from '../../services/pdf/types';

export interface TemplateDefinitionRecord {
  code: string;
  name: string;
  description: string;
  category: string;
  thumbnail_uri: string | null;
  default_config_json: string;
  is_system: number;
  created_at: number;
  updated_at: number;
}

export const SYSTEM_TEMPLATES: TemplateDefinitionRecord[] = [
  {
    code: 'standard',
    name: 'Standard Corporate',
    description: 'Clean, balanced corporate hierarchy suitable for B2B and professional services.',
    category: 'general',
    thumbnail_uri: null,
    default_config_json: JSON.stringify({ brandColor: '#171717', secondaryColor: '#6B6B6B' }),
    is_system: 1,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  },
  {
    code: 'executive',
    name: 'Executive Ink',
    description: 'Deep navy accents, structured summary card, and prominent UPI QR payment block.',
    category: 'corporate',
    thumbnail_uri: null,
    default_config_json: JSON.stringify({ brandColor: '#102A43', secondaryColor: '#2563EB' }),
    is_system: 1,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  },
  {
    code: 'compact',
    name: 'Commerce Compact',
    description: 'Space-efficient, high-density format designed for wholesale, retail, and multi-item orders.',
    category: 'pos',
    thumbnail_uri: null,
    default_config_json: JSON.stringify({ brandColor: '#1E293B', secondaryColor: '#475569' }),
    is_system: 1,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  },
  {
    code: 'modern',
    name: 'Modern Editorial',
    description: 'Contemporary typography, generous whitespace, and sleek horizontal dividers.',
    category: 'creative',
    thumbnail_uri: null,
    default_config_json: JSON.stringify({ brandColor: '#2563EB', secondaryColor: '#64748B' }),
    is_system: 1,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  },
  {
    code: 'minimal',
    name: 'Monochrome Minimal',
    description: 'Pure black-and-white elegance with zero printer ink waste and razor-sharp contrast.',
    category: 'general',
    thumbnail_uri: null,
    default_config_json: JSON.stringify({ brandColor: '#000000', secondaryColor: '#333333' }),
    is_system: 1,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  },
];

export class TemplateRepository {
  /**
   * Retrieves all available template definitions (system + user-defined).
   */
  static async getAvailableTemplates(): Promise<TemplateDefinitionRecord[]> {
    const db = await DatabaseManager.getDatabaseAsync();
    try {
      const rows = await db.getAllAsync<TemplateDefinitionRecord>(
        'SELECT * FROM template_definitions ORDER BY is_system DESC, name ASC;'
      );
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch {
      // If table not yet queried or migrated in mock
    }
    return SYSTEM_TEMPLATES;
  }

  /**
   * Retrieves the assigned template code for a given document type and profile.
   * Defaults to 'standard' if no assignment is found.
   */
  static async getAssignedTemplate(
    businessProfileId: string,
    docType: string
  ): Promise<PdfTemplateType> {
    const db = await DatabaseManager.getDatabaseAsync();
    try {
      const row = await db.getFirstAsync<{ template_code: string }>(
        'SELECT template_code FROM template_assignments WHERE business_profile_id = ? AND doc_type = ?;',
        [businessProfileId, docType]
      );
      if (row?.template_code) {
        return row.template_code as PdfTemplateType;
      }
    } catch {
      // Fallback
    }
    return 'standard';
  }

  /**
   * Assigns a default template for a specific document type.
   */
  static async assignTemplate(
    businessProfileId: string,
    docType: string,
    templateCode: string
  ): Promise<void> {
    const db = await DatabaseManager.getDatabaseAsync();
    const id = `assign_${businessProfileId}_${docType}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO template_assignments (id, business_profile_id, doc_type, template_code, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(business_profile_id, doc_type) DO UPDATE SET
         template_code = excluded.template_code,
         updated_at = excluded.updated_at;`,
      [id, businessProfileId, docType, templateCode, now]
    );
  }

  /**
   * Retrieves styling customization for a given template and profile.
   */
  static async getCustomization(
    businessProfileId: string,
    templateCode: string
  ): Promise<TemplateCustomization | null> {
    const db = await DatabaseManager.getDatabaseAsync();
    try {
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM template_customizations WHERE business_profile_id = ? AND template_code = ?;',
        [businessProfileId, templateCode]
      );
      if (!row) return null;

      let columnVisibility = {};
      if (row.column_visibility_json) {
        try {
          columnVisibility = JSON.parse(row.column_visibility_json);
        } catch {
          // ignore
        }
      }

      return {
        id: row.id,
        template_code: row.template_code,
        business_profile_id: row.business_profile_id,
        brand_color: row.brand_color,
        secondary_color: row.secondary_color,
        font_family: row.font_family,
        logo_position: row.logo_position,
        show_logo: Boolean(row.show_logo),
        show_tax_breakdown: Boolean(row.show_tax_breakdown),
        show_payment_qr: Boolean(row.show_payment_qr),
        show_signature: Boolean(row.show_signature),
        show_terms: Boolean(row.show_terms),
        custom_declaration: row.custom_declaration,
        custom_footer_notes: row.custom_footer_notes,
        column_visibility: columnVisibility,
      };
    } catch {
      return null;
    }
  }

  /**
   * Saves or updates styling customizations for a template and business profile.
   */
  static async saveCustomization(
    businessProfileId: string,
    customization: TemplateCustomization
  ): Promise<void> {
    const db = await DatabaseManager.getDatabaseAsync();
    const id = customization.id || `cust_${businessProfileId}_${customization.template_code}`;
    const now = Date.now();
    const colJson = JSON.stringify(customization.column_visibility || {});

    await db.runAsync(
      `INSERT INTO template_customizations (
         id, template_code, business_profile_id, brand_color, secondary_color,
         font_family, logo_position, show_logo, show_tax_breakdown, show_payment_qr,
         show_signature, show_terms, custom_declaration, custom_footer_notes,
         column_visibility_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(template_code, business_profile_id) DO UPDATE SET
         brand_color = excluded.brand_color,
         secondary_color = excluded.secondary_color,
         font_family = excluded.font_family,
         logo_position = excluded.logo_position,
         show_logo = excluded.show_logo,
         show_tax_breakdown = excluded.show_tax_breakdown,
         show_payment_qr = excluded.show_payment_qr,
         show_signature = excluded.show_signature,
         show_terms = excluded.show_terms,
         custom_declaration = excluded.custom_declaration,
         custom_footer_notes = excluded.custom_footer_notes,
         column_visibility_json = excluded.column_visibility_json,
         updated_at = excluded.updated_at;`,
      [
        id,
        customization.template_code,
        businessProfileId,
        customization.brand_color || '#171717',
        customization.secondary_color || '#6B6B6B',
        customization.font_family || 'Inter, system-ui, sans-serif',
        customization.logo_position || 'left',
        customization.show_logo !== false ? 1 : 0,
        customization.show_tax_breakdown !== false ? 1 : 0,
        customization.show_payment_qr !== false ? 1 : 0,
        customization.show_signature !== false ? 1 : 0,
        customization.show_terms !== false ? 1 : 0,
        customization.custom_declaration || null,
        customization.custom_footer_notes || null,
        colJson,
        now,
      ]
    );
  }
}
