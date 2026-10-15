/**
 * CARD VALIDATION & BIN ENGINE UNIT TESTS
 * Verifies Luhn algorithm, ISO/IEC 7812 scheme detection, BIN bank resolution,
 * formatting, and expiry checking.
 */

import { CardValidationEngine } from '../../src/domain/payments/card/CardValidationEngine';
import { BinLookupEngine } from '../../src/domain/payments/card/BinLookupEngine';

describe('CardValidationEngine & BinLookupEngine Tests', () => {
  describe('1. Luhn Mod-10 Checksum Algorithm', () => {
    test('validates authentic test card numbers correctly', () => {
      // Standard test numbers that pass Luhn
      expect(CardValidationEngine.validateLuhn('4532015112345670')).toBe(true); // Visa
      expect(CardValidationEngine.validateLuhn('5401234567890123')).toBe(true); // Mastercard
      expect(CardValidationEngine.validateLuhn('378282246310005')).toBe(true);  // Amex
      expect(CardValidationEngine.validateLuhn('6071123456789016')).toBe(true); // RuPay
      expect(CardValidationEngine.validateLuhn('6011000990139424')).toBe(true); // Discover
    });

    test('rejects card numbers with incorrect check digit or typo', () => {
      // Changing the last digit of 4532015112345670 from 0 to 9
      expect(CardValidationEngine.validateLuhn('4532015112345679')).toBe(false);
      // Changing single digit in Amex
      expect(CardValidationEngine.validateLuhn('378282246310004')).toBe(false);
      // Short or empty strings
      expect(CardValidationEngine.validateLuhn('')).toBe(false);
      expect(CardValidationEngine.validateLuhn('12345')).toBe(false);
    });
  });

  describe('2. Card Scheme Detection & BIN Resolution', () => {
    test('accurately resolves HDFC Bank Visa card metadata', () => {
      const res = CardValidationEngine.validateCardNumber('4532 0151 1234 5670');
      expect(res.brand).toBe('visa');
      expect(res.brandName).toBe('Visa');
      expect(res.issuerName).toBe('HDFC Bank');
      expect(res.cardType).toBe('debit');
      expect(res.country).toBe('IN');
      expect(res.isValidLuhn).toBe(true);
      expect(res.isValidOverall).toBe(true);
      expect(res.last4).toBe('5670');
      expect(res.maskedNumber).toBe('•••• •••• •••• 5670');
    });

    test('accurately resolves HDFC Bank RuPay card metadata', () => {
      const res = CardValidationEngine.validateCardNumber('6071 1234 5678 9016');
      expect(res.brand).toBe('rupay');
      expect(res.brandName).toBe('RuPay');
      expect(res.issuerName).toBe('HDFC Bank');
      expect(res.tier).toBe('Platinum');
      expect(res.isValidLuhn).toBe(true);
      expect(res.isValidOverall).toBe(true);
    });

    test('accurately resolves State Bank of India (SBI) Visa card metadata', () => {
      const res = CardValidationEngine.validateCardNumber('4001 2345 6789 0120');
      expect(res.brand).toBe('visa');
      expect(res.issuerName).toBe('State Bank of India');
      expect(res.country).toBe('IN');
      expect(res.isValidLuhn).toBe(true);
    });

    test('accurately resolves ICICI Bank credit card metadata', () => {
      const res = CardValidationEngine.validateCardNumber('4029 1234 5678 9014');
      expect(res.brand).toBe('visa');
      expect(res.issuerName).toBe('ICICI Bank');
      expect(res.cardType).toBe('credit');
      expect(res.tier).toBe('Amazon Pay ICICI');
      expect(res.isValidLuhn).toBe(true);
    });

    test('accurately resolves American Express card metadata and 15-digit rules', () => {
      const res = CardValidationEngine.validateCardNumber('3782 822463 10005');
      expect(res.brand).toBe('amex');
      expect(res.brandName).toBe('American Express');
      expect(res.issuerName).toBe('American Express');
      expect(res.expectedLengths).toEqual([15]);
      expect(res.cvvLength).toBe(4);
      expect(res.isValidLuhn).toBe(true);
      expect(res.isValidOverall).toBe(true);
      expect(res.maskedNumber).toBe('•••• •••••• •0005');
    });
  });

  describe('3. Dynamic Typing Formatting', () => {
    test('formats 16-digit cards into 4-4-4-4 groups', () => {
      const res = CardValidationEngine.formatCardNumber('4532015112345678');
      expect(res.formatted).toBe('4532 0151 1234 5678');
    });

    test('formats 15-digit Amex cards into 4-6-5 groups', () => {
      const res = CardValidationEngine.formatCardNumber('378282246310005');
      expect(res.formatted).toBe('3782 822463 10005');
    });

    test('ignores non-digit characters during formatting', () => {
      const res = CardValidationEngine.formatCardNumber('4532-0151-1234-5678');
      expect(res.formatted).toBe('4532 0151 1234 5678');
    });
  });

  describe('4. Expiry & CVV Validation', () => {
    test('validates valid future expiry dates', () => {
      expect(CardValidationEngine.validateExpiry('12/28').isValid).toBe(true);
      expect(CardValidationEngine.validateExpiry('08/30').isValid).toBe(true);
    });

    test('rejects past expired dates', () => {
      const res = CardValidationEngine.validateExpiry('01/20');
      expect(res.isValid).toBe(false);
      expect(res.isExpired).toBe(true);
      expect(res.errorMessage).toBe('Card has expired');
    });

    test('rejects invalid months', () => {
      const res = CardValidationEngine.validateExpiry('13/28');
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Invalid month (01-12)');
    });

    test('enforces 4-digit CVV for Amex and 3-digit for Visa/Mastercard/RuPay', () => {
      expect(CardValidationEngine.validateCvv('123', 'visa')).toBe(true);
      expect(CardValidationEngine.validateCvv('1234', 'visa')).toBe(false);
      expect(CardValidationEngine.validateCvv('1234', 'amex')).toBe(true);
      expect(CardValidationEngine.validateCvv('123', 'amex')).toBe(false);
      expect(CardValidationEngine.validateCvv('456', 'rupay')).toBe(true);
    });
  });
});
