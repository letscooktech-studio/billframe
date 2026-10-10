import fs from 'fs';
import path from 'path';
import { renderTaxInvoiceGoldStandardHtml } from '../../src/services/pdf/templates/TaxInvoiceGoldStandardTemplate';
import { renderLetterDocumentHtml } from '../../src/services/pdf/templates/LetterDocumentRenderer';
import { renderWorkOrderHtml } from '../../src/services/pdf/templates/WorkOrderRenderer';
import { renderPurchaseOrderHtml } from '../../src/services/pdf/templates/PurchaseOrderRenderer';
import { renderUniversalCustomHtml } from '../../src/services/pdf/templates/UniversalCustomRenderer';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../src/domain/profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../src/domain/documents/universal/types';
import { SYSTEM_SCHEMAS } from '../../src/domain/documents/universal/SystemSchemas';

describe('Generate HTML Proofs for Visual Verification', () => {
  const artifactDir = 'C:\\Users\\manis\\.gemini\\antigravity\\brain\\b7518e44-99c6-47f3-9b05-4526047e62da';

  const mockBusiness: BusinessProfile = {
    id: 'biz_apex_01',
    name: 'Apex Studio',
    legal_name: 'Apex Solutions Private Limited',
    tagline: 'BUILD • INNOVATE • GROW',
    tax_id: '29AAAAA0000A1Z5',
    email: 'billing@apexsolutions.com',
    phone: '+91 98765 43210',
    address_line1: 'Flat 402, Green View Apartments',
    address_line2: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560038',
    country: 'India',
    country_iso2: 'IN',
    subdivision_code: 'IN-KA',
    subdivision_name: 'Karnataka',
    phone_country_iso2: 'IN',
    phone_e164: '+919876543210',
    upi_vpa: 'apexsolutions@hdfcbank',
    website: 'www.apexsolutions.com',
    signatory_name: 'Rahul Mehta',
    signatory_title: 'Managing Director',
    bank_name: 'HDFC Bank Ltd.',
    bank_account_number: '50200012345678',
    bank_ifsc: 'HDFC0001234',
    bank_branch: 'Indiranagar 100ft Road, Bengaluru',
    bank_account_type: 'Current Account',
    header_style: 'modern',
    footer_show_signature: true,
    footer_show_stamp: true,
    footer_show_address: true,
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    default_notes: 'Thank you for your business.',
    default_payment_terms: 'Payment due within 30 days from invoice date.',
    logo_uri: null,
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  it('1. Generates Tax Invoice HTML proof matching GST Rule 46 Gold Standard', () => {
    const taxDoc: any = {
      id: 'doc_tax_001',
      doc_type: 'invoice',
      document_number: 'INV-2026-0042',
      customer_id: 'cust_01',
      job_id: null,
      issue_date: Date.now(),
      due_date: Date.now() + 30 * 86400000,
      subtotal_minor: 15000000, // ₹1,50,000.00
      total_minor: 17700000,     // ₹1,77,000.00
      currency: 'INR',
      notes: 'Payment via NEFT/RTGS or UPI to registered bank details.',
      terms: 'Subject to Bengaluru jurisdiction. Interest @ 18% p.a. on delayed payments.',
      created_at: Date.now(),
      updated_at: Date.now(),
      lifecycle_status: 'issued',
      customer_name: 'Alpha Enterprises',
      customer_business_name: 'Alpha Enterprises Pvt Ltd',
      customer_email: 'accounts@alphaent.com',
      customer_phone: '+91 91234 56789',
      customer_billing_address: 'Plot 45, Phase II, Electronic City, Bengaluru - 560100',
      items: [
        {
          id: 'item_1',
          document_id: 'doc_tax_001',
          catalog_item_id: null,
          description: 'Cloud Infrastructure Architecture & Security Hardening',
          item_notes: 'HSN/SAC: 998313',
          category: 'service',
          quantity_scaled: 10000, // 1 unit
          unit_name: 'Month',
          unit_price_minor: 10000000, // ₹1,00,000.00
          line_total_minor: 10000000,
          sort_order: 1,
        },
        {
          id: 'item_2',
          document_id: 'doc_tax_001',
          catalog_item_id: null,
          description: 'DevOps CI/CD Pipeline Automation & Monitoring Setup',
          item_notes: 'HSN/SAC: 998314',
          category: 'service',
          quantity_scaled: 10000, // 1 unit
          unit_name: 'Project',
          unit_price_minor: 5000000, // ₹50,000.00
          line_total_minor: 5000000,
          sort_order: 2,
        },
      ],
    };

    const html = renderTaxInvoiceGoldStandardHtml(taxDoc, mockBusiness, 'a4');
    fs.writeFileSync(path.join(artifactDir, 'proof_tax_invoice.html'), html, 'utf-8');
    expect(html).toContain('TAX INVOICE');
    expect(html).toContain('INV-2026-0042');
  });

  it('2. Generates Purchase Order HTML proof matching Procurement Standard', () => {
    const poSchema: UniversalDocumentSchema = {
      id: 'schema_purchase_order',
      code: 'purchase_order',
      name: 'Purchase Order',
      docClass: 'class_b_administrative',
      category: 'procurement',
      description: 'Formal purchase order',
      icon: 'shopping-cart',
      defaultTemplate: 'purchase_order',
      isSystem: true,
      sections: [],
    };

    const poInstance: UniversalDocumentInstance = {
      id: 'inst_po_001',
      businessProfileId: mockBusiness.id,
      typeId: 'purchase_order',
      docClass: 'class_b_administrative',
      documentNumber: 'PO-2026-0189',
      title: 'Purchase Order for Datacenter Hardware & Optics',
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Nexus Networking Hardware Ltd',
      partyDetails: {
        address: '42 Silicon Avenue, Whitefield, Bengaluru - 560066',
        contact: 'Sales Desk (+91 80 9876 5432)',
      },
      content: {
        vendor_name: 'Nexus Networking Hardware Ltd',
        vendor_address: '42 Silicon Avenue, Whitefield, Bengaluru - 560066',
        vendor_gstin: '29ABCDE1234F1Z5',
        vendor_contact: 'Mr. Arvind Krishnan (+91 98888 12345)',
        ship_to_address: 'Apex Studio Data Facility, 9th Floor,Indiranagar, Bengaluru - 560038',
        po_date: '09 Oct 2026',
        payment_terms: 'Net 30 Days after 3-way inspection',
        delivery_due_date: '25 Oct 2026',
        shipping_method: 'Insured Surface Cargo (Air Expedited)',
        items: [
          { item_name: '100G QSFP28 Single-Mode Optical Transceiver', hsn: '85177090', qty: 24, unit: 'NOS', rate: 8500, tax_rate: '18%', total: 204000 },
          { item_name: 'OM4 Multimode Fiber Trunk Cable 24-Core 50m', hsn: '85447000', qty: 10, unit: 'ROLL', rate: 12500, tax_rate: '18%', total: 125000 },
          { item_name: 'High-Density 48-Port Cat6A Patch Panel Loaded', hsn: '85369090', qty: 6, unit: 'NOS', rate: 4200, tax_rate: '18%', total: 25200 },
        ],
        subtotal: '₹ 3,54,200',
        cgst: '₹ 31,878',
        sgst: '₹ 31,878',
        grand_total: '₹ 4,17,956',
        amount_in_words: 'Four Lakh Seventeen Thousand Nine Hundred Fifty-Six Rupees Only',
        prepared_by: 'Sunil Nair (Procurement Lead)',
        verified_by: 'Kavita Rao (Finance Controller)',
        authorized_by: 'Rahul Mehta (Managing Director)',
      },
      templateCode: 'purchase_order',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderPurchaseOrderHtml(poInstance, poSchema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_purchase_order.html'), html, 'utf-8');
    expect(html).toContain('PURCHASE ORDER');
    expect(html).toContain('PO-2026-0189');
  });

  it('3. Generates Job Offer Letter HTML proof matching Reference 2', () => {
    const offerSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter')!;
    const offerInstance: UniversalDocumentInstance = {
      id: 'inst_offer_001',
      businessProfileId: mockBusiness.id,
      typeId: 'job_offer_letter',
      docClass: 'class_b_administrative',
      documentNumber: 'OFF-2026-0042',
      title: 'Job Offer Letter - Lead Architect',
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Aarav Sharma',
      partyDetails: {
        address: 'Flat 402, Green View Apts, Indiranagar, Bengaluru',
        email: 'aarav.sharma@example.com',
      },
      content: {
        candidate_name: 'Aarav Sharma',
        candidate_address: 'Flat 402, Green View Apts, Indiranagar, Bengaluru - 560034',
        job_title: 'Staff Frontend Architect',
        department: 'Platform Engineering',
        work_location: 'Bengaluru (Hybrid)',
        employment_type: 'Full-time Permanent',
        joining_date: '24 Oct 2026',
        reporting_to: 'VP of Technology',
        probation_period: '3 Months',
        offer_valid_until: '15 Oct 2026',
        annual_salary_ctc: '₹24,00,000',
        payment_frequency: 'Monthly (Last working day)',
        benefits: 'PF / Health Insurance / Gratuity',
        working_hours: '40 Hours / Week (Mon - Fri)',
        leave_policy: '24 Days Annual Paid Leave',
        salary_breakdown: [
          { component: 'Basic Salary', monthly: '₹1,00,000', annual: '₹12,00,000' },
          { component: 'House Rent Allowance (HRA)', monthly: '₹50,000', annual: '₹6,00,000' },
          { component: 'Special Allowance', monthly: '₹35,000', annual: '₹4,20,000' },
          { component: 'Statutory Bonus / Benefits', monthly: '₹15,000', annual: '₹1,80,000' },
        ],
        signatory_name: 'Priya Nair',
        signatory_title: 'Head of People & Culture',
      },
      templateCode: 'letterhead',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderLetterDocumentHtml(offerInstance, offerSchema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_job_offer.html'), html, 'utf-8');
    expect(html).toContain('JOB OFFER LETTER');
    expect(html).toContain('OFF-2026-0042');
  });

  it('4. Generates Work Order HTML proof matching Reference 3', () => {
    const woSchema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order')!;
    const woInstance: UniversalDocumentInstance = {
      id: 'inst_wo_001',
      businessProfileId: mockBusiness.id,
      typeId: 'work_order',
      docClass: 'class_b_administrative',
      documentNumber: 'WO-2026-0042',
      title: 'Data Center HVAC Installation & Fiber Cabling',
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'CloudScale Infrastructure Ltd',
      partyDetails: {
        address: 'Building 7, Cyber Gateway, Outer Ring Rd, Bengaluru',
      },
      content: {
        customer_name: 'CloudScale Infrastructure Ltd',
        site_address: 'Building 7, Cyber Gateway, Outer Ring Rd, Bengaluru',
        project_id: 'PRJ-2026-094',
        requested_by: 'Operations Manager',
        asset_equipment: 'HVAC Chiller Unit #4',
        assigned_technician: 'Sunil Kumar (Senior Field Specialist)',
        work_category: 'Preventive Maintenance & Overhaul',
        work_description: 'Complete system diagnostics, filter replacement, refrigerant pressure testing, sensor recalibration, and load balancing across all terminal zones.',
        tasks_list: [
          'Pre-site inspection and safety clearance',
          'Fiber optic trunk cable routing and splicing',
          'HVAC cooling unit pressure testing and refrigerant recharge',
          'Perform 30-minute full capacity test run and log parameters',
        ],
        safety_instructions: 'Mandatory hard hat, anti-static safety boots, and dual-lock lockout/tagout (LOTO) procedures apply. Keep dry chemical fire extinguisher on site.',
      },
      templateCode: 'work_order',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderWorkOrderHtml(woInstance, woSchema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_work_order.html'), html, 'utf-8');
    expect(html).toContain('WORK ORDER / JOB CARD');
    expect(html).toContain('WO-2026-0042');
  });

  it('5. Generates Salary Slip / Payslip HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_pay_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'PAY-2026-09',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Aarav Sharma',
      partyDetails: { email: 'aarav.sharma@example.com' },
      content: {
        employee_name: 'Aarav Sharma',
        employee_id: 'EMP-0142',
        designation: 'Lead Full-Stack Architect',
        pay_period: 'October 2026',
        days_worked: '31 Days (0 LOP)',
        net_pay: '₹1,31,500',
        gross_earnings: '₹1,50,000',
        total_deductions: '₹18,500',
        payment_date: '31 Oct 2026',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_salary_slip.html'), html, 'utf-8');
    expect(html).toContain('Salary Slip / Payslip');
    expect(html).toContain('₹1,31,500');
  });

  it('6. Generates Site Inspection Report HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'site_inspection_report')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_sir_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'SIR-2026-042',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Apex Global Towers',
      partyDetails: { location: 'Outer Ring Road, Bengaluru' },
      content: {
        site_name: 'Apex Global Towers Campus 2',
        facility_manager: 'Vikram Sengupta',
        inspection_date: '09 Oct 2026',
        compliance_rating: '98% Pass (Grade A+)',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_site_inspection.html'), html, 'utf-8');
    expect(html).toContain('Site Inspection Report');
  });

  it('7. Generates Meeting Minutes HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'meeting_minutes')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_min_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'MIN-2026-042',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Board of Directors',
      partyDetails: {},
      content: {
        chairperson: 'Vikram Sengupta (CEO)',
        recorder: 'Anita Desai (Chief of Staff)',
        location: 'Executive Boardroom A',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_meeting_minutes.html'), html, 'utf-8');
    expect(html).toContain('Meeting Minutes & Action Register');
  });

  it('8. Generates Customer Account Statement HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'customer_account_statement')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_soa_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'SOA-2026-10',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Metro Logistics Ltd',
      partyDetails: { email: 'billing@metrologistics.in' },
      content: {
        customer_name: 'Metro Logistics Ltd',
        statement_period: '01 Sep 2026 - 30 Sep 2026',
        closing_balance: '₹84,000',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_customer_statement.html'), html, 'utf-8');
    expect(html).toContain('Customer Account Statement');
    expect(html).toContain('₹84,000');
  });

  it('9. Generates Goods Received Note HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'goods_received_note')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_grn_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'GRN-2026-0881',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Apex Micro Systems Ltd',
      partyDetails: {},
      content: {
        vendor_name: 'Apex Micro Systems Ltd',
        po_reference: 'PO-2026-0422',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_goods_received_note.html'), html, 'utf-8');
    expect(html).toContain('Goods Received Note (GRN)');
  });

  it('10. Generates House Rent Receipt HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'rent_receipt')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_rent_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'RENT-2026-10',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Pooja Hegde',
      partyDetails: {},
      content: {
        tenant_name: 'Pooja Hegde',
        rent_amount: '₹45,000',
        rent_period: 'For the month of October 2026',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_rent_receipt.html'), html, 'utf-8');
    expect(html).toContain('House Rent Receipt');
  });

  it('11. Generates Equipment Responsibility Form HTML proof (Gold/Black Master)', () => {
    const schema = SYSTEM_SCHEMAS.find((s) => s.code === 'equipment_responsibility')!;
    const instance: UniversalDocumentInstance = {
      id: 'inst_proof_eq_01',
      businessProfileId: mockBusiness.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: 'ASSET-2026-009',
      title: schema.name,
      status: 'issued',
      issueDate: Date.now(),
      partyName: 'Rahul Verma',
      partyDetails: {},
      content: {
        employee_name: 'Rahul Verma',
        employee_id: 'EMP-0401',
        department: 'Core Infrastructure',
      },
      templateCode: 'gold_master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderUniversalCustomHtml(instance, schema, mockBusiness);
    fs.writeFileSync(path.join(artifactDir, 'proof_equipment_responsibility.html'), html, 'utf-8');
    expect(html).toContain('Equipment Responsibility Undertaking');
  });
});
