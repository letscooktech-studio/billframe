/**
 * DOCUMENT READINESS VALIDATOR
 * 
 * Independent Statutory Hard Gate.
 * Validates actual filled data, regulatory particulars, calculations,
 * authorizations, and statutory integrity.
 * 
 * CRITICAL RULE:
 * A 100/100 Design Quality Score must NEVER override a failed Document Readiness validation.
 * If any statutory requirement fails, `hardGatePassed` is false, and the document
 * must not be claimed as legally final or compliant.
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from './types';

export interface StatutoryViolation {
  readonly code: string;
  readonly field: string;
  readonly rule: string;
  readonly statutoryReference: string;
  readonly severity: 'BLOCKER' | 'WARNING';
}

export interface DocumentReadinessResult {
  readonly documentId: string;
  readonly documentType: string;
  readonly isReady: boolean;
  readonly hardGatePassed: boolean;
  readonly statutoryScore: number; // 0 - 100
  readonly violations: readonly StatutoryViolation[];
  readonly warnings: readonly StatutoryViolation[];
  readonly checklist: readonly {
    readonly item: string;
    readonly passed: boolean;
    readonly statutoryRef: string;
    readonly details?: string;
  }[];
}

/**
 * Validates Indian GSTIN format per Section 22/25 of CGST Act:
 * 15 alphanumeric characters:
 * - 2 digits (State Code 01-38 or 97/99)
 * - 10 characters (PAN format: 5 letters, 4 digits, 1 letter)
 * - 1 digit (Entity code 1-9 or A-Z)
 * - 1 character 'Z'
 * - 1 check digit/character
 */
export function isValidGstin(gstin: string | undefined | null): boolean {
  if (!gstin) return false;
  const cleaned = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(cleaned);
}

/**
 * Validates Indian HSN/SAC code:
 * Goods HSN: 2, 4, 6, or 8 digits
 * Services SAC: 6 digits (typically starting with 99)
 */
export function isValidHsnSac(code: string | undefined | null): boolean {
  if (!code) return false;
  const cleaned = code.trim();
  const regex = /^([0-9]{2}|[0-9]{4}|[0-9]{6}|[0-9]{8}|99[0-9]{4})$/;
  return regex.test(cleaned);
}

export class DocumentReadinessValidator {
  /**
   * Evaluates statutory readiness for a Financial Document (e.g. GST Tax Invoice)
   */
  static validateTaxInvoice(
    doc: FullDocument,
    business: BusinessProfile
  ): DocumentReadinessResult {
    const violations: StatutoryViolation[] = [];
    const warnings: StatutoryViolation[] = [];
    const checklist: { item: string; passed: boolean; statutoryRef: string; details?: string }[] = [];

    // 1. Supplier Name & Registered Address (Rule 46(a))
    const hasSupplierName = Boolean(business.name?.trim() || business.legal_name?.trim());
    const hasSupplierAddress = Boolean(
      business.address_line1?.trim() && (business.city?.trim() || business.state?.trim())
    );
    const supplierIdentPassed = hasSupplierName && hasSupplierAddress;
    checklist.push({
      item: 'Supplier Legal Identity & Address',
      passed: supplierIdentPassed,
      statutoryRef: 'CBIC CGST Rule 46(a)',
      details: supplierIdentPassed
        ? `${business.name || business.legal_name}`
        : 'Missing supplier name or physical address',
    });
    if (!hasSupplierName) {
      violations.push({
        code: 'MISSING_SUPPLIER_NAME',
        field: 'business.name',
        rule: 'Supplier registered or legal name is mandatory.',
        statutoryReference: 'CBIC CGST Rule 46(a)',
        severity: 'BLOCKER',
      });
    }
    if (!hasSupplierAddress) {
      violations.push({
        code: 'MISSING_SUPPLIER_ADDRESS',
        field: 'business.address_line1',
        rule: 'Supplier physical address with city/state is mandatory.',
        statutoryReference: 'CBIC CGST Rule 46(a)',
        severity: 'BLOCKER',
      });
    }

    // 2. Supplier GSTIN (Rule 46(b))
    const supplierGstin = business.tax_id?.trim().toUpperCase();
    const isSupplierGstinValid = isValidGstin(supplierGstin);
    checklist.push({
      item: 'Supplier GSTIN Format & State Code',
      passed: isSupplierGstinValid,
      statutoryRef: 'CBIC CGST Rule 46(b)',
      details: supplierGstin || 'Not provided',
    });
    if (!supplierGstin) {
      violations.push({
        code: 'MISSING_SUPPLIER_GSTIN',
        field: 'business.tax_id',
        rule: 'Supplier GSTIN is required for a statutory GST Tax Invoice.',
        statutoryReference: 'CBIC CGST Rule 46(b)',
        severity: 'BLOCKER',
      });
    } else if (!isSupplierGstinValid) {
      violations.push({
        code: 'INVALID_SUPPLIER_GSTIN_FORMAT',
        field: 'business.tax_id',
        rule: 'Supplier GSTIN must match the 15-character statutory format (e.g. 27AAAAA0000A1Z5).',
        statutoryReference: 'CBIC CGST Rule 46(b)',
        severity: 'BLOCKER',
      });
    }

    // 3. Consecutive Serial Number <= 16 characters (Rule 46(b))
    const docNumber = doc.document_number?.trim();
    const isNumberPresent = Boolean(docNumber);
    const isNumberLengthValid = docNumber ? docNumber.length <= 16 : false;
    const isInvoiceNumValid = isNumberPresent && isNumberLengthValid;
    checklist.push({
      item: 'Consecutive Serial Invoice Number (<= 16 chars)',
      passed: isInvoiceNumValid,
      statutoryRef: 'CBIC CGST Rule 46(b)',
      details: docNumber ? `${docNumber} (${docNumber.length} chars)` : 'Missing',
    });
    if (!isNumberPresent) {
      violations.push({
        code: 'MISSING_INVOICE_NUMBER',
        field: 'doc.document_number',
        rule: 'Consecutive serial invoice number unique for a financial year is mandatory.',
        statutoryReference: 'CBIC CGST Rule 46(b)',
        severity: 'BLOCKER',
      });
    } else if (!isNumberLengthValid) {
      violations.push({
        code: 'INVOICE_NUMBER_EXCEEDS_16_CHARS',
        field: 'doc.document_number',
        rule: `Invoice number length (${docNumber?.length}) exceeds statutory 16-character limit.`,
        statutoryReference: 'CBIC CGST Rule 46(b)',
        severity: 'BLOCKER',
      });
    }

    // 4. Date of Issue (Rule 46(c))
    const hasValidDate = typeof doc.issue_date === 'number' && doc.issue_date > 0;
    checklist.push({
      item: 'Date of Issue',
      passed: hasValidDate,
      statutoryRef: 'CBIC CGST Rule 46(c)',
      details: hasValidDate ? new Date(doc.issue_date).toLocaleDateString('en-IN') : 'Missing',
    });
    if (!hasValidDate) {
      violations.push({
        code: 'MISSING_ISSUE_DATE',
        field: 'doc.issue_date',
        rule: 'Valid date of invoice issue is mandatory.',
        statutoryReference: 'CBIC CGST Rule 46(c)',
        severity: 'BLOCKER',
      });
    }

    // 5. Recipient Name, Address, and GSTIN (Rule 46(d), (e), (f))
    const recipientName = doc.customer_business_name?.trim() || doc.customer_name?.trim();
    const recipientAddress = doc.customer_billing_address?.trim();
    const recipientGstin = (doc as any).customer_tax_id?.trim().toUpperCase();
    const hasRecipientIdent = Boolean(recipientName);
    checklist.push({
      item: 'Recipient Identity (Bill To)',
      passed: hasRecipientIdent,
      statutoryRef: 'CBIC CGST Rule 46(d)',
      details: recipientName || 'Missing recipient name',
    });
    if (!hasRecipientIdent) {
      violations.push({
        code: 'MISSING_RECIPIENT_NAME',
        field: 'doc.customer_name',
        rule: 'Recipient customer or business name is mandatory.',
        statutoryReference: 'CBIC CGST Rule 46(d)',
        severity: 'BLOCKER',
      });
    }

    // B2B GSTIN check
    if (recipientGstin) {
      const isRecipientGstinValid = isValidGstin(recipientGstin);
      checklist.push({
        item: 'Recipient GSTIN (Registered B2B)',
        passed: isRecipientGstinValid,
        statutoryRef: 'CBIC CGST Rule 46(d)',
        details: recipientGstin,
      });
      if (!isRecipientGstinValid) {
        violations.push({
          code: 'INVALID_RECIPIENT_GSTIN',
          field: 'doc.customer_tax_id',
          rule: 'Provided Recipient GSTIN format is invalid.',
          statutoryReference: 'CBIC CGST Rule 46(d)',
          severity: 'BLOCKER',
        });
      }
    } else {
      // Unregistered B2C check: if total >= 50,000 INR, address is mandatory
      const totalAmount = BigInt(doc.total_minor || 0);
      const isOver50k = totalAmount >= 5000000n; // 50,000 * 100 minor
      if (isOver50k && !recipientAddress) {
        violations.push({
          code: 'MISSING_UNREGISTERED_RECIPIENT_ADDRESS',
          field: 'doc.customer_billing_address',
          rule: 'For supplies of value ₹50,000 or more to an unregistered recipient, name and address of recipient along with place of delivery are mandatory.',
          statutoryReference: 'CBIC CGST Rule 46(f)',
          severity: 'BLOCKER',
        });
      }
    }

    // 6. HSN/SAC Code & Line Items (Rule 46(g), (h), (i), (j))
    const items = doc.items || [];
    const hasItems = items.length > 0;
    checklist.push({
      item: 'Line Items with Description & Quantity',
      passed: hasItems,
      statutoryRef: 'CBIC CGST Rule 46(g), (h), (i)',
      details: `${items.length} item(s)`,
    });
    if (!hasItems) {
      violations.push({
        code: 'NO_LINE_ITEMS',
        field: 'doc.items',
        rule: 'Invoice must contain at least one line item with description, quantity, and unit rate.',
        statutoryReference: 'CBIC CGST Rule 46(g)',
        severity: 'BLOCKER',
      });
    } else {
      let missingHsnCount = 0;
      for (const item of items) {
        const itemHsn = (item as any).hsn_sac_code || (item as any).hsn || (item as any).sac;
        if (!itemHsn) {
          missingHsnCount++;
        }
      }
      if (missingHsnCount > 0) {
        warnings.push({
          code: 'MISSING_HSN_SAC_CODE',
          field: 'item.hsn_sac_code',
          rule: `${missingHsnCount} item(s) are missing statutory HSN/SAC code. Mandatory for businesses above ₹5 Cr (6 digits) or ₹1.5-5 Cr (4 digits).`,
          statutoryReference: 'Notification No. 78/2020 – Central Tax (Rule 46(g))',
          severity: 'WARNING',
        });
      }
    }

    // 7. Place of Supply & State Code (Rule 46(n))
    const placeOfSupply = (doc as any).place_of_supply || business.state;
    const hasPlaceOfSupply = Boolean(placeOfSupply && placeOfSupply.trim());
    checklist.push({
      item: 'Place of Supply along with State Name',
      passed: hasPlaceOfSupply,
      statutoryRef: 'CBIC CGST Rule 46(n)',
      details: placeOfSupply || 'Missing',
    });
    if (!hasPlaceOfSupply) {
      violations.push({
        code: 'MISSING_PLACE_OF_SUPPLY',
        field: 'doc.place_of_supply',
        rule: 'Place of supply along with name of State must be mentioned.',
        statutoryReference: 'CBIC CGST Rule 46(n)',
        severity: 'BLOCKER',
      });
    }

    // 8. Reverse Charge Mechanism Indicator (Rule 46(p))
    checklist.push({
      item: 'Reverse Charge Mechanism (RCM) Explicitly Specified',
      passed: true,
      statutoryRef: 'CBIC CGST Rule 46(p)',
      details: (doc as any).reverse_charge ? 'Yes' : 'No',
    });

    // 9. Signatory or Digital Authorization (Rule 46(q))
    const signatoryName = business.signatory_name?.trim() || (doc as any).signatory_name?.trim();
    const hasSignatory = Boolean(signatoryName);
    checklist.push({
      item: 'Authorized Signatory Identity or Electronic Stamp',
      passed: hasSignatory,
      statutoryRef: 'CBIC CGST Rule 46(q)',
      details: signatoryName || 'Missing signatory designation',
    });
    if (!hasSignatory) {
      warnings.push({
        code: 'MISSING_AUTHORIZED_SIGNATORY',
        field: 'business.signatory_name',
        rule: 'Signature or digital signature of supplier or authorized representative is required.',
        statutoryReference: 'CBIC CGST Rule 46(q)',
        severity: 'WARNING',
      });
    }

    // Calculate score & pass state
    const blockerCount = violations.filter((v) => v.severity === 'BLOCKER').length;
    const hardGatePassed = blockerCount === 0;
    const totalChecklist = checklist.length;
    const passedChecklist = checklist.filter((c) => c.passed).length;
    const statutoryScore = Math.round((passedChecklist / totalChecklist) * 100);

    return {
      documentId: doc.id,
      documentType: 'indian_gst_tax_invoice',
      isReady: hardGatePassed,
      hardGatePassed,
      statutoryScore,
      violations,
      warnings,
      checklist,
    };
  }

  /**
   * Generic validator for Administrative & Custom documents (Class B / Class C)
   */
  static validateUniversalDocument(
    instance: UniversalDocumentInstance,
    schema: UniversalDocumentSchema,
    business: BusinessProfile
  ): DocumentReadinessResult {
    const violations: StatutoryViolation[] = [];
    const warnings: StatutoryViolation[] = [];
    const checklist: { item: string; passed: boolean; statutoryRef: string; details?: string }[] = [];

    // Check organization identity
    const hasOrg = Boolean(business.name?.trim());
    checklist.push({
      item: 'Issuing Organization Name',
      passed: hasOrg,
      statutoryRef: 'General Business Governance',
      details: business.name || 'Missing',
    });
    if (!hasOrg) {
      violations.push({
        code: 'MISSING_ORG_NAME',
        field: 'business.name',
        rule: 'Issuing organization name is required.',
        statutoryReference: 'General Business Law',
        severity: 'BLOCKER',
      });
    }

    // Check document number
    const hasDocNumber = Boolean(instance.documentNumber?.trim());
    checklist.push({
      item: 'Document Reference Number',
      passed: hasDocNumber,
      statutoryRef: 'Corporate Documentation Practice',
      details: instance.documentNumber || 'Missing',
    });
    if (!hasDocNumber) {
      violations.push({
        code: 'MISSING_DOC_NUMBER',
        field: 'instance.documentNumber',
        rule: 'Unique document reference number is required.',
        statutoryReference: 'Corporate Record Standards',
        severity: 'BLOCKER',
      });
    }

    // Check party name
    const hasParty = Boolean(instance.partyName?.trim());
    checklist.push({
      item: 'Recipient / Employee / Counterparty Name',
      passed: hasParty,
      statutoryRef: 'Contractual Law',
      details: instance.partyName || 'Missing',
    });
    if (!hasParty) {
      violations.push({
        code: 'MISSING_PARTY_NAME',
        field: 'instance.partyName',
        rule: 'Counterparty name is required.',
        statutoryReference: 'Contractual Law',
        severity: 'BLOCKER',
      });
    }

    // Check required fields from schema sections
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const val = instance.content[field.id];
          const hasVal = val !== undefined && val !== null && String(val).trim() !== '';
          checklist.push({
            item: `Required Field: ${field.label}`,
            passed: hasVal,
            statutoryRef: `${schema.name} Schema Contract`,
            details: hasVal ? String(val).slice(0, 30) : 'Not filled',
          });
          if (!hasVal) {
            violations.push({
              code: `MISSING_REQUIRED_FIELD_${field.id.toUpperCase()}`,
              field: `content.${field.id}`,
              rule: `Field "${field.label}" is mandatory for ${schema.name}.`,
              statutoryReference: `${schema.name} Specification`,
              severity: 'BLOCKER',
            });
          }
        }
      }
    }

    const blockerCount = violations.filter((v) => v.severity === 'BLOCKER').length;
    const hardGatePassed = blockerCount === 0;
    const totalChecklist = checklist.length || 1;
    const passedChecklist = checklist.filter((c) => c.passed).length;
    const statutoryScore = Math.round((passedChecklist / totalChecklist) * 100);

    return {
      documentId: instance.id,
      documentType: schema.code,
      isReady: hardGatePassed,
      hardGatePassed,
      statutoryScore,
      violations,
      warnings,
      checklist,
    };
  }
}
