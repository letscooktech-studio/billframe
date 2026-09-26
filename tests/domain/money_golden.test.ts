/**
 * GOLDEN MONEY & DOCUMENT CALCULATION TEST SUITE
 * Deterministic reference test vectors covering all 17+ mandatory cases.
 * Strictly verifies integer minor unit precision and zero floating point error.
 */

import {
  calculateDocument,
  parseQuantityToScaled,
  quantityScaledToDecimalString,
} from '../../src/domain/documents/DocumentCalculator';
import {
  addMoney,
  createMoney,
  formatMoney,
  moneyToDecimalString,
  parseDecimalStringToMoney,
  roundHalfUp,
  subtractMoney,
} from '../../src/domain/money/Money';
import { calculateTax } from '../../src/domain/tax/TaxEngine';

describe('1. Pure Money & Minor Unit Arithmetic', () => {
  test('Financial Round Half-Up behaves identically to standard accounting rules', () => {
    // 5 / 2 = 2.5 -> rounds to 3
    expect(roundHalfUp(5n, 2n)).toBe(3n);
    // -5 / 2 = -2.5 -> rounds to -3 (away from zero)
    expect(roundHalfUp(-5n, 2n)).toBe(-3n);
    // 4 / 2 = 2 -> 2
    expect(roundHalfUp(4n, 2n)).toBe(2n);
    // 1 / 3 = 0.333... -> 0
    expect(roundHalfUp(1n, 3n)).toBe(0n);
    // 2 / 3 = 0.666... -> 1
    expect(roundHalfUp(2n, 3n)).toBe(1n);
  });

  test('Decimal string to minor units parsing (USD 2 decimals)', () => {
    const m1 = parseDecimalStringToMoney('19.95', 'USD');
    expect(m1.amountMinor).toBe(1995n);
    expect(m1.currency).toBe('USD');

    const m2 = parseDecimalStringToMoney('19,95', 'USD');
    expect(m2.amountMinor).toBe(1995n);

    const m3 = parseDecimalStringToMoney('500', 'USD');
    expect(m3.amountMinor).toBe(50000n);

    const m4 = parseDecimalStringToMoney('0.05', 'USD');
    expect(m4.amountMinor).toBe(5n);
  });

  test('Decimal string to minor units parsing for JPY (0 decimals)', () => {
    const jpy = parseDecimalStringToMoney('5000', 'JPY');
    expect(jpy.amountMinor).toBe(5000n);
    expect(jpy.currency).toBe('JPY');
  });

  test('Addition and Subtraction with currency parity assertion', () => {
    const a = createMoney(1050n, 'USD'); // $10.50
    const b = createMoney(450n, 'USD');  // $4.50
    const sum = addMoney(a, b);
    expect(sum.amountMinor).toBe(1500n); // $15.00

    const diff = subtractMoney(a, b);
    expect(diff.amountMinor).toBe(600n);  // $6.00

    const eur = createMoney(100n, 'EUR');
    expect(() => addMoney(a, eur)).toThrow('Currency mismatch');
  });

  test('Money formatting to decimal strings', () => {
    expect(moneyToDecimalString(createMoney(1995n, 'USD'))).toBe('19.95');
    expect(moneyToDecimalString(createMoney(5000n, 'JPY'))).toBe('5000');
    expect(moneyToDecimalString(createMoney(5n, 'USD'))).toBe('0.05');
  });
});

describe('2. Scaled Quantity Parsing & Formatting', () => {
  test('Quantity scale (10,000n = 1 unit)', () => {
    expect(parseQuantityToScaled('1')).toBe(10000n);
    expect(parseQuantityToScaled('1.5')).toBe(15000n);
    expect(parseQuantityToScaled('0.2500')).toBe(2500n);
    expect(parseQuantityToScaled('0.0001')).toBe(1n);

    expect(quantityScaledToDecimalString(10000n)).toBe('1');
    expect(quantityScaledToDecimalString(15000n)).toBe('1.5');
    expect(quantityScaledToDecimalString(2500n)).toBe('0.25');
    expect(quantityScaledToDecimalString(1n)).toBe('0.0001');
  });
});

describe('3. Deterministic Golden Calculation Vectors', () => {
  test('Vector 1: Zero-value invoice', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(0n);
    expect(result.grandTotal.amountMinor).toBe(0n);
    expect(result.balance.amountMinor).toBe(0n);
    expect(result.paymentStatus).toBe('unpaid');
  });

  test('Vector 2: Single line item', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          description: 'Consulting',
          quantityScaled: 10000n, // 1.0 unit
          unitPriceMinor: 50000n, // $500.00
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(50000n);
    expect(result.grandTotal.amountMinor).toBe(50000n);
    expect(result.balance.amountMinor).toBe(50000n);
  });

  test('Vector 3: Multiple line items with integer summing', () => {
    const result = calculateDocument({
      currency: 'INR',
      items: [
        { description: 'Design', quantityScaled: 10000n, unitPriceMinor: 1500000n }, // ₹15,000.00
        { description: 'Development', quantityScaled: 20000n, unitPriceMinor: 2500000n }, // 2 x ₹25,000.00 = ₹50,000.00
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'GST',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(6500000n); // ₹65,000.00
    expect(result.grandTotal.amountMinor).toBe(6500000n);
  });

  test('Vector 4: Decimal quantity with fractional minor rounding', () => {
    // 1.375 hours at $75.50/hr ($75.50 = 7550 cents)
    // 7550 * 13750 = 103,812,500 / 10000 = 10381.25 -> rounds to 10381 ($103.81)
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          description: 'Hourly support',
          quantityScaled: 13750n, // 1.3750
          unitPriceMinor: 7550n,   // $75.50
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(10381n);
    expect(result.grandTotal.amountMinor).toBe(10381n);
  });

  test('Vector 5: Fixed document discount', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Service', quantityScaled: 10000n, unitPriceMinor: 10000n }], // $100.00
      discountType: 'fixed',
      discountValue: 1500n, // $15.00 discount
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(10000n);
    expect(result.discount.amountMinor).toBe(1500n);
    expect(result.taxableBase.amountMinor).toBe(8500n);
    expect(result.grandTotal.amountMinor).toBe(8500n);
  });

  test('Vector 6: Percentage document discount (10% = 1000 bp)', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Service', quantityScaled: 10000n, unitPriceMinor: 10000n }], // $100.00
      discountType: 'percentage',
      discountValue: 1000n, // 10.00%
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.discount.amountMinor).toBe(1000n); // $10.00
    expect(result.grandTotal.amountMinor).toBe(9000n); // $90.00
  });

  test('Vector 7: Exclusive Percentage Tax (e.g. 18.00% GST = 1800 bp)', () => {
    // Subtotal = $100.00 (10000 cents), Tax = 18% = 1800 cents, Total = $118.00 (11800 cents)
    const result = calculateDocument({
      currency: 'INR',
      items: [{ description: 'Consulting', quantityScaled: 10000n, unitPriceMinor: 10000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'exclusive',
      taxRateBasisPoints: 1800n,
      taxLabel: 'GST',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(10000n);
    expect(result.tax.amountMinor).toBe(1800n);
    expect(result.grandTotal.amountMinor).toBe(11800n);
  });

  test('Vector 8: Inclusive Percentage Tax (Gross = $118.00 at 18.00%)', () => {
    // Gross = 11800 cents
    // NetBase = roundHalfUp((11800 * 10000) / 11800) = 10000 cents ($100.00)
    // Tax = 11800 - 10000 = 1800 cents ($18.00)
    const result = calculateDocument({
      currency: 'INR',
      items: [{ description: 'Consulting', quantityScaled: 10000n, unitPriceMinor: 11800n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'inclusive',
      taxRateBasisPoints: 1800n,
      taxLabel: 'GST',
      totalPaymentsMinor: 0n,
    });

    expect(result.grandTotal.amountMinor).toBe(11800n);
    expect(result.taxableBase.amountMinor).toBe(10000n);
    expect(result.tax.amountMinor).toBe(1800n);
  });

  test('Vector 9: Multiple Partial Payments and Balance Calculation', () => {
    // Total = $1,000.00 (100000 cents)
    // Payment 1: $250.00 (25000 cents) -> Balance = $750.00 (75000 cents) -> partially_paid
    const r1 = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Project', quantityScaled: 10000n, unitPriceMinor: 100000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 25000n,
    });

    expect(r1.paid.amountMinor).toBe(25000n);
    expect(r1.balance.amountMinor).toBe(75000n);
    expect(r1.paymentStatus).toBe('partially_paid');

    // Payment 2 adds $750.00 -> Total Paid = $1000.00 -> Balance = 0 -> paid
    const r2 = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Project', quantityScaled: 10000n, unitPriceMinor: 100000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 100000n,
    });

    expect(r2.paid.amountMinor).toBe(100000n);
    expect(r2.balance.amountMinor).toBe(0n);
    expect(r2.paymentStatus).toBe('paid');
  });

  test('Vector 10: Overpayment handling (Paid > Grand Total)', () => {
    // Total = $100.00 (10000 cents), Paid = $120.00 (12000 cents)
    const result = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Item', quantityScaled: 10000n, unitPriceMinor: 10000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 12000n,
    });

    expect(result.balance.amountMinor).toBe(0n);
    expect(result.paymentStatus).toBe('paid');
  });

  test('Vector 11: Japanese Yen (0 minor units)', () => {
    // 3 items at ¥5,000 = ¥15,000 + 10% tax (1000 bp) = ¥16,500
    const result = calculateDocument({
      currency: 'JPY',
      items: [{ description: 'Goods', quantityScaled: 30000n, unitPriceMinor: 5000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'exclusive',
      taxRateBasisPoints: 1000n,
      taxLabel: 'Consumption Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(15000n);
    expect(result.tax.amountMinor).toBe(1500n);
    expect(result.grandTotal.amountMinor).toBe(16500n);
  });

  test('Vector 12: High-value amounts (> $10,000,000.00)', () => {
    // $15,000,000.00 = 1,500,000,000 cents
    const result = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Enterprise Project', quantityScaled: 10000n, unitPriceMinor: 1500000000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'exclusive',
      taxRateBasisPoints: 500n, // 5%
      taxLabel: 'Sales Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.subtotal.amountMinor).toBe(1500000000n);
    expect(result.tax.amountMinor).toBe(75000000n); // $750,000.00
    expect(result.grandTotal.amountMinor).toBe(1575000000n); // $15,750,000.00
  });

  test('Vector 13: Overdue status evaluation', () => {
    const now = 1774704000000;
    const pastDueDate = now - 86400000; // 1 day ago
    const futureDueDate = now + 86400000; // 1 day in future

    // Case A: Issued invoice, past due, balance > 0 -> Overdue: true
    const overdueRes = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Item', quantityScaled: 10000n, unitPriceMinor: 10000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
      dueDateTimestamp: pastDueDate,
      currentTimestamp: now,
      lifecycleStatus: 'issued',
    });
    expect(overdueRes.isOverdue).toBe(true);

    // Case B: Draft invoice, past due -> Overdue: false (draft cannot be overdue)
    const draftRes = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Item', quantityScaled: 10000n, unitPriceMinor: 10000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
      dueDateTimestamp: pastDueDate,
      currentTimestamp: now,
      lifecycleStatus: 'draft',
    });
    expect(draftRes.isOverdue).toBe(false);

    // Case C: Issued invoice, past due, but balance is 0 -> Overdue: false
    const paidRes = calculateDocument({
      currency: 'USD',
      items: [{ description: 'Item', quantityScaled: 10000n, unitPriceMinor: 10000n }],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 10000n,
      dueDateTimestamp: pastDueDate,
      currentTimestamp: now,
      lifecycleStatus: 'issued',
    });
    expect(paidRes.isOverdue).toBe(false);
  });
});
