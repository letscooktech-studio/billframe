/**
 * AI LOCAL SQL CONTEXT ENGINE
 * Extracts relevant local SQLite records (Customers, Catalog Items, Past Documents,
 * Business Profile, Ledgers) to provide high-precision grounding to the AI Agent.
 */

import { CustomerRepository } from '../../data/repositories/CustomerRepository';
import { CatalogRepository } from '../../data/repositories/CatalogRepository';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DocumentTypeRegistry } from '../../domain/documents/DocumentTypeRegistry';

export interface LocalContextData {
  businessProfile: {
    name: string;
    taxId?: string | null;
    currency: string;
    state?: string | null;
  } | null;
  matchedCustomers: Array<{
    id: string;
    name: string;
    businessName?: string | null;
    email?: string | null;
    taxId?: string | null;
    billingAddress?: string | null;
  }>;
  matchedCatalogItems: Array<{
    id: string;
    name: string;
    unitPriceMinor: string;
    unitName: string;
    hsnSac?: string | null;
  }>;
  recentDocuments: Array<{
    id: string;
    documentNumber: string;
    docType: string;
    customerName?: string;
    totalMinor: number;
    lifecycleStatus: string;
  }>;
  availableDocumentTypes: Array<{
    id: string;
    name: string;
    category: string;
    defaultPrefix: string;
  }>;
}

export class AiLocalSqlContext {
  /**
   * Builds focused local context based on user query keywords
   */
  static async buildContextForPrompt(userPrompt: string): Promise<LocalContextData> {
    const activeProfile = await BusinessProfileRepository.getActiveProfile().catch(() => null);

    // Extract potential search tokens
    const tokens = userPrompt
      .replace(/[^\w\s]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    // Search customers
    const matchedCustomersMap = new Map<string, any>();
    for (const token of tokens.slice(0, 5)) {
      try {
        const found = await CustomerRepository.search(token, false);
        for (const c of found) {
          matchedCustomersMap.set(c.id, {
            id: c.id,
            name: c.name,
            businessName: c.business_name,
            email: c.email,
            taxId: c.tax_id,
            billingAddress: c.billing_address,
          });
        }
      } catch {
        // Non-blocking
      }
    }

    // Search catalog items
    const matchedCatalogMap = new Map<string, any>();
    for (const token of tokens.slice(0, 5)) {
      try {
        const found = await CatalogRepository.search(token);
        for (const itm of found) {
          matchedCatalogMap.set(itm.id, {
            id: itm.id,
            name: itm.name,
            unitPriceMinor: itm.unit_price_minor.toString(),
            unitName: itm.unit_name,
            hsnSac: (itm as any).hsn_sac_code || undefined,
          });
        }
      } catch {
        // Non-blocking
      }
    }

    // Recent documents for ledger context
    let recentDocs: any[] = [];
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const rows: any[] = await db.getAllAsync(
        `SELECT d.id, d.document_number, d.doc_type, d.total_minor, d.lifecycle_status, c.name AS customer_name
         FROM documents d
         LEFT JOIN customers c ON d.customer_id = c.id
         ORDER BY d.issue_date DESC LIMIT 8;`
      );
      recentDocs = (rows || []).map((d: any) => ({
        id: d.id,
        documentNumber: d.document_number,
        docType: d.doc_type,
        customerName: d.customer_name,
        totalMinor: d.total_minor,
        lifecycleStatus: d.lifecycle_status,
      }));
    } catch {
      // Non-blocking
    }

    // Relevant statutory document types
    const documentTypes = DocumentTypeRegistry.getAll().slice(0, 40).map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      defaultPrefix: d.defaultPrefix,
    }));

    return {
      businessProfile: activeProfile
        ? {
            name: activeProfile.name || activeProfile.legal_name || 'My Business',
            taxId: activeProfile.tax_id,
            currency: activeProfile.default_currency || 'USD',
            state: activeProfile.state,
          }
        : null,
      matchedCustomers: Array.from(matchedCustomersMap.values()),
      matchedCatalogItems: Array.from(matchedCatalogMap.values()),
      recentDocuments: recentDocs,
      availableDocumentTypes: documentTypes,
    };
  }

  /**
   * Formats context into a compressed markdown prompt section
   */
  static formatContextForSystemPrompt(ctx: LocalContextData): string {
    let out = '### LOCAL SQL DATABASE CONTEXT (DEVICE MEMORY):\n';

    if (ctx.businessProfile) {
      out += `Business: ${ctx.businessProfile.name} | Tax ID/GSTIN: ${ctx.businessProfile.taxId || 'N/A'} | Default Currency: ${ctx.businessProfile.currency}\n`;
    }

    if (ctx.matchedCustomers.length > 0) {
      out += 'Matching Existing Customers in Local Database:\n';
      ctx.matchedCustomers.forEach((c) => {
        out += `- ID: ${c.id} | Name: ${c.name} | Business: ${c.businessName || 'N/A'} | Tax ID: ${c.taxId || 'N/A'} | Address: ${c.billingAddress || 'N/A'}\n`;
      });
    }

    if (ctx.matchedCatalogItems.length > 0) {
      out += 'Matching Catalog Items / Pricing:\n';
      ctx.matchedCatalogItems.forEach((itm) => {
        out += `- Name: ${itm.name} | Default Price Minor: ${itm.unitPriceMinor} | Unit: ${itm.unitName} | HSN/SAC: ${itm.hsnSac || 'N/A'}\n`;
      });
    }

    if (ctx.recentDocuments.length > 0) {
      out += 'Recent Documents in Database:\n';
      ctx.recentDocuments.slice(0, 5).forEach((d) => {
        out += `- Doc #${d.documentNumber} (${d.docType}) for ${d.customerName || 'N/A'}: Minor Amount ${d.totalMinor} [Status: ${d.lifecycleStatus}]\n`;
      });
    }

    return out;
  }
}
