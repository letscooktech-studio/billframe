/**
 * LOGO DOCUMENT INTEGRATION TEST SUITE
 * 
 * Verifies that uploaded logos are seamlessly integrated into:
 * - Universal Gold/Black Master renderer across layouts
 * - Tax Invoice Gold Standard template
 * - Purchase Order, Work Order, and Letterhead templates
 * - Document Studio HTML preview pipeline
 * - Automatic fallback to gold monogram when logo is removed
 */

import { renderUniversalCustomHtml } from '../../src/services/pdf/templates/UniversalCustomRenderer';
import { UniversalDocumentRenderer } from '../../src/services/pdf/UniversalDocumentRenderer';
import { renderTaxInvoiceGoldStandardHtml } from '../../src/services/pdf/templates/TaxInvoiceGoldStandardTemplate';
import { renderPurchaseOrderHtml } from '../../src/services/pdf/templates/PurchaseOrderRenderer';
import { renderWorkOrderHtml } from '../../src/services/pdf/templates/WorkOrderRenderer';
import { renderLetterDocumentHtml } from '../../src/services/pdf/templates/LetterDocumentRenderer';
import { SYSTEM_SCHEMAS } from '../../src/domain/documents/universal/SystemSchemas';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../src/domain/documents/universal/types';
import { BusinessProfile } from '../../src/domain/profile/types';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';

const SAMPLE_LOGO_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const BIZ_WITH_LOGO: BusinessProfile = {
  id: 'biz_apex_corp',
  name: 'Apex Innovations Ltd',
  legal_name: 'Apex Innovations Private Limited',
  tax_id: '27AABCA1234F1Z5',
  default_currency: 'INR',
  default_document_locale: 'en-IN',
  address_line1: '108 Tech Boulevard, Electronic City',
  city: 'Bengaluru',
  state: 'Karnataka',
  postal_code: '560100',
  country: 'IN',
  country_iso2: 'IN',
  phone: '+91 98765 43210',
  email: 'finance@apexinnovations.com',
  website: 'www.apexinnovations.com',
  logo_uri: SAMPLE_LOGO_DATA_URI,
  is_active: 1,
  created_at: Date.now(),
  updated_at: Date.now(),
};

const BIZ_WITHOUT_LOGO: BusinessProfile = {
  ...BIZ_WITH_LOGO,
  logo_uri: null,
};

function createTestInstance(
  schema: UniversalDocumentSchema,
  docNumber: string,
  partyName: string,
  customContent: Record<string, any> = {}
): UniversalDocumentInstance {
  return {
    id: `inst_${schema.code}_${Date.now()}`,
    businessProfileId: BIZ_WITH_LOGO.id,
    typeId: schema.id,
    docClass: schema.docClass,
    documentNumber: docNumber,
    title: schema.name,
    status: 'issued',
    issueDate: Date.now(),
    partyName,
    partyDetails: {
      email: 'counterparty@example.com',
      phone: '+91 98765 43210',
    },
    content: customContent,
    templateCode: 'gold_master',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('Logo Document Integration & Upload Rendering', () => {
  describe('UniversalCustomRenderer (Gold/Black Enterprise Master)', () => {
    const salarySchema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip')!;
    const inspectionSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'site_inspection_report')!;

    it('embeds image tag with uploaded logo data URI in the logo frame', () => {
      const instance = createTestInstance(salarySchema, 'PAY-2026-001', 'Aarav Sharma');
      const html = renderUniversalCustomHtml(instance, salarySchema, BIZ_WITH_LOGO);
      expect(html).toContain('class="logo-frame"');
      expect(html).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
      expect(html).toContain('alt="Logo"');
      expect(html).not.toContain('✦</div>\n        LOGO');
    });

    it('renders classic gold monogram fallback when logo_uri is null', () => {
      const instance = createTestInstance(salarySchema, 'PAY-2026-002', 'Aarav Sharma');
      const html = renderUniversalCustomHtml(instance, salarySchema, BIZ_WITHOUT_LOGO);
      expect(html).toContain('class="logo-frame"');
      expect(html).toContain('LOGO');
      expect(html).toContain('✦');
      expect(html).not.toContain('<img src="data:image/png');
    });

    it('preserves uploaded logo across different layout families (checklist, statement, etc.)', () => {
      const instance = createTestInstance(inspectionSchema, 'INSP-2026-001', 'Flat 402 Site');
      const checklistHtml = renderUniversalCustomHtml(instance, inspectionSchema, BIZ_WITH_LOGO);
      expect(checklistHtml).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
      expect(checklistHtml).toContain('class="logo-frame"');
    });
  });

  describe('UniversalDocumentRenderer Dispatcher', () => {
    const jobOfferSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;

    it('renders uploaded logo in Document Studio preview HTML', () => {
      const instance = createTestInstance(jobOfferSchema, 'JOB-2026-088', 'Devika Patel', {
        candidate_name: 'Devika Patel',
        designation: 'Principal Systems Architect',
      });
      const html = UniversalDocumentRenderer.renderHtml(instance, jobOfferSchema, BIZ_WITH_LOGO);
      expect(html).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
      expect(html).toContain('Apex Innovations Ltd');
    });
  });

  describe('Financial Invoicing & Operational Renderers', () => {
    it('TaxInvoiceGoldStandardTemplate renders uploaded logo', () => {
      const mockDoc: any = {
        id: 'doc_tax_01',
        doc_type: 'invoice',
        document_number: 'INV-2026-901',
        issue_date: Date.now(),
        subtotal_minor: 15000000,
        total_minor: 17700000,
        currency: 'INR',
        customer_id: 'cust_01',
        customer: {
          id: 'cust_01',
          name: 'Global Horizons Corp',
          billing_address: 'Level 4, IT Towers, Bengaluru',
        },
        items: [
          {
            id: 'item_1',
            description: 'Cloud Infrastructure Setup',
            quantity_scaled: 10000,
            unit_name: 'Phase',
            unit_price_minor: 15000000,
            line_total_minor: 15000000,
          },
        ],
      };

      const html = renderTaxInvoiceGoldStandardHtml(mockDoc, BIZ_WITH_LOGO, 'a4');
      expect(html).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
      expect(html).not.toContain('[ORGANIZATION LOGO]');
    });

    it('TaxInvoiceGoldStandardTemplate renders fallback when logo is missing', () => {
      const mockDoc: any = {
        id: 'doc_tax_02',
        doc_type: 'invoice',
        document_number: 'INV-2026-902',
        issue_date: Date.now(),
        subtotal_minor: 0,
        total_minor: 0,
        currency: 'INR',
        items: [],
      };

      const html = renderTaxInvoiceGoldStandardHtml(mockDoc, BIZ_WITHOUT_LOGO, 'a4');
      expect(html).toContain('[ORGANIZATION LOGO]');
      expect(html).not.toContain('<img src="data:image/png');
    });

    it('PurchaseOrderRenderer renders uploaded logo', () => {
      const poSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'purchase_order')!;
      const poInstance = createTestInstance(poSchema, 'PO-2026-014', 'Acme Hardware');
      const html = renderPurchaseOrderHtml(poInstance, poSchema, BIZ_WITH_LOGO);
      expect(html).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
    });

    it('WorkOrderRenderer renders uploaded logo', () => {
      const woSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order')!;
      const woInstance = createTestInstance(woSchema, 'WO-2026-007', 'Sunrise Builders');
      const html = renderWorkOrderHtml(woInstance, woSchema, BIZ_WITH_LOGO);
      expect(html).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
    });

    it('LetterDocumentRenderer renders uploaded logo', () => {
      const letterSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'appointment_letter')!;
      const letterInstance = createTestInstance(letterSchema, 'APP-2026-001', 'Rahul Sen');
      const html = renderLetterDocumentHtml(letterInstance, letterSchema, BIZ_WITH_LOGO);
      expect(html).toContain(`<img src="${SAMPLE_LOGO_DATA_URI}"`);
    });
  });
});
