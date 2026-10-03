/**
 * TAX ENGINE
 * Central, deterministic calculation engine for single-rate and multi-component taxes.
 * Preserves legacy calculateTax contract while introducing CountryPack resolution,
 * place-of-supply determination, and document-level tax aggregations.
 */

import { Money, roundHalfUp } from '../money/Money';
import { CountryPackRegistry } from './CountryPackRegistry';
import {
  DocumentTaxSummary,
  SupplyType,
  TaxComponentSummary,
  TaxContext,
  TaxDecision,
  TaxRateBreakdown,
  TaxType,
} from './TaxTypes';

export * from './TaxTypes';
export * from './CountryPack';
export * from './CountryPackRegistry';
export * from './packs/IndiaGstPack';
export * from './packs/GlobalCountryPacks';

export interface TaxCalculationResult {
  readonly taxableBase: Money;
  readonly taxAmount: Money;
  readonly grandTotal: Money;
  readonly taxRateBasisPoints: bigint;
  readonly taxLabel: string;
}

/**
 * CANONICAL BACKWARD-COMPATIBLE SINGLE-RATE TAX CALCULATION
 * Evaluates tax and total for a given taxable base amount using pure integer arithmetic.
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

/**
 * Resolves tax decision for an item using the appropriate CountryPack.
 */
export function resolveTaxForLineItem(context: TaxContext): TaxDecision {
  const pack = CountryPackRegistry.getPack(context.businessProfile.countryIso2);
  return pack.resolveItemTax(context);
}

/**
 * Aggregates line item tax decisions into a unified document-level summary.
 * Groups by component (e.g. total CGST, total SGST, total IGST) and by tax rate slabs.
 */
export function aggregateDocumentTax(
  lineDecisions: readonly TaxDecision[],
  currency: string
): DocumentTaxSummary {
  if (lineDecisions.length === 0) {
    return {
      packId: 'GENERIC',
      packVersion: '2026.01',
      placeOfSupply: '',
      supplyType: 'intra_state',
      reverseCharge: false,
      totalTaxableBaseMinor: 0n,
      totalTaxMinor: 0n,
      totalGrossMinor: 0n,
      components: [],
      rateBreakdowns: [],
    };
  }

  const first = lineDecisions[0];
  const packId = first.packId;
  const packVersion = first.packVersion;
  const placeOfSupply = first.placeOfSupply;
  const supplyType: SupplyType = first.supplyType;
  const reverseCharge = lineDecisions.some((d) => d.reverseCharge);

  let totalTaxableBaseMinor = 0n;
  let totalTaxMinor = 0n;
  let totalGrossMinor = 0n;

  // 1. Component aggregation map: code -> TaxComponentSummary
  const componentMap = new Map<string, { code: string; name: string; rateBasisPoints: bigint; totalAmountMinor: bigint; jurisdiction?: string }>();

  // 2. Rate breakdown aggregation map: rateBasisPoints -> breakdown
  const rateMap = new Map<
    bigint,
    {
      rateBasisPoints: bigint;
      taxableBaseMinor: bigint;
      taxAmountMinor: bigint;
      componentMap: Map<string, { code: string; name: string; rateBasisPoints: bigint; totalAmountMinor: bigint; jurisdiction?: string }>;
    }
  >();

  for (const decision of lineDecisions) {
    totalTaxableBaseMinor += decision.taxableAmountMinor;
    totalTaxMinor += decision.totalTaxAmountMinor;
    totalGrossMinor += decision.grossAmountMinor;

    // Aggregate by component
    for (const comp of decision.components) {
      const key = `${comp.code}_${comp.rateBasisPoints}_${comp.jurisdiction || ''}`;
      const existing = componentMap.get(key);
      if (existing) {
        existing.totalAmountMinor += comp.amountMinor;
      } else {
        componentMap.set(key, {
          code: comp.code,
          name: comp.name,
          rateBasisPoints: comp.rateBasisPoints,
          totalAmountMinor: comp.amountMinor,
          jurisdiction: comp.jurisdiction,
        });
      }
    }

    // Aggregate by rate slab
    const rateKey = decision.totalTaxRateBasisPoints;
    let rateEntry = rateMap.get(rateKey);
    if (!rateEntry) {
      rateEntry = {
        rateBasisPoints: rateKey,
        taxableBaseMinor: 0n,
        taxAmountMinor: 0n,
        componentMap: new Map(),
      };
      rateMap.set(rateKey, rateEntry);
    }
    rateEntry.taxableBaseMinor += decision.taxableAmountMinor;
    rateEntry.taxAmountMinor += decision.totalTaxAmountMinor;

    for (const comp of decision.components) {
      const compKey = `${comp.code}_${comp.rateBasisPoints}_${comp.jurisdiction || ''}`;
      const c = rateEntry.componentMap.get(compKey);
      if (c) {
        c.totalAmountMinor += comp.amountMinor;
      } else {
        rateEntry.componentMap.set(compKey, {
          code: comp.code,
          name: comp.name,
          rateBasisPoints: comp.rateBasisPoints,
          totalAmountMinor: comp.amountMinor,
          jurisdiction: comp.jurisdiction,
        });
      }
    }
  }

  const components: TaxComponentSummary[] = Array.from(componentMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );

  const rateBreakdowns: TaxRateBreakdown[] = Array.from(rateMap.values())
    .map((r) => ({
      rateBasisPoints: r.rateBasisPoints,
      taxableBaseMinor: r.taxableBaseMinor,
      taxAmountMinor: r.taxAmountMinor,
      components: Array.from(r.componentMap.values()),
    }))
    .sort((a, b) => (a.rateBasisPoints > b.rateBasisPoints ? 1 : -1));

  return {
    packId,
    packVersion,
    placeOfSupply,
    supplyType,
    reverseCharge,
    totalTaxableBaseMinor,
    totalTaxMinor,
    totalGrossMinor,
    components,
    rateBreakdowns,
  };
}
