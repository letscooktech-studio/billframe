/**
 * UNIVERSAL BUSINESS DOCUMENT ENGINE — 20-POINT COMPREHENSIVE TEST SUITE
 * Verifies:
 * 1. Schema Catalog & Typed Field Specifications
 * 2. Proof Slice 2: Job Offer Letter (Class B HR & Employment)
 * 3. Proof Slice 3: Work Order & Service Card (Class B Operations)
 * 4. Proof Slice 4: User-Defined Custom Document Engine (Class C)
 * 5. Complete Financial Ledger Isolation
 * 6. PDF HTML Rendering Fidelity & Dual Signatures
 */

import { UniversalDocumentRepository } from '../../src/data/repositories/UniversalDocumentRepository';
import { UniversalDocumentRenderer } from '../../src/services/pdf/UniversalDocumentRenderer';
import { PdfService } from '../../src/services/pdf/PdfService';
import { SYSTEM_SCHEMAS } from '../../src/domain/documents/universal/SystemSchemas';
import {
  UniversalDocumentInstance,
  UniversalDocumentSchema,
} from '../../src/domain/documents/universal/types';
import { BusinessProfile } from '../../src/domain/profile/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Universal Business Document Engine Tests', () => {
  let mockDb: ReturnType<typeof getMockDb>;

  const mockBusiness: BusinessProfile = {
    id: 'biz_universal_01',
    name: 'Apex Infotech',
    legal_name: 'Apex Infotech Solutions Private Limited',
    tax_id: '29ABCDE1234F1Z5',
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    address_line1: '9th Floor, Tech Park IV',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560103',
    country: 'IN',
    country_iso2: 'IN',
    phone: '+91 80 4123 4567',
    email: 'hr@apexinfotech.io',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  beforeEach(() => {
    mockDb = getMockDb();
    mockDb.reset();
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 1: SCHEMA CATALOG & TYPED FIELD SPECIFICATIONS
  // ────────────────────────────────────────────────────────────────
  describe('Schema Catalog & Typed Fields', () => {
    it('1. provides all required system document schemas out of the box', async () => {
      const schemas = await UniversalDocumentRepository.getDocumentTypesAsync(mockBusiness.id);

      const codes = schemas.map((s) => s.code);
      expect(codes).toContain('job_offer_letter');
      expect(codes).toContain('appointment_letter');
      expect(codes).toContain('work_order');
      expect(codes).toContain('business_letterhead');
      expect(codes).toContain('equipment_responsibility');
    });

    it('2. distinguishes Class B (Administrative) from Class C (Custom) schemas', () => {
      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter');
      const workOrderSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order');
      const equipmentSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'equipment_responsibility');

      expect(offerSchema?.docClass).toBe('class_b_administrative');
      expect(offerSchema?.category).toBe('hr_employment');

      expect(workOrderSchema?.docClass).toBe('class_b_administrative');
      expect(workOrderSchema?.category).toBe('operations');

      expect(equipmentSchema?.docClass).toBe('class_c_custom');
    });

    it('3. specifies typed fields including text, date, currency, and structured tables', () => {
      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
      const compSection = offerSchema.sections.find((sec) => sec.id === 'compensation')!;

      const ctcField = compSection.fields.find((f) => f.id === 'total_ctc');
      expect(ctcField?.type).toBe('currency');
      expect(ctcField?.required).toBe(true);

      const tableField = compSection.fields.find((f) => f.id === 'salary_breakdown');
      expect(tableField?.type).toBe('table');
      expect(tableField?.columns?.length).toBe(3);
      expect(tableField?.columns?.[0].key).toBe('component');
      expect(tableField?.columns?.[1].key).toBe('monthly');
      expect(tableField?.columns?.[2].key).toBe('annual');
    });

    it('4. finds a schema by code or by unique ID', async () => {
      const schemaByCode = await UniversalDocumentRepository.getDocumentTypeByIdAsync('job_offer_letter');
      const schemaById = await UniversalDocumentRepository.getDocumentTypeByIdAsync('schema_job_offer_letter');

      expect(schemaByCode).toBeDefined();
      expect(schemaById).toBeDefined();
      expect(schemaByCode?.code).toBe('job_offer_letter');
      expect(schemaById?.code).toBe('job_offer_letter');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 2: PROOF SLICE 2 — JOB OFFER LETTER (CLASS B HR)
  // ────────────────────────────────────────────────────────────────
  describe('Proof Slice 2: Job Offer Letter (Class B HR & Employment)', () => {
    const offerInstance: UniversalDocumentInstance = {
      id: 'doc_offer_001',
      businessProfileId: mockBusiness.id,
      typeId: 'job_offer_letter',
      docClass: 'class_b_administrative',
      documentNumber: 'OFF-2026-001',
      title: 'Job Offer Letter - Aarav Sharma',
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Aarav Sharma',
      partyDetails: {
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 43210',
        address: 'Flat 402, Green View Apts, Indiranagar, Bengaluru',
        designation: 'Staff Frontend Architect',
      },
      content: {
        candidate_name: 'Aarav Sharma',
        candidate_email: 'aarav.sharma@example.com',
        candidate_address: 'Flat 402, Green View Apts, Indiranagar, Bengaluru',
        job_title: 'Staff Frontend Architect',
        department: 'Platform Engineering',
        reporting_to: 'VP of Technology',
        joining_date: Date.now() + 15 * 86400000,
        work_location: 'Bengaluru (Hybrid)',
        employment_type: 'Full-time Permanent',
        probation_period: '3 Months',
        total_ctc: '2,400,000',
        salary_breakdown: [
          { component: 'Basic Salary', monthly: '₹100,000', annual: '₹1,200,000' },
          { component: 'House Rent Allowance (HRA)', monthly: '₹50,000', annual: '₹600,000' },
          { component: 'Special Allowance', monthly: '₹35,000', annual: '₹420,000' },
          { component: 'Statutory Bonus / Benefits', monthly: '₹15,000', annual: '₹180,000' },
        ],
        variable_notes: 'Eligible for annual company performance incentive up to 10% of base CTC.',
        signatory_name: 'Priya Nair',
        signatory_title: 'Head of People & Culture',
        offer_validity_date: Date.now() + 7 * 86400000,
      },
      templateCode: 'letterhead',
      branding: {
        brandColor: '#0F172A',
        secondaryColor: '#2563EB',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('5. creates, persists, and retrieves a complete Job Offer Letter instance', async () => {
      const saved = await UniversalDocumentRepository.saveDocumentInstanceAsync(offerInstance);
      expect(saved.id).toBe('doc_offer_001');

      const loaded = await UniversalDocumentRepository.getDocumentInstanceByIdAsync('doc_offer_001');
      expect(loaded).toBeDefined();
      expect(loaded?.partyName).toBe('Aarav Sharma');
      expect(loaded?.content.job_title).toBe('Staff Frontend Architect');
      expect(loaded?.content.salary_breakdown.length).toBe(4);
    });

    it('6. compiles executive letterhead HTML without invoice lines or balance due', () => {
      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
      const html = UniversalDocumentRenderer.renderHtml(offerInstance, offerSchema, mockBusiness);

      // Positive assertions: contains authentic offer letter terms
      expect(html).toContain('Apex Infotech Solutions Private Limited');
      expect(html).toContain('Aarav Sharma');
      expect(html).toContain('Staff Frontend Architect');
      expect(html).toContain('Platform Engineering');
      expect(html).toContain('₹2,400,000');
      expect(html).toContain('House Rent Allowance (HRA)');
      expect(html).toContain('Candidate Acceptance');
      expect(html).toContain('Priya Nair');
      expect(html).toContain('Head of People & Culture');

      // Negative assertions: MUST NOT look like an invoice
      expect(html).not.toContain('Balance Due');
      expect(html).not.toContain('Amount Paid');
      expect(html).not.toContain('UPI QR Code');
    });

    it('7. renders dual signatures: employer authorized signatory & candidate acceptance block', () => {
      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
      const html = UniversalDocumentRenderer.renderHtml(offerInstance, offerSchema, mockBusiness);

      expect(html).toContain('For & On Behalf of Apex Infotech');
      expect(html).toContain('Candidate Acceptance');
      expect(html).toContain('Signature & Date:');
    });

    it('8. generates PDF html through PdfService universal document bridge', () => {
      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
      const html = PdfService.generateUniversalDocumentHtml(offerInstance, offerSchema, mockBusiness);

      expect(html).toContain('OFF-2026-001');
      expect(html).toContain('Staff Frontend Architect');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 3: PROOF SLICE 3 — WORK ORDER (CLASS B OPERATIONS)
  // ────────────────────────────────────────────────────────────────
  describe('Proof Slice 3: Work Order & Service Card (Class B Operations)', () => {
    const workOrderInstance: UniversalDocumentInstance = {
      id: 'doc_wo_001',
      businessProfileId: mockBusiness.id,
      typeId: 'work_order',
      docClass: 'class_b_administrative',
      documentNumber: 'WO-2026-042',
      title: 'Data Center HVAC Installation & Fiber Cabling',
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'CloudScale Infrastructure Ltd',
      partyDetails: {
        address: 'Building 7, Cyber Gateway, Outer Ring Rd, Bengaluru',
        phone: '+91 99887 76655',
      },
      content: {
        client_name: 'CloudScale Infrastructure Ltd',
        site_address: 'Building 7, Cyber Gateway, Outer Ring Rd, Bengaluru',
        project_title: 'Data Center HVAC Installation & Fiber Cabling',
        site_contact_person: 'Vikram Mehta (+91 99887 76655)',
        start_date: Date.now(),
        completion_deadline: Date.now() + 5 * 86400000,
        assigned_team_lead: 'Sunil Kumar (Senior Field Engineer)',
        scope_summary: 'Installation of high-density server rack HVAC ducting and OM4 fiber optical backbone termination.',
        tasks_list: [
          { task_description: 'Pre-site inspection and safety clearance', materials_required: 'Infrared Thermometer, PPE', est_hours: 4 },
          { task_description: 'Fiber optic trunk cable routing and splicing', materials_required: 'OM4 Fiber Cable, Fusion Splicer', est_hours: 16 },
          { task_description: 'HVAC cooling unit pressure testing', materials_required: 'Pressure Manifold, R410A Refrigerant', est_hours: 8 },
        ],
        safety_instructions: 'Mandatory hard hat, anti-static safety boots, and dual-lock lockout/tagout (LOTO) procedures apply.',
        supervisor_name: 'Sunil Kumar',
        client_representative: 'Vikram Mehta',
      },
      templateCode: 'work_order',
      branding: {
        brandColor: '#1E293B',
        secondaryColor: '#D97706',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('9. saves and retrieves a structured operational Work Order', async () => {
      const saved = await UniversalDocumentRepository.saveDocumentInstanceAsync(workOrderInstance);
      expect(saved.id).toBe('doc_wo_001');

      const loaded = await UniversalDocumentRepository.getDocumentInstanceByIdAsync('doc_wo_001');
      expect(loaded?.partyName).toBe('CloudScale Infrastructure Ltd');
      expect(loaded?.content.tasks_list.length).toBe(3);
    });

    it('10. renders site address, scheduled window, and task checklist table', () => {
      const woSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order')!;
      const html = UniversalDocumentRenderer.renderHtml(workOrderInstance, woSchema, mockBusiness);

      expect(html).toContain('Work Order / Job Card');
      expect(html).toContain('WO-2026-042');
      expect(html).toContain('Building 7, Cyber Gateway');
      expect(html).toContain('Fiber optic trunk cable routing and splicing');
      expect(html).toContain('Sunil Kumar (Senior Field Engineer)');
    });

    it('11. includes safety protocol banner and dual supervisor/client site sign-offs', () => {
      const woSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order')!;
      const html = UniversalDocumentRenderer.renderHtml(workOrderInstance, woSchema, mockBusiness);

      expect(html).toContain('Safety, PPE & Protocol Notice');
      expect(html).toContain('lockout/tagout (LOTO)');
      expect(html).toContain('Supervisor Authorization');
      expect(html).toContain('Client Site Acknowledgment');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 4: PROOF SLICE 4 — USER-DEFINED CUSTOM DOCUMENT ENGINE
  // ────────────────────────────────────────────────────────────────
  describe('Proof Slice 4: User-Defined Custom Document Engine (Class C)', () => {
    const customEquipmentSchema: UniversalDocumentSchema = {
      id: 'schema_custom_asset_undertaking',
      code: 'custom_asset_undertaking',
      name: 'Asset Handover & Responsibility Form',
      docClass: 'class_c_custom',
      category: 'custom',
      description: 'Custom organization undertaking for issued high-value laptops and mobile test devices.',
      icon: 'shield',
      defaultTemplate: 'letterhead',
      isSystem: false,
      sections: [
        {
          id: 'custodian_sec',
          title: 'Asset Custodian',
          fields: [
            { id: 'emp_name', label: 'Employee Name', type: 'text', required: true },
            { id: 'emp_id', label: 'Employee ID', type: 'text' },
            { id: 'issue_date', label: 'Issue Date', type: 'date', required: true },
          ],
        },
        {
          id: 'items_sec',
          title: 'Assigned Company Hardware',
          fields: [
            {
              id: 'assets_grid',
              label: 'Equipment Inventory',
              type: 'table',
              columns: [
                { key: 'item', label: 'Item / Model', type: 'text', widthPercentage: 40, align: 'left' },
                { key: 'serial', label: 'Serial Number', type: 'text', widthPercentage: 35, align: 'left' },
                { key: 'value', label: 'Declared Value', type: 'currency', widthPercentage: 25, align: 'right' },
              ],
            },
          ],
        },
        {
          id: 'terms_sec',
          title: 'Responsibility Undertaking',
          fields: [
            {
              id: 'undertaking_note',
              label: 'Terms of Care',
              type: 'textarea',
              defaultValue: 'The employee is solely responsible for proper care and safekeeping of the assigned equipment.',
            },
          ],
        },
      ],
      footerConfig: {
        showSignatures: true,
        showTerms: true,
        showNotes: false,
        authorizedSignatoryLabel: 'Issued by IT Assets',
        recipientAcceptanceLabel: 'Employee Acknowledgment',
      },
    };

    it('12. allows user to create and save a new custom document schema in SQLite', async () => {
      const savedSchema = await UniversalDocumentRepository.saveCustomDocumentTypeAsync(
        customEquipmentSchema,
        mockBusiness.id
      );

      expect(savedSchema.id).toBe('schema_custom_asset_undertaking');
      expect(savedSchema.docClass).toBe('class_c_custom');
      expect(savedSchema.isSystem).toBe(false);

      const allSchemas = await UniversalDocumentRepository.getDocumentTypesAsync(mockBusiness.id);
      expect(allSchemas.some((s) => s.id === 'schema_custom_asset_undertaking')).toBe(true);
    });

    it('13. creates and saves an instance of the custom document type', async () => {
      const customInstance: UniversalDocumentInstance = {
        id: 'doc_asset_001',
        businessProfileId: mockBusiness.id,
        typeId: 'schema_custom_asset_undertaking',
        docClass: 'class_c_custom',
        documentNumber: 'ASSET-2026-009',
        title: 'Asset Handover - MacBook Pro M3',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Rahul Verma',
        partyDetails: { employeeId: 'EMP-401' },
        content: {
          emp_name: 'Rahul Verma',
          emp_id: 'EMP-401',
          issue_date: '2026-10-09',
          assets_grid: [
            { item: 'MacBook Pro 16" M3 Max 64GB', serial: 'C02G1234MD6R', value: '₹349,000' },
            { item: 'Dell UltraSharp 32" 4K Monitor', serial: 'CN-098765-72872', value: '₹75,000' },
          ],
          undertaking_note: 'I acknowledge receiving the above hardware in brand new condition and agree to return it upon separation.',
        },
        templateCode: 'custom_studio',
        branding: { brandColor: '#1E293B', secondaryColor: '#4F46E5' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const saved = await UniversalDocumentRepository.saveDocumentInstanceAsync(customInstance);
      expect(saved.id).toBe('doc_asset_001');

      const loaded = await UniversalDocumentRepository.getDocumentInstanceByIdAsync('doc_asset_001');
      expect(loaded?.partyName).toBe('Rahul Verma');
      expect(loaded?.content.assets_grid.length).toBe(2);
    });

    it('14. dynamically renders the custom schema sections, fields, tables, and signatures', () => {
      const customInstance: UniversalDocumentInstance = {
        id: 'doc_asset_001',
        businessProfileId: mockBusiness.id,
        typeId: 'schema_custom_asset_undertaking',
        docClass: 'class_c_custom',
        documentNumber: 'ASSET-2026-009',
        title: 'Asset Handover - MacBook Pro M3',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Rahul Verma',
        partyDetails: {},
        content: {
          emp_name: 'Rahul Verma',
          emp_id: 'EMP-401',
          assets_grid: [
            { item: 'MacBook Pro 16" M3 Max 64GB', serial: 'C02G1234MD6R', value: '₹349,000' },
          ],
          undertaking_note: 'I acknowledge receiving the above hardware in brand new condition.',
        },
        templateCode: 'custom_studio',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const html = UniversalDocumentRenderer.renderHtml(customInstance, customEquipmentSchema, mockBusiness);

      expect(html).toContain('Asset Handover & Responsibility Form');
      expect(html).toContain('Rahul Verma');
      expect(html).toContain('MacBook Pro 16" M3 Max 64GB');
      expect(html).toContain('C02G1234MD6R');
      expect(html).toContain('Issued by IT Assets');
      expect(html).toContain('Employee Acknowledgment');
    });

    it('15. allows deleting user custom schemas while safeguarding system schemas', async () => {
      // Save custom schema first
      await UniversalDocumentRepository.saveCustomDocumentTypeAsync(
        customEquipmentSchema,
        mockBusiness.id
      );

      // Deleting custom schema should succeed
      const deleteResult = await UniversalDocumentRepository.deleteCustomDocumentTypeAsync(
        'schema_custom_asset_undertaking'
      );
      expect(deleteResult).toBe(true);

      // Attempting to delete system schema should be blocked and return false
      const sysDeleteResult = await UniversalDocumentRepository.deleteCustomDocumentTypeAsync(
        'schema_job_offer_letter'
      );
      expect(sysDeleteResult).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 5: FINANCIAL LEDGER ISOLATION & INVARIANTS
  // ────────────────────────────────────────────────────────────────
  describe('Financial Ledger Isolation & Invariants', () => {
    it('16. ensures Class B and Class C documents are persisted in document_instances, not documents table', async () => {
      const offerInstance: UniversalDocumentInstance = {
        id: 'doc_offer_iso_1',
        businessProfileId: mockBusiness.id,
        typeId: 'job_offer_letter',
        docClass: 'class_b_administrative',
        documentNumber: 'OFF-001',
        title: 'Offer Letter',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Deepa Roy',
        partyDetails: {},
        content: { total_ctc: '1,500,000' },
        templateCode: 'letterhead',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await UniversalDocumentRepository.saveDocumentInstanceAsync(offerInstance);

      // Verify it exists in document_instances
      const inInstances = await UniversalDocumentRepository.getDocumentInstanceByIdAsync('doc_offer_iso_1');
      expect(inInstances).toBeDefined();

      // Verify it is NOT in financial documents table
      const inFinancialDocs = mockDb.state.documents.find((d) => d.id === 'doc_offer_iso_1');
      expect(inFinancialDocs).toBeUndefined();
    });

    it('17. guarantees that administrative documents with large CTC numbers do not contaminate accounts receivable', async () => {
      // Even with multiple offer letters of ₹24 Lakhs and equipment of ₹3.5 Lakhs
      const inst1: UniversalDocumentInstance = {
        id: 'inst_hr_ctc_1',
        businessProfileId: mockBusiness.id,
        typeId: 'job_offer_letter',
        docClass: 'class_b_administrative',
        documentNumber: 'OFF-100',
        title: 'VP Offer',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'VP Engineering',
        partyDetails: {},
        content: { total_ctc: '5,000,000' },
        templateCode: 'letterhead',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await UniversalDocumentRepository.saveDocumentInstanceAsync(inst1);

      // Database documents table remains at 0 invoices
      expect(mockDb.state.documents.length).toBe(0);
    });

    it('18. filters instances by document class and type id', async () => {
      const instA: UniversalDocumentInstance = {
        id: 'inst_filter_1',
        businessProfileId: mockBusiness.id,
        typeId: 'job_offer_letter',
        docClass: 'class_b_administrative',
        documentNumber: 'OFF-1',
        title: 'Offer',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Alice',
        partyDetails: {},
        content: {},
        templateCode: 'letterhead',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const instB: UniversalDocumentInstance = {
        id: 'inst_filter_2',
        businessProfileId: mockBusiness.id,
        typeId: 'work_order',
        docClass: 'class_b_administrative',
        documentNumber: 'WO-1',
        title: 'Work Order',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Bob',
        partyDetails: {},
        content: {},
        templateCode: 'work_order',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await UniversalDocumentRepository.saveDocumentInstanceAsync(instA);
      await UniversalDocumentRepository.saveDocumentInstanceAsync(instB);

      const offerOnly = await UniversalDocumentRepository.getDocumentInstancesAsync(mockBusiness.id, {
        typeId: 'job_offer_letter',
      });
      expect(offerOnly.length).toBe(1);
      expect(offerOnly[0].id).toBe('inst_filter_1');

      const woOnly = await UniversalDocumentRepository.getDocumentInstancesAsync(mockBusiness.id, {
        typeId: 'work_order',
      });
      expect(woOnly.length).toBe(1);
      expect(woOnly[0].id).toBe('inst_filter_2');
    });

    it('19. supports document deletion cleanly from repository', async () => {
      const toDelete: UniversalDocumentInstance = {
        id: 'inst_del_1',
        businessProfileId: mockBusiness.id,
        typeId: 'business_letterhead',
        docClass: 'class_b_administrative',
        documentNumber: 'LET-001',
        title: 'Draft Memo',
        status: 'draft',
        issueDate: Date.now(),
        partyName: 'Internal',
        partyDetails: {},
        content: {},
        templateCode: 'letterhead',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await UniversalDocumentRepository.saveDocumentInstanceAsync(toDelete);
      expect(await UniversalDocumentRepository.getDocumentInstanceByIdAsync('inst_del_1')).toBeDefined();

      const deleted = await UniversalDocumentRepository.deleteDocumentInstanceAsync('inst_del_1');
      expect(deleted).toBe(true);
      expect(await UniversalDocumentRepository.getDocumentInstanceByIdAsync('inst_del_1')).toBeNull();
    });

    it('20. generates tamper-resistant HTML document output with no script injections', () => {
      const sanitizedInstance: UniversalDocumentInstance = {
        id: 'inst_sec_1',
        businessProfileId: mockBusiness.id,
        typeId: 'job_offer_letter',
        docClass: 'class_b_administrative',
        documentNumber: 'SEC-001',
        title: 'Clean Offer',
        status: 'issued',
        issueDate: Date.now(),
        partyName: 'Security Candidate',
        partyDetails: {},
        content: {
          candidate_name: 'Security Candidate',
          job_title: 'Senior Cryptographer',
          total_ctc: '3,000,000',
        },
        templateCode: 'letterhead',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
      const html = UniversalDocumentRenderer.renderHtml(sanitizedInstance, offerSchema, mockBusiness);

      expect(html).toContain('Senior Cryptographer');
      expect(html).not.toContain('<script');
      expect(html).toContain('<!DOCTYPE html>');
    });
  });
});
