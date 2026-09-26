/**
 * TAX ENGINE
 * Deterministic percentage tax calculation for Exclusive and Inclusive tax modes.
 * Zero hardcoded rates. Rates are specified as basis points (1 bp = 0.01%, 10000 bp = 100%).
 */

import { Money, roundHalfUp } from '../money/Money';

export type TaxType = 'none' | 'exclusive' | 'inclusive';

export interface TaxCalculationResult {
  readonly taxableBase: Money;
  readonly taxAmount: Money;
  readonly grandTotal: Money;
  readonly taxRateBasisPoints: bigint;
  readonly taxLabel: string;
}

/**
 * Calculates tax and total for a given taxable base amount.
 */
export function calculateTax(
  taxableBase: Money,
  taxType: TaxType,
  taxRateBasisPoints: bigint,
  taxLabel: string = 'Tax'
): TaxCalculationResult {
  const currency = taxableBase.currency;
  const baseMinor = taxableBase.amountMinor;

  if (taxType === 'none' || taxRateBasisPoints <= 0n || baseMinor <= 0n) {
    return {
      taxableBase,
      taxAmount: { amountMinor: 0n, currency },
      grandTotal: taxableBase,
      taxRateBasisPoints: 0n,
      taxLabel,
    };
  }

  if (taxType === 'exclusive') {
    // Exclusive: Tax = roundHalfUp((Base * RateBP) / 10000)
    // GrandTotal = Base + Tax
    const taxMinor = roundHalfUp(baseMinor * taxRateBasisPoints, 10000n);
    const totalMinor = baseMinor + taxMinor;

    return {
      taxableBase,
      taxAmount: { amountMinor: taxMinor, currency },
      grandTotal: { amountMinor: totalMinor, currency },
      taxRateBasisPoints,
      taxLabel,
    };
  }

  if (taxType === 'inclusive') {
    // Inclusive: Base is the gross total.
    // NetBase = roundHalfUp((Gross * 10000) / (10000 + RateBP))
    // Tax = Gross - NetBase
    const denominator = 10000n + taxRateBasisPoints;
    const netBaseMinor = roundHalfUp(baseMinor * 10000n, denominator);
    const taxMinor = baseMinor - netBaseMinor;

    return {
      taxableBase: { amountMinor: netBaseMinor, currency },
      taxAmount: { amountMinor: taxMinor, currency },
      grandTotal: taxableBase, // Gross is already the grand total
      taxRateBasisPoints,
      taxLabel,
    };
  }

  throw new Error(`Unsupported tax type: "${taxType}"`);
}
