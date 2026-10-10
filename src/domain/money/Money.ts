/**
 * PURE DOMAIN MONEY ENGINE
 * Zero floating-point arithmetic.
 * Representation: bigint minor units (cents, paise, yen).
 * All division operations enforce standard Financial Half-Up rounding.
 */

import { getCurrencyMetadata } from './Currencies';

export interface Money {
  readonly amountMinor: bigint;
  readonly currency: string;
}

/**
 * Financial Round Half-Up (Round half away from zero).
 * Formula: sign(N) * floor((|N| + floor(|D| / 2)) / |D|)
 */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new Error('Division by zero in money calculation');
  }

  const sign = (numerator < 0n) !== (denominator < 0n) ? -1n : 1n;
  const absN = numerator < 0n ? -numerator : numerator;
  const absD = denominator < 0n ? -denominator : denominator;

  const halfD = absD / 2n;
  const rounded = (absN + halfD) / absD;

  return sign * rounded;
}

/**
 * Creates a Money value object.
 */
export function createMoney(amountMinor: bigint, currency?: string | null): Money {
  const safeCurr = (currency && typeof currency === 'string' ? currency.trim().toUpperCase() : '') || 'USD';
  return {
    amountMinor,
    currency: safeCurr,
  };
}

/**
 * Creates a zero-value Money object for a given currency.
 */
export function zeroMoney(currency?: string | null): Money {
  const safeCurr = (currency && typeof currency === 'string' ? currency.trim().toUpperCase() : '') || 'USD';
  return {
    amountMinor: 0n,
    currency: safeCurr,
  };
}

/**
 * Asserts two Money objects share the same currency.
 */
function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: cannot operate on ${a.currency} and ${b.currency}`);
  }
}

/**
 * Adds two Money values.
 */
export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return {
    amountMinor: a.amountMinor + b.amountMinor,
    currency: a.currency,
  };
}

/**
 * Subtracts Money b from Money a.
 */
export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return {
    amountMinor: a.amountMinor - b.amountMinor,
    currency: a.currency,
  };
}

/**
 * Clamps a Money value to a minimum of zero.
 */
export function clampZero(m: Money): Money {
  return {
    amountMinor: m.amountMinor < 0n ? 0n : m.amountMinor,
    currency: m.currency,
  };
}

/**
 * Parses user input decimal string into Money minor units without floating-point errors.
 * Supports standard dot or comma decimal separators (e.g. "19.95", "19,95", "500").
 */
export function parseDecimalStringToMoney(input: string, currency: string): Money {
  const meta = getCurrencyMetadata(currency);
  // Strip currency symbols, letters, spaces except digits, dots and commas
  const cleaned = input.replace(/[^\d.,]/g, '').trim();

  if (!cleaned) {
    return zeroMoney(currency);
  }

  let normalized = cleaned;
  // Handle formats with both commas and dots (e.g. 1,000.50 or 1.000,50)
  if (normalized.includes(',') && normalized.includes('.')) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    if (lastDot > lastComma) {
      // Standard US format: 1,000.50 -> remove commas
      normalized = normalized.replace(/,/g, '');
    } else {
      // European format: 1.000,50 -> remove dots and replace comma with dot
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    }
  } else if (normalized.includes(',')) {
    // Only comma present: check if comma is thousands separator (e.g. 1,000) or decimal (e.g. 19,95)
    const parts = normalized.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1 && !parts[1].includes('.')) {
      // e.g. 1,000 or 10,000 without decimals -> treat as 1000
      normalized = normalized.replace(',', '');
    } else {
      // e.g. 19,95 or 5,5 -> treat as decimal
      normalized = normalized.replace(',', '.');
    }
  }

  // Check for valid decimal format (e.g. "123", "123.45")
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid numeric amount input: "${input}"`);
  }

  const parts = normalized.split('.');
  const wholePart = BigInt(parts[0]);

  if (meta.minorUnits === 0) {
    return {
      amountMinor: wholePart,
      currency: meta.code,
    };
  }

  const fractionStr = (parts[1] || '').padEnd(meta.minorUnits, '0').slice(0, meta.minorUnits);
  const multiplier = 10n ** BigInt(meta.minorUnits);
  const fractionPart = BigInt(fractionStr);

  return {
    amountMinor: wholePart * multiplier + fractionPart,
    currency: meta.code,
  };
}

/**
 * Converts a Money object into a standard decimal string (e.g. "19.95" or "500").
 */
export function moneyToDecimalString(m?: Money | null): string {
  if (!m) return '0.00';
  const meta = getCurrencyMetadata(m.currency);
  const amountMinor = typeof m.amountMinor === 'bigint' ? m.amountMinor : 0n;
  const absAmount = amountMinor < 0n ? -amountMinor : amountMinor;
  const sign = amountMinor < 0n ? '-' : '';

  if (meta.minorUnits === 0) {
    return `${sign}${absAmount.toString()}`;
  }

  const divisor = 10n ** BigInt(meta.minorUnits);
  const whole = absAmount / divisor;
  const fraction = (absAmount % divisor).toString().padStart(meta.minorUnits, '0');

  return `${sign}${whole.toString()}.${fraction}`;
}

/**
 * Formats Money for UI display using Intl.NumberFormat according to document locale.
 */
export function formatMoney(m?: Money | null, documentLocale: string = 'en-US'): string {
  if (!m) return '$0.00';
  const meta = getCurrencyMetadata(m.currency);
  const decimalStr = moneyToDecimalString(m);
  const numValue = Number(decimalStr);

  try {
    return new Intl.NumberFormat(documentLocale || 'en-US', {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.minorUnits,
      maximumFractionDigits: meta.minorUnits,
    }).format(numValue);
  } catch {
    // Fallback if locale is unsupported
    return `${meta.symbol}${decimalStr}`;
  }
}

/**
 * Safely converts an unknown value (number, float, string, or bigint) into a BigInt minor unit,
 * protecting against RangeError (fractions) and SyntaxError.
 */
export function toBigIntSafe(val: unknown, fallback: bigint = 0n): bigint {
  if (typeof val === 'bigint') {
    return val;
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      return fallback;
    }
    return BigInt(Math.round(val));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) {
      return fallback;
    }
    try {
      if (/^-?\d+$/.test(trimmed)) {
        return BigInt(trimmed);
      }
      const num = parseFloat(trimmed);
      if (Number.isFinite(num)) {
        return BigInt(Math.round(num));
      }
    } catch {
      return fallback;
    }
    return fallback;
  }
  return fallback;
}
