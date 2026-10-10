/**
 * FIELD REGISTRY & SYNTAX VALIDATION ENGINE
 * Authoritative catalogue of typed document data fields, syntax validators,
 * and authenticity trust levels.
 * Distinguishes USER_ENTERED, FORMAT_VALIDATED, and EXTERNALLY_VERIFIED states.
 */

export type FieldDataType =
  | 'string'
  | 'multiline_text'
  | 'money'
  | 'scaled_quantity'
  | 'date'
  | 'enum'
  | 'boolean'
  | 'address'
  | 'phone'
  | 'email'
  | 'gstin'
  | 'pan'
  | 'ifsc'
  | 'upi_vpa'
  | 'hsn_sac';

export type FieldTrustLevel =
  | 'USER_ENTERED'        // Unverified user-supplied string
  | 'FORMAT_VALIDATED'    // Matches official syntax/checksum format
  | 'EXTERNALLY_VERIFIED' // Verified by authorized external authority API
  | 'REQUIRES_REVIEW';    // Outdated, conflicting, or suspicious

export interface FieldDefinition {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly dataType: FieldDataType;
  readonly defaultTrustLevel: FieldTrustLevel;
  readonly isSensitive: boolean;
  readonly allowedInPdf: boolean; // Protects internal costs/notes from PDF leak
}

export const CANONICAL_FIELDS: Record<string, FieldDefinition> = {
  'seller.name': {
    id: 'seller.name',
    label: 'Business / Seller Name',
    dataType: 'string',
    defaultTrustLevel: 'USER_ENTERED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'seller.gstin': {
    id: 'seller.gstin',
    label: 'Supplier GSTIN',
    dataType: 'gstin',
    defaultTrustLevel: 'FORMAT_VALIDATED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'buyer.name': {
    id: 'buyer.name',
    label: 'Customer / Buyer Name',
    dataType: 'string',
    defaultTrustLevel: 'USER_ENTERED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'buyer.gstin': {
    id: 'buyer.gstin',
    label: 'Recipient GSTIN',
    dataType: 'gstin',
    defaultTrustLevel: 'FORMAT_VALIDATED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'document.place_of_supply': {
    id: 'document.place_of_supply',
    label: 'Place of Supply (State & Code)',
    dataType: 'string',
    defaultTrustLevel: 'FORMAT_VALIDATED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'payment.upi_vpa': {
    id: 'payment.upi_vpa',
    label: 'Payee UPI ID (VPA)',
    dataType: 'upi_vpa',
    defaultTrustLevel: 'FORMAT_VALIDATED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'payment.bank_account': {
    id: 'payment.bank_account',
    label: 'Bank Account Number',
    dataType: 'string',
    defaultTrustLevel: 'USER_ENTERED',
    isSensitive: true,
    allowedInPdf: true,
  },
  'payment.ifsc': {
    id: 'payment.ifsc',
    label: 'Bank IFSC Code',
    dataType: 'ifsc',
    defaultTrustLevel: 'FORMAT_VALIDATED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'items.hsn_sac': {
    id: 'items.hsn_sac',
    label: 'HSN / SAC Code',
    dataType: 'hsn_sac',
    defaultTrustLevel: 'FORMAT_VALIDATED',
    isSensitive: false,
    allowedInPdf: true,
  },
  'document.internal_notes': {
    id: 'document.internal_notes',
    label: 'Confidential Internal Notes',
    dataType: 'multiline_text',
    defaultTrustLevel: 'USER_ENTERED',
    isSensitive: true,
    allowedInPdf: false, // STRICTLY EXCLUDED FROM PDF EXPORT
  },
  'items.internal_cost': {
    id: 'items.internal_cost',
    label: 'Internal Item Cost',
    dataType: 'money',
    defaultTrustLevel: 'USER_ENTERED',
    isSensitive: true,
    allowedInPdf: false, // STRICTLY EXCLUDED FROM PDF EXPORT
  },
};

export class FieldRegistry {
  static get(fieldId: string): FieldDefinition | undefined {
    return CANONICAL_FIELDS[fieldId];
  }
  static getAll(): Record<string, FieldDefinition> {
    return CANONICAL_FIELDS;
  }
}

/**
 * SYNTAX VALIDATORS FOR COMMERCIAL & STATUTORY IDENTIFIERS
 */
export class SyntaxValidator {
  /**
   * GSTIN format: 15 alphanumeric characters
   * - 2 digits state code (01-38 or 97)
   * - 10 chars PAN
   * - 1 digit entity code (1-9 or A-Z)
   * - 'Z' default
   * - 1 check digit/char
   */
  static isValidGstin(input: string): boolean {
    if (!input) return false;
    const clean = input.trim().toUpperCase();
    return /^(?:0[1-9]|[1-2][0-9]|3[0-8]|97)[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);
  }

  static validateGstin(input: string): { isValid: boolean; error?: string } {
    const isValid = this.isValidGstin(input);
    return { isValid, error: isValid ? undefined : 'Invalid GSTIN format' };
  }

  /**
   * Indian PAN: 10 chars (5 uppercase letters, 4 digits, 1 uppercase letter)
   */
  static isValidPan(input: string): boolean {
    if (!input) return false;
    const clean = input.trim().toUpperCase();
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);
  }

  static validatePan(input: string): { isValid: boolean; error?: string } {
    const isValid = this.isValidPan(input);
    return { isValid, error: isValid ? undefined : 'Invalid PAN format' };
  }

  /**
   * Indian IFSC: 11 characters
   * - 4 letters (bank code)
   * - '0' fifth character
   * - 6 alphanumeric characters (branch code)
   */
  static isValidIfsc(input: string): boolean {
    if (!input) return false;
    const clean = input.trim().toUpperCase();
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean);
  }

  static validateIfsc(input: string): { isValid: boolean; error?: string } {
    const isValid = this.isValidIfsc(input);
    return { isValid, error: isValid ? undefined : 'Invalid IFSC format' };
  }

  /**
   * UPI Virtual Payment Address (VPA): e.g. merchant@upi, user@okaxis
   */
  static isValidUpiVpa(input: string): boolean {
    if (!input) return false;
    const clean = input.trim().toLowerCase();
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(clean);
  }

  static validateUpiVpa(input: string): { isValid: boolean; error?: string } {
    const isValid = this.isValidUpiVpa(input);
    return { isValid, error: isValid ? undefined : 'Invalid UPI VPA format' };
  }

  /**
   * HSN/SAC Code: 2, 4, 6, or 8 digits
   */
  static isValidHsnSac(input: string): boolean {
    if (!input) return false;
    const clean = input.trim();
    return /^(?:[0-9]{2}|[0-9]{4}|[0-9]{6}|[0-9]{8})$/.test(clean);
  }

  static validateHsnSac(input: string): { isValid: boolean; error?: string } {
    const isValid = this.isValidHsnSac(input);
    return { isValid, error: isValid ? undefined : 'Invalid HSN/SAC code' };
  }

  /**
   * Invoice / Serial Number: Up to 16 alphanumeric characters + hyphens/slashes (CBIC Rule 46(b))
   */
  static isValidConsecutiveInvoiceNumber(input: string): boolean {
    if (!input) return false;
    const clean = input.trim();
    if (clean.length === 0 || clean.length > 16) return false;
    return /^[A-Za-z0-9\-\/]+$/.test(clean);
  }

  static validateInvoiceSerial(input: string): { isValid: boolean; error?: string } {
    const isValid = this.isValidConsecutiveInvoiceNumber(input);
    return { isValid, error: isValid ? undefined : 'Invalid invoice serial format' };
  }
}
