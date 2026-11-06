/**
 * REAL PDF & PRINT FIDELITY VERIFICATION SUITE
 * 
 * Verifies real document rendering across:
 * 1. 5 Document Archetypes: Tax Invoice, Job Offer Letter, Work Order, Salary Slip, Student Fee Receipt
 * 2. 4 Logo Geometries: Wide Wordmark (4:1), Square Badge (1:1), Tall Seal (1:2), Transparent PNG
 * 3. Page Formats: A4 and US Letter with explicit safe printable margins
 * 4. Branding Palettes: Gold/Black Standard (#C59B27), Customer Brand (#2563EB), Pure Monochrome (#000000)
 * 5. Print Perfection: Zero overflow-x:hidden, separate @media print, and page break isolation
 * 6. Generates physical HTML artifact proofs to disk
 */

import * as fs from 'fs';
import * as path from 'path';
import { UniversalDocumentRenderer } from '../../src/services/pdf/UniversalDocumentRenderer';
import { renderTaxInvoiceGoldStandardHtml } from '../../src/services/pdf/templates/TaxInvoiceGoldStandardTemplate';
import { SYSTEM_SCHEMAS } from '../../src/domain/documents/universal/SystemSchemas';
import { BusinessProfile } from '../../src/domain/profile/types';
import { UniversalDocumentInstance } from '../../src/domain/documents/universal/types';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';

// Sample logo URIs with known dimensions/aspect ratios
const LOGO_WIDE_4X1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAADElEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const LOGO_SQUARE_1X1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const LOGO_TALL_1X2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACfailfAAAAEElEQVR42mNk+M9QDwAE/wF7p654kQAAAABJRU5ErkJggg==';
const LOGO_TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const ARTIFACT_DIR = path.resolve(__dirname, '../../test-artifacts');

const BASE_BUSINESS: BusinessProfile = {
  id: 'biz_fidelity_test',
  name: 'Apex Horizon Technologies',
  legal_name: 'Apex Horizon Technologies Private Limited',
  tax_id: '29ABCDE1234F1Z5',
  default_currency: 'INR',
  default_document_locale: 'en-IN',
  address_line1: 'Tower 4, Horizon Tech Park, Outer Ring Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  postal_code: '560103',
  country: 'IN',
  country_iso2: 'IN',
  phone: '+91 80 4123 4567',
  email: 'corporate@apexhorizon.com',
  website: 'www.apexhorizon.com',
  tagline: 'INNOVATION &bull; PRECISION &bull; SCALE',
  signatory_name: 'Dr. Anita Sen',
  signatory_title: 'Managing Director & CEO',
  bank_name: 'HDFC Bank Ltd.',
  bank_account_number: '50200099881122',
  bank_ifsc: 'HDFC0000240',
  bank_branch: 'Koramangala, Bengaluru',
  logo_uri: LOGO_WIDE_4X1,
  is_active: 1,
  created_at: Date.now(),
  updated_at: Date.now(),
};

function createInstance(
  schemaCode: string,
  docNumber: string,
  partyName: string,
  content: Record<string, any> = {}
): UniversalDocumentInstance {
  const schema = SYSTEM_SCHEMAS.find((s) => s.code === schemaCode)!;
  return {
    id: `inst_${schemaCode}_${Date.now()}`,
    businessProfileId: BASE_BUSINESS.id,
    typeId: schema.id,
    docClass: schema.docClass,
    documentNumber: docNumber,
    title: schema.name,
    status: 'issued',
    issueDate: Date.now(),
    partyName,
    partyDetails: {
      address: 'Plot 71, Cyber Park Phase 1, Whitefield, Bengaluru',
      phone: '+91 98450 12345',
      email: 'counterparty@apexhorizon.com',
    },
    content,
    templateCode: schema.defaultTemplate,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('Real PDF & Print Layout Fidelity Suite', () => {
  beforeAll(() => {
    if (!fs.existsSync(ARTIFACT_DIR)) {
      try {
        fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
      } catch {
        // Artifact dir may be managed externally
      }
    }
  });

  describe('Gate 1: Responsive Logo Geometry Across 4 Geometries', () => {
    const jobOfferSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;

    it('preserves Wide Wordmark (4:1) with max-width: 240px and max-height: 75px', () => {
      const biz = { ...BASE_BUSINESS, logo_uri: LOGO_WIDE_4X1 };
      const inst = createInstance('job_offer_letter', 'OFF-2026-WIDE', 'Rohan Mehta');
      const html = UniversalDocumentRenderer.renderHtml(inst, jobOfferSchema, biz);

      expect(html).toContain('max-width: 240px');
      expect(html).toContain('max-height: 75px');
      expect(html).toContain('object-fit: contain');
      expect(html).toContain(`<img src="${LOGO_WIDE_4X1}"`);
      expect(html).not.toContain('width: 72px;\n      height: 72px;');
    });

    it('preserves Square Crest (1:1) without forced squashing', () => {
      const biz = { ...BASE_BUSINESS, logo_uri: LOGO_SQUARE_1X1 };
      const inst = createInstance('job_offer_letter', 'OFF-2026-SQ', 'Rohan Mehta');
      const html = UniversalDocumentRenderer.renderHtml(inst, jobOfferSchema, biz);

      expect(html).toContain(`<img src="${LOGO_SQUARE_1X1}"`);
      expect(html).toContain('max-width: 240px');
      expect(html).toContain('max-height: 75px');
    });

    it('preserves Tall Seal (1:2) with aspect-ratio containment', () => {
      const biz = { ...BASE_BUSINESS, logo_uri: LOGO_TALL_1X2 };
      const inst = createInstance('job_offer_letter', 'OFF-2026-TALL', 'Rohan Mehta');
      const html = UniversalDocumentRenderer.renderHtml(inst, jobOfferSchema, biz);

      expect(html).toContain(`<img src="${LOGO_TALL_1X2}"`);
      expect(html).toContain('object-fit: contain');
    });

    it('handles Transparent PNG/SVG cleanly on white background', () => {
      const biz = { ...BASE_BUSINESS, logo_uri: LOGO_TRANSPARENT };
      const inst = createInstance('job_offer_letter', 'OFF-2026-TRANS', 'Rohan Mehta');
      const html = UniversalDocumentRenderer.renderHtml(inst, jobOfferSchema, biz);

      expect(html).toContain(`<img src="${LOGO_TRANSPARENT}"`);
      expect(html).toContain('background: #FFFFFF');
    });
  });

  describe('Gate 2: Page Geometry & Margin Fidelity (A4 vs Letter)', () => {
    const woSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order')!;

    it('renders A4 with explicit millimeter print margins and zero overflow-x clipping', () => {
      const inst = createInstance('work_order', 'WO-A4-01', 'Techno Infra');
      const html = UniversalDocumentRenderer.renderHtml(inst, woSchema, BASE_BUSINESS, 'a4');

      expect(html).toContain('size: A4 portrait');
      expect(html).toContain('margin: 10mm 12mm 12mm 12mm');
      expect(html).not.toContain('overflow-x: hidden');
      expect(html).toContain('overflow: visible');
      expect(html).toContain('@media print');
      expect(html).toContain('page-break-inside: avoid');
    });

    it('renders US Letter with explicit inch print margins', () => {
      const inst = createInstance('work_order', 'WO-LTR-01', 'Techno Infra');
      const html = UniversalDocumentRenderer.renderHtml(inst, woSchema, BASE_BUSINESS, 'letter');

      expect(html).toContain('size: letter portrait');
      expect(html).toContain('margin: 0.5in 0.45in 0.55in 0.45in');
      expect(html).not.toContain('overflow-x: hidden');
    });
  });

  describe('Gate 3: Multi-Palette Brand Freedom (Monochrome vs Gold vs Brand)', () => {
    const salarySchema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip')!;

    it('renders default Gold/Black Enterprise Master palette (#C59B27)', () => {
      const inst = createInstance('salary_slip', 'PAY-GOLD-01', 'Sunil Narang', {
        net_pay: '₹1,45,000',
      });
      const html = UniversalDocumentRenderer.renderHtml(inst, salarySchema, BASE_BUSINESS);

      expect(html).toContain('#C59B27');
      expect(html).toContain('#111827');
      expect(html).toContain('₹1,45,000');
    });

    it('renders customer custom corporate brand color (#2563EB)', () => {
      const inst = createInstance('salary_slip', 'PAY-BLUE-01', 'Sunil Narang', {
        net_pay: '₹1,45,000',
      });
      const customConfig = {
        template_code: 'standard',
        brand_color: '#2563EB',
      };
      const html = UniversalDocumentRenderer.renderHtml(inst, salarySchema, BASE_BUSINESS, 'a4', customConfig);

      expect(html).toContain('#2563EB');
      expect(html).toContain('₹1,45,000');
    });

    it('renders Pure Monochrome Minimal palette when selected', () => {
      const inst = createInstance('salary_slip', 'PAY-MONO-01', 'Sunil Narang', {
        net_pay: '₹1,45,000',
      });
      const monoConfig = {
        template_code: 'monochrome_minimal',
      };
      const html = UniversalDocumentRenderer.renderHtml(inst, salarySchema, BASE_BUSINESS, 'a4', monoConfig);

      expect(html).toContain('#000000');
      expect(html).not.toContain('#C59B27');
    });
  });

  describe('Gate 4: 5 Working Archetypes & Physical HTML Proof Generation', () => {
    it('1. Generates Tax Invoice Gold Standard HTML proof', () => {
      const mockInvoiceDoc: FullDocument = ({
        id: 'doc_tax_fidelity_01',
        business_profile_id: BASE_BUSINESS.id,
        doc_type: 'invoice',
        document_number: 'INV-2026-FIDELITY-01',
        issue_date: Date.now(),
        due_date: Date.now() + 30 * 86400000,
        subtotal_minor: 25000000n as any,
        tax_minor: 4500000n as any,
        discount_minor: 0n as any,
        deposit_minor: 0n as any,
        total_minor: 29500000n as any,
        currency: 'INR',
        lifecycle_status: 'issued',
        is_archived: 0,
        customer_id: 'cust_01',
        customer_name: 'Metro Infrastructure Ltd.',
        customer_business_name: 'Metro Infrastructure Solutions Ltd.',
        customer_tax_id: '29ABCDE5555F1Z9',
        customer_billing_address: '100 Metro Boulevard, Whitefield, Bengaluru - 560066',
        items: [
          {
            id: 'item_1',
            document_id: 'doc_tax_fidelity_01',
            catalog_item_id: null,
            item_notes: null,
            description: 'Enterprise Cloud Architecture Consulting & Review',
            quantity_scaled: 10000n as any,
            unit_name: 'Phase',
            unit_price_minor: 15000000n as any,
            line_total_minor: 15000000n as any,
            tax_rate_bp: 1800,
            tax_minor: 2700000n as any,
            sort_order: 1,
            hsn_sac: '998313',
          },
          {
            id: 'item_2',
            document_id: 'doc_tax_fidelity_01',
            catalog_item_id: null,
            item_notes: null,
            description: 'Kubernetes Platform Provisioning & High-Availability Setup',
            quantity_scaled: 10000n as any,
            unit_name: 'Cluster',
            unit_price_minor: 10000000n as any,
            line_total_minor: 10000000n as any,
            tax_rate_bp: 1800,
            tax_minor: 1800000n as any,
            sort_order: 2,
            hsn_sac: '998314',
          },
        ],
        created_at: Date.now(),
        updated_at: Date.now(),
      } as unknown as FullDocument);

      const html = renderTaxInvoiceGoldStandardHtml(mockInvoiceDoc, BASE_BUSINESS, 'a4');
      expect(html).toContain('INV-2026-FIDELITY-01');
      expect(html).toContain('Metro Infrastructure Solutions Ltd.');
      expect(html).toContain('Enterprise Cloud Architecture Consulting');
      expect(html).not.toContain('overflow-x: hidden');

      const outPath = path.join(ARTIFACT_DIR, 'proof_fidelity_tax_invoice.html');
      fs.writeFileSync(outPath, html, 'utf8');
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('2. Generates Job Offer Letter HTML proof', () => {
      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
      const inst = createInstance('job_offer_letter', 'OFF-2026-902', 'Devika Patel', {
        candidate_name: 'Devika Patel',
        job_title: 'Lead Distributed Systems Architect',
        department: 'Platform Engineering',
        annual_salary_ctc: '3,200,000',
        joining_date: '2026-11-01',
        work_location: 'Bengaluru, India (Hybrid)',
      });

      const html = UniversalDocumentRenderer.renderHtml(inst, offerSchema, BASE_BUSINESS, 'a4');
      expect(html).toContain('JOB OFFER LETTER');
      expect(html).toContain('Devika Patel');
      expect(html).toContain('Lead Distributed Systems Architect');
      expect(html).toContain('₹3,200,000');
      expect(html).not.toContain('overflow-x: hidden');

      const outPath = path.join(ARTIFACT_DIR, 'proof_fidelity_job_offer.html');
      fs.writeFileSync(outPath, html, 'utf8');
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('3. Generates Work Order / Job Card HTML proof', () => {
      const woSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order')!;
      const inst = createInstance('work_order', 'WO-2026-440', 'L&T Infotech Facility', {
        customer_name: 'L&T Infotech Facility',
        asset_equipment: 'Primary High-Voltage Transformer Unit 2',
        assigned_technician: 'Ramesh K. (Certified HV Inspector)',
        work_category: 'Statutory Annual Inspection & Oil Dielectric Testing',
        work_description: 'Carry out dissolved gas analysis, test dielectric breakdown voltage of transformer oil, clean high-voltage bushings, and verify earthing resistance.',
      });

      const html = UniversalDocumentRenderer.renderHtml(inst, woSchema, BASE_BUSINESS, 'a4');
      expect(html).toContain('WORK ORDER / JOB CARD');
      expect(html).toContain('L&amp;T Infotech Facility');
      expect(html).toContain('Primary High-Voltage Transformer Unit 2');
      expect(html).not.toContain('overflow-x: hidden');

      const outPath = path.join(ARTIFACT_DIR, 'proof_fidelity_work_order.html');
      fs.writeFileSync(outPath, html, 'utf8');
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('4. Generates Salary Slip / Payslip HTML proof', () => {
      const salarySchema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip')!;
      const inst = createInstance('salary_slip', 'PAY-2026-10-88', 'Pooja Hegde', {
        employee_name: 'Pooja Hegde',
        employee_id: 'EMP-1049',
        designation: 'Senior DevOps Architect',
        pay_period: 'October 2026',
        gross_earnings: '₹1,85,000',
        total_deductions: '₹22,400',
        net_pay: '₹1,62,600',
      });

      const html = UniversalDocumentRenderer.renderHtml(inst, salarySchema, BASE_BUSINESS, 'a4');
      expect(html).toContain('Salary Slip / Payslip');
      expect(html).toContain('Pooja Hegde');
      expect(html).toContain('₹1,62,600');
      expect(html).not.toContain('overflow-x: hidden');

      const outPath = path.join(ARTIFACT_DIR, 'proof_fidelity_salary_slip.html');
      fs.writeFileSync(outPath, html, 'utf8');
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('5. Generates Student Fee Receipt HTML proof', () => {
      const feeSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'student_fee_receipt')!;
      const inst = createInstance('student_fee_receipt', 'FEE-2026-SEM5-12', 'Arjun Varma', {
        student_name: 'Arjun Varma',
        enrollment_id: 'STU-2024-CSE-091',
        academic_program: 'B.Tech Computer Science & Engineering',
        semester: 'Semester V (Fall 2026)',
        total_paid: '₹85,000',
        balance_due: '₹0.00',
      });

      const html = UniversalDocumentRenderer.renderHtml(inst, feeSchema, BASE_BUSINESS, 'a4');
      expect(html).toContain('Student Tuition & Fee Receipt');
      expect(html).toContain('Arjun Varma');
      expect(html).toContain('₹85,000');
      expect(html).not.toContain('overflow-x: hidden');

      const outPath = path.join(ARTIFACT_DIR, 'proof_fidelity_student_fee_receipt.html');
      fs.writeFileSync(outPath, html, 'utf8');
      expect(fs.existsSync(outPath)).toBe(true);
    });
  });
});
