/**
 * GLOBAL COUNTRY PACKS
 * First-class support for United States (Sales Tax), United Kingdom (VAT),
 * Canada (GST/HST/PST), and Generic global fallbacks.
 */

import { roundHalfUp } from '../../money/Money';
import { CountryPack } from '../CountryPack';
import {
  CountryPackMetadata,
  SupplyType,
  TaxComponent,
  TaxContext,
  TaxDecision,
} from '../TaxTypes';

/**
 * Standard Canadian Provincial Tax Configurations.
 */
interface CanadaProvinceTax {
  readonly mode: 'HST' | 'GST_PST' | 'GST_ONLY';
  readonly hstRate?: bigint;
  readonly gstRate?: bigint;
  readonly pstRate?: bigint;
}

const CANADA_PROVINCES: Record<string, CanadaProvinceTax> = {
  'CA-ON': { mode: 'HST', hstRate: 1300n }, // Ontario: 13% HST
  'CA-BC': { mode: 'GST_PST', gstRate: 500n, pstRate: 700n }, // British Columbia: 5% GST + 7% PST
  'CA-QC': { mode: 'GST_PST', gstRate: 500n, pstRate: 9975n / 10n }, // Quebec: 5% GST + 9.975% QST (~998 bp)
  'CA-AB': { mode: 'GST_ONLY', gstRate: 500n }, // Alberta: 5% GST only
  'CA-NS': { mode: 'HST', hstRate: 1500n }, // Nova Scotia: 15% HST
  'CA-NB': { mode: 'HST', hstRate: 1500n }, // New Brunswick: 15% HST
  'CA-MB': { mode: 'GST_PST', gstRate: 500n, pstRate: 700n }, // Manitoba: 5% GST + 7% PST
  'CA-SK': { mode: 'GST_PST', gstRate: 500n, pstRate: 600n }, // Saskatchewan: 5% GST + 6% PST
};

/**
 * UNITED STATES SALES TAX PACK
 */
export class UsSalesTaxPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'US_SALES_TAX',
    countryCode: 'US',
    name: 'United States Sales Tax',
    version: '2026.01',
    taxSystem: 'Sales Tax',
    defaultCurrency: 'USD',
    capabilities: ['place_of_supply', 'inclusive_exclusive', 'flat_override'],
    defaultRateBasisPoints: 0n, // US base default is 0% (depends on state nexus)
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { customer, item, taxType } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    const placeOfSupply = customer?.subdivisionCode || customer?.countryIso2 || 'US';

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'US_TAX_EXEMPT',
        placeOfSupply,
        supplyType: 'exempt',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: [],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    const components: TaxComponent[] = [
      {
        code: 'SALES_TAX',
        name: 'Sales Tax',
        rateBasisPoints,
        amountMinor: totalTaxAmountMinor,
        jurisdiction: placeOfSupply,
      },
    ];

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'US_SALES_TAX_STANDARD',
      placeOfSupply,
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components,
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * UNITED KINGDOM VAT PACK
 */
export class UkVatPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'GB_VAT',
    countryCode: 'GB',
    name: 'United Kingdom Value Added Tax',
    version: '2026.01',
    taxSystem: 'VAT',
    defaultCurrency: 'GBP',
    capabilities: ['inclusive_exclusive', 'flat_override'],
    defaultRateBasisPoints: 2000n, // 20% Standard VAT
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { item, taxType } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'GB_VAT_ZERO',
        placeOfSupply: 'GB',
        supplyType: 'zero_rated' as SupplyType,
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: [],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'GB_VAT_STANDARD',
      placeOfSupply: 'GB',
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components: [
        {
          code: 'VAT',
          name: 'Value Added Tax',
          rateBasisPoints,
          amountMinor: totalTaxAmountMinor,
          jurisdiction: 'GB',
        },
      ],
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * CANADA GST / HST PACK
 */
export class CanadaGstHstPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'CA_GST_HST',
    countryCode: 'CA',
    name: 'Canada Goods and Services Tax / Harmonized Sales Tax',
    version: '2026.01',
    taxSystem: 'GST/HST',
    defaultCurrency: 'CAD',
    capabilities: ['multi_component', 'place_of_supply', 'inclusive_exclusive'],
    defaultRateBasisPoints: 500n, // Federal 5% GST minimum
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { customer, item, taxType } = context;
    const provinceCode = (customer?.subdivisionCode || '').toUpperCase();
    const config = CANADA_PROVINCES[provinceCode];

    let components: TaxComponent[] = [];
    let totalRateBasisPoints = 500n;

    if (item.taxRateBasisPoints !== undefined && item.taxRateBasisPoints !== null) {
      totalRateBasisPoints = item.taxRateBasisPoints;
    } else if (config) {
      if (config.mode === 'HST') {
        totalRateBasisPoints = config.hstRate || 1300n;
      } else if (config.mode === 'GST_PST') {
        totalRateBasisPoints = (config.gstRate || 500n) + (config.pstRate || 700n);
      } else {
        totalRateBasisPoints = config.gstRate || 500n;
      }
    }

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    if (taxType === 'none' || totalRateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'CA_EXEMPT',
        placeOfSupply: provinceCode || 'CA',
        supplyType: 'exempt',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: [],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * totalRateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + totalRateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    // Split components if standard province config
    if (config?.mode === 'GST_PST') {
      const gstRate = config.gstRate || 500n;
      const gstAmount = roundHalfUp(taxableAmountMinor * gstRate, 10000n);
      const pstAmount = totalTaxAmountMinor - gstAmount;
      components = [
        { code: 'GST', name: 'Federal GST', rateBasisPoints: gstRate, amountMinor: gstAmount },
        { code: 'PST', name: 'Provincial PST', rateBasisPoints: totalRateBasisPoints - gstRate, amountMinor: pstAmount, jurisdiction: provinceCode },
      ];
    } else if (config?.mode === 'HST') {
      components = [
        { code: 'HST', name: 'Harmonized Sales Tax', rateBasisPoints: totalRateBasisPoints, amountMinor: totalTaxAmountMinor, jurisdiction: provinceCode },
      ];
    } else {
      components = [
        { code: 'GST', name: 'Federal GST', rateBasisPoints: totalRateBasisPoints, amountMinor: totalTaxAmountMinor },
      ];
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: config ? `CA_${config.mode}` : 'CA_GST_DEFAULT',
      placeOfSupply: provinceCode || 'CA',
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components,
      totalTaxRateBasisPoints: totalRateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * GENERIC GLOBAL FALLBACK PACK
 */
export class GenericCountryPack implements CountryPack {
  readonly metadata: CountryPackMetadata;

  constructor(countryCode: string = 'GENERIC', currency: string = 'USD') {
    this.metadata = {
      packId: `${countryCode.toUpperCase()}_STANDARD`,
      countryCode: countryCode.toUpperCase(),
      name: `${countryCode.toUpperCase()} Standard Tax`,
      version: '2026.01',
      taxSystem: 'Standard Tax',
      defaultCurrency: currency,
      capabilities: ['inclusive_exclusive', 'flat_override'],
      defaultRateBasisPoints: 0n,
    };
  }

  resolveItemTax(context: TaxContext): TaxDecision {
    const { item, taxType } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'GENERIC_ZERO',
        placeOfSupply: this.metadata.countryCode,
        supplyType: 'intra_state',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: [],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'GENERIC_PERCENTAGE',
      placeOfSupply: this.metadata.countryCode,
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components: [
        {
          code: 'TAX',
          name: 'Tax',
          rateBasisPoints,
          amountMinor: totalTaxAmountMinor,
        },
      ],
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * AUSTRALIA GST PACK (AU)
 * Standard 10% Goods and Services Tax (GST) under A New Tax System (GST) Act 1999.
 */
export class AustraliaGstPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'AU_GST',
    countryCode: 'AU',
    name: 'Australia Goods and Services Tax',
    version: '2026.01',
    taxSystem: 'GST',
    defaultCurrency: 'AUD',
    capabilities: ['place_of_supply', 'inclusive_exclusive', 'flat_override'],
    defaultRateBasisPoints: 1000n, // 10% Standard GST
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { item, taxType, customer } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    const placeOfSupply = customer?.subdivisionCode || customer?.countryIso2 || 'AU';

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'AU_GST_FREE',
        placeOfSupply,
        supplyType: 'exempt',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: ['GST-Free Supply under Division 38 of GST Act 1999'],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'AU_GST_STANDARD',
      placeOfSupply,
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components: [
        {
          code: 'GST',
          name: 'Goods and Services Tax',
          rateBasisPoints,
          amountMinor: totalTaxAmountMinor,
          jurisdiction: placeOfSupply,
        },
      ],
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * UNITED ARAB EMIRATES VAT PACK (AE)
 * Standard 5% Value Added Tax under Federal Decree-Law No. (8) of 2017.
 */
export class UaeVatPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'AE_VAT',
    countryCode: 'AE',
    name: 'United Arab Emirates Value Added Tax',
    version: '2026.01',
    taxSystem: 'VAT',
    defaultCurrency: 'AED',
    capabilities: ['place_of_supply', 'inclusive_exclusive', 'flat_override'],
    defaultRateBasisPoints: 500n, // 5% Standard VAT
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { item, taxType, customer } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    const placeOfSupply = customer?.subdivisionCode || customer?.countryIso2 || 'AE';

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'AE_VAT_ZERO',
        placeOfSupply,
        supplyType: 'exempt',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: ['Zero-rated or Designated Free Zone Supply under Article 45/51'],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'AE_VAT_STANDARD',
      placeOfSupply,
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components: [
        {
          code: 'VAT',
          name: 'Value Added Tax (ضريبة القيمة المضافة)',
          rateBasisPoints,
          amountMinor: totalTaxAmountMinor,
          jurisdiction: placeOfSupply,
        },
      ],
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * GERMANY / EU VAT PACK (DE)
 * Standard 19% Mehrwertsteuer (MwSt) under § 12 UStG & EU VAT Directive 2006/112/EC.
 */
export class GermanyVatPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'DE_VAT',
    countryCode: 'DE',
    name: 'Germany Value Added Tax (MwSt / USt)',
    version: '2026.01',
    taxSystem: 'MwSt',
    defaultCurrency: 'EUR',
    capabilities: ['place_of_supply', 'inclusive_exclusive', 'flat_override'],
    defaultRateBasisPoints: 1900n, // 19% Standard MwSt
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { item, taxType, customer } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    const placeOfSupply = customer?.subdivisionCode || customer?.countryIso2 || 'DE';

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'DE_UST_STEUERFREI',
        placeOfSupply,
        supplyType: 'exempt',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: ['Steuerfreie Lieferung (§ 4 UStG) oder Umkehrung der Steuerschuldnerschaft (Reverse Charge)'],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'DE_UST_STANDARD',
      placeOfSupply,
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components: [
        {
          code: 'MWST',
          name: 'Mehrwertsteuer (Umsatzsteuer)',
          rateBasisPoints,
          amountMinor: totalTaxAmountMinor,
          jurisdiction: placeOfSupply,
        },
      ],
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

/**
 * SINGAPORE GST PACK (SG)
 * Standard 9% Goods and Services Tax under IRAS GST Act 1993.
 */
export class SingaporeGstPack implements CountryPack {
  readonly metadata: CountryPackMetadata = {
    packId: 'SG_GST',
    countryCode: 'SG',
    name: 'Singapore Goods and Services Tax',
    version: '2026.01',
    taxSystem: 'GST',
    defaultCurrency: 'SGD',
    capabilities: ['place_of_supply', 'inclusive_exclusive', 'flat_override'],
    defaultRateBasisPoints: 900n, // 9% Standard GST (effective 2024+)
  };

  resolveItemTax(context: TaxContext): TaxDecision {
    const { item, taxType } = context;
    const rateBasisPoints = item.taxRateBasisPoints ?? this.metadata.defaultRateBasisPoints;

    const rawQty = item.quantityScaled > 0n ? item.quantityScaled : 10000n;
    const rawLine = roundHalfUp(item.unitPriceMinor * rawQty, 10000n);
    const disc = item.discountMinor && item.discountMinor > 0n ? item.discountMinor : 0n;
    const lineNet = rawLine > disc ? rawLine - disc : 0n;

    if (taxType === 'none' || rateBasisPoints <= 0n) {
      return {
        packId: this.metadata.packId,
        packVersion: this.metadata.version,
        ruleId: 'SG_GST_ZERO',
        placeOfSupply: 'SG',
        supplyType: 'exempt',
        reverseCharge: false,
        taxType,
        components: [],
        totalTaxRateBasisPoints: 0n,
        taxableAmountMinor: lineNet,
        totalTaxAmountMinor: 0n,
        grossAmountMinor: lineNet,
        roundingAdjustmentMinor: 0n,
        notes: ['Zero-rated international supply or exempt financial service'],
      };
    }

    let taxableAmountMinor = 0n;
    let totalTaxAmountMinor = 0n;
    let grossAmountMinor = 0n;

    if (taxType === 'exclusive') {
      taxableAmountMinor = lineNet;
      totalTaxAmountMinor = roundHalfUp(taxableAmountMinor * rateBasisPoints, 10000n);
      grossAmountMinor = taxableAmountMinor + totalTaxAmountMinor;
    } else {
      grossAmountMinor = lineNet;
      const denom = 10000n + rateBasisPoints;
      taxableAmountMinor = roundHalfUp(grossAmountMinor * 10000n, denom);
      totalTaxAmountMinor = grossAmountMinor - taxableAmountMinor;
    }

    return {
      packId: this.metadata.packId,
      packVersion: this.metadata.version,
      ruleId: 'SG_GST_STANDARD',
      placeOfSupply: 'SG',
      supplyType: 'intra_state',
      reverseCharge: false,
      taxType,
      components: [
        {
          code: 'GST',
          name: 'Goods and Services Tax',
          rateBasisPoints,
          amountMinor: totalTaxAmountMinor,
          jurisdiction: 'SG',
        },
      ],
      totalTaxRateBasisPoints: rateBasisPoints,
      taxableAmountMinor,
      totalTaxAmountMinor,
      grossAmountMinor,
      roundingAdjustmentMinor: 0n,
      notes: [],
    };
  }
}

