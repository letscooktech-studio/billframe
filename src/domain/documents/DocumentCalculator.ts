/**
 * CENTRAL DOCUMENT CALCULATION ENGINE
 * Authoritative calculator for Invoices, Estimates, and Receipts.
 * Uses integer minor units and pure integer math. Zero floating point.
 */

import { Money, roundHalfUp } from '../money/Money';
import { calculateTax } from '../tax/TaxEngine';
import {
  DocumentCalculationInput,
  DocumentCalculationOutput,
  LineItemCalculation,
  PaymentStatus,
  QUANTITY_SCALE,
} from './types';

/**
 * Parses user decimal string quantity into scaled integer (QUANTITY_SCALE = 10_000n).
 * Examples: "1" -> 10000n, "1.5" -> 15000n, "0.2500" -> 2500n
 */
export function parseQuantityToScaled(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) {
    return 0n;
  }

  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid quantity string: "${input}"`);
  }

  const parts = normalized.split('.');
  const wholePart = BigInt(parts[0]);
  const fractionStr = (parts[1] || '').padEnd(4, '0').slice(0, 4);
  const fractionPart = BigInt(fractionStr);

  return wholePart * QUANTITY_SCALE + fractionPart;
}

/**
 * Converts scaled quantity integer to decimal string representation without trailing zeros.
 * Example: 15000n -> "1.5", 10000n -> "1", 2500n -> "0.25"
 */
export function quantityScaledToDecimalString(scaled: bigint): string {
  const sign = scaled < 0n ? '-' : '';
  const abs = scaled < 0n ? -scaled : scaled;
  const whole = abs / QUANTITY_SCALE;
  const fraction = abs % QUANTITY_SCALE;

  if (fraction === 0n) {
    return `${sign}${whole.toString()}`;
  }

  const fracStr = fraction.toString().padStart(4, '0').replace(/0+$/, '');
  return `${sign}${whole.toString()}.${fracStr}`;
}

/**
 * Executes the complete document calculation pipeline.
 */
export function calculateDocument(input: DocumentCalculationInput): DocumentCalculationOutput {
  const currency = input.currency.toUpperCase();

  // 1. Calculate each line item total
  let subtotalMinor = 0n;
  const calculatedItems: LineItemCalculation[] = [];

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    const rawLineMinor = item.unitPriceMinor * item.quantityScaled;
    const lineTotalMinor = roundHalfUp(rawLineMinor, QUANTITY_SCALE);

    subtotalMinor += lineTotalMinor;

    calculatedItems.push({
      id: item.id || `item_${i + 1}`,
      description: item.description,
      itemNotes: item.itemNotes || null,
      quantityScaled: item.quantityScaled,
      unitName: item.unitName || 'item',
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor,
    });
  }

  const subtotal: Money = { amountMinor: subtotalMinor, currency };

  // 2. Calculate document discount
  let discountMinor = 0n;
  if (input.discountType === 'fixed') {
    discountMinor = input.discountValue > subtotalMinor ? subtotalMinor : input.discountValue;
  } else if (input.discountType === 'percentage') {
    // discountValue is in basis points (e.g. 1000n = 10%)
    const clampedRate = input.discountValue > 10000n ? 10000n : input.discountValue;
    discountMinor = roundHalfUp(subtotalMinor * clampedRate, 10000n);
  }
  const discount: Money = { amountMinor: discountMinor, currency };

  // 3. Calculate taxable base
  const taxableBaseMinor = subtotalMinor - discountMinor > 0n ? subtotalMinor - discountMinor : 0n;
  const taxableBase: Money = { amountMinor: taxableBaseMinor, currency };

  // 4. Calculate tax
  const taxResult = calculateTax(
    taxableBase,
    input.taxType,
    input.taxRateBasisPoints,
    input.taxLabel
  );

  const tax = taxResult.taxAmount;
  const grandTotal = taxResult.grandTotal;

  // 5. Apply deposits and payments
  const depositMinor = input.depositMinor && input.depositMinor > 0n ? input.depositMinor : 0n;
  const deposit: Money = { amountMinor: depositMinor, currency };

  const paidMinor = input.totalPaymentsMinor > 0n ? input.totalPaymentsMinor : 0n;
  const paid: Money = { amountMinor: paidMinor, currency };

  const totalCreditsMinor = paidMinor + depositMinor;
  const balanceMinor = grandTotal.amountMinor > totalCreditsMinor ? grandTotal.amountMinor - totalCreditsMinor : 0n;
  const balance: Money = { amountMinor: balanceMinor, currency };

  // 6. Derive payment status from payments and deposit
  let paymentStatus: PaymentStatus = 'unpaid';
  if (totalCreditsMinor >= grandTotal.amountMinor && grandTotal.amountMinor > 0n) {
    paymentStatus = 'paid';
  } else if (totalCreditsMinor > 0n) {
    paymentStatus = 'partially_paid';
  }

  // 7. Derive overdue status
  const currentTs = input.currentTimestamp || Date.now();
  const isOverdue = Boolean(
    input.dueDateTimestamp &&
      currentTs > input.dueDateTimestamp &&
      balanceMinor > 0n &&
      input.lifecycleStatus === 'issued'
  );

  return {
    currency,
    items: calculatedItems,
    subtotal,
    discount,
    taxableBase: taxResult.taxableBase,
    tax,
    grandTotal,
    deposit,
    paid,
    balance,
    paymentStatus,
    isOverdue,
  };
}
