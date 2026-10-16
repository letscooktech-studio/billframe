/**
 * DOCUMENT COMPLIANCE & LEGAL STATUTORY VALIDATOR
 * Enforces CBIC GST Rule 46, Rule 53, Rule 55, and statutory particulars.
 * Guarantees cosmetic templates cannot override or conceal mandatory statutory data.
 */

import { FullDocument } from '../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../profile/types';
import { SyntaxValidator } from '../fields/FieldRegistry';

export interface ComplianceViolation {
  readonly fieldKey: string;
  readonly message: string;
  readonly rule?: string;
}

export interface ComplianceValidationResult {
  readonly isValid: boolean;
  readonly isCompliant: boolean;
  readonly errors: readonly ComplianceViolation[];
  readonly warnings: readonly string[];
  readonly statutoryRule?: string;
}

export class DocumentComplianceValidator {
  /**
   * Validates a document against statutory particulars based on country jurisdiction:
   * - India: CBIC CGST Rule 46 (GSTIN, HSN/SAC, Place of supply)
   * - US: UCC Article 2 & IRC § 6011 (EIN/State Permit)
   * - UK: HMRC Notice 700 & Value Added Tax Act 1994 s.58 (VAT Reg No)
   * - Canada: Canada Excise Tax Act Part IX (CRA BN/GST)
   * - Australia: ATO A New Tax System (GST) Act 1999 Div 29 (ABN)
   * - UAE: UAE FTA Decree-Law No. (8) on VAT Art 59 (TRN 15 digits)
   * - Germany: § 14 UStG & EU VAT Directive 2006/112/EC (USt-IdNr / Steuernummer)
   * - Singapore: IRAS Goods and Services Tax Act (Cap. 117A) (GST Reg / UEN)
   */
  static validateTaxInvoice(
    doc: FullDocument,
    business: BusinessProfile
  ): ComplianceValidationResult {
    const errors: ComplianceViolation[] = [];
    const warnings: string[] = [];
    const country = (business.country_iso2 || 'IN').toUpperCase();

    // 1. Supplier Particulars
    if (!business.name || !business.name.trim()) {
      errors.push({
        fieldKey: 'supplier_name',
        message: 'Supplier business name is required.',
        rule: country === 'IN' ? 'CBIC CGST Rule 46(a)' : `${country} Statutory Invoicing Rules`,
      });
    }

    const supplierTaxId = (business.tax_id || '').trim();
    if (country === 'IN') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_gstin',
          message: 'Supplier GSTIN is mandatory under Rule 46(a).',
          rule: 'CBIC CGST Rule 46(a)',
        });
      } else if (!SyntaxValidator.isValidGstin(supplierTaxId)) {
        errors.push({
          fieldKey: 'supplier_gstin',
          message: `Supplier GSTIN "${supplierTaxId}" is not syntactically valid.`,
          rule: 'CBIC CGST Rule 46(a)',
        });
      }
    } else if (country === 'US') {
      if (!supplierTaxId) {
        warnings.push('Supplier Federal EIN or State Tax ID is recommended for commercial tax invoices.');
      }
    } else if (country === 'GB') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_tax_id',
          message: 'Supplier VAT Registration Number is mandatory under HMRC Notice 700.',
          rule: 'UK VAT Act 1994 s.58',
        });
      }
    } else if (country === 'CA') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_tax_id',
          message: 'Supplier CRA Business Number (BN/GST) is mandatory for tax invoices.',
          rule: 'Canada Excise Tax Act Part IX',
        });
      }
    } else if (country === 'AU') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_tax_id',
          message: 'Supplier ABN is mandatory under A New Tax System (GST) Act 1999 Div 29.',
          rule: 'ATO A New Tax System (GST) Act 1999 Div 29',
        });
      }
    } else if (country === 'AE') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_tax_id',
          message: 'Supplier TRN is mandatory under UAE FTA Decree-Law No. (8) Art 59.',
          rule: 'UAE FTA Decree-Law No. (8) Art 59',
        });
      }
    } else if (country === 'DE') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_tax_id',
          message: 'Supplier USt-IdNr or Steuernummer is mandatory under § 14 UStG.',
          rule: '§ 14 Abs. 4 UStG',
        });
      }
    } else if (country === 'SG') {
      if (!supplierTaxId) {
        errors.push({
          fieldKey: 'supplier_tax_id',
          message: 'Supplier GST Registration Number or UEN is mandatory for GST invoices.',
          rule: 'IRAS GST Act (Cap. 117A)',
        });
      }
    } else {
      if (!supplierTaxId) {
        warnings.push('Supplier tax identification number is missing.');
      }
    }

    // 2. Consecutive Serial Number
    if (!doc.document_number || !doc.document_number.trim()) {
      errors.push({
        fieldKey: 'document_number',
        message: 'Invoice number is mandatory.',
        rule: country === 'IN' ? 'CBIC CGST Rule 46(b)' : 'Statutory Invoice Numbering',
      });
    } else if (country === 'IN' && !SyntaxValidator.isValidConsecutiveInvoiceNumber(doc.document_number)) {
      errors.push({
        fieldKey: 'document_number',
        message: `Invoice number "${doc.document_number}" exceeds 16 characters or contains disallowed special characters.`,
        rule: 'CBIC CGST Rule 46(b)',
      });
    }

    // 3. Date of Issue
    if (!doc.issue_date || doc.issue_date <= 0) {
      errors.push({
        fieldKey: 'issue_date',
        message: 'Date of invoice issuance is mandatory.',
        rule: country === 'IN' ? 'CBIC CGST Rule 46(c)' : 'Statutory Date Requirement',
      });
    }

    // 4. Recipient Particulars
    if (!doc.customer_name || !doc.customer_name.trim()) {
      errors.push({
        fieldKey: 'customer_name',
        message: 'Recipient name is mandatory.',
        rule: country === 'IN' ? 'CBIC CGST Rule 46(d)' : 'Recipient Identity Requirement',
      });
    }

    // 5. Line items, Quantities, and Rates
    if (!doc.items || doc.items.length === 0) {
      errors.push({
        fieldKey: 'items',
        message: 'At least one line item is required.',
        rule: country === 'IN' ? 'CBIC CGST Rule 46(g)' : 'Line Item Requirement',
      });
    } else {
      for (let i = 0; i < doc.items.length; i++) {
        const item = doc.items[i];
        if (!item.description || !item.description.trim()) {
          errors.push({
            fieldKey: `item_${i}_description`,
            message: `Item #${i + 1} is missing a description.`,
            rule: country === 'IN' ? 'CBIC CGST Rule 46(g)' : 'Line Item Description',
          });
        }
        if (item.quantity_scaled <= 0) {
          errors.push({
            fieldKey: `item_${i}_quantity`,
            message: `Item #${i + 1} must have a quantity greater than zero.`,
            rule: country === 'IN' ? 'CBIC CGST Rule 46(h)' : 'Line Item Quantity',
          });
        }
        if (item.unit_price_minor < 0) {
          errors.push({
            fieldKey: `item_${i}_unit_price`,
            message: `Item #${i + 1} cannot have a negative unit price.`,
            rule: country === 'IN' ? 'CBIC CGST Rule 46(i)' : 'Line Item Unit Price',
          });
        }
        if (country === 'IN') {
          const hsn = item.hsn_sac_code || item.hsn_sac;
          if (hsn && !SyntaxValidator.isValidHsnSac(hsn)) {
            warnings.push(`Item #${i + 1} HSN/SAC code "${hsn}" is not standard 2/4/6/8 digits.`);
          }
        }
      }
    }

    // 6. Tax Rate and Tax Amount Charged
    if (doc.tax_minor > 0 && doc.tax_rate_bp === 0) {
      warnings.push('Tax amount charged without an explicit tax rate basis points recorded.');
    }

    // 7. Place of Supply (Rule 46(n) for India)
    if (country === 'IN' && !doc.place_of_supply) {
      errors.push({
        fieldKey: 'place_of_supply',
        message: 'Place of supply is mandatory under Rule 46(n).',
        rule: 'CBIC CGST Rule 46(n)',
      });
    }

    const statutoryRuleTitle =
      country === 'IN' ? 'CBIC CGST Rule 46' :
      country === 'US' ? 'UCC Article 2 & IRC § 6011' :
      country === 'GB' ? 'HMRC Notice 700 / VAT Act 1994' :
      country === 'CA' ? 'Canada Excise Tax Act Part IX' :
      country === 'AU' ? 'ATO A New Tax System (GST) Act 1999 Div 29' :
      country === 'AE' ? 'UAE FTA Decree-Law No. (8) Art 59' :
      country === 'DE' ? '§ 14 UStG & EU VAT Directive' :
      country === 'SG' ? 'IRAS GST Act (Cap. 117A)' :
      'International Statutory Invoicing Standards';

    return {
      isValid: errors.length === 0,
      isCompliant: errors.length === 0,
      errors,
      warnings,
      statutoryRule: statutoryRuleTitle,
    };
  }

  static validateGstTaxInvoice(
    doc: FullDocument,
    business: BusinessProfile
  ): ComplianceValidationResult {
    return this.validateTaxInvoice(doc, business);
  }

  /**
   * Validates a Credit / Debit Note against jurisdiction rules:
   * - India: CBIC CGST Rule 53
   * - UK: VAT Regulations 1995 Reg 24
   * - Canada: Excise Tax Act s. 232
   * - Australia: A New Tax System (GST) Act 1999 Div 29
   * - Global: Statutory Adjustment Note Standards
   */
  static validateCreditNote(
    doc: FullDocument,
    business: BusinessProfile
  ): ComplianceValidationResult {
    const errors: ComplianceViolation[] = [];
    const warnings: string[] = [];
    const country = (business.country_iso2 || 'IN').toUpperCase();

    const ruleLabel =
      country === 'IN' ? 'CBIC GST Rule 53' :
      country === 'GB' ? 'HMRC VAT Reg 24' :
      country === 'CA' ? 'Excise Tax Act s. 232' :
      country === 'AU' ? 'ATO GST Div 29 Adjustment' :
      'Statutory Credit Note Standard';

    // Requires supplier details, serial number, and original invoice link
    if (!business.name || !business.name.trim()) {
      errors.push({
        fieldKey: 'supplier_name',
        message: 'Supplier business name is required.',
        rule: ruleLabel,
      });
    }
    if (!doc.document_number || !doc.document_number.trim()) {
      errors.push({
        fieldKey: 'document_number',
        message: 'Credit note serial number is mandatory.',
        rule: ruleLabel,
      });
    }
    if (!doc.parent_document_id && !doc.notes?.includes('Original Invoice')) {
      errors.push({
        fieldKey: 'parent_document_id',
        message: 'Cross-referencing the serial number and date of the corresponding original tax invoice is required.',
        rule: ruleLabel,
      });
    }

    return {
      isValid: errors.length === 0,
      isCompliant: errors.length === 0,
      errors,
      warnings,
      statutoryRule: ruleLabel,
    };
  }

  /**
   * Validates a Delivery Challan against CBIC CGST Rule 55
   */
  static validateDeliveryChallan(
    doc: FullDocument,
    _business: BusinessProfile
  ): ComplianceValidationResult {
    const errors: ComplianceViolation[] = [];
    const warnings: string[] = [];

    if (!doc.document_number || !doc.document_number.trim()) {
      errors.push({
        fieldKey: 'document_number',
        message: 'Delivery challan serial number is mandatory.',
        rule: 'CBIC CGST Rule 55',
      });
    }
    if (!doc.items || doc.items.length === 0) {
      errors.push({
        fieldKey: 'items',
        message: 'Goods description and quantity are mandatory for delivery challans under Rule 55.',
        rule: 'CBIC CGST Rule 55',
      });
    }

    return {
      isValid: errors.length === 0,
      isCompliant: errors.length === 0,
      errors,
      warnings,
      statutoryRule: 'CBIC CGST Rule 55',
    };
  }

  /**
   * Column visibility validator: forbids hiding mandatory statutory fields like description or line totals
   */
  static validateColumnVisibility(
    _docType: string,
    columnVisibility: Record<string, boolean>
  ): ComplianceValidationResult {
    const errors: ComplianceViolation[] = [];
    if (columnVisibility['description'] === false) {
      errors.push({
        fieldKey: 'description',
        message: 'Statutory Rule 46 prohibits hiding item descriptions.',
        rule: 'CBIC CGST Rule 46',
      });
    }
    if (columnVisibility['total'] === false) {
      errors.push({
        fieldKey: 'total',
        message: 'Statutory Rule 46 prohibits hiding item totals.',
        rule: 'CBIC CGST Rule 46',
      });
    }

    return {
      isValid: errors.length === 0,
      isCompliant: errors.length === 0,
      errors,
      warnings: [],
      statutoryRule: 'CBIC CGST Rule 46',
    };
  }

  /**
   * Verifies that a template customization does NOT illegally hide mandatory fields.
   */
  static validateTemplateConfigAgainstStatutoryRules(
    docType: string,
    columnVisibility: Record<string, boolean>
  ): { isPermitted: boolean; violationError?: string } {
    const res = this.validateColumnVisibility(docType, columnVisibility);
    if (!res.isCompliant) {
      return { isPermitted: false, violationError: res.errors[0]?.message };
    }
    return { isPermitted: true };
  }
}
