import { calculateDocument } from '../../src/domain/documents/DocumentCalculator';
import { QUANTITY_SCALE } from '../../src/domain/documents/types';

describe('Contractor Job Costing & Profitability Engine', () => {
  it('accurately computes gross profit and margin basis points for contractor line items', () => {
    // 2 units at $150 ($300 billed), contractor cost is $90 per unit ($180 cost)
    // 1 unit at $200 ($200 billed), contractor cost is $120 ($120 cost)
    // Total billed: $500. Total cost: $300. Gross profit: $200. Margin: 40.00% = 4000 bp.
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          id: 'item_1',
          description: 'Framing labor',
          quantityScaled: 2n * QUANTITY_SCALE,
          unitPriceMinor: 15_000n, // $150.00
          internalCostMinor: 9_000n, // $90.00
          category: 'labour',
        },
        {
          id: 'item_2',
          description: 'Treated Lumber',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitPriceMinor: 20_000n, // $200.00
          internalCostMinor: 12_000n, // $120.00
          category: 'materials',
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.grandTotal.amountMinor).toBe(50_000n);
    expect(result.totalInternalCost.amountMinor).toBe(30_000n);
    expect(result.grossProfit.amountMinor).toBe(20_000n);
    expect(result.marginBasisPoints).toBe(4000); // 40.00%

    // Verify individual line item profit
    expect(result.items[0].lineTotalMinor).toBe(30_000n);
    expect(result.items[0].internalCostMinor).toBe(18_000n);
    expect(result.items[0].profitMinor).toBe(12_000n);
    expect(result.items[0].category).toBe('labour');

    expect(result.items[1].lineTotalMinor).toBe(20_000n);
    expect(result.items[1].internalCostMinor).toBe(12_000n);
    expect(result.items[1].profitMinor).toBe(8_000n);
    expect(result.items[1].category).toBe('materials');
  });

  it('handles zero internal cost (100% margin on pure service/labor)', () => {
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          id: 'item_consult',
          description: 'Architecture Consulting',
          quantityScaled: 10n * QUANTITY_SCALE,
          unitPriceMinor: 10_000n, // $100/hr = $1,000
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.grandTotal.amountMinor).toBe(100_000n);
    expect(result.totalInternalCost.amountMinor).toBe(0n);
    expect(result.grossProfit.amountMinor).toBe(100_000n);
    expect(result.marginBasisPoints).toBe(10000); // 100.00%
  });

  it('handles negative or loss-making items gracefully without negative overflow', () => {
    // Underestimated job: cost $150, billed $100
    const result = calculateDocument({
      currency: 'USD',
      items: [
        {
          id: 'item_loss',
          description: 'Emergency Fix',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitPriceMinor: 10_000n, // $100
          internalCostMinor: 15_000n, // $150
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBasisPoints: 0n,
      taxLabel: 'Tax',
      totalPaymentsMinor: 0n,
    });

    expect(result.grandTotal.amountMinor).toBe(10_000n);
    expect(result.totalInternalCost.amountMinor).toBe(15_000n);
    expect(result.grossProfit.amountMinor).toBe(0n); // Bounded at 0
    expect(result.marginBasisPoints).toBe(0);
  });
});
