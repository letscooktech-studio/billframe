/**
 * Currency metadata definitions.
 * Storing ISO codes, minor unit decimal exponents, and standard display symbols.
 */

export interface CurrencyMetadata {
  code: string;
  name: string;
  symbol: string;
  minorUnits: number; // e.g. 2 for cents/paise, 0 for yen
}

export const CURRENCIES: Record<string, CurrencyMetadata> = {
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    minorUnits: 2,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnits: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnits: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    minorUnits: 2,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    minorUnits: 0,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: '$',
    minorUnits: 2,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: '$',
    minorUnits: 2,
  },
  AED: {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'AED',
    minorUnits: 2,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: '$',
    minorUnits: 2,
  },
};

export const DEFAULT_CURRENCY = 'USD';

export function getCurrencyMetadata(code: string): CurrencyMetadata {
  return CURRENCIES[code.toUpperCase()] || {
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    symbol: code.toUpperCase(),
    minorUnits: 2,
  };
}
