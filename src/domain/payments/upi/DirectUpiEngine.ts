/**
 * DIRECT UPI ENGINE
 * Authoritative NPCI-compliant UPI URI generator, strict VPA validator,
 * zero-fee peer-to-merchant payment link engine, and regional cross-currency conversion.
 */

import { moneyToDecimalString, formatMoney } from '../../money/Money';
import { ExchangeRateEngine } from '../../money/ExchangeRateEngine';
import { UpiPayload, UpiValidationResult, UpiConversionResult } from './UpiTypes';

/**
 * NPCI Standard VPA Validation Regex:
 * Username: 2 to 256 alphanumeric, period, dash, underscore.
 * Bank Provider: 2 to 64 letters/alphanumeric.
 * Disallows query parameter injection characters (&, ?, =, %, whitespace).
 */
const VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;

export class DirectUpiEngine {
  /**
   * Validates a UPI Virtual Payment Address (VPA) / UPI ID.
   */
  static validateVpa(vpa?: string | null): UpiValidationResult {
    if (!vpa || typeof vpa !== 'string') {
      return { isValid: false, error: 'UPI ID cannot be empty.' };
    }

    const trimmed = vpa.trim().toLowerCase();

    if (trimmed.length < 5 || trimmed.length > 320) {
      return { isValid: false, error: 'UPI ID length is invalid.' };
    }

    if (!trimmed.includes('@')) {
      return { isValid: false, error: 'UPI ID must contain "@" (e.g. name@bank).' };
    }

    const parts = trimmed.split('@');
    if (parts.length !== 2) {
      return { isValid: false, error: 'UPI ID cannot contain multiple "@" symbols.' };
    }

    if (!VPA_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: 'Invalid UPI ID format. Only letters, numbers, dots, and hyphens are permitted.',
      };
    }

    return {
      isValid: true,
      normalizedVpa: trimmed,
    };
  }

  /**
   * Builds an NPCI-compliant standard `upi://pay` URI.
   * If `amountMinor` is provided, includes exact amount in decimal format.
   * If `amountMinor` is omitted, generates a standard open-amount static merchant QR.
   */
  static buildUpiUri(payload: UpiPayload): string {
    const vpaValidation = this.validateVpa(payload.vpa);
    if (!vpaValidation.isValid || !vpaValidation.normalizedVpa) {
      throw new Error(`Cannot generate UPI URI: ${vpaValidation.error}`);
    }

    const params = new URLSearchParams();
    params.set('pa', vpaValidation.normalizedVpa);
    params.set('pn', payload.payeeName.trim());

    if (payload.amountMinor !== undefined) {
      if (payload.amountMinor <= 0n) {
        throw new Error('UPI payment amount must be greater than zero.');
      }
      // Convert amount in paise to decimal string (e.g. 150000n -> "1500.00")
      const amountDecimal = moneyToDecimalString({
        amountMinor: payload.amountMinor,
        currency: 'INR',
      });
      params.set('am', amountDecimal);
    }

    params.set('cu', 'INR');

    if (payload.transactionNote) {
      params.set('tn', payload.transactionNote.trim());
    }

    if (payload.transactionRef) {
      params.set('tr', payload.transactionRef.trim());
    }

    if (payload.merchantCategoryCode) {
      params.set('mc', payload.merchantCategoryCode.trim());
    }

    return `upi://pay?${params.toString()}`;
  }

  /**
   * Builds an NPCI-compliant UPI URI with automatic currency conversion
   * to INR using verified official exchange reference rates.
   * If currency is already INR, uses the exact amount directly.
   * If currency is foreign (USD, EUR, GBP, AED, etc.), converts to INR and annotates rate.
   */
  static buildUpiUriWithCurrencyConversion(params: {
    vpa: string;
    payeeName: string;
    sourceAmountMinor?: bigint;
    sourceCurrency: string;
    transactionRef?: string;
    transactionNote?: string;
  }): UpiConversionResult {
    if (params.sourceAmountMinor === undefined) {
      const upiUri = this.buildUpiUri({
        vpa: params.vpa,
        payeeName: params.payeeName,
        currency: 'INR',
        transactionRef: params.transactionRef,
        transactionNote: params.transactionNote,
      });
      return { upiUri, isConverted: false };
    }

    const currUpper = params.sourceCurrency.toUpperCase();
    if (currUpper === 'INR') {
      const upiUri = this.buildUpiUri({
        vpa: params.vpa,
        payeeName: params.payeeName,
        amountMinor: params.sourceAmountMinor,
        currency: 'INR',
        transactionRef: params.transactionRef,
        transactionNote: params.transactionNote,
      });
      return {
        upiUri,
        inrAmountMinor: params.sourceAmountMinor,
        isConverted: false,
      };
    }

    // Cross-currency conversion to INR via official ExchangeRateEngine
    const sourceMoney = { amountMinor: params.sourceAmountMinor, currency: currUpper };
    const convResult = ExchangeRateEngine.convert(sourceMoney, 'INR');
    const inrPaise = convResult.targetMoney.amountMinor;

    const rateLabel = convResult.crossRateDisplay;
    const note = params.transactionNote
      ? `${params.transactionNote} (${formatMoney(sourceMoney)} @ ${rateLabel})`
      : `Payment for ${formatMoney(sourceMoney)} (${rateLabel})`;

    const upiUri = this.buildUpiUri({
      vpa: params.vpa,
      payeeName: params.payeeName,
      amountMinor: inrPaise,
      currency: 'INR',
      transactionRef: params.transactionRef,
      transactionNote: note,
    });

    return {
      upiUri,
      inrAmountMinor: inrPaise,
      isConverted: true,
      conversionSummary: `${formatMoney(sourceMoney)} ≈ ${formatMoney(convResult.targetMoney)}`,
      exchangeRateLabel: `${convResult.provenanceLabel}: ${convResult.crossRateDisplay}`,
    };
  }

  /**
   * Parses and validates a raw `upi://pay` URI.
   */
  static parseUpiUri(rawUri: string): UpiPayload | null {
    if (!rawUri || !rawUri.startsWith('upi://pay?')) {
      return null;
    }

    try {
      const queryString = rawUri.replace('upi://pay?', '');
      const params = new URLSearchParams(queryString);

      const pa = params.get('pa');
      const pn = params.get('pn') || 'Merchant';
      const am = params.get('am');
      const cu = params.get('cu') || 'INR';
      const tn = params.get('tn') || '';
      const tr = params.get('tr') || undefined;
      const mc = params.get('mc') || undefined;

      if (!pa) return null;
      const vpaValidation = this.validateVpa(pa);
      if (!vpaValidation.isValid) return null;

      let amountMinor = 0n;
      if (am) {
        const parsedFloat = parseFloat(am);
        if (isNaN(parsedFloat) || parsedFloat < 0) return null;
        // Parse decimal strictly to paise
        const parts = am.split('.');
        const whole = BigInt(parts[0] || '0');
        const frac = parts[1] ? parts[1].padEnd(2, '0').slice(0, 2) : '00';
        amountMinor = whole * 100n + BigInt(frac);
      }

      return {
        vpa: pa,
        payeeName: pn,
        amountMinor,
        currency: 'INR',
        transactionNote: tn,
        transactionRef: tr,
        merchantCategoryCode: mc,
      };
    } catch {
      return null;
    }
  }
}
