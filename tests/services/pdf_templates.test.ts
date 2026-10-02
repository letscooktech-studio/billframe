import { PdfService } from '../../src/services/pdf/PdfService';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../src/domain/profile/types';
import { ReceiptRecord } from '../../src/data/repositories/PaymentRepository';

describe('PDF Template Engine & Security Boundary', () => {
  const mockBusiness: BusinessProfile = {
    id: 'biz_1',
    name: 'Acme Carpentry LLC',
    legal_name: 'Acme Carpentry LLC',
    tax_id: 'US-987654321',
    email: 'contact@acmecarpentry.com',
    phone: '+1 555-0199',
    address_line1: '123 Timber Lane',
    city: 'Denver',
    state: 'CO',
    postal_code: '80202',
    country: 'US',
    country_iso2: 'US',
    logo_uri: null,
    default_currency: 'USD',
    default_document_locale: 'en-US',
    default_payment_terms: 'net_30',
    default_notes: 'Thank you for your business.',
    is_active: true,
    created_at: 1774000000000,
    updated_at: 1774000000000,
  };

  const mockDocument: FullDocument = {
    id: 'doc_inv_101',
    business_profile_id: 'biz_1',
    job_id: 'job_42',
    doc_type: 'invoice',
    sequence_number: 101,
    document_number: 'INV-0101',
    customer_id: 'cust_99',
    customer_name: 'Apex Construction',
    customer_business_name: 'Apex Group',
    customer_billing_address: '456 Skyline Blvd\nDenver, CO 80203',
    lifecycle_status: 'issued',
    issue_date: 1774704000000,
    due_date: 1777296000000,
    currency: 'USD',
    subtotal_minor: 50000, // $500.00
    discount_minor: 0,
    discount_type: 'none',
    discount_value: 0,
    tax_minor: 4000, // $40.00
    tax_type: 'exclusive',
    tax_rate_bp: 800,
    tax_label: 'State Tax',
    total_minor: 54000, // $540.00
    deposit_minor: 10000, // $100.00
    total_paid_minor: 20000, // $200.00
    balance_minor: 24000, // $240.00
    payment_status: 'partially_paid',
    is_overdue: false,
    po_number: 'PO-8889',
    payment_terms_preset: 'net_30',
    shipping_address: 'Jobsite 7B, North Ridge',
    payment_instructions: 'Wire to routing 123456789 account 987654321',
    notes: 'Please inspect framing within 5 days.',
    terms: 'Net 30. 1.5% monthly finance charge on late payments.',
    internal_notes: 'Internal contractor profit margin is 35%. DO NOT SHARE WITH CLIENT.',
    signature_uri: null,
    signature_date: null,
    parent_document_id: null,
    is_archived: 0,
    created_at: 1774704000000,
    updated_at: 1774704000000,
    items: [
      {
        id: 'item_1',
        document_id: 'doc_inv_101',
        catalog_item_id: null,
        description: 'Framing labor',
        item_notes: '2 workers, 8 hours',
        category: 'labour',
        quantity_scaled: 160000, // 16.0 hrs
        unit_name: 'hrs',
        unit_price_minor: 3125, // $31.25/hr
        internal_cost_minor: 1800, // Private cost: $18.00/hr (MUST NOT LEAK)
        line_total_minor: 50000, // $500.00
        sort_order: 0,
      },
    ],
  };

  it('renders standard, compact, and modern templates cleanly', () => {
    const standardHtml = PdfService.generateDocumentHtml(mockDocument, mockBusiness, 'standard');
    expect(standardHtml).toContain('Acme Carpentry LLC');
    expect(standardHtml).toContain('INV-0101');
    expect(standardHtml).toContain('Apex Construction');
    expect(standardHtml).toContain('Framing labor');
    expect(standardHtml).toContain('$540.00'); // Total
    expect(standardHtml).toContain('$240.00'); // Balance Due

    const compactHtml = PdfService.generateDocumentHtml(mockDocument, mockBusiness, 'compact');
    expect(compactHtml).toContain('INV-0101');
    expect(compactHtml).toContain('$540.00');

    const modernHtml = PdfService.generateDocumentHtml(mockDocument, mockBusiness, 'modern');
    expect(modernHtml).toContain('INV-0101');
    expect(modernHtml).toContain('Jobsite 7B, North Ridge');
  });

  it('CRITICAL PRIVACY TEST: strictly protects internal contractor costs and notes from rendering on PDF', () => {
    const templates: ('standard' | 'compact' | 'modern')[] = ['standard', 'compact', 'modern'];

    for (const t of templates) {
      const html = PdfService.generateDocumentHtml(mockDocument, mockBusiness, t);

      // Private contractor cost ($18.00 / 1800 minor) must NOT be in the HTML
      expect(html).not.toContain('1800');
      expect(html).not.toContain('$18.00');

      // Internal notes must NOT be in client-facing PDF
      expect(html).not.toContain('Internal contractor profit margin is 35%');
      expect(html).not.toContain('DO NOT SHARE WITH CLIENT');
    }
  });

  it('renders payment receipts with exact invoice and balance context', () => {
    const mockReceipt: ReceiptRecord = {
      id: 'rec_1',
      business_profile_id: 'biz_1',
      payment_id: 'pay_1',
      invoice_id: 'doc_inv_101',
      sequence_number: 1,
      receipt_number: 'REC-0001',
      receipt_snapshot_json: JSON.stringify({
        receipt_number: 'REC-0001',
        invoice_number: 'INV-0101',
        customer_name: 'Apex Construction',
        amount_minor: 20000,
        currency: 'USD',
        payment_date: 1774800000000,
        payment_method: 'bank_transfer',
        reference: 'WIRE-TX-9981',
        remaining_balance_minor: 24000,
        notes: 'Deposit instalment wire received',
      }),
      issue_date: 1774800000000,
      created_at: 1774800000000,
    };

    const receiptHtml = PdfService.generateReceiptHtml(mockReceipt, mockBusiness);
    expect(receiptHtml).toContain('REC-0001');
    expect(receiptHtml).toContain('INV-0101');
    expect(receiptHtml).toContain('$200.00');
    expect(receiptHtml).toContain('WIRE-TX-9981');
    expect(receiptHtml).toContain('$240.00');
  });
});
