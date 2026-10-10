/**
 * DOCUMENT STUDIO TEMPLATES & PERSISTENCE TEST SUITE
 * Tests TemplateRepository (SQLite assignments and customizations) and
 * PdfService template rendering dispatch across all 12 presentation styles.
 */

import { TemplateRepository } from '../../src/data/repositories/TemplateRepository';
import { PdfService } from '../../src/services/pdf/PdfService';
import { PdfTemplateType, TemplateCustomization } from '../../src/services/pdf/types';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../src/domain/profile/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Document Studio Template Repository & SQLite Persistence', () => {
  let mockDb: ReturnType<typeof getMockDb>;

  beforeEach(() => {
    mockDb = getMockDb();
    mockDb.reset();
  });

  it('retrieves available system templates from database or fallback defaults', async () => {
    const templates = await TemplateRepository.getAvailableTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(5);

    const codes = templates.map((t) => t.code);
    expect(codes).toContain('standard');
    expect(codes).toContain('executive');
    expect(codes).toContain('compact');
    expect(codes).toContain('modern');
    expect(codes).toContain('minimal');
  });

  it('assigns and retrieves default templates per document type and business profile', async () => {
    const bizId = 'biz_studio_1';

    // Default before assignment is 'standard'
    const initial = await TemplateRepository.getAssignedTemplate(bizId, 'invoice');
    expect(initial).toBe('standard');

    // Assign 'executive' to 'invoice'
    await TemplateRepository.assignTemplate(bizId, 'invoice', 'executive');
    const assigned = await TemplateRepository.getAssignedTemplate(bizId, 'invoice');
    expect(assigned).toBe('executive');

    // Assign 'compact' to 'delivery_challan'
    await TemplateRepository.assignTemplate(bizId, 'delivery_challan', 'compact');
    const challanTemplate = await TemplateRepository.getAssignedTemplate(bizId, 'delivery_challan');
    expect(challanTemplate).toBe('compact');

    // Invoice remains 'executive'
    expect(await TemplateRepository.getAssignedTemplate(bizId, 'invoice')).toBe('executive');
  });

  it('saves and retrieves per-template brand customizations', async () => {
    const bizId = 'biz_studio_1';
    const customization: TemplateCustomization = {
      template_code: 'executive',
      brand_color: '#0F2942',
      secondary_color: '#3B82F6',
      font_family: 'Inter, sans-serif',
      logo_position: 'left',
      show_logo: true,
      show_tax_breakdown: true,
      show_payment_qr: true,
      show_signature: true,
      show_terms: false,
      custom_declaration: 'We declare that this invoice shows the actual price of goods described.',
      custom_footer_notes: 'ISO 9001:2015 Certified Organization',
      column_visibility: {
        hsn: true,
        taxRate: true,
      },
    };

    await TemplateRepository.saveCustomization(bizId, customization);

    const loaded = await TemplateRepository.getCustomization(bizId, 'executive');
    expect(loaded).toBeDefined();
    expect(loaded?.brand_color).toBe('#0F2942');
    expect(loaded?.show_terms).toBe(false);
    expect(loaded?.custom_declaration).toContain('We declare that this invoice');
    expect(loaded?.custom_footer_notes).toBe('ISO 9001:2015 Certified Organization');
    expect(loaded?.column_visibility?.hsn).toBe(true);
  });
});

describe('PdfService Multi-Template Dispatch & Brand Customization', () => {
  const mockBiz: BusinessProfile = {
    id: 'biz_test_pdf',
    name: 'Precision Engineering Ltd',
    legal_name: 'Precision Engineering Private Limited',
    tax_id: '27AABCP1234F1Z5',
    email: 'accounts@precision.in',
    phone: '+91 22 2490 0000',
    address_line1: 'Plot 42, MIDC Industrial Area',
    city: 'Pune',
    state: 'Maharashtra',
    postal_code: '411018',
    country: 'IN',
    country_iso2: 'IN',
    logo_uri: 'file:///data/user/0/com.billframe/files/logo.png',
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    default_payment_terms: 'net_30',
    default_notes: 'Thank you for your business.',
    upi_vpa: 'precision@hdfcbank',
    is_active: true,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  };

  const mockDoc: FullDocument = {
    id: 'doc_101',
    business_profile_id: 'biz_test_pdf',
    job_id: null,
    doc_type: 'tax_invoice',
    sequence_number: 101,
    document_number: 'INV-2026-0101',
    customer_id: 'cust_45',
    customer_name: 'Tata Motors Limited',
    customer_business_name: 'Tata Motors Commercial Vehicles',
    customer_billing_address: 'Bombay House, Homi Mody Street, Mumbai',
    lifecycle_status: 'issued',
    issue_date: 1774704000000,
    due_date: 1777296000000,
    currency: 'INR',
    subtotal_minor: 500000,
    discount_minor: 0,
    discount_type: 'none',
    discount_value: 0,
    tax_minor: 90000,
    tax_type: 'exclusive',
    tax_rate_bp: 1800,
    tax_label: 'GST (18%)',
    total_minor: 590000,
    deposit_minor: 0,
    total_paid_minor: 0,
    balance_minor: 590000,
    payment_status: 'unpaid',
    is_overdue: false,
    po_number: 'PO-TATA-998',
    payment_terms_preset: 'net_30',
    shipping_address: 'Plant 1, Pimpri, Pune',
    payment_instructions: 'NEFT to HDFC Bank A/c 50200012345678 IFSC HDFC0000123',
    notes: 'Components manufactured to JIS B 1180 specs.',
    terms: 'Payment due strictly within 30 days of invoice date.',
    internal_notes: 'Confidential production cost: ₹3,200. NEVER DISCLOSE.',
    signature_uri: null,
    signature_date: null,
    parent_document_id: null,
    is_archived: 0,
    created_at: 1774704000000,
    updated_at: 1774704000000,
    items: [
      {
        id: 'item_1',
        document_id: 'doc_101',
        catalog_item_id: null,
        description: 'M12 High-Tensile Flange Bolts (Pack of 500)',
        item_notes: 'Grade 10.9 Zinc Plated',
        category: 'materials',
        quantity_scaled: 500000, // 50.0 packs
        unit_name: 'packs',
        unit_price_minor: 10000, // ₹100.00
        internal_cost_minor: 6400, // Private cost (MUST NOT LEAK)
        line_total_minor: 500000,
        sort_order: 0,
      },
    ],
  };

  const allTemplates: PdfTemplateType[] = [
    'standard',
    'compact',
    'modern',
    'executive',
    'minimal',
    'executive_ink',
    'ledger_navy',
    'architectural_grid',
    'modern_editorial',
    'commerce_compact',
    'service_record',
    'monochrome_minimal',
  ];

  it.each(allTemplates)('compiles valid HTML for template "%s" without leaking internal contractor cost', (templateType) => {
    const html = PdfService.generateDocumentHtml(mockDoc, mockBiz, templateType);

    expect(html).toContain('Precision Engineering');
    expect(html).toContain('INV-2026-0101');
    expect(html).toContain('Tata Motors Limited');
    expect(html).toContain('M12 High-Tensile Flange Bolts');

    // CRITICAL SECURITY INVARIANT: Contractor private internal notes and costs MUST NEVER LEAK
    expect(html).not.toContain('Confidential production cost');
    expect(html).not.toContain('NEVER DISCLOSE');
    expect(html).not.toContain('6400');
  });

  it('applies brand color and custom declaration when customization is provided', () => {
    const customBrand = '#8B0000'; // Deep crimson
    const customDeclaration = 'Certified that all particulars given above are true and correct.';
    const customFooter = 'Goods once sold will not be taken back without authorization.';

    const custom: TemplateCustomization = {
      template_code: 'standard',
      brand_color: customBrand,
      custom_declaration: customDeclaration,
      custom_footer_notes: customFooter,
    };

    const html = PdfService.generateDocumentHtml(mockDoc, mockBiz, 'standard', 'a4', custom);

    expect(html).toContain(customBrand);
    expect(html).toContain(customDeclaration);
    expect(html).toContain(customFooter);
  });

  it('respects show_terms=false and show_payment_qr=false overrides', () => {
    const custom: TemplateCustomization = {
      template_code: 'standard',
      show_terms: false,
      show_payment_qr: false,
    };

    const html = PdfService.generateDocumentHtml(mockDoc, mockBiz, 'standard', 'a4', custom);

    // Terms & QR should be suppressed
    expect(html).not.toContain('Payment due strictly within 30 days');
    expect(html).not.toContain('Scan &amp; Pay via UPI');
  });
});
