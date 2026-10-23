/**
 * DOCUMENT REGISTRY, FIELD SYNTAX, AND STATUTORY COMPLIANCE TEST SUITE
 * Tests the source-verified DocumentTypeRegistry, FieldRegistry syntax validators,
 * and CBIC GST Rule 46/53/55 statutory compliance validator.
 */

import { DocumentTypeRegistry } from '../../src/domain/documents/DocumentTypeRegistry';
import { FieldRegistry, SyntaxValidator, FieldTrustLevel } from '../../src/domain/fields/FieldRegistry';
import { DocumentComplianceValidator } from '../../src/domain/compliance/DocumentComplianceValidator';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../src/domain/profile/types';

describe('Document Type Registry', () => {
  it('registers all 40 professional enterprise document types with metadata', () => {
    const allTypes = DocumentTypeRegistry.getAll();
    expect(allTypes.length).toBe(40);

    const typeCodes = allTypes.map((t) => t.type);
    expect(typeCodes).toContain('tax_invoice');
    expect(typeCodes).toContain('bill_of_supply');
    expect(typeCodes).toContain('export_invoice');
    expect(typeCodes).toContain('commercial_invoice');
    expect(typeCodes).toContain('invoice_cum_bill_of_supply');
    expect(typeCodes).toContain('cash_bill');
    expect(typeCodes).toContain('pos_receipt');
    expect(typeCodes).toContain('service_invoice');
    expect(typeCodes).toContain('milestone_invoice');
    expect(typeCodes).toContain('progress_invoice');
    expect(typeCodes).toContain('recurring_invoice');
    expect(typeCodes).toContain('advance_invoice');
    expect(typeCodes).toContain('revised_tax_invoice');
    expect(typeCodes).toContain('sales_return_note');
    expect(typeCodes).toContain('invoice_aging_report');
    expect(typeCodes).toContain('payment_reminder');
    expect(typeCodes).toContain('order_confirmation');
    expect(typeCodes).toContain('proforma');
    expect(typeCodes).toContain('quotation');
    expect(typeCodes).toContain('purchase_order');
    expect(typeCodes).toContain('delivery_challan');
    expect(typeCodes).toContain('credit_note');
    expect(typeCodes).toContain('debit_note');
    expect(typeCodes).toContain('receipt');
    expect(typeCodes).toContain('payment_voucher');
    expect(typeCodes).toContain('work_order');
    expect(typeCodes).toContain('sales_order');
    expect(typeCodes).toContain('goods_received_note');
    expect(typeCodes).toContain('packing_list');
    expect(typeCodes).toContain('customer_account_statement');
    expect(typeCodes).toContain('salary_slip');
    expect(typeCodes).toContain('job_offer_letter');
    expect(typeCodes).toContain('job_application');
    expect(typeCodes).toContain('experience_certificate');
    expect(typeCodes).toContain('rent_receipt');
    expect(typeCodes).toContain('student_fee_receipt');
    expect(typeCodes).toContain('equipment_responsibility_letter');
    expect(typeCodes).toContain('meeting_minutes');
    expect(typeCodes).toContain('site_inspection_report');
    expect(typeCodes).toContain('nda_agreement');
  });

  it('correctly classifies statutory vs commercial vs internal documents', () => {
    expect(DocumentTypeRegistry.get('tax_invoice')?.classification).toBe('statutory_rule');
    expect(DocumentTypeRegistry.get('bill_of_supply')?.classification).toBe('statutory_rule');
    expect(DocumentTypeRegistry.get('credit_note')?.classification).toBe('statutory_rule');
    expect(DocumentTypeRegistry.get('debit_note')?.classification).toBe('statutory_rule');
    expect(DocumentTypeRegistry.get('delivery_challan')?.classification).toBe('statutory_rule');

    expect(DocumentTypeRegistry.get('quotation')?.classification).toBe('commercial_standard');
    expect(DocumentTypeRegistry.get('proforma')?.classification).toBe('commercial_standard');
    expect(DocumentTypeRegistry.get('purchase_order')?.classification).toBe('commercial_standard');

    expect(DocumentTypeRegistry.get('work_order')?.classification).toBe('internal_business');
  });

  it('provides default sequence prefixes and allows valid workflow transitions', () => {
    const quotation = DocumentTypeRegistry.get('quotation');
    expect(quotation?.defaultPrefix).toBe('QT-');
    expect(quotation?.allowedTransitions).toContain('proforma');
    expect(quotation?.allowedTransitions).toContain('tax_invoice');

    const challan = DocumentTypeRegistry.get('delivery_challan');
    expect(challan?.defaultPrefix).toBe('DC-');
    expect(challan?.allowedTransitions).toContain('tax_invoice');

    const creditNote = DocumentTypeRegistry.get('credit_note');
    expect(creditNote?.defaultPrefix).toBe('CN-');
    expect(creditNote?.requiresOriginalInvoiceRef).toBe(true);
  });
});

describe('Field Registry & Syntax Validator', () => {
  describe('GSTIN Validation', () => {
    it('validates authentic Indian GSTIN formats', () => {
      expect(SyntaxValidator.validateGstin('27AAAAA0000A1Z5').isValid).toBe(true);
      expect(SyntaxValidator.validateGstin('29ABCDE1234F1Z5').isValid).toBe(true);
      expect(SyntaxValidator.validateGstin('07AABCB1234A1Z1').isValid).toBe(true);
    });

    it('rejects invalid GSTIN formats', () => {
      expect(SyntaxValidator.validateGstin('12345').isValid).toBe(false);
      expect(SyntaxValidator.validateGstin('99AAAAA0000A1Z5').isValid).toBe(false); // Invalid state code 99
      expect(SyntaxValidator.validateGstin('').isValid).toBe(false);
    });
  });

  describe('PAN Validation', () => {
    it('validates 10-character Indian PAN cards', () => {
      expect(SyntaxValidator.validatePan('AAAAA0000A').isValid).toBe(true);
      expect(SyntaxValidator.validatePan('ABCDE1234F').isValid).toBe(true);
    });

    it('rejects malformed PAN numbers', () => {
      expect(SyntaxValidator.validatePan('ABC12345').isValid).toBe(false);
      expect(SyntaxValidator.validatePan('12345ABCDE').isValid).toBe(false);
    });
  });

  describe('IFSC Validation', () => {
    it('validates 11-character RBI IFSC bank codes', () => {
      expect(SyntaxValidator.validateIfsc('HDFC0001234').isValid).toBe(true);
      expect(SyntaxValidator.validateIfsc('SBIN0000691').isValid).toBe(true);
    });

    it('rejects invalid IFSC codes where 5th char is not 0', () => {
      expect(SyntaxValidator.validateIfsc('HDFC1001234').isValid).toBe(false);
      expect(SyntaxValidator.validateIfsc('HDFC').isValid).toBe(false);
    });
  });

  describe('UPI VPA Validation', () => {
    it('validates virtual payment addresses', () => {
      expect(SyntaxValidator.validateUpiVpa('merchant@icici').isValid).toBe(true);
      expect(SyntaxValidator.validateUpiVpa('user.name@okaxis').isValid).toBe(true);
    });

    it('rejects invalid VPA strings', () => {
      expect(SyntaxValidator.validateUpiVpa('merchant-without-handle').isValid).toBe(false);
      expect(SyntaxValidator.validateUpiVpa('@bank').isValid).toBe(false);
    });
  });

  describe('HSN / SAC Code Validation', () => {
    it('validates 2, 4, 6, and 8 digit HSN/SAC codes', () => {
      expect(SyntaxValidator.validateHsnSac('84').isValid).toBe(true);
      expect(SyntaxValidator.validateHsnSac('8471').isValid).toBe(true);
      expect(SyntaxValidator.validateHsnSac('998314').isValid).toBe(true);
      expect(SyntaxValidator.validateHsnSac('84713010').isValid).toBe(true);
    });

    it('rejects odd-length or non-numeric codes', () => {
      expect(SyntaxValidator.validateHsnSac('847').isValid).toBe(false);
      expect(SyntaxValidator.validateHsnSac('84713').isValid).toBe(false);
      expect(SyntaxValidator.validateHsnSac('ABCD').isValid).toBe(false);
    });
  });

  describe('Invoice Serial Number Validation (CBIC Rule 46)', () => {
    it('validates alphanumeric serials under 16 characters with hyphen and slash', () => {
      expect(SyntaxValidator.validateInvoiceSerial('INV-2026/001').isValid).toBe(true);
      expect(SyntaxValidator.validateInvoiceSerial('2026-27/01').isValid).toBe(true);
      expect(SyntaxValidator.validateInvoiceSerial('ABC12345').isValid).toBe(true);
    });

    it('rejects serials longer than 16 characters or containing invalid special chars', () => {
      expect(SyntaxValidator.validateInvoiceSerial('INV-2026-00000000001').isValid).toBe(false); // > 16 chars
      expect(SyntaxValidator.validateInvoiceSerial('INV#2026').isValid).toBe(false); // '#' not permitted by Rule 46
      expect(SyntaxValidator.validateInvoiceSerial('').isValid).toBe(false);
    });
  });
});

describe('Document Statutory Compliance Validator (CBIC GST Rules 46, 53, 55)', () => {
  const baseBusiness: BusinessProfile = {
    id: 'biz_gst',
    name: 'Bharat Systems Pvt Ltd',
    legal_name: 'Bharat Systems Private Limited',
    tax_id: '27AAAAA0000A1Z5',
    email: 'billing@bharatsystems.in',
    phone: '+91 9876543210',
    address_line1: '101 Tech Hub, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400069',
    country: 'IN',
    country_iso2: 'IN',
    subdivision_code: '27',
    subdivision_name: 'Maharashtra',
    logo_uri: null,
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    default_payment_terms: 'immediate',
    default_notes: 'Terms apply.',
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const validDoc: FullDocument = {
    id: 'doc_1',
    business_profile_id: 'biz_gst',
    job_id: null,
    doc_type: 'tax_invoice',
    sequence_number: 1,
    document_number: 'INV-2026/01',
    customer_id: 'cust_1',
    customer_name: 'Apex Infotech',
    customer_business_name: 'Apex Infotech Limited',
    customer_billing_address: '202 Corporate Park, Bengaluru, Karnataka',
    lifecycle_status: 'issued',
    issue_date: Date.now(),
    due_date: Date.now() + 86400000 * 30,
    currency: 'INR',
    subtotal_minor: 100000,
    discount_minor: 0,
    discount_type: 'none',
    discount_value: 0,
    tax_minor: 18000,
    tax_type: 'exclusive',
    tax_rate_bp: 1800,
    tax_label: 'IGST',
    total_minor: 118000,
    deposit_minor: 0,
    total_paid_minor: 0,
    balance_minor: 118000,
    payment_status: 'unpaid',
    is_overdue: false,
    po_number: null,
    payment_terms_preset: 'net_30',
    shipping_address: null,
    payment_instructions: null,
    notes: null,
    terms: null,
    internal_notes: null,
    signature_uri: null,
    signature_date: null,
    parent_document_id: null,
    is_archived: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
    place_of_supply: '29',
    supply_type: 'inter_state',
    reverse_charge: false,
    items: [
      {
        id: 'item_1',
        document_id: 'doc_1',
        catalog_item_id: null,
        description: 'Software Consulting Services',
        item_notes: null,
        category: 'services',
        quantity_scaled: 10000,
        unit_name: 'hrs',
        unit_price_minor: 100000,
        internal_cost_minor: 0,
        line_total_minor: 100000,
        sort_order: 0,
        hsn_sac: '998314',
      },
    ],
  };

  it('validates a compliant Rule 46 Tax Invoice without errors', () => {
    const report = DocumentComplianceValidator.validateTaxInvoice(validDoc, baseBusiness);
    expect(report.isCompliant).toBe(true);
    expect(report.errors.length).toBe(0);
  });

  it('detects violations when supplier GSTIN or Place of Supply is missing on tax invoice', () => {
    const invalidBiz: BusinessProfile = {
      ...baseBusiness,
      tax_id: null, // Missing GSTIN
    };

    const docMissingPos: FullDocument = {
      ...validDoc,
      place_of_supply: null,
    };

    const report = DocumentComplianceValidator.validateTaxInvoice(docMissingPos, invalidBiz);
    expect(report.isCompliant).toBe(false);
    expect(report.errors.some((e) => e.fieldKey === 'supplier_gstin')).toBe(true);
    expect(report.errors.some((e) => e.fieldKey === 'place_of_supply')).toBe(true);
  });

  it('enforces Rule 53 requirement that Credit Notes must reference original invoice', () => {
    const creditNoteWithoutRef: FullDocument = {
      ...validDoc,
      doc_type: 'credit_note',
      parent_document_id: null,
    };

    const report = DocumentComplianceValidator.validateCreditNote(creditNoteWithoutRef, baseBusiness);
    expect(report.isCompliant).toBe(false);
    expect(report.errors.some((e) => e.fieldKey === 'parent_document_id')).toBe(true);
    expect(report.errors.some((e) => e.rule === 'CBIC GST Rule 53')).toBe(true);
  });

  it('enforces column visibility compliance: forbids hiding mandatory item description or totals', () => {
    const check1 = DocumentComplianceValidator.validateColumnVisibility('tax_invoice', {
      description: false, // Trying to hide description
    });
    expect(check1.isCompliant).toBe(false);
    expect(check1.errors.some((e) => e.fieldKey === 'description')).toBe(true);

    const check2 = DocumentComplianceValidator.validateColumnVisibility('tax_invoice', {
      total: false, // Trying to hide total
    });
    expect(check2.isCompliant).toBe(false);
    expect(check2.errors.some((e) => e.fieldKey === 'total')).toBe(true);
  });
});
