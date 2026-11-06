/**
 * UNIVERSAL DOCUMENT REPOSITORY
 * Offline-first SQLite persistence for Class B (Administrative) and Class C (Custom) documents.
 * Completely isolates non-ledger documents from financial balance tables and accounts receivable.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import {
  DocumentClass,
  UniversalDocumentInstance,
  UniversalDocumentSchema,
} from '../../domain/documents/universal/types';
import { SYSTEM_SCHEMAS } from '../../domain/documents/universal/SystemSchemas';

export class UniversalDocumentRepository {
  private static async getDb() {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Retrieves all document schemas (system presets + user-defined custom schemas)
   */
  static async getDocumentTypesAsync(businessProfileId?: string): Promise<UniversalDocumentSchema[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT id, business_profile_id, code, name, doc_class, category, description,
              icon, schema_json, default_template, is_system
       FROM custom_document_types
       WHERE business_profile_id = ? OR is_system = 1
       ORDER BY is_system DESC, name ASC;`,
      [businessProfileId || 'system']
    );

    const schemasMap = new Map<string, UniversalDocumentSchema>();

    // 1. Load system defaults
    for (const sys of SYSTEM_SCHEMAS) {
      schemasMap.set(sys.code, sys);
      schemasMap.set(sys.id, sys);
    }

    // 2. Overlay / add database records
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.schema_json);
        const schema: UniversalDocumentSchema = {
          id: r.id,
          code: r.code,
          name: r.name,
          docClass: r.doc_class as DocumentClass,
          category: r.category as any,
          description: r.description || '',
          icon: r.icon || 'file-text',
          defaultTemplate: r.default_template || 'letterhead',
          isSystem: Boolean(r.is_system),
          sections: parsed.sections || [],
          headerConfig: parsed.headerConfig,
          footerConfig: parsed.footerConfig,
        };
        schemasMap.set(r.id, schema);
        schemasMap.set(r.code, schema);
      } catch {
        // Skip unparseable records
      }
    }

    // Return unique schemas
    const unique = Array.from(new Set(schemasMap.values()));
    return unique;
  }

  /**
   * Retrieves a document schema by ID or code.
   */
  static async getDocumentTypeByIdAsync(
    idOrCode: string,
    businessProfileId?: string
  ): Promise<UniversalDocumentSchema | null> {
    // Check system schemas first for fast match
    const sys = SYSTEM_SCHEMAS.find((s) => s.id === idOrCode || s.code === idOrCode);
    if (sys) return sys;

    const db = await this.getDb();
    let row = await db.getFirstAsync<any>(
      `SELECT * FROM custom_document_types WHERE id = ?;`,
      [idOrCode]
    );

    if (!row) {
      row = await db.getFirstAsync<any>(
        `SELECT * FROM custom_document_types WHERE code = ? AND (business_profile_id = ? OR is_system = 1);`,
        [idOrCode, businessProfileId || 'system']
      );
    }

    if (!row) return null;

    try {
      const parsed = JSON.parse(row.schema_json);
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        docClass: row.doc_class as DocumentClass,
        category: row.category as any,
        description: row.description || '',
        icon: row.icon || 'file-text',
        defaultTemplate: row.default_template || 'letterhead',
        isSystem: Boolean(row.is_system),
        sections: parsed.sections || [],
        headerConfig: parsed.headerConfig,
        footerConfig: parsed.footerConfig,
      };
    } catch {
      return null;
    }
  }

  /**
   * Saves a user-defined custom document type schema.
   */
  static async saveCustomDocumentTypeAsync(
    schema: UniversalDocumentSchema,
    businessProfileId: string
  ): Promise<UniversalDocumentSchema> {
    const db = await this.getDb();
    const now = Date.now();
    const id = schema.id || `custom_type_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const code = schema.code || id;

    const schemaToSave: UniversalDocumentSchema = {
      ...schema,
      id,
      code,
      docClass: schema.docClass || 'class_c_custom',
      isSystem: false,
    };

    await db.runAsync(
      `INSERT INTO custom_document_types (
         id, business_profile_id, code, name, doc_class, category, description,
         icon, schema_json, default_template, is_system, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
      [
        id,
        businessProfileId,
        code,
        schema.name,
        schemaToSave.docClass,
        schema.category,
        schema.description || '',
        schema.icon || 'file-text',
        JSON.stringify(schemaToSave),
        schema.defaultTemplate || 'letterhead',
        now,
        now,
      ]
    );

    return schemaToSave;
  }

  /**
   * Deletes a user-defined custom document type.
   */
  static async deleteCustomDocumentTypeAsync(id: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await db.getFirstAsync<any>(
      `SELECT is_system FROM custom_document_types WHERE id = ?;`,
      [id]
    );
    if (!existing || existing.is_system === 1) {
      return false; // Cannot delete system types
    }

    await db.runAsync(`DELETE FROM custom_document_types WHERE id = ?;`, [id]);
    return true;
  }

  /**
   * Retrieves all document instances for a business, with optional filters.
   */
  static async getDocumentInstancesAsync(
    businessProfileId: string,
    filter?: { typeId?: string; docClass?: DocumentClass; status?: string }
  ): Promise<UniversalDocumentInstance[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM document_instances WHERE business_profile_id = ? ORDER BY issue_date DESC, created_at DESC;`,
      [businessProfileId]
    );

    let instances: UniversalDocumentInstance[] = rows.map((r) => {
      let partyDetails = {};
      let content = {};
      let branding = undefined;
      try {
        partyDetails = r.party_details_json ? JSON.parse(r.party_details_json) : {};
      } catch {}
      try {
        content = r.content_json ? JSON.parse(r.content_json) : {};
      } catch {}
      try {
        branding = r.branding_json ? JSON.parse(r.branding_json) : undefined;
      } catch {}

      return {
        id: r.id,
        businessProfileId: r.business_profile_id,
        typeId: r.type_id,
        docClass: r.doc_class as DocumentClass,
        documentNumber: r.document_number,
        title: r.title,
        status: r.status as any,
        issueDate: r.issue_date,
        partyName: r.party_name || '',
        partyDetails,
        content,
        templateCode: r.template_code || 'letterhead',
        branding,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    if (filter?.typeId) {
      instances = instances.filter((i) => i.typeId === filter.typeId);
    }
    if (filter?.docClass) {
      instances = instances.filter((i) => i.docClass === filter.docClass);
    }
    if (filter?.status) {
      instances = instances.filter((i) => i.status === filter.status);
    }

    return instances;
  }

  /**
   * Retrieves a document instance by ID.
   */
  static async getDocumentInstanceByIdAsync(id: string): Promise<UniversalDocumentInstance | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM document_instances WHERE id = ?;`,
      [id]
    );
    if (!row) return null;

    let partyDetails = {};
    let content = {};
    let branding = undefined;
    try {
      partyDetails = row.party_details_json ? JSON.parse(row.party_details_json) : {};
    } catch {}
    try {
      content = row.content_json ? JSON.parse(row.content_json) : {};
    } catch {}
    try {
      branding = row.branding_json ? JSON.parse(row.branding_json) : undefined;
    } catch {}

    return {
      id: row.id,
      businessProfileId: row.business_profile_id,
      typeId: row.type_id,
      docClass: row.doc_class as DocumentClass,
      documentNumber: row.document_number,
      title: row.title,
      status: row.status as any,
      issueDate: row.issue_date,
      partyName: row.party_name || '',
      partyDetails,
      content,
      templateCode: row.template_code || 'letterhead',
      branding,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Saves or updates a document instance.
   */
  static async saveDocumentInstanceAsync(
    instance: UniversalDocumentInstance
  ): Promise<UniversalDocumentInstance> {
    const db = await this.getDb();
    const now = Date.now();
    const id = instance.id || `doc_inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const savedInstance: UniversalDocumentInstance = {
      ...instance,
      id,
      createdAt: instance.createdAt || now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO document_instances (
         id, business_profile_id, type_id, doc_class, document_number, title,
         status, issue_date, party_name, party_details_json, content_json,
         template_code, branding_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         document_number = excluded.document_number, title = excluded.title,
         status = excluded.status, issue_date = excluded.issue_date,
         party_name = excluded.party_name, party_details_json = excluded.party_details_json,
         content_json = excluded.content_json, template_code = excluded.template_code,
         branding_json = excluded.branding_json, updated_at = excluded.updated_at;`,
      [
        id,
        savedInstance.businessProfileId,
        savedInstance.typeId,
        savedInstance.docClass,
        savedInstance.documentNumber,
        savedInstance.title,
        savedInstance.status,
        savedInstance.issueDate,
        savedInstance.partyName,
        JSON.stringify(savedInstance.partyDetails || {}),
        JSON.stringify(savedInstance.content || {}),
        savedInstance.templateCode,
        savedInstance.branding ? JSON.stringify(savedInstance.branding) : null,
        savedInstance.createdAt,
        savedInstance.updatedAt,
      ]
    );

    return savedInstance;
  }

  /**
   * Deletes a document instance.
   */
  static async deleteDocumentInstanceAsync(id: string): Promise<boolean> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM document_instances WHERE id = ?;`, [id]);
    return true;
  }
}
