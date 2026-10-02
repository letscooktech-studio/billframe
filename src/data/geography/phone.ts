/**
 * GOOGLE LIBPHONENUMBER-COMPLIANT INTERNATIONAL PHONE UTILITIES
 * Canonical E.164 normalization, country-aware validation, and display formatting.
 * Zero homemade regex hacks.
 */

import {
  parsePhoneNumberFromString,
  CountryCode,
  getCountryCallingCode,
} from 'libphonenumber-js/min';
import { NormalizedPhoneResult } from './types';

/**
 * Returns the international calling code (e.g. "+91", "+1") for an ISO-2 country.
 */
export function getCallingCodeForCountry(iso2: string): string {
  try {
    const code = getCountryCallingCode(iso2.toUpperCase() as CountryCode);
    return `+${code}`;
  } catch {
    return '+1';
  }
}

/**
 * Parses and validates an input phone number against libphonenumber semantics.
 * Returns canonical E.164 for storage and formatted national representation for UI.
 */
export function normalizePhoneNumber(
  rawInput: string,
  countryIso2: string
): NormalizedPhoneResult {
  const cleanInput = (rawInput || '').trim();
  const cleanIso2 = (countryIso2 || 'US').trim().toUpperCase() as CountryCode;
  const callingCode = getCallingCodeForCountry(cleanIso2);

  if (!cleanInput) {
    return {
      isValid: false,
      e164: '',
      nationalFormatted: '',
      countryIso2: cleanIso2,
      callingCode,
      error: 'Phone number cannot be empty',
    };
  }

  try {
    // 1. Try parsing with explicit country context
    const parsed = parsePhoneNumberFromString(cleanInput, cleanIso2);

    if (parsed && parsed.isValid()) {
      return {
        isValid: true,
        e164: parsed.format('E.164'),
        nationalFormatted: parsed.formatNational(),
        countryIso2: parsed.country || cleanIso2,
        callingCode: `+${parsed.countryCallingCode}`,
      };
    }

    // 2. Try prepending calling code if user typed local national digits
    if (!cleanInput.startsWith('+')) {
      const withPrefix = `${callingCode}${cleanInput.replace(/^0+/, '')}`;
      const parsedWithPrefix = parsePhoneNumberFromString(withPrefix, cleanIso2);

      if (parsedWithPrefix && parsedWithPrefix.isValid()) {
        return {
          isValid: true,
          e164: parsedWithPrefix.format('E.164'),
          nationalFormatted: parsedWithPrefix.formatNational(),
          countryIso2: parsedWithPrefix.country || cleanIso2,
          callingCode: `+${parsedWithPrefix.countryCallingCode}`,
        };
      }
    }

    // Structural diagnostics
    let errorDetail = 'Invalid phone number format';
    if (parsed) {
      if (!parsed.isPossible()) {
        errorDetail = 'Phone number has an invalid length for this region';
      }
    } else {
      const digitsOnly = cleanInput.replace(/\D/g, '');
      if (digitsOnly.length < 5) {
        errorDetail = 'Phone number is too short';
      } else if (digitsOnly.length > 15) {
        errorDetail = 'Phone number exceeds international maximum length (15 digits)';
      }
    }

    return {
      isValid: false,
      e164: cleanInput.startsWith('+') ? cleanInput.replace(/\s+/g, '') : `${callingCode}${cleanInput.replace(/\D/g, '')}`,
      nationalFormatted: cleanInput,
      countryIso2: cleanIso2,
      callingCode,
      error: errorDetail,
    };
  } catch (err: any) {
    return {
      isValid: false,
      e164: cleanInput,
      nationalFormatted: cleanInput,
      countryIso2: cleanIso2,
      callingCode,
      error: err?.message || 'Failed to parse phone number',
    };
  }
}

/**
 * Formats a phone number for neat human display.
 */
export function formatPhoneDisplay(rawInput: string, countryIso2: string): string {
  const res = normalizePhoneNumber(rawInput, countryIso2);
  return res.isValid ? res.nationalFormatted : rawInput;
}
