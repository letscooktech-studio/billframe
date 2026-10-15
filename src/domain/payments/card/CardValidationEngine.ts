/**
 * CARD VALIDATION ENGINE
 * Production-grade ISO/IEC 7812 card validation engine.
 * Includes:
 * 1. Mathematical Luhn Mod-10 Checksum verification
 * 2. Scheme & BIN detection with bank identification
 * 3. Dynamic formatting as the user types (4-4-4-4, 4-6-5 for Amex, etc.)
 * 4. Expiry Date (MM/YY) and CVV length checking
 * 5. PCI-DSS compliant masking
 */

import { BinLookupEngine } from './BinLookupEngine';
import { CardBrand, CardExpiryValidationResult, CardValidationResult } from './CardTypes';

interface BrandConfig {
  readonly brand: CardBrand;
  readonly expectedLengths: readonly number[];
  readonly cvvLength: number;
  readonly grouping: readonly number[];
  readonly maxLength: number;
}

const BRAND_CONFIGS: Record<CardBrand, BrandConfig> = {
  amex: { brand: 'amex', expectedLengths: [15], cvvLength: 4, grouping: [4, 6, 5], maxLength: 15 },
  diners: { brand: 'diners', expectedLengths: [14, 16], cvvLength: 3, grouping: [4, 6, 4], maxLength: 16 },
  visa: { brand: 'visa', expectedLengths: [16, 13, 19], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 16 },
  mastercard: { brand: 'mastercard', expectedLengths: [16], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 16 },
  rupay: { brand: 'rupay', expectedLengths: [16], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 16 },
  discover: { brand: 'discover', expectedLengths: [16], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 16 },
  jcb: { brand: 'jcb', expectedLengths: [16], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 16 },
  maestro: { brand: 'maestro', expectedLengths: [16, 18, 19], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 19 },
  unknown: { brand: 'unknown', expectedLengths: [16], cvvLength: 3, grouping: [4, 4, 4, 4], maxLength: 19 },
};

export class CardValidationEngine {
  /**
   * Luhn Algorithm (Mod 10 Checksum) implementation.
   * Doubles every second digit from the rightmost and sums digits.
   * If total modulo 10 is 0, the card number is mathematically valid.
   */
  public static validateLuhn(sanitizedNumber: string): boolean {
    if (!sanitizedNumber || sanitizedNumber.length < 12) {
      return false;
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitizedNumber.length - 1; i >= 0; i--) {
      const char = sanitizedNumber.charAt(i);
      const digit = parseInt(char, 10);
      if (isNaN(digit)) return false;

      let val = digit;
      if (shouldDouble) {
        val *= 2;
        if (val > 9) val -= 9;
      }

      sum += val;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Formats raw digits with proper scheme spacing (e.g., 4-4-4-4 for Visa, 4-6-5 for Amex).
   */
  public static formatCardNumber(rawInput: string): { formatted: string; sanitized: string; brand: CardBrand } {
    const sanitized = rawInput.replace(/\D/g, '');
    const binInfo = BinLookupEngine.lookup(sanitized);
    const config = BRAND_CONFIGS[binInfo.brand] || BRAND_CONFIGS.unknown;
    const truncated = sanitized.substring(0, config.maxLength);

    const parts: string[] = [];
    let start = 0;

    for (const groupSize of config.grouping) {
      if (start >= truncated.length) break;
      parts.push(truncated.substring(start, start + groupSize));
      start += groupSize;
    }

    // Capture any remainder if longer than standard groups
    if (start < truncated.length) {
      parts.push(truncated.substring(start));
    }

    return {
      formatted: parts.join(' '),
      sanitized: truncated,
      brand: binInfo.brand,
    };
  }

  /**
   * Formats masked number for display and receipt storage (e.g., "•••• •••• •••• 4242").
   */
  public static maskCardNumber(sanitizedNumber: string, brand: CardBrand): string {
    if (!sanitizedNumber) return '';
    const last4 = sanitizedNumber.slice(-4);
    if (brand === 'amex') {
      return `•••• •••••• •${last4}`;
    }
    return `•••• •••• •••• ${last4}`;
  }

  /**
   * Validates full card number against BIN tables, length requirements, and Luhn checksum.
   */
  public static validateCardNumber(rawInput: string): CardValidationResult {
    const { formatted, sanitized, brand } = this.formatCardNumber(rawInput);
    const binDetails = BinLookupEngine.lookup(sanitized);
    const config = BRAND_CONFIGS[brand] || BRAND_CONFIGS.unknown;

    const isCompleteLength = config.expectedLengths.includes(sanitized.length);
    const isValidLuhn = this.validateLuhn(sanitized);
    const last4 = sanitized.length >= 4 ? sanitized.slice(-4) : sanitized;
    const maskedNumber = this.maskCardNumber(sanitized, brand);

    let errorMessage: string | undefined = undefined;
    if (sanitized.length > 0 && !isCompleteLength && sanitized.length < Math.min(...config.expectedLengths)) {
      errorMessage = `Incomplete card number (${sanitized.length}/${config.expectedLengths[0]} digits)`;
    } else if (isCompleteLength && !isValidLuhn) {
      errorMessage = 'Invalid card number (checksum failed)';
    }

    const isValidOverall = isCompleteLength && isValidLuhn;

    return {
      rawInput,
      sanitizedNumber: sanitized,
      formattedNumber: formatted,
      brand: binDetails.brand,
      brandName: binDetails.brandName,
      cardType: binDetails.cardType,
      issuerName: binDetails.issuerName,
      country: binDetails.country,
      tier: binDetails.tier,
      isValidLuhn,
      isCompleteLength,
      isValidOverall,
      expectedLengths: config.expectedLengths,
      cvvLength: config.cvvLength,
      last4,
      maskedNumber,
      errorMessage,
    };
  }

  /**
   * Formats and validates card expiry string (e.g., MM/YY).
   */
  public static formatExpiry(rawExpiry: string): string {
    const digits = rawExpiry.replace(/\D/g, '').substring(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.substring(0, 2)}/${digits.substring(2)}`;
  }

  /**
   * Validates card expiration month and year against current calendar date.
   */
  public static validateExpiry(expiryStr: string): CardExpiryValidationResult {
    const cleaned = expiryStr.replace(/\D/g, '');
    if (cleaned.length < 4) {
      return { isValid: false, isExpired: false, errorMessage: 'Enter MM/YY expiry' };
    }

    const month = parseInt(cleaned.substring(0, 2), 10);
    const rawYear = parseInt(cleaned.substring(2, 4), 10);
    const fullYear = 2000 + rawYear;

    if (isNaN(month) || month < 1 || month > 12) {
      return { isValid: false, isExpired: false, errorMessage: 'Invalid month (01-12)' };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    const isExpired = fullYear < currentYear || (fullYear === currentYear && month < currentMonth);

    if (isExpired) {
      return { isValid: false, month, year: fullYear, isExpired: true, errorMessage: 'Card has expired' };
    }

    return { isValid: true, month, year: fullYear, isExpired: false };
  }

  /**
   * Validates CVV digits against the card scheme requirement (4 for Amex, 3 for others).
   */
  public static validateCvv(rawCvv: string, brand: CardBrand): boolean {
    const cleaned = rawCvv.replace(/\D/g, '');
    const requiredLength = BRAND_CONFIGS[brand]?.cvvLength || 3;
    return cleaned.length === requiredLength;
  }
}
