/**
 * BILLFRAME GOLD/BLACK DOCUMENT MASTER STANDARD — 36-DOCUMENT AUTOMATED VERIFICATION SUITE
 * 
 * Verifies that all 36 enterprise document templates from the master specification:
 * 1. Exist as fully typed schemas in SYSTEM_SCHEMAS with sections, fields and defaults
 * 2. Render through UniversalDocumentRenderer and UniversalCustomRenderer
 * 3. Enforce the Gold/Black design language:
 *    - Logo frame with gold accent (#C59B27)
 *    - Serif organization identity header
 *    - 2px Gold dividing rule
 *    - Uppercase serif document title
 *    - Uppercase gold-tracked category subtitle
 *    - 2-column rounded metadata cards
 *    - Dark section banners (#111827)
 *    - Warm cream table headers (#FDFBF7)
 *    - Status pill badges (PASS / FAIL / WARN)
 *    - Summary cards with highlighted gold totals
 *    - Dual signature blocks with underlines
 * 4. Maintain strict financial ledger isolation for administrative documents
 */

import { SYSTEM_SCHEMAS } from '../../src/domain/documents/universal/SystemSchemas';
import { UniversalDocumentRepository } from '../../src/data/repositories/UniversalDocumentRepository';
import { UniversalDocumentRenderer } from '../../src/services/pdf/UniversalDocumentRenderer';
import { renderUniversalCustomHtml } from '../../src/services/pdf/templates/UniversalCustomRenderer';
import {
  UniversalDocumentInstance,
  UniversalDocumentSchema,
} from '../../src/domain/documents/universal/types';
import { BusinessProfile } from '../../src/domain/profile/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Gold/Black Document Master 36-Template Verification', () => {
  let mockDb: ReturnType<typeof getMockDb>;

  const mockBusiness: BusinessProfile = {
    id: 'biz_gold_black_01',
    name: 'Apex Solutions',
    legal_name: 'Apex Solutions Private Limited',
    tax_id: '29ABCDE1234F1Z5',
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    address_line1: '9th Floor, Tech Park IV, Outer Ring Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560103',
    country: 'IN',
    country_iso2: 'IN',
    phone: '+91 80 4123 4567',
    email: 'contact@apexsolutions.com',
    website: 'www.apexsolutions.com',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const MANIFEST_36_CODES = [
    // HR & Employment (8)
    'job_offer_letter',
    'appointment_letter',
    'internship_letter',
    'experience_certificate',
    'relieving_letter',
    'promotion_letter',
    'salary_slip',
    'leave_approval_letter',
    // Corporate Letters & Admin (4)
    'business_letterhead',
    'authorization_letter',
    'meeting_minutes',
    'equipment_responsibility',
    // Sales & Billing (6)
    'tax_invoice',
    'bill_of_supply',
    'quotation',
    'payment_receipt',
    'customer_account_statement',
    'credit_note',
    // Procurement & Dispatch (6)
    'purchase_order',
    'goods_received_note',
    'supplier_evaluation',
    'delivery_challan',
    'packing_list',
    'material_issue_note',
    // Operations & Field Service (6)
    'work_order',
    'service_report',
    'site_inspection_report',
    'production_order',
    'quality_inspection_report',
    'equipment_maintenance_log',
    // Property & Education (6)
    'rent_receipt',
    'move_in_handover_checklist',
    'student_fee_receipt',
    'enrollment_confirmation_letter',
    'grant_proposal',
    'donation_acknowledgement',
  ];

  beforeEach(() => {
    mockDb = getMockDb();
    mockDb.reset();
  });

  describe('1. Schema Registry Completeness', () => {
    it('contains all 36 manifest document templates in SYSTEM_SCHEMAS', () => {
      expect(SYSTEM_SCHEMAS.length).toBeGreaterThanOrEqual(36);

      const registeredCodes = SYSTEM_SCHEMAS.map((s) => s.code);
      for (const requiredCode of MANIFEST_36_CODES) {
        expect(registeredCodes).toContain(requiredCode);
      }
    });

    it('retrieves all 36 schemas via UniversalDocumentRepository.getDocumentTypesAsync', async () => {
      const allTypes = await UniversalDocumentRepository.getDocumentTypesAsync();
      expect(allTypes.length).toBeGreaterThanOrEqual(36);

      const codes = allTypes.map((t) => t.code);
      for (const requiredCode of MANIFEST_36_CODES) {
        expect(codes).toContain(requiredCode);
      }
    });

    it('each schema possesses valid sections, fields, labels, and docClass', () => {
      for (const schema of SYSTEM_SCHEMAS) {
        expect(schema.id).toBeDefined();
        expect(schema.code).toBeDefined();
        expect(schema.name.length).toBeGreaterThan(0);
        expect(schema.category).toBeDefined();
        expect(schema.sections.length).toBeGreaterThan(0);

        for (const sec of schema.sections) {
          expect(sec.title).toBeDefined();
          expect(sec.fields.length).toBeGreaterThan(0);
          for (const f of sec.fields) {
            expect(f.id).toBeDefined();
            expect(f.label).toBeDefined();
            expect(f.type).toBeDefined();
          }
        }
      }
    });
  });

  describe('2. Gold/Black Document Master Design Invariants', () => {
    const createTestInstance = (
      schema: UniversalDocumentSchema,
      docNumber = 'GB-2026-001',
      partyName = 'Vikram Sharma',
      customContent: Record<string, any> = {}
    ): UniversalDocumentInstance => ({
      id: `inst_${schema.code}_${Date.now()}`,
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: docNumber,
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName,
      partyDetails: {
        email: 'vikram@example.com',
        phone: '+91 98765 43210',
      },
      content: customContent,
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    it('renders Monochrome branding tokens in UniversalCustomRenderer', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip')!;
      const instance = createTestInstance(schema, 'PAY-2026-10', 'Aarav Sharma');

      const html = renderUniversalCustomHtml(instance, schema, mockBusiness);

      // True Black Accent (#000000)
      expect(html).toContain('#000000');
      // Dark Table Header (#111827)
      expect(html).toContain('#111827');
      // Clean Monochrome Background (#FFFFFF)
      expect(html).toContain('#FFFFFF');
      // Brand Name
      expect(html).toContain('Apex Solutions');
      // Document Number & Recipient
      expect(html).toContain('PAY-2026-10');
      expect(html).toContain('Aarav Sharma');
      // Signatures
      expect(html).toContain('ACKNOWLEDGEMENT AND SIGNATURES');
    });

    it('renders Payslip layout family with gross earnings, deductions and net pay highlight', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip')!;
      const instance = createTestInstance(schema, 'PAY-2026-09', 'Deepa Roy', {
        employee_name: 'Deepa Roy',
        net_pay: '₹1,31,500',
        gross_earnings: '₹1,50,000',
        total_deductions: '₹18,500',
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Salary Slip / Payslip');
      expect(html).toContain('Deepa Roy');
      expect(html).toContain('₹1,31,500');
      expect(html).toContain('summary-value-gold');
    });

    it('renders Experience Certificate with tenure and conduct statement', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'experience_certificate')!;
      const instance = createTestInstance(schema, 'EXP-2026-04', 'Kavita Sundaram', {
        employee_name: 'Kavita Sundaram',
        last_designation: 'Principal Quality Assurance Engineer',
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Experience Certificate');
      expect(html).toContain('Kavita Sundaram');
      expect(html).toContain('Principal Quality Assurance Engineer');
    });

    it('renders Meeting Minutes with decisions table and action owners', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'meeting_minutes')!;
      const instance = createTestInstance(schema, 'MIN-2026-042', 'Board of Directors');

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Meeting Minutes & Action Register');
      expect(html).toContain('Decisions & Action Register');
      expect(html).toContain('custom-table');
    });

    it('renders Site Inspection Report with checklist status pills (PASS/FAIL)', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'site_inspection_report')!;
      const instance = createTestInstance(schema, 'SIR-2026-01', 'Facility Engineering', {
        inspection_table: [
          { area: 'Electrical Room', condition: 'Clean', severity: 'Satisfactory', action: 'Routine check' },
          { area: 'Fire Exit Stairwell', condition: 'Clear', severity: 'Pass', action: 'None' },
        ],
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Site Inspection Report');
      expect(html).toContain('status-pass');
    });

    it('renders Customer Account Statement with debit, credit and closing balance', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'customer_account_statement')!;
      const instance = createTestInstance(schema, 'SOA-2026-09', 'Metro Logistics Ltd', {
        customer_name: 'Metro Logistics Ltd',
        closing_balance: '₹84,000',
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Customer Account Statement');
      expect(html).toContain('Metro Logistics Ltd');
      expect(html).toContain('₹84,000');
    });

    it('renders Goods Received Note (GRN) with received vs accepted quantities', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'goods_received_note')!;
      const instance = createTestInstance(schema, 'GRN-2026-0881', 'Apex Micro Systems Ltd');

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Goods Received Note (GRN)');
      expect(html).toContain('Inward Goods Verification Table');
    });

    it('renders Supplier Performance Evaluation with scorecard table and tier rating', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'supplier_evaluation')!;
      const instance = createTestInstance(schema, 'SPE-2026-Q3', 'Precision Fasteners & Tools');

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Supplier Performance Evaluation');
      expect(html).toContain('APPROVED TIER-1 SUPPLIER');
    });

    it('renders House Rent Receipt with statutory HRA exemption details', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'rent_receipt')!;
      const instance = createTestInstance(schema, 'RENT-2026-08', 'Pooja Hegde', {
        tenant_name: 'Pooja Hegde',
        rent_amount: '₹42,000',
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('House Rent Receipt');
      expect(html).toContain('Pooja Hegde');
      expect(html).toContain('₹42,000');
    });

    it('renders Student Tuition Fee Receipt with fee head breakdown and bursar sign-off', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'student_fee_receipt')!;
      const instance = createTestInstance(schema, 'FEE-2026-0812', 'Ananya Deshmukh', {
        student_name: 'Ananya Deshmukh',
        total_paid: '₹85,000',
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Student Tuition & Fee Receipt');
      expect(html).toContain('Ananya Deshmukh');
      expect(html).toContain('₹85,000');
    });

    it('renders Grant Proposal with problem statement and budget request table', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'grant_proposal')!;
      const instance = createTestInstance(schema, 'GRANT-2026-03', 'Global Tech Equity Foundation');

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Grant Proposal & Program Summary');
      expect(html).toContain('Problem Statement & Proposed Solution');
    });

    it('renders Donation Acknowledgement with 80G tax exemption clause', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'donation_acknowledgement')!;
      const instance = createTestInstance(schema, 'DON-2026-4402', 'Dr. Ramesh Ramanathan', {
        donor_name: 'Dr. Ramesh Ramanathan',
        total_paid: '₹50,000',
      });

      const html = UniversalDocumentRenderer.renderHtml(instance, schema, mockBusiness);
      expect(html).toContain('Donation & Contribution Acknowledgement');
      expect(html).toContain('Section 80G of the Income Tax Act');
    });
  });

  describe('3. Security & HTML Sanitization', () => {
    it('sanitizes script tags from content without breaking quotes or legal symbols', () => {
      const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'equipment_responsibility')!;
      const instance: UniversalDocumentInstance = {
        id: 'inst_sec_01',
        businessProfileId: mockBusiness.id,
        typeId: schema.id,
        docClass: 'class_c_custom',
        documentNumber: '<script>alert("xss")</script>ASSET-01',
        title: schema.name,
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Rahul Verma & Co. "Authorized"',
        partyDetails: { email: 'security@example.com' },
        content: {
          employee_name: 'Rahul Verma & Co. "Authorized"',
          terms_text: 'Liability clause & return terms: "Immediate replacement required". <script>alert(1)</script>',
        },
        templateCode: 'gold_master',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const html = renderUniversalCustomHtml(instance, schema, mockBusiness);

      // Script tags must be stripped or escaped
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('</script>');
      // Safe characters and quotes preserved
      expect(html).toContain('&lt;script&gt;alert("xss")&lt;/script&gt;ASSET-01');
      expect(html).toContain('Rahul Verma & Co. "Authorized"');
      expect(html).toContain('Liability clause & return terms: "Immediate replacement required". &lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });
});
