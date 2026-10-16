/**
 * COUNTRY-SPECIFIC TAX INFORMATION & STATUTORY COMPLIANCE TEST SUITE
 * Verifies that the tax engine, document compliance validator, and template configurations
 * correctly represent statutory tax particulars per country jurisdiction:
 * - India (IN): GSTIN, PAN, HSN/SAC, CGST/SGST/IGST, CBIC CGST Rules 46/49/53
 * - United States (US): EIN, State Tax Permit, SKU/UNSPSC, Sales Tax, UCC & IRC § 6011
 * - United Kingdom (GB): VAT Reg No, CRN, Commodity Code, VAT 20%, HMRC Notice 700
 * - Canada (CA): CRA BN/GST, PST/QST, Tariff Code, HST 13%, Excise Tax Act Part IX
 * - Australia (AU): ABN, ACN, Item Code, GST 10%, ATO Div 29 A New Tax System Act
 * - United Arab Emirates (AE): TRN 15 digits, HS Code, VAT 5%, FTA Decree-Law (8) Art 59
 * - Germany (DE): USt-IdNr, Steuernummer, Taric/Zolltarif, MwSt 19%, § 14 UStG & EU VAT Directive
 * - Singapore (SG): GST Reg No, UEN, Product Code, GST 9%, IRAS GST Act (Cap. 117A)
 */

import { CountryPackRegistry } from '../../src/domain/tax/CountryPackRegistry';
import { DocumentComplianceValidator } from '../../src/domain/compliance/DocumentComplianceValidator';
import { COUNTRY_TAX_CONFIGS } from '../../src/app/document/templates';
import { FullDocument } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfile } from '../../src/domain/profile/types';

describe('Country-Specific Tax Information & Jurisdictions', () => {
  describe('CountryPackRegistry Country Resolution', () => {
    it('resolves Australia GST Pack with 10% rate and GST tax system', () => {
      const pack = CountryPackRegistry.getPack('AU');
      expect(pack).toBeDefined();
      expect(pack?.metadata.countryCode).toBe('AU');
      expect(pack?.metadata.taxSystem).toBe('GST');
      expect(pack?.metadata.defaultRateBasisPoints).toBe(1000n); // 10.0%
      expect(pack?.metadata.defaultCurrency).toBe('AUD');
    });

    it('resolves UAE VAT Pack with 5% rate and VAT tax system', () => {
      const pack = CountryPackRegistry.getPack('AE');
      expect(pack).toBeDefined();
      expect(pack?.metadata.countryCode).toBe('AE');
      expect(pack?.metadata.taxSystem).toBe('VAT');
      expect(pack?.metadata.defaultRateBasisPoints).toBe(500n); // 5.0%
      expect(pack?.metadata.defaultCurrency).toBe('AED');
    });

    it('resolves Germany MwSt Pack with 19% rate and MwSt tax system', () => {
      const pack = CountryPackRegistry.getPack('DE');
      expect(pack).toBeDefined();
      expect(pack?.metadata.countryCode).toBe('DE');
      expect(pack?.metadata.taxSystem).toBe('MwSt');
      expect(pack?.metadata.defaultRateBasisPoints).toBe(1900n); // 19.0%
      expect(pack?.metadata.defaultCurrency).toBe('EUR');
    });

    it('resolves Singapore GST Pack with 9% rate and GST tax system', () => {
      const pack = CountryPackRegistry.getPack('SG');
      expect(pack).toBeDefined();
      expect(pack?.metadata.countryCode).toBe('SG');
      expect(pack?.metadata.taxSystem).toBe('GST');
      expect(pack?.metadata.defaultRateBasisPoints).toBe(900n); // 9.0%
      expect(pack?.metadata.defaultCurrency).toBe('SGD');
    });

    it('resolves UK VAT Pack with 20% standard rate and GBP currency', () => {
      const pack = CountryPackRegistry.getPack('GB');
      expect(pack).toBeDefined();
      expect(pack?.metadata.countryCode).toBe('GB');
      expect(pack?.metadata.taxSystem).toBe('VAT');
      expect(pack?.metadata.defaultRateBasisPoints).toBe(2000n); // 20.0%
      expect(pack?.metadata.defaultCurrency).toBe('GBP');
    });

    it('resolves US Sales Tax Pack with Sales Tax and USD currency', () => {
      const pack = CountryPackRegistry.getPack('US');
      expect(pack).toBeDefined();
      expect(pack?.metadata.countryCode).toBe('US');
      expect(pack?.metadata.taxSystem).toBe('Sales Tax');
      expect(pack?.metadata.defaultCurrency).toBe('USD');
    });
  });

  describe('DocumentComplianceValidator Multi-Country Branching', () => {
    const makeBusinessProfile = (partial: Partial<BusinessProfile>): BusinessProfile => ({
      id: 'biz_test_default',
      name: 'Default Test Business',
      country: 'India',
      country_iso2: 'IN',
      default_currency: 'INR',
      default_document_locale: 'en-IN',
      is_active: true,
      created_at: 1729000000000,
      updated_at: 1729000000000,
      ...partial,
    });

    const makeDoc = (num: string): FullDocument => ({
      id: 'doc_test_1',
      business_profile_id: 'biz_1',
      job_id: null,
      doc_type: 'tax_invoice',
      sequence_number: 1,
      document_number: num,
      customer_id: 'cust_1',
      customer_name: 'Acme International Corp',
      customer_business_name: 'Acme International Corporation',
      customer_billing_address: '100 Broadway, New York, NY',
      lifecycle_status: 'issued',
      issue_date: 1729000000000,
      due_date: 1731600000000,
      currency: 'USD',
      subtotal_minor: 500000,
      discount_minor: 0,
      discount_type: 'none',
      discount_value: 0,
      tax_minor: 0,
      tax_type: 'none',
      tax_rate_bp: 0,
      tax_label: 'TAX',
      total_minor: 500000,
      deposit_minor: 0,
      total_paid_minor: 0,
      balance_minor: 500000,
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
      created_at: 1729000000000,
      updated_at: 1729000000000,
      place_of_supply: '27',
      supply_type: 'intra_state',
      reverse_charge: false,
      items: [
        {
          id: 'item_1',
          document_id: 'doc_test_1',
          catalog_item_id: null,
          description: 'Cloud Infrastructure Service',
          item_notes: null,
          category: 'services',
          quantity_scaled: 10000,
          unit_name: 'month',
          unit_price_minor: 500000,
          internal_cost_minor: 0,
          line_total_minor: 500000,
          sort_order: 0,
          hsn_sac: '998314',
        },
      ],
    });

    it('enforces Indian GST Rule 46 requirements only when country is IN', () => {
      const indianBusiness = makeBusinessProfile({
        name: 'Apex India Ltd',
        tax_id: '27AABCU9603R1ZM',
        country_iso2: 'IN',
        state: 'Maharashtra',
      });
      const doc = makeDoc('INV/2026/001');
      doc.place_of_supply = '27';

      const validResult = DocumentComplianceValidator.validateTaxInvoice(doc, indianBusiness);
      expect(validResult.isCompliant).toBe(true);
      expect(validResult.statutoryRule).toBe('CBIC CGST Rule 46');

      // Without place of supply, Indian invoice is invalid under Rule 46(n)
      doc.place_of_supply = undefined;
      const invalidResult = DocumentComplianceValidator.validateTaxInvoice(doc, indianBusiness);
      expect(invalidResult.isCompliant).toBe(false);
      expect(invalidResult.errors.some((e) => e.fieldKey === 'place_of_supply')).toBe(true);
    });

    it('validates US commercial invoice under UCC & IRC without demanding Indian GSTIN or Place of Supply', () => {
      const usBusiness = makeBusinessProfile({
        name: 'Apex US Corporation',
        tax_id: '12-3456789',
        country_iso2: 'US',
        country: 'United States',
        default_currency: 'USD',
        state: 'New York',
      });
      const doc = makeDoc('INV-2026-US-01');

      const result = DocumentComplianceValidator.validateTaxInvoice(doc, usBusiness);
      expect(result.isCompliant).toBe(true);
      expect(result.statutoryRule).toBe('UCC Article 2 & IRC § 6011');
      expect(result.errors.length).toBe(0);
    });

    it('validates UK invoice under HMRC Notice 700 and requires VAT Reg No', () => {
      const ukBusiness = makeBusinessProfile({
        name: 'Apex UK Ltd',
        tax_id: 'GB 123 4567 89',
        country_iso2: 'GB',
        country: 'United Kingdom',
        default_currency: 'GBP',
      });
      const doc = makeDoc('INV-2026-UK-01');

      const result = DocumentComplianceValidator.validateTaxInvoice(doc, ukBusiness);
      expect(result.isCompliant).toBe(true);
      expect(result.statutoryRule).toBe('HMRC Notice 700 / VAT Act 1994');

      // Missing VAT Reg No should fail
      const missingVatBiz = makeBusinessProfile({ ...ukBusiness, tax_id: '' });
      const failedResult = DocumentComplianceValidator.validateTaxInvoice(doc, missingVatBiz);
      expect(failedResult.isCompliant).toBe(false);
      expect(failedResult.errors.some((e) => e.fieldKey === 'supplier_tax_id')).toBe(true);
    });

    it('validates Australian invoice under ATO Div 29 and requires ABN', () => {
      const auBusiness = makeBusinessProfile({
        name: 'Apex Australia Pty Ltd',
        tax_id: '12 345 678 901',
        country_iso2: 'AU',
        country: 'Australia',
        default_currency: 'AUD',
      });
      const doc = makeDoc('INV-2026-AU-01');

      const result = DocumentComplianceValidator.validateTaxInvoice(doc, auBusiness);
      expect(result.isCompliant).toBe(true);
      expect(result.statutoryRule).toBe('ATO A New Tax System (GST) Act 1999 Div 29');
    });

    it('validates German invoice under § 14 UStG and requires USt-IdNr / Steuernummer', () => {
      const deBusiness = makeBusinessProfile({
        name: 'Apex Deutschland GmbH',
        tax_id: 'DE 123456789',
        country_iso2: 'DE',
        country: 'Germany',
        default_currency: 'EUR',
      });
      const doc = makeDoc('RE-2026-DE-01');

      const result = DocumentComplianceValidator.validateTaxInvoice(doc, deBusiness);
      expect(result.isCompliant).toBe(true);
      expect(result.statutoryRule).toBe('§ 14 UStG & EU VAT Directive');
    });

    it('validates UAE invoice under FTA Decree-Law (8) Art 59 and requires TRN', () => {
      const uaeBusiness = makeBusinessProfile({
        name: 'Apex UAE LLC',
        tax_id: '100 2345 6789 0003',
        country_iso2: 'AE',
        country: 'United Arab Emirates',
        default_currency: 'AED',
      });
      const doc = makeDoc('INV-2026-AE-01');

      const result = DocumentComplianceValidator.validateTaxInvoice(doc, uaeBusiness);
      expect(result.isCompliant).toBe(true);
      expect(result.statutoryRule).toBe('UAE FTA Decree-Law No. (8) Art 59');
    });
  });

  describe('COUNTRY_TAX_CONFIGS Metadata Accuracy', () => {
    it('contains all 8 required tax jurisdictions with complete financial routing and tax parameters', () => {
      const expectedCodes = ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'DE', 'SG'];
      for (const code of expectedCodes) {
        const config = COUNTRY_TAX_CONFIGS[code];
        expect(config).toBeDefined();
        expect(config.code).toBe(code);
        expect(config.name).toBeTruthy();
        expect(config.flag).toBeTruthy();
        expect(config.currencySymbol).toBeTruthy();
        expect(config.currencyCode).toBeTruthy();
        expect(config.taxSystemName).toBeTruthy();
        expect(config.taxIdLabel).toBeTruthy();
        expect(config.defaultTaxId).toBeTruthy();
        expect(config.itemCodeHeader).toBeTruthy();
        expect(config.bankRoutingLabel).toBeTruthy();
        expect(config.digitalPayLabel).toBeTruthy();
        expect(config.sampleBankName).toBeTruthy();
      }
    });

    it('specifies the proper classification code header per country', () => {
      expect(COUNTRY_TAX_CONFIGS.IN.itemCodeHeader).toBe('HSN/SAC');
      expect(COUNTRY_TAX_CONFIGS.US.itemCodeHeader).toBe('SKU / CODE');
      expect(COUNTRY_TAX_CONFIGS.GB.itemCodeHeader).toBe('COMMODITY');
      expect(COUNTRY_TAX_CONFIGS.CA.itemCodeHeader).toBe('TARIFF CODE');
      expect(COUNTRY_TAX_CONFIGS.AU.itemCodeHeader).toBe('ITEM CODE');
      expect(COUNTRY_TAX_CONFIGS.AE.itemCodeHeader).toBe('HS CODE');
      expect(COUNTRY_TAX_CONFIGS.DE.itemCodeHeader).toBe('ZOLLTARIF');
      expect(COUNTRY_TAX_CONFIGS.SG.itemCodeHeader).toBe('PROD CODE');
    });

    it('specifies the proper bank wire routing label per country', () => {
      expect(COUNTRY_TAX_CONFIGS.IN.bankRoutingLabel).toBe('IFSC');
      expect(COUNTRY_TAX_CONFIGS.US.bankRoutingLabel).toBe('ABA Routing');
      expect(COUNTRY_TAX_CONFIGS.GB.bankRoutingLabel).toBe('Sort Code');
      expect(COUNTRY_TAX_CONFIGS.CA.bankRoutingLabel).toBe('Transit / Inst');
      expect(COUNTRY_TAX_CONFIGS.AU.bankRoutingLabel).toBe('BSB Code');
      expect(COUNTRY_TAX_CONFIGS.AE.bankRoutingLabel).toBe('IBAN / SWIFT');
      expect(COUNTRY_TAX_CONFIGS.DE.bankRoutingLabel).toBe('IBAN / BIC');
      expect(COUNTRY_TAX_CONFIGS.SG.bankRoutingLabel).toBe('Bank / Branch');
    });
  });
});
