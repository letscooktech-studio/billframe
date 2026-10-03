import { TaxExplainabilityEngine } from '../../src/domain/tax/TaxExplainability';
import { TaxDecision, DocumentTaxSummary } from '../../src/domain/tax/TaxTypes';

describe('TaxExplainabilityEngine', () => {
  it('explains India GST intra-state supply with Section 8 CGST citation', () => {
    const decision: TaxDecision = {
      packId: 'IN_GST',
      packVersion: '2026.01',
      ruleId: 'IN_GST_INTRA_STATE',
      placeOfSupply: 'IN-KA',
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType: 'exclusive',
      components: [
        { code: 'CGST', name: 'Central GST', rateBasisPoints: 900n, amountMinor: 9000n },
        { code: 'SGST', name: 'State GST', rateBasisPoints: 900n, amountMinor: 9000n },
      ],
      totalTaxRateBasisPoints: 1800n,
      taxableAmountMinor: 100000n,
      totalTaxAmountMinor: 18000n,
      grossAmountMinor: 118000n,
      roundingAdjustmentMinor: 0n,
      notes: ['Intra-state supply within Karnataka'],
    };

    const explanation = TaxExplainabilityEngine.explain(decision, 'INR');

    expect(explanation.taxSystem).toContain('Goods and Services Tax');
    expect(explanation.title).toContain('Intra-State Supply');
    expect(explanation.statutoryCitation).toContain('Section 8, CGST Act 2017');
    expect(explanation.placeOfSupply).toBe('IN-KA');
    expect(explanation.supplyTypeLabel).toBe('INTRA STATE');
    expect(explanation.reverseChargeNote).toBeUndefined();
    expect(explanation.componentBreakdown).toHaveLength(2);
    expect(explanation.componentBreakdown[0].ratePercent).toBe('9.00%');
    expect(explanation.componentBreakdown[1].ratePercent).toBe('9.00%');
  });

  it('explains India GST inter-state supply with Section 7 IGST citation', () => {
    const decision: TaxDecision = {
      packId: 'IN_GST',
      packVersion: '2026.01',
      ruleId: 'IN_GST_INTER_STATE',
      placeOfSupply: 'IN-MH',
      supplyType: 'inter_state',
      reverseCharge: true,
      taxType: 'exclusive',
      components: [
        { code: 'IGST', name: 'Integrated GST', rateBasisPoints: 1800n, amountMinor: 18000n },
      ],
      totalTaxRateBasisPoints: 1800n,
      taxableAmountMinor: 100000n,
      totalTaxAmountMinor: 18000n,
      grossAmountMinor: 118000n,
      roundingAdjustmentMinor: 0n,
      notes: ['Inter-state supply from KA to MH'],
    };

    const explanation = TaxExplainabilityEngine.explain(decision, 'INR');

    expect(explanation.title).toContain('Inter-State Supply (IGST)');
    expect(explanation.statutoryCitation).toContain('Section 7, IGST Act 2017');
    expect(explanation.reverseChargeNote).toContain('Reverse Charge Mechanism (RCM)');
    expect(explanation.componentBreakdown[0].code).toBe('IGST');
  });

  it('explains UK VAT domestic supply with VATA 1994 citation', () => {
    const decision: TaxDecision = {
      packId: 'GB_VAT',
      packVersion: '2026.01',
      ruleId: 'GB_VAT_STANDARD',
      placeOfSupply: 'GB',
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType: 'exclusive',
      components: [
        { code: 'VAT', name: 'Standard VAT', rateBasisPoints: 2000n, amountMinor: 2000n },
      ],
      totalTaxRateBasisPoints: 2000n,
      taxableAmountMinor: 10000n,
      totalTaxAmountMinor: 2000n,
      grossAmountMinor: 12000n,
      roundingAdjustmentMinor: 0n,
      notes: ['UK Standard VAT 20%'],
    };

    const explanation = TaxExplainabilityEngine.explain(decision, 'GBP');

    expect(explanation.taxSystem).toContain('Value Added Tax (VAT)');
    expect(explanation.statutoryCitation).toContain('Value Added Tax Act 1994');
  });

  it('explains from DocumentTaxSummary successfully', () => {
    const summary: DocumentTaxSummary = {
      packId: 'IN_GST',
      packVersion: '2026.01',
      placeOfSupply: 'IN-DL',
      supplyType: 'inter_state',
      reverseCharge: false,
      totalTaxableBaseMinor: 50000n,
      totalTaxMinor: 9000n,
      totalGrossMinor: 59000n,
      components: [
        { code: 'IGST', name: 'Integrated GST', rateBasisPoints: 1800n, totalAmountMinor: 9000n },
      ],
      rateBreakdowns: [],
    };

    const explanation = TaxExplainabilityEngine.explainSummary(summary, 'INR');

    expect(explanation.title).toContain('Inter-State Supply (IGST)');
    expect(explanation.statutoryCitation).toContain('Section 7, IGST Act 2017');
    expect(explanation.placeOfSupply).toBe('IN-DL');
    expect(explanation.componentBreakdown[0].amountMinor).toBe(9000n);
  });

  it('explains from a raw document record with intra-state GST split', () => {
    const doc = {
      currency: 'INR',
      place_of_supply: 'IN-TN',
      supply_type: 'intra_state',
      reverse_charge: 0,
      tax_label: 'GST',
      tax_rate_bp: 1800,
      tax_minor: 1800,
    };

    const explanation = TaxExplainabilityEngine.explainFromDocument(doc);

    expect(explanation.taxSystem).toContain('Goods and Services Tax (GST)');
    expect(explanation.title).toContain('Intra-State Supply');
    expect(explanation.componentBreakdown).toHaveLength(2);
    expect(explanation.componentBreakdown[0].code).toBe('CGST');
    expect(explanation.componentBreakdown[0].ratePercent).toBe('9.00%');
    expect(explanation.componentBreakdown[1].code).toBe('SGST');
    expect(explanation.componentBreakdown[1].ratePercent).toBe('9.00%');
    expect(explanation.componentBreakdown[0].amountMinor).toBe(900n);
    expect(explanation.componentBreakdown[1].amountMinor).toBe(900n);
  });
});
