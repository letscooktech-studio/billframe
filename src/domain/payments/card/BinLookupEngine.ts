/**
 * BIN / IIN LOOKUP ENGINE
 * Deterministic Bank Identification Number (BIN/IIN) resolution.
 * Accurately determines issuing bank, scheme, card category (Credit/Debit),
 * and product tier for Indian and global financial institutions.
 */

import { CardBinDetails, CardBrand, CardType } from './CardTypes';

interface BinRule {
  readonly prefix: string;
  readonly issuer: string;
  readonly cardType: CardType;
  readonly brand: CardBrand;
  readonly brandName: string;
  readonly country: string;
  readonly tier?: string;
}

/**
 * High-precision offline BIN directory covering top Indian & international issuers.
 */
const OFFLINE_BIN_TABLE: readonly BinRule[] = [
  // ── RuPay Schemes (NPCI) ──
  { prefix: '6070', issuer: 'State Bank of India', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Classic' },
  { prefix: '6071', issuer: 'HDFC Bank', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Platinum' },
  { prefix: '6072', issuer: 'ICICI Bank', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Coral' },
  { prefix: '6073', issuer: 'Punjab National Bank', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Platinum' },
  { prefix: '6074', issuer: 'Bank of Baroda', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Classic' },
  { prefix: '6075', issuer: 'Axis Bank', cardType: 'credit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Select' },
  { prefix: '6077', issuer: 'Kotak Mahindra Bank', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Platinum' },
  { prefix: '6081', issuer: 'State Bank of India', cardType: 'credit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'SimplyCLICK' },
  { prefix: '60', issuer: 'National Payments Corporation (NPCI)', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Standard' },
  { prefix: '6521', issuer: 'HDFC Bank', cardType: 'credit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Millennia' },
  { prefix: '6522', issuer: 'ICICI Bank', cardType: 'credit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Rubyx' },
  { prefix: '508', issuer: 'NPCI RuPay Global', cardType: 'credit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'Select' },
  { prefix: '353', issuer: 'NPCI RuPay - JCB Global', cardType: 'credit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'International' },
  { prefix: '356', issuer: 'NPCI RuPay - JCB Global', cardType: 'debit', brand: 'rupay', brandName: 'RuPay', country: 'IN', tier: 'International' },

  // ── HDFC Bank (Visa & Mastercard) ──
  { prefix: '4052', issuer: 'HDFC Bank', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'EasyShop Platinum' },
  { prefix: '4160', issuer: 'HDFC Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Regalia Gold' },
  { prefix: '4213', issuer: 'HDFC Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Infinia' },
  { prefix: '4375', issuer: 'HDFC Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Millennia' },
  { prefix: '4532', issuer: 'HDFC Bank', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Classic Debit' },
  { prefix: '4617', issuer: 'HDFC Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Signature' },
  { prefix: '5186', issuer: 'HDFC Bank', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'Regalia' },
  { prefix: '5241', issuer: 'HDFC Bank', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'World Privilege' },
  { prefix: '5401', issuer: 'HDFC Bank', cardType: 'debit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'Titanium' },

  // ── State Bank of India (Visa & Mastercard) ──
  { prefix: '4001', issuer: 'State Bank of India', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Global Contactless' },
  { prefix: '4016', issuer: 'State Bank of India', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Silver' },
  { prefix: '4043', issuer: 'State Bank of India', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'SBI Card PRIME' },
  { prefix: '4156', issuer: 'State Bank of India', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'SBI Card ELITE' },
  { prefix: '4282', issuer: 'State Bank of India', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Gold Debit' },
  { prefix: '4591', issuer: 'State Bank of India', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'SimplySAVE' },
  { prefix: '5121', issuer: 'State Bank of India', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'SBI Aurum' },
  { prefix: '5242', issuer: 'State Bank of India', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'SBI Pulse' },

  // ── ICICI Bank ──
  { prefix: '4008', issuer: 'ICICI Bank', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Privilege Debit' },
  { prefix: '4029', issuer: 'ICICI Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Amazon Pay ICICI' },
  { prefix: '4166', issuer: 'ICICI Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Coral Credit' },
  { prefix: '4232', issuer: 'ICICI Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Rubyx' },
  { prefix: '4315', issuer: 'ICICI Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Sapphiro' },
  { prefix: '4386', issuer: 'ICICI Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Emeralde' },
  { prefix: '5146', issuer: 'ICICI Bank', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'World' },
  { prefix: '5399', issuer: 'ICICI Bank', cardType: 'debit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'Titanium Debit' },

  // ── Axis Bank ──
  { prefix: '4021', issuer: 'Axis Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Flipkart Axis' },
  { prefix: '4122', issuer: 'Axis Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Magnus' },
  { prefix: '4474', issuer: 'Axis Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Select' },
  { prefix: '4514', issuer: 'Axis Bank', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Burgundy Debit' },
  { prefix: '5181', issuer: 'Axis Bank', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'Atlas' },
  { prefix: '5326', issuer: 'Axis Bank', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'IN', tier: 'ACE' },

  // ── Kotak Mahindra Bank ──
  { prefix: '4344', issuer: 'Kotak Mahindra Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'White Reserve' },
  { prefix: '4364', issuer: 'Kotak Mahindra Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Zen Signature' },
  { prefix: '4508', issuer: 'Kotak Mahindra Bank', cardType: 'debit', brand: 'visa', brandName: 'Visa', country: 'IN', tier: 'Platinum Debit' },

  // ── American Express ──
  { prefix: '3712', issuer: 'American Express', cardType: 'credit', brand: 'amex', brandName: 'American Express', country: 'IN', tier: 'Platinum Card' },
  { prefix: '3743', issuer: 'American Express', cardType: 'credit', brand: 'amex', brandName: 'American Express', country: 'IN', tier: 'Gold Card' },
  { prefix: '3769', issuer: 'American Express', cardType: 'credit', brand: 'amex', brandName: 'American Express', country: 'IN', tier: 'Membership Rewards' },
  { prefix: '3782', issuer: 'American Express', cardType: 'credit', brand: 'amex', brandName: 'American Express', country: 'US', tier: 'Centurion' },
  { prefix: '34', issuer: 'American Express', cardType: 'credit', brand: 'amex', brandName: 'American Express', country: 'US', tier: 'Corporate' },
  { prefix: '37', issuer: 'American Express', cardType: 'credit', brand: 'amex', brandName: 'American Express', country: 'US', tier: 'Cardmember' },

  // ── International Global Leaders ──
  { prefix: '4114', issuer: 'JPMorgan Chase', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'US', tier: 'Chase Sapphire Reserve' },
  { prefix: '4246', issuer: 'JPMorgan Chase', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'US', tier: 'Chase Freedom' },
  { prefix: '4024', issuer: 'Bank of America', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'US', tier: 'Travel Rewards' },
  { prefix: '4009', issuer: 'Wells Fargo', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'US', tier: 'Active Cash' },
  { prefix: '4013', issuer: 'Barclays Bank', cardType: 'credit', brand: 'visa', brandName: 'Visa', country: 'GB', tier: 'Barclaycard' },
  { prefix: '5424', issuer: 'Citibank', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'US', tier: 'Citi Premier' },
  { prefix: '5500', issuer: 'Capital One', cardType: 'credit', brand: 'mastercard', brandName: 'Mastercard', country: 'US', tier: 'Venture X' },
  { prefix: '6011', issuer: 'Discover Financial', cardType: 'credit', brand: 'discover', brandName: 'Discover', country: 'US', tier: 'Discover it' },
  { prefix: '36', issuer: 'Diners Club International', cardType: 'credit', brand: 'diners', brandName: 'Diners Club', country: 'US', tier: 'Carte Blanche' },
  { prefix: '35', issuer: 'JCB International', cardType: 'credit', brand: 'jcb', brandName: 'JCB', country: 'JP', tier: 'JCB Platinum' },
];

export class BinLookupEngine {
  /**
   * Resolves card metadata synchronously using the high-priority offline BIN directory.
   */
  public static lookup(cardNumber: string): CardBinDetails {
    const digits = cardNumber.replace(/\D/g, '');
    if (!digits) {
      return {
        brand: 'unknown',
        brandName: 'Unknown',
        cardType: 'unknown',
        issuerName: 'Unknown Bank',
        country: '',
      };
    }

    // Try longest matching prefix first (4 digits, then 3, then 2, then 1)
    for (let len = Math.min(digits.length, 6); len >= 1; len--) {
      const prefix = digits.substring(0, len);
      const match = OFFLINE_BIN_TABLE.find((rule) => rule.prefix === prefix);
      if (match) {
        return {
          brand: match.brand,
          brandName: match.brandName,
          cardType: match.cardType,
          issuerName: match.issuer,
          country: match.country,
          tier: match.tier,
        };
      }
    }

    // Fallback: Detect scheme brand from first digit/pattern
    if (digits.startsWith('4')) {
      return { brand: 'visa', brandName: 'Visa', cardType: 'unknown', issuerName: 'Visa Issuer', country: '' };
    }
    if (/^(5[1-5]|2[2-7])/.test(digits)) {
      return { brand: 'mastercard', brandName: 'Mastercard', cardType: 'unknown', issuerName: 'Mastercard Issuer', country: '' };
    }
    if (/^(60|6521|6522|508|353|356|81|82)/.test(digits)) {
      return { brand: 'rupay', brandName: 'RuPay', cardType: 'debit', issuerName: 'RuPay Issuer (NPCI)', country: 'IN' };
    }
    if (/^3[47]/.test(digits)) {
      return { brand: 'amex', brandName: 'American Express', cardType: 'credit', issuerName: 'American Express', country: 'US' };
    }
    if (/^(6011|65|64[4-9])/.test(digits)) {
      return { brand: 'discover', brandName: 'Discover', cardType: 'credit', issuerName: 'Discover Network', country: 'US' };
    }
    if (/^3(0[0-5]|[689])/.test(digits)) {
      return { brand: 'diners', brandName: 'Diners Club', cardType: 'credit', issuerName: 'Diners Club International', country: 'US' };
    }
    if (/^(2131|1800|35)/.test(digits)) {
      return { brand: 'jcb', brandName: 'JCB', cardType: 'credit', issuerName: 'JCB International', country: 'JP' };
    }
    if (/^(5018|5020|5038|5893|6304|6759|6761|6762|6763)/.test(digits)) {
      return { brand: 'maestro', brandName: 'Maestro', cardType: 'debit', issuerName: 'Maestro Worldwide', country: '' };
    }

    return {
      brand: 'unknown',
      brandName: 'Unknown Scheme',
      cardType: 'unknown',
      issuerName: 'Unknown Issuer',
      country: '',
    };
  }
}
