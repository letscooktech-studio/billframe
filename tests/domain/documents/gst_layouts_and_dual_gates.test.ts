/**
 * UNIVERSAL DOCUMENT ENGINE & GST DUAL-GATE TEST SUITE
 * 
 * Verifies:
 * 1. 446 Universal Document Catalogue Registry (25 categories, stable IDs, lifecycle states)
 * 2. Document Readiness Validator (Statutory CBIC Rule 46 compliance gate)
 * 3. 100-Point Template Quality Score Engine (7 dimensions, >= 95 Flagship S+++ rubric)
 * 4. 5 Genuine Black-and-White GST Tax Invoice Layouts (Executive, Ledger, Minimal, Corporate, Supply Chain)
 * 5. Dual-Gate Hard Rule: Design Quality Score must NEVER override failed Statutory Readiness
 */

import {
  Catalogue446Registry,
  CatalogueDocumentEntry,
} from '../../../src/domain/documents/universal/CatalogueRegistry446';
import {
  DocumentReadinessValidator,
  isValidGstin,
} from '../../../src/domain/documents/universal/DocumentReadinessValidator';
import {
  TemplateQualityScoreEngine,
} from '../../../src/domain/documents/universal/TemplateQualityScore';
import {
  renderGstTaxInvoiceHtml,
  numberToIndianWords,
  parseGstInvoiceData,
} from '../../../src/services/pdf/templates/gst';
import { FullDocument } from '../../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../src/domain/profile/types';

// Mock business profile compliant with GSTIN standards
const validBusinessProfile: BusinessProfile = {
  id: 'biz_apex_tech_001',
  name: 'Apex Infotech Solutions Private Limited',
  legal_name: 'Apex Infotech Solutions Private Limited',
  address_line1: 'Plot 42, Hinjewadi Phase 1, Rajiv Gandhi Infotech Park',
  city: 'Pune',
  state: 'Maharashtra',
  postal_code: '411057',
  country: 'India',
  country_iso2: 'IN',
  default_currency: 'INR',
  default_document_locale: 'en-IN',
  is_active: 1,
  tax_id: '27AABCU9603R1ZM', // Valid Maharashtra 15-char GSTIN
  email: 'billing@apextech.in',
  phone: '+91 98765 43210',
  signatory_name: 'Rahul Mehta',
  signatory_title: 'Authorized Signatory',
  bank_name: 'HDFC Bank',
  bank_account_number: '50200012345678',
  bank_ifsc: 'HDFC0000123',
  bank_branch: 'Hinjewadi Pune',
  created_at: 1700000000000,
  updated_at: 1700000000000,
};

// Mock B2B Document (Maharashtra -> Maharashtra: Intra-state supply)
const validIntraStateDoc: FullDocument = {
  id: 'doc_inv_2026_001',
  business_profile_id: 'biz_apex_tech_001',
  job_id: null,
  doc_type: 'invoice',
  sequence_number: 1,
  document_number: 'INV/2026/001', // <= 16 alphanumeric characters
  customer_id: 'cust_tata_001',
  lifecycle_status: 'draft',
  issue_date: 1735689600000, // Jan 1, 2025
  due_date: 1738368000000,   // Jan 31, 2025
  currency: 'INR',
  subtotal_minor: 10000000,   // Rs 1,00,000.00
  discount_minor: 0,
  discount_type: 'none',
  discount_value: 0,
  tax_minor: 1800000,         // Rs 18,000.00 (18% GST: 9% CGST + 9% SGST)
  tax_type: 'exclusive',
  tax_rate_bp: 1800,
  tax_label: 'GST (18%)',
  total_minor: 11800000,      // Rs 1,18,000.00
  deposit_minor: 0,
  po_number: 'PO-TATA-8842',
  payment_terms_preset: 'net_30',
  shipping_address: 'Tata Consultancy Services, Olympus Gate 1, Thane West, MH 400601',
  payment_instructions: 'Payment via NEFT/RTGS to HDFC Bank A/C: 50200012345678',
  notes: 'Subject to Pune jurisdiction. Thank you for your business.',
  terms: 'Payment due within 30 days of invoice receipt.',
  internal_notes: 'VIP B2B Client Account',
  signature_uri: null,
  signature_date: 1735689600000,
  place_of_supply: 'Maharashtra (State Code 27)',
  supply_type: 'services',
  reverse_charge: false,
  parent_document_id: null,
  is_archived: 0,
  created_at: 1735689600000,
  updated_at: 1735689600000,
  customer_name: 'Tata Consultancy Services Limited',
  customer_business_name: 'Tata Consultancy Services',
  customer_email: 'accounts.payable@tcs.com',
  customer_phone: '+91 22 6778 9999',
  customer_billing_address: 'TCS House, Raveline Street, Fort, Mumbai, MH 400001',
  items: [
    {
      id: 'item_1',
      document_id: 'doc_inv_2026_001',
      catalog_item_id: null,
      description: 'Cloud Infrastructure Architecture & DevSecOps Engineering',
      item_notes: 'Sprint 24-26 technical deliverables',
      quantity_scaled: 10000, // 1 unit
      unit_name: 'Month',
      unit_price_minor: 10000000,
      line_total_minor: 10000000,
      sort_order: 1,
      hsn_sac_code: '998314', // IT consultancy services SAC
    },
  ],
  total_paid_minor: 0,
  balance_minor: 11800000,
  payment_status: 'unpaid',
  is_overdue: false,
  ...({ customer_tax_id: '27AAACT2727Q1ZW' } as any), // Valid B2B Recipient GSTIN
};

// Mock Inter-State Supply (Maharashtra -> Karnataka: Inter-state IGST)
const validInterStateDoc: FullDocument = {
  ...validIntraStateDoc,
  document_number: 'INV/2026/002',
  place_of_supply: 'Karnataka (State Code 29)',
  customer_name: 'Infosys Limited',
  customer_billing_address: 'Electronics City, Hosur Road, Bengaluru, KA 560100',
  ...({ customer_tax_id: '29AABCI1234A1Z5' } as any), // Karnataka GSTIN
};

describe('Universal Document Engine & GST Dual-Gate Suite', () => {

  // =========================================================================
  // 1. 446-DOCUMENT CATALOGUE REGISTRY
  // =========================================================================
  describe('1. 446 Catalogue Registry & Taxonomic Architecture', () => {
    it('should index all 25 statutory and industrial categories', () => {
      const categories = Catalogue446Registry.getCategories();
      expect(categories).toHaveLength(25);
      expect(categories[0].title).toBe('Sales, Billing & Commercial Tax');
      expect(categories[0].categoryIndex).toBe(1);
      expect(categories[24].title).toBe('Custom & User-Defined Organization Documents');
      expect(categories[24].categoryIndex).toBe(25);
    });

    it('should register exactly 446 candidate document identifiers', () => {
      const allEntries = Catalogue446Registry.getAllEntries();
      expect(allEntries).toHaveLength(446);
      
      // Verify prefix formatting BF-DOC-XX-YYY
      for (const entry of allEntries) {
        expect(entry.id).toMatch(/^BF-DOC-\d{2}-\d{3}$/);
        expect(entry.canonicalName.length).toBeGreaterThan(0);
        expect(entry.categoryIndex).toBeGreaterThanOrEqual(1);
        expect(entry.categoryIndex).toBeLessThanOrEqual(25);
      }
    });

    it('should track lifecycle states without false release claims', () => {
      const all = Catalogue446Registry.getAllEntries();
      const releaseReady = Catalogue446Registry.getReleaseReadyEntries();
      
      // The release slice: Indian GST Tax Invoice must be RELEASE_READY
      expect(releaseReady.length).toBeGreaterThanOrEqual(1);
      const gstDoc = Catalogue446Registry.getEntryById('BF-DOC-01-002');
      expect(gstDoc).toBeDefined();
      expect(gstDoc?.lifecycleStatus).toBe('RELEASE_READY');
      expect(gstDoc?.canonicalName).toBe('Indian GST Tax Invoice');
      expect(gstDoc?.supportedLayoutCodes).toContain('gst_executive');
      expect(gstDoc?.supportedLayoutCodes).toContain('gst_ledger');
      expect(gstDoc?.supportedLayoutCodes).toContain('gst_minimal');
      expect(gstDoc?.supportedLayoutCodes).toContain('gst_corporate');
      expect(gstDoc?.supportedLayoutCodes).toContain('gst_supply_chain');

      // The majority of candidate documents should maintain strict research/draft provenance
      const researchOrDraft = all.filter((e: CatalogueDocumentEntry) => e.lifecycleStatus !== 'RELEASE_READY');
      expect(researchOrDraft.length).toBeGreaterThan(400);
    });

    it('should accurately retrieve documents by category and search queries', () => {
      const cat1Docs = Catalogue446Registry.getEntriesByCategory('sales_billing');
      expect(cat1Docs.length).toBeGreaterThan(0);
      expect(cat1Docs[0].categoryIndex).toBe(1);

      const searchResults = Catalogue446Registry.searchEntries('GST');
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      expect(searchResults.some((d: CatalogueDocumentEntry) => d.id === 'BF-DOC-01-002')).toBe(true);
    });
  });

  // =========================================================================
  // 2. STATUTORY DOCUMENT READINESS GATE (CBIC RULE 46)
  // =========================================================================
  describe('2. Statutory Document Readiness Gate (Rule 46)', () => {
    it('should PASS a fully compliant B2B intra-state tax invoice', () => {
      const result = DocumentReadinessValidator.validateTaxInvoice(validIntraStateDoc, validBusinessProfile);
      expect(result.hardGatePassed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.statutoryScore).toBe(100);
      
      // Data parser confirms intra-state tax split
      const parsed = parseGstInvoiceData(validIntraStateDoc, validBusinessProfile);
      expect(parsed.isInterState).toBe(false);
      expect(parsed.totalCgstMinor).toBeGreaterThan(0n);
      expect(parsed.totalSgstMinor).toBeGreaterThan(0n);
      expect(parsed.totalIgstMinor).toBe(0n);
    });

    it('should correctly classify inter-state supply and tax regime (IGST)', () => {
      const result = DocumentReadinessValidator.validateTaxInvoice(validInterStateDoc, validBusinessProfile);
      expect(result.hardGatePassed).toBe(true);
      
      const parsed = parseGstInvoiceData(validInterStateDoc, validBusinessProfile);
      expect(parsed.isInterState).toBe(true);
      expect(parsed.placeOfSupplyCode).toBe('29');
      expect(parsed.totalIgstMinor).toBeGreaterThan(0n);
      expect(parsed.totalCgstMinor).toBe(0n);
      expect(parsed.totalSgstMinor).toBe(0n);
    });

    it('should FAIL when Supplier GSTIN is missing or invalid structure', () => {
      const badProfile = { ...validBusinessProfile, tax_id: 'INVALID_GST_123' };
      const result = DocumentReadinessValidator.validateTaxInvoice(validIntraStateDoc, badProfile);
      expect(result.hardGatePassed).toBe(false);
      expect(result.violations.some((v) => v.code === 'INVALID_SUPPLIER_GSTIN_FORMAT')).toBe(true);
    });

    it('should FAIL when Invoice Number exceeds 16 characters (Rule 46(b) statutory limit)', () => {
      const badDoc = { ...validIntraStateDoc, document_number: 'INV/MUM/2026/OVERLIMIT999' }; // 25 chars
      const result = DocumentReadinessValidator.validateTaxInvoice(badDoc, validBusinessProfile);
      expect(result.hardGatePassed).toBe(false);
      expect(result.violations.some((v) => v.code === 'INVOICE_NUMBER_EXCEEDS_16_CHARS')).toBe(true);
    });

    it('should FAIL when Place of Supply is missing', () => {
      const badDoc = { ...validIntraStateDoc, place_of_supply: '' };
      const profileNoState = { ...validBusinessProfile, state: '' };
      const result = DocumentReadinessValidator.validateTaxInvoice(badDoc, profileNoState);
      expect(result.hardGatePassed).toBe(false);
      expect(result.violations.some((v) => v.code === 'MISSING_PLACE_OF_SUPPLY')).toBe(true);
    });

    it('should warn when line items lack HSN/SAC codes', () => {
      const warnDoc = {
        ...validIntraStateDoc,
        items: [
          {
            ...validIntraStateDoc.items[0],
            hsn_sac_code: '', // Missing HSN
          },
        ],
      };
      const result = DocumentReadinessValidator.validateTaxInvoice(warnDoc, validBusinessProfile);
      expect(result.warnings.some((w) => w.code === 'MISSING_HSN_SAC_CODE')).toBe(true);
    });

    it('should require B2C recipient name and address if total >= Rs 50,000 (Rule 46(f))', () => {
      const b2cDoc: FullDocument = {
        ...validIntraStateDoc,
        customer_name: '',     // Missing recipient name
        customer_business_name: null,
        customer_billing_address: null,
        total_minor: 6000000,  // Rs 60,000 (>= 50k threshold)
        ...({ customer_tax_id: null } as any), // B2C (unregistered)
      };
      const result = DocumentReadinessValidator.validateTaxInvoice(b2cDoc, validBusinessProfile);
      expect(result.hardGatePassed).toBe(false);
      expect(result.violations.some((v) => v.code === 'MISSING_RECIPIENT_NAME')).toBe(true);
      expect(result.violations.some((v) => v.code === 'MISSING_UNREGISTERED_RECIPIENT_ADDRESS')).toBe(true);
    });
  });

  // =========================================================================
  // 3. 100-POINT TEMPLATE QUALITY SCORE ENGINE
  // =========================================================================
  describe('3. 100-Point Template Quality Score Engine', () => {
    it('should score all 5 genuine GST layouts >= 95 points (Flagship S+++ Tier)', () => {
      const layouts = ['gst_executive', 'gst_ledger', 'gst_minimal', 'gst_corporate', 'gst_supply_chain'] as const;

      for (const layout of layouts) {
        const evaluation = TemplateQualityScoreEngine.evaluate(layout);
        expect(evaluation.totalScore).toBeGreaterThanOrEqual(95);
        expect(evaluation.tier).toBe('Flagship S+++');
        expect(evaluation.isFlagship).toBe(true);

        // Verify categories are populated
        expect(evaluation.categories.length).toBe(7);
        for (const cat of evaluation.categories) {
          expect(cat.awardedPoints).toBeGreaterThan(0);
        }
      }
    });

    it('should enforce that a 100/100 design score NEVER overrides failed statutory readiness', () => {
      // Document with missing GSTIN & over-length invoice number
      const illegalDoc: FullDocument = {
        ...validIntraStateDoc,
        document_number: 'INV/EXCEEDING/16/CHARS/LONG/NUMBER',
      };
      const illegalProfile: BusinessProfile = {
        ...validBusinessProfile,
        tax_id: 'INVALID',
      };

      const readiness = DocumentReadinessValidator.validateTaxInvoice(illegalDoc, illegalProfile);
      const quality = TemplateQualityScoreEngine.evaluate('gst_executive');

      // Quality score is high (>= 95)
      expect(quality.totalScore).toBeGreaterThanOrEqual(95);

      // But Statutory readiness is strictly FALSE
      expect(readiness.hardGatePassed).toBe(false);

      // Combined evaluation rule: Document CANNOT be issued or treated as legally valid
      const canOfficiallyIssue = readiness.hardGatePassed && quality.isFlagship;
      expect(canOfficiallyIssue).toBe(false);
    });
  });

  // =========================================================================
  // 4. 5 GENUINE BLACK-AND-WHITE GST TAX INVOICE LAYOUTS
  // =========================================================================
  describe('4. 5 Genuine GST Tax Invoice Layouts (HTML & Print Rendering)', () => {

    it('GST-01 Executive Letterhead: should compile dominant org header, 3-column party grid, and grand total bar', () => {
      const html = renderGstTaxInvoiceHtml(validIntraStateDoc, validBusinessProfile, 'gst_executive');
      
      expect(html).toContain('TAX INVOICE');
      expect(html).toContain('Apex Infotech Solutions Private Limited');
      expect(html).toContain('Tata Consultancy Services');
      expect(html).toContain('27AABCU9603R1ZM'); // Supplier GSTIN
      expect(html).toContain('27AAACT2727Q1ZW'); // Recipient GSTIN
      expect(html).toContain('INV/2026/001');     // Invoice number
      expect(html).toContain('998314');           // SAC
      expect(html).toContain('CGST');
      expect(html).toContain('SGST');
      expect(html).toContain('GRAND TOTAL');
      expect(html).toContain('Rupees One Lakh Eighteen Thousand Only');
    });

    it('GST-02 Structured Ledger: should compile boxed metadata strip, shaded party panels, and 11-column table', () => {
      const html = renderGstTaxInvoiceHtml(validIntraStateDoc, validBusinessProfile, 'gst_ledger');
      
      expect(html).toContain('TAX INVOICE');
      expect(html).toContain('Invoice No.');
      expect(html).toContain('Place of Supply');
      expect(html).toContain('BILL TO');
      expect(html).toContain('SHIP TO (If different)');
      expect(html).toContain('HSN / SAC');
      expect(html).toContain('TAX BREAKUP');
      expect(html).toContain('Total Taxable Value');
      expect(html).toContain('Grand Total (₹)');
    });

    it('GST-03 Minimal Professional: should compile ultra-bold number, hairline typography, and clean stacked totals', () => {
      const html = renderGstTaxInvoiceHtml(validIntraStateDoc, validBusinessProfile, 'gst_minimal');
      
      expect(html).toContain('TAX INVOICE');
      expect(html).toContain('INV/2026/001');
      expect(html).toContain('Apex Infotech Solutions Private Limited');
      expect(html).toContain('BILL TO');
      expect(html).toContain('Taxable Value');
      expect(html).toContain('CGST');
      expect(html).toContain('SGST');
      expect(html).toContain('TOTAL INVOICE VALUE');
    });

    it('GST-04 Corporate B2B: should compile e-invoice metadata, Bill/Ship panels, and inverted black total bar', () => {
      const html = renderGstTaxInvoiceHtml(validIntraStateDoc, validBusinessProfile, 'gst_corporate');
      
      expect(html).toContain('TAX INVOICE');
      expect(html).toContain('BILL TO (Registered Buyer)');
      expect(html).toContain('SHIP TO (If different)');
      expect(html).toContain('GRAND TOTAL (₹)');
      expect(html).toContain('HDFC Bank');
      expect(html).toContain('HDFC0000123');
    });

    it('GST-05 Trade Supply Chain: should compile 4-column metadata strip, running page numbers, and multi-dispatch support', () => {
      const html = renderGstTaxInvoiceHtml(validInterStateDoc, validBusinessProfile, 'gst_supply_chain');
      
      expect(html).toContain('TAX INVOICE');
      expect(html).toContain('Invoice Date');
      expect(html).toContain('Place of Supply');
      expect(html).toContain('Bill To');
      expect(html).toContain('Ship To');
      expect(html).toContain('Total IGST'); // Karnataka inter-state IGST
      expect(html).toContain('Page 1 of 1');
      expect(html).toContain('Apex Infotech Solutions Private Limited');
    });
  });

  // =========================================================================
  // 5. INDIAN CURRENCY NUMBER-TO-WORDS ENGINE
  // =========================================================================
  describe('5. Indian Currency Number-to-Words Engine', () => {
    it('should format Indian monetary values into statutory words', () => {
      expect(numberToIndianWords(118000)).toBe('Rupees One Lakh Eighteen Thousand Only');
      expect(numberToIndianWords(5000000)).toBe('Rupees Fifty Lakh Only');
      expect(numberToIndianWords(12500000)).toBe('Rupees One Crore Twenty Five Lakh Only');
      expect(numberToIndianWords(0)).toBe('Rupees Zero Only');
    });
  });

  // =========================================================================
  // 6. MONOCHROME PAPER & PRINT FIDELITY INVARIANTS
  // =========================================================================
  describe('6. Monochrome Paper & Print Fidelity Invariants', () => {
    it('all 5 layouts must enforce clean monochrome background and zero artificial SaaS rainbow gradients', () => {
      const layouts = ['gst_executive', 'gst_ledger', 'gst_minimal', 'gst_corporate', 'gst_supply_chain'] as const;

      for (const layout of layouts) {
        const html = renderGstTaxInvoiceHtml(validIntraStateDoc, validBusinessProfile, layout);
        
        // Pure print background
        expect(html.toLowerCase()).toContain('background: #ffffff');
        // Standard A4 print dimensions
        expect(html).toContain('@page');
        expect(html).toContain('size: A4 portrait');
        // Zero saturated RGB rainbow colors
        expect(html).not.toMatch(/color:\s*#[0-9a-fA-F]*(?:ff0000|00ff00|0000ff)/i);
      }
    });
  });
});
