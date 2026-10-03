import { EInvoiceExportService } from '../../src/services/einvoice/EInvoiceExportService';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../src/domain/profile/types';

describe('EInvoiceExportService', () => {
  const mockProfile: BusinessProfile = {
    id: 'prof_test',
    name: 'Bharat Tech Solutions',
    legal_name: 'Bharat Tech Solutions Private Limited',
    tax_id: '29ABCDE1234F1Z5',
    email: 'billing@bharattech.in',
    phone: '+91 9876543210',
    address_line1: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560001',
    country: 'IN',
    country_iso2: 'IN',
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockDoc = {
    id: 'doc_inv_1',
    business_profile_id: 'prof_test',
    job_id: null,
    doc_type: 'invoice' as const,
    document_number: 'INV-0042',
    sequence_number: 42,
    customer_id: 'cust_1',
    lifecycle_status: 'issued' as const,
    issue_date: 1774963200000,
    due_date: null,
    currency: 'INR',
    subtotal_minor: 100000, // ₹1,000.00
    discount_minor: 0,
    discount_type: 'none' as const,
    discount_value: 0,
    tax_minor: 18000, // ₹180.00 (18%)
    tax_type: 'exclusive' as const,
    tax_rate_bp: 1800,
    tax_label: 'GST',
    total_minor: 118000, // ₹1,180.00
    deposit_minor: 0,
    po_number: null,
    payment_terms_preset: 'due_on_receipt' as const,
    shipping_address: null,
    payment_instructions: null,
    notes: null,
    terms: null,
    internal_notes: null,
    signature_uri: null,
    signature_date: null,
    place_of_supply: 'IN-KA',
    supply_type: 'intra_state',
    reverse_charge: 0,
    payment_link_url: null,
    payment_link_id: null,
    parent_document_id: null,
    is_archived: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
    customer_name: 'Karnataka Retailers Ltd',
    customer_business_name: 'Karnataka Retailers Private Limited',
    customer_email: null,
    customer_phone: null,
    customer_billing_address: '45 Brigade Road, Bengaluru',
    total_paid_minor: 0,
    balance_minor: 118000,
    payment_status: 'unpaid' as const,
    is_overdue: false,
    items: [
      {
        id: 'item_1',
        document_id: 'doc_inv_1',
        catalog_item_id: null,
        description: 'Server Maintenance Service',
        item_notes: null,
        category: 'service',
        hsn_sac_code: '998313',
        quantity_scaled: 10000,
        unit_name: 'service',
        unit_price_minor: 100000,
        line_total_minor: 100000,
        tax_rate_bp: 1800,
        tax_minor: 18000,
        tax_type: 'exclusive',
        tax_components_json: null,
        sort_order: 0,
      },
    ],
  } as FullDocument;

  it('validates India GST IRP eligibility accurately', () => {
    const validCheck = EInvoiceExportService.validateIndiaIrpEligibility(mockDoc, mockProfile);
    expect(validCheck.isEligible).toBe(true);
    expect(validCheck.missingFields).toHaveLength(0);

    const invalidProfile = { ...mockProfile, tax_id: null };
    const invalidCheck = EInvoiceExportService.validateIndiaIrpEligibility(mockDoc, invalidProfile);
    expect(invalidCheck.isEligible).toBe(false);
    expect(invalidCheck.missingFields.some((f) => f.includes('GSTIN'))).toBe(true);
  });

  it('generates compliant India GST IRP payload with CGST/SGST split and disclaimer', () => {
    const payload = EInvoiceExportService.generateIndiaIrpPayload(mockDoc, mockProfile);

    expect(payload.Version).toBe('1.1');
    expect(payload.DocDtls.Typ).toBe('INV');
    expect(payload.DocDtls.No).toBe('INV-0042');
    expect(payload.SellerDtls.Gstin).toBe('29ABCDE1234F1Z5');
    expect(payload.ValDtls.AssVal).toBe(1000); // ₹1,000.00
    expect(payload.ValDtls.CgstVal).toBe(90); // 9% = ₹90.00
    expect(payload.ValDtls.SgstVal).toBe(90); // 9% = ₹90.00
    expect(payload.ValDtls.IgstVal).toBe(0);
    expect(payload.ValDtls.TotInvVal).toBe(1180); // ₹1,180.00
    expect(payload.Meta.localStatus).toBe('schema_valid_unregistered');
    expect(payload.Meta.disclaimer).toContain('GST Suvidha Provider');
  });

  it('generates compliant PEPPOL UBL 2.1 payload', () => {
    const peppol = EInvoiceExportService.generatePeppolPayload(mockDoc, mockProfile);

    expect(peppol.CustomizationID).toContain('urn:cen.eu:en16931:2017');
    expect(peppol.ID).toBe('INV-0042');
    expect(peppol.InvoiceTypeCode).toBe('380');
    expect(peppol.LegalMonetaryTotal.LineExtensionAmount).toBe(1000);
    expect(peppol.LegalMonetaryTotal.PayableAmount).toBe(1180);
    expect(peppol.TaxTotal.TaxAmount).toBe(180);
    expect(peppol.InvoiceLine).toHaveLength(1);
    expect(peppol.InvoiceLine[0].Item.Description).toBe('Server Maintenance Service');
    expect(peppol.Meta.localStatus).toBe('ubl_2_1_schema_ready');
  });
});
