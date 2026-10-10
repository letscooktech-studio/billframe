/**
 * UNIVERSAL DOCUMENT RENDERER
 * Dispatches Class B (Administrative) and Class C (Custom) documents to their
 * specialized HTML layout engines based on schema type and template design.
 */

import { BusinessProfile } from '../../domain/profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../domain/documents/universal/types';
import { TemplateCustomization } from './types';
import { renderLetterDocumentHtml } from './templates/LetterDocumentRenderer';
import { renderWorkOrderHtml } from './templates/WorkOrderRenderer';
import { renderPurchaseOrderHtml } from './templates/PurchaseOrderRenderer';
import { renderUniversalCustomHtml } from './templates/UniversalCustomRenderer';

export class UniversalDocumentRenderer {
  /**
   * Generates production-ready, self-contained HTML for any administrative or custom document.
   */
  static renderHtml(
    instance: UniversalDocumentInstance,
    schema: UniversalDocumentSchema,
    business: BusinessProfile,
    paperSize: 'a4' | 'letter' = 'a4',
    customization?: TemplateCustomization
  ): string {
    const templateCode = instance.templateCode || schema.defaultTemplate;

    // 0. Explicit Gold/Black Master standard layout override
    if (templateCode === 'gold_master' || templateCode === 'custom_studio' || templateCode === 'universal') {
      return renderUniversalCustomHtml(instance, schema, business, paperSize, customization);
    }

    // 1. Job Offer Letters, Appointment Letters (Dedicated executive HR letterhead)
    if (schema.code === 'job_offer_letter' || schema.code === 'appointment_letter') {
      return renderLetterDocumentHtml(instance, schema, business, paperSize, customization);
    }

    // 2. Work Orders (Dedicated field engineering card)
    if (schema.code === 'work_order') {
      return renderWorkOrderHtml(instance, schema, business, paperSize, customization);
    }

    // 3. Purchase Orders (Dedicated corporate procurement grid)
    if (schema.code === 'purchase_order') {
      return renderPurchaseOrderHtml(instance, schema, business, paperSize, customization);
    }

    // 4. Gold/Black Document Master Engine (Salary slips, checklists, minutes, statements, handovers, receipts, proposals, custom)
    return renderUniversalCustomHtml(instance, schema, business, paperSize, customization);
  }
}
