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
export function createMoney(amountMinor: bigint, currency: string): Money {
  return {
    amountMinor,
    currency: currency.toUpperCase(),
  };
}

/**
 * Creates a zero-value Money object for a given currency.
 */
export function zeroMoney(currency: string): Money {
  return {
    amountMinor: 0n,
    currency: currency.toUpperCase(),
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
  const trimmed = input.trim();

  if (!trimmed) {
    return zeroMoney(currency);
  }

  // Normalize comma decimal separator to dot if only one comma exists
  const normalized = trimmed.replace(',', '.');

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
export function moneyToDecimalString(m: Money): string {
  const meta = getCurrencyMetadata(m.currency);
  const absAmount = m.amountMinor < 0n ? -m.amountMinor : m.amountMinor;
  const sign = m.amountMinor < 0n ? '-' : '';

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
export function formatMoney(m: Money, documentLocale: string = 'en-US'): string {
  const meta = getCurrencyMetadata(m.currency);
  const decimalStr = moneyToDecimalString(m);
  const numValue = Number(decimalStr);

  try {
    return new Intl.NumberFormat(documentLocale, {
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
