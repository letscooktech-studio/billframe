/**
 * TAX EXPLAINABILITY ENGINE ("Why This Rate?")
 * Provides clear, legally grounded, and transparent explanations for tax rules,
 * place-of-supply determinations, and multi-component tax calculations.
 */

import { formatMoney, createMoney } from '../money/Money';
import { TaxDecision, TaxComponent, SupplyType, DocumentTaxSummary } from './TaxTypes';

export interface TaxExplanation {
  readonly title: string;
  readonly summary: string;
  readonly taxSystem: string;
  readonly placeOfSupply: string;
  readonly supplyTypeLabel: string;
  readonly statutoryCitation: string;
  readonly reverseChargeNote?: string;
  readonly componentBreakdown: Array<{
    name: string;
    code: string;
    ratePercent: string;
    amountMinor: bigint;
  }>;
  readonly rulesApplied: string[];
}

export class TaxExplainabilityEngine {
  /**
   * Generates a structured, evidence-based explanation for a TaxDecision.
   */
  public static explain(decision: TaxDecision, currency: string = 'INR'): TaxExplanation {
    const isIndiaGst = decision.packId === 'IN_GST';
    const isUsSalesTax = decision.packId === 'US_SALES_TAX';
    const isGbVat = decision.packId === 'GB_VAT';

    let taxSystem = 'Standard Tax';
    let statutoryCitation = 'Applicable Regional Tax Code';
    let title = 'Tax Rate Breakdown';
    let summary = 'Standard transaction tax calculation applied.';

    if (isIndiaGst) {
      taxSystem = 'Goods and Services Tax (GST)';
      if (decision.supplyType === 'intra_state') {
        title = 'Intra-State Supply (CGST + SGST/UTGST)';
        summary = `Both seller and place of supply are located within ${decision.placeOfSupply}. Central GST and State/UT GST are charged in equal proportions.`;
        statutoryCitation = 'Section 8, CGST Act 2017 & respective SGST Act / UTGST Act';
      } else if (decision.supplyType === 'inter_state') {
        title = 'Inter-State Supply (IGST)';
        summary = `Seller location and place of supply (${decision.placeOfSupply}) are in different states. Integrated GST (IGST) is charged.`;
        statutoryCitation = 'Section 7, IGST Act 2017';
      } else if (decision.supplyType === 'export') {
        title = 'Zero-Rated Export';
        summary = 'Supply is exported outside India and treated as zero-rated under bond/LUT.';
        statutoryCitation = 'Section 16, IGST Act 2017';
      }
    } else if (isUsSalesTax) {
      taxSystem = 'State & Local Sales Tax';
      title = `Sales Tax (${decision.placeOfSupply})`;
      summary = `Destination-based sales tax evaluated for ${decision.placeOfSupply}.`;
      statutoryCitation = 'State Department of Revenue Sales & Use Tax Regulations';
    } else if (isGbVat) {
      taxSystem = 'Value Added Tax (VAT)';
      title = 'UK Value Added Tax';
      summary = 'UK standard-rate domestic business supply.';
      statutoryCitation = 'Value Added Tax Act 1994 (VATA 1994)';
    }

    const componentBreakdown = decision.components.map((c) => ({
      name: c.name,
      code: c.code,
      ratePercent: `${(Number(c.rateBasisPoints) / 100).toFixed(2)}%`,
      amountMinor: c.amountMinor,
    }));

    const rulesApplied: string[] = [
      `Place of Supply: ${decision.placeOfSupply}`,
      `Supply Classification: ${decision.supplyType.replace('_', ' ').toUpperCase()}`,
      `Tax Application: ${decision.taxType.toUpperCase()}`,
      `Total Rate: ${(Number(decision.totalTaxRateBasisPoints) / 100).toFixed(2)}%`,
      ...decision.notes,
    ];

    return {
      title,
      summary,
      taxSystem,
      placeOfSupply: decision.placeOfSupply,
      supplyTypeLabel: decision.supplyType.replace('_', ' ').toUpperCase(),
      statutoryCitation,
      reverseChargeNote: decision.reverseCharge
        ? 'Reverse Charge Mechanism (RCM) applies: recipient is liable to discharge tax liability.'
        : undefined,
      componentBreakdown,
      rulesApplied,
    };
  }

  /**
   * Generates a structured explanation from an aggregated DocumentTaxSummary.
   */
  public static explainSummary(summary: DocumentTaxSummary, currency: string = 'INR'): TaxExplanation {
    const isIndiaGst = summary.packId === 'IN_GST' || (!summary.packId && currency === 'INR');
    const isUsSalesTax = summary.packId === 'US_SALES_TAX';
    const isGbVat = summary.packId === 'GB_VAT';

    let taxSystem = 'Standard Tax';
    let statutoryCitation = 'Applicable Regional Tax Code';
    let title = 'Document Tax Breakdown';
    let explanationSummary = 'Standard transaction tax calculation applied.';

    if (isIndiaGst) {
      taxSystem = 'Goods and Services Tax (GST)';
      if (summary.supplyType === 'intra_state') {
        title = 'Intra-State Supply (CGST + SGST/UTGST)';
        explanationSummary = `Both seller and place of supply are located within ${summary.placeOfSupply || 'the same state'}. Central GST and State/UT GST are charged in equal proportions.`;
        statutoryCitation = 'Section 8, CGST Act 2017 & respective SGST Act / UTGST Act';
      } else if (summary.supplyType === 'inter_state') {
        title = 'Inter-State Supply (IGST)';
        explanationSummary = `Seller location and place of supply (${summary.placeOfSupply || 'other state'}) are in different states. Integrated GST (IGST) is charged.`;
        statutoryCitation = 'Section 7, IGST Act 2017';
      } else if (summary.supplyType === 'export') {
        title = 'Zero-Rated Export';
        explanationSummary = 'Supply is exported outside India and treated as zero-rated under bond/LUT.';
        statutoryCitation = 'Section 16, IGST Act 2017';
      }
    } else if (isUsSalesTax) {
      taxSystem = 'State & Local Sales Tax';
      title = `Sales Tax (${summary.placeOfSupply || 'Destination'})`;
      explanationSummary = `Destination-based sales tax evaluated for ${summary.placeOfSupply || 'buyer location'}.`;
      statutoryCitation = 'State Department of Revenue Sales & Use Tax Regulations';
    } else if (isGbVat) {
      taxSystem = 'Value Added Tax (VAT)';
      title = 'UK Value Added Tax';
      explanationSummary = 'UK standard-rate domestic business supply.';
      statutoryCitation = 'Value Added Tax Act 1994 (VATA 1994)';
    }

    const componentBreakdown = summary.components.map((c) => ({
      name: c.name,
      code: c.code,
      ratePercent: `${(Number(c.rateBasisPoints) / 100).toFixed(2)}%`,
      amountMinor: c.totalAmountMinor,
    }));

    const rulesApplied: string[] = [
      `Place of Supply: ${summary.placeOfSupply || 'Standard Business Location'}`,
      `Supply Classification: ${(summary.supplyType || 'standard').replace('_', ' ').toUpperCase()}`,
      `Reverse Charge: ${summary.reverseCharge ? 'Applicable (Recipient Liable)' : 'Not Applicable'}`,
    ];

    return {
      title,
      summary: explanationSummary,
      taxSystem,
      placeOfSupply: summary.placeOfSupply || 'Standard Location',
      supplyTypeLabel: (summary.supplyType || 'standard').replace('_', ' ').toUpperCase(),
      statutoryCitation,
      reverseChargeNote: summary.reverseCharge
        ? 'Reverse Charge Mechanism (RCM) applies: recipient is liable to discharge tax liability.'
        : undefined,
      componentBreakdown,
      rulesApplied,
    };
  }

  /**
   * Generates a tax explanation from any document record or draft, falling back to document tax fields.
   */
  public static explainFromDocument(doc: {
    tax_summary?: any | null;
    place_of_supply?: string | null;
    supply_type?: string | null;
    reverse_charge?: number | boolean;
    tax_label?: string;
    tax_rate_bp?: number;
    tax_minor?: number;
    currency?: string;
    items?: Array<{
      tax_components_json?: string | null;
      tax_rate_bp?: number;
      tax_minor?: number;
      tax_type?: string;
    }>;
  }): TaxExplanation {
    const currency = doc.currency || 'USD';

    // 1. If structured tax_summary already exists
    if (doc.tax_summary) {
      const summary = typeof doc.tax_summary === 'string' ? JSON.parse(doc.tax_summary) : doc.tax_summary;
      // Convert any stringified bigints to bigint if needed
      const normalizedSummary: DocumentTaxSummary = {
        packId: summary.packId || (currency === 'INR' ? 'IN_GST' : 'GENERIC'),
        packVersion: summary.packVersion || '2026.01',
        placeOfSupply: summary.placeOfSupply || doc.place_of_supply || '',
        supplyType: (summary.supplyType || doc.supply_type || 'intra_state') as SupplyType,
        reverseCharge: Boolean(summary.reverseCharge ?? doc.reverse_charge),
        totalTaxableBaseMinor: BigInt(summary.totalTaxableBaseMinor || 0),
        totalTaxMinor: BigInt(summary.totalTaxMinor || doc.tax_minor || 0),
        totalGrossMinor: BigInt(summary.totalGrossMinor || 0),
        components: (summary.components || []).map((c: any) => ({
          code: c.code,
          name: c.name,
          rateBasisPoints: BigInt(c.rateBasisPoints || 0),
          totalAmountMinor: BigInt(c.totalAmountMinor || c.amountMinor || 0),
          jurisdiction: c.jurisdiction,
        })),
        rateBreakdowns: summary.rateBreakdowns || [],
      };
      return this.explainSummary(normalizedSummary, currency);
    }

    // 2. Synthesize from document line items or fallback flat rate
    const components: Array<{ name: string; code: string; ratePercent: string; amountMinor: bigint }> = [];
    const isIndia = currency === 'INR';
    const placeOfSupply = doc.place_of_supply || (isIndia ? 'Default State' : 'Origin/Destination');
    const supplyType = (doc.supply_type || (isIndia ? 'intra_state' : 'standard')) as SupplyType;
    const isRcm = Boolean(doc.reverse_charge);

    let hasExtractedItemComponents = false;
    if (doc.items && doc.items.length > 0) {
      for (const it of doc.items) {
        if (it.tax_components_json) {
          try {
            const parsed = JSON.parse(it.tax_components_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              for (const comp of parsed) {
                components.push({
                  name: comp.name || comp.code,
                  code: comp.code,
                  ratePercent: `${(Number(comp.rateBasisPoints || 0) / 100).toFixed(2)}%`,
                  amountMinor: BigInt(comp.amountMinor || 0),
                });
              }
              hasExtractedItemComponents = true;
            }
          } catch {
            // ignore JSON parse errors
          }
        }
      }
    }

    if (!hasExtractedItemComponents && (doc.tax_minor || doc.tax_rate_bp)) {
      const taxRateBp = doc.tax_rate_bp || 0;
      const taxAmount = BigInt(doc.tax_minor || 0);

      if (isIndia && supplyType === 'intra_state' && taxRateBp > 0) {
        // Split into CGST and SGST
        const halfRate = Math.floor(taxRateBp / 2);
        const halfAmount = taxAmount / 2n;
        components.push({
          name: 'Central GST (CGST)',
          code: 'CGST',
          ratePercent: `${(halfRate / 100).toFixed(2)}%`,
          amountMinor: halfAmount,
        });
        components.push({
          name: 'State GST (SGST)',
          code: 'SGST',
          ratePercent: `${(halfRate / 100).toFixed(2)}%`,
          amountMinor: taxAmount - halfAmount,
        });
      } else if (isIndia && supplyType === 'inter_state' && taxRateBp > 0) {
        components.push({
          name: 'Integrated GST (IGST)',
          code: 'IGST',
          ratePercent: `${(taxRateBp / 100).toFixed(2)}%`,
          amountMinor: taxAmount,
        });
      } else {
        components.push({
          name: doc.tax_label || 'Standard Tax',
          code: 'TAX',
          ratePercent: `${(taxRateBp / 100).toFixed(2)}%`,
          amountMinor: taxAmount,
        });
      }
    }

    let taxSystem = isIndia ? 'Goods and Services Tax (GST)' : 'Standard Tax';
    let statutoryCitation = isIndia
      ? supplyType === 'intra_state'
        ? 'Section 8, CGST Act 2017 & SGST Act'
        : 'Section 7, IGST Act 2017'
      : 'Applicable Regional Tax Regulations';

    let title = isIndia
      ? supplyType === 'intra_state'
        ? 'Intra-State Supply (CGST + SGST)'
        : 'Inter-State Supply (IGST)'
      : `${doc.tax_label || 'Tax'} Calculation`;

    let summary = isIndia
      ? `Place of supply: ${placeOfSupply}. Tax determined based on registered GST rules.`
      : `Tax calculated at ${(Number(doc.tax_rate_bp || 0) / 100).toFixed(2)}% for place of supply: ${placeOfSupply}.`;

    return {
      title,
      summary,
      taxSystem,
      placeOfSupply,
      supplyTypeLabel: supplyType.replace('_', ' ').toUpperCase(),
      statutoryCitation,
      reverseChargeNote: isRcm
        ? 'Reverse Charge Mechanism (RCM) applies: recipient is liable to discharge tax liability.'
        : undefined,
      componentBreakdown: components,
      rulesApplied: [
        `Place of Supply: ${placeOfSupply}`,
        `Supply Type: ${supplyType.replace('_', ' ').toUpperCase()}`,
        `Effective Rate: ${(Number(doc.tax_rate_bp || 0) / 100).toFixed(2)}%`,
      ],
    };
  }
}
