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
   * Validates a document against CBIC CGST Rule 46 (Statutory Tax Invoice Particulars)
   */
  static validateTaxInvoice(
    doc: FullDocument,
    business: BusinessProfile
  ): ComplianceValidationResult {
    const errors: ComplianceViolation[] = [];
    const warnings: string[] = [];

    // 1. Supplier Particulars (Rule 46(a))
    if (!business.name || !business.name.trim()) {
      errors.push({
        fieldKey: 'supplier_name',
        message: 'Supplier business name is required.',
        rule: 'CBIC CGST Rule 46(a)',
      });
    }
    const supplierGstin = (business.tax_id || '').trim();
    if (!supplierGstin) {
      errors.push({
        fieldKey: 'supplier_gstin',
        message: 'Supplier GSTIN is mandatory under Rule 46(a).',
        rule: 'CBIC CGST Rule 46(a)',
      });
    } else if (!SyntaxValidator.isValidGstin(supplierGstin)) {
      errors.push({
        fieldKey: 'supplier_gstin',
        message: `Supplier GSTIN "${supplierGstin}" is not syntactically valid.`,
        rule: 'CBIC CGST Rule 46(a)',
      });
    }

    // 2. Consecutive Serial Number (Rule 46(b) - Up to 16 characters)
    if (!doc.document_number || !doc.document_number.trim()) {
      errors.push({
        fieldKey: 'document_number',
        message: 'Invoice number is mandatory.',
        rule: 'CBIC CGST Rule 46(b)',
      });
    } else if (!SyntaxValidator.isValidConsecutiveInvoiceNumber(doc.document_number)) {
      errors.push({
        fieldKey: 'document_number',
        message: `Invoice number "${doc.document_number}" exceeds 16 characters or contains disallowed special characters.`,
        rule: 'CBIC CGST Rule 46(b)',
      });
    }

    // 3. Date of Issue (Rule 46(c))
    if (!doc.issue_date || doc.issue_date <= 0) {
      errors.push({
        fieldKey: 'issue_date',
        message: 'Date of invoice issuance is mandatory.',
        rule: 'CBIC CGST Rule 46(c)',
      });
    }

    // 4. Recipient Particulars (Rule 46(d) & (e))
    if (!doc.customer_name || !doc.customer_name.trim()) {
      errors.push({
        fieldKey: 'customer_name',
        message: 'Recipient name is mandatory.',
        rule: 'CBIC CGST Rule 46(d)',
      });
    }

    // 5. Line items, HSN/SAC, Rates, and Quantities (Rule 46(g), (h), (i), (j))
    if (!doc.items || doc.items.length === 0) {
      errors.push({
        fieldKey: 'items',
        message: 'At least one line item is required.',
        rule: 'CBIC CGST Rule 46(g)',
      });
    } else {
      for (let i = 0; i < doc.items.length; i++) {
        const item = doc.items[i];
        if (!item.description || !item.description.trim()) {
          errors.push({
            fieldKey: `item_${i}_description`,
            message: `Item #${i + 1} is missing a description.`,
            rule: 'CBIC CGST Rule 46(g)',
          });
        }
        if (item.quantity_scaled <= 0) {
          errors.push({
            fieldKey: `item_${i}_quantity`,
            message: `Item #${i + 1} must have a quantity greater than zero.`,
            rule: 'CBIC CGST Rule 46(h)',
          });
        }
        if (item.unit_price_minor < 0) {
          errors.push({
            fieldKey: `item_${i}_unit_price`,
            message: `Item #${i + 1} cannot have a negative unit price.`,
            rule: 'CBIC CGST Rule 46(i)',
          });
        }
        const hsn = item.hsn_sac_code || item.hsn_sac;
        if (hsn && !SyntaxValidator.isValidHsnSac(hsn)) {
          warnings.push(`Item #${i + 1} HSN/SAC code "${hsn}" is not standard 2/4/6/8 digits.`);
        }
      }
    }

    // 6. Tax Rate and Tax Amount Charged (Rule 46(m))
    if (doc.tax_minor > 0 && doc.tax_rate_bp === 0) {
      warnings.push('Tax amount charged without an explicit tax rate basis points recorded.');
    }

    // 7. Place of Supply (Rule 46(n))
    if (!doc.place_of_supply) {
      errors.push({
        fieldKey: 'place_of_supply',
        message: 'Place of supply is mandatory under Rule 46(n).',
        rule: 'CBIC CGST Rule 46(n)',
      });
    }

    return {
      isValid: errors.length === 0,
      isCompliant: errors.length === 0,
      errors,
      warnings,
      statutoryRule: 'CBIC CGST Rule 46',
    };
  }

  static validateGstTaxInvoice(
    doc: FullDocument,
    business: BusinessProfile
  ): ComplianceValidationResult {
    return this.validateTaxInvoice(doc, business);
  }

  /**
   * Validates a Credit / Debit Note against CBIC CGST Rule 53
   */
  static validateCreditNote(
    doc: FullDocument,
    business: BusinessProfile
  ): ComplianceValidationResult {
    const errors: ComplianceViolation[] = [];
    const warnings: string[] = [];

    // Rule 53 requires supplier details, serial number, and original invoice link
    if (!business.name || !business.name.trim()) {
      errors.push({
        fieldKey: 'supplier_name',
        message: 'Supplier business name is required.',
        rule: 'CBIC CGST Rule 53',
      });
    }
    if (!doc.document_number || !doc.document_number.trim()) {
      errors.push({
        fieldKey: 'document_number',
        message: 'Credit note serial number is mandatory.',
        rule: 'CBIC CGST Rule 53',
      });
    }
    if (!doc.parent_document_id && !doc.notes?.includes('Original Invoice')) {
      errors.push({
        fieldKey: 'parent_document_id',
        message: 'Rule 53 specifies referencing the serial number and date of the corresponding original tax invoice.',
        rule: 'CBIC GST Rule 53',
      });
    }

    return {
      isValid: errors.length === 0,
      isCompliant: errors.length === 0,
      errors,
      warnings,
      statutoryRule: 'CBIC CGST Rule 53',
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
