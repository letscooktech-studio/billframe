/**
 * TAX DOMAIN TYPES & CONTRACTS
 * Comprehensive, offline-first tax contracts supporting multi-component taxes,
 * place-of-supply resolution, HSN/SAC catalogs, and historical audit snapshots.
 */

import { Money } from '../money/Money';

export type TaxType = 'none' | 'exclusive' | 'inclusive';

export type SupplyType =
  | 'intra_state'
  | 'inter_state'
  | 'export'
  | 'exempt'
  | 'nil_rated'
  | 'non_taxable';

export type TaxCapability =
  | 'multi_component'
  | 'place_of_supply'
  | 'hsn_sac'
  | 'reverse_charge'
  | 'inclusive_exclusive'
  | 'compound'
  | 'flat_override';

export interface TaxComponent {
  readonly code: string; // e.g. 'CGST', 'SGST', 'UTGST', 'IGST', 'VAT', 'STATE_TAX'
  readonly name: string; // e.g. 'Central GST', 'State GST', 'Integrated GST'
  readonly rateBasisPoints: bigint; // e.g. 900n for 9.00%
  readonly amountMinor: bigint; // Minor units (e.g. paise/cents)
  readonly jurisdiction?: string; // State or subdivision code (e.g. 'IN-KA')
}

export interface TaxDecision {
  readonly packId: string; // e.g. 'IN_GST', 'US_SALES_TAX', 'GB_VAT'
  readonly packVersion: string; // e.g. '2026.01'
  readonly ruleId: string; // e.g. 'IN_GST_INTRA_STATE_STANDARD', 'IN_GST_INTER_STATE'
  readonly placeOfSupply: string; // Subdivision or country code
  readonly supplyType: SupplyType;
  readonly reverseCharge: boolean;
  readonly taxType: TaxType;
  readonly components: readonly TaxComponent[];
  readonly totalTaxRateBasisPoints: bigint;
  readonly taxableAmountMinor: bigint;
  readonly totalTaxAmountMinor: bigint;
  readonly grossAmountMinor: bigint;
  readonly roundingAdjustmentMinor: bigint;
  readonly notes: readonly string[];
}

export interface TaxProfileContext {
  readonly countryIso2: string;
  readonly subdivisionCode?: string | null; // e.g. 'IN-KA' or 'KA'
  readonly taxId?: string | null; // e.g. GSTIN
  readonly isTaxRegistered?: boolean;
}

export interface CustomerTaxContext {
  readonly countryIso2?: string | null;
  readonly subdivisionCode?: string | null;
  readonly taxId?: string | null;
  readonly isBusiness?: boolean;
}

export interface ItemTaxContext {
  readonly id?: string;
  readonly catalogItemId?: string | null;
  readonly hsnSacCode?: string | null;
  readonly itemType?: 'goods' | 'service';
  readonly unitPriceMinor: bigint;
  readonly quantityScaled: bigint; // scaled by 10_000n
  readonly discountMinor?: bigint;
  readonly taxRateBasisPoints?: bigint; // explicit override if any
}

export interface TaxContext {
  readonly businessProfile: TaxProfileContext;
  readonly customer?: CustomerTaxContext | null;
  readonly item: ItemTaxContext;
  readonly taxType: TaxType;
  readonly documentDate?: number;
}

export interface HsnSacEntry {
  readonly code: string;
  readonly type: 'hsn' | 'sac';
  readonly description: string;
  readonly category: string;
  readonly defaultRateBasisPoints: bigint;
  readonly cessRateBasisPoints?: bigint; // e.g. 1200n for 12% compensation cess
}

export interface CountryPackMetadata {
  readonly packId: string;
  readonly countryCode: string; // ISO 3166-1 alpha-2
  readonly name: string;
  readonly version: string;
  readonly taxSystem: string;
  readonly defaultCurrency: string;
  readonly capabilities: readonly TaxCapability[];
  readonly defaultRateBasisPoints: bigint;
}

export interface TaxComponentSummary {
  readonly code: string;
  readonly name: string;
  readonly rateBasisPoints: bigint;
  readonly totalAmountMinor: bigint;
  readonly jurisdiction?: string;
}

export interface TaxRateBreakdown {
  readonly rateBasisPoints: bigint;
  readonly taxableBaseMinor: bigint;
  readonly taxAmountMinor: bigint;
  readonly components: readonly TaxComponentSummary[];
}

export interface DocumentTaxSummary {
  readonly packId: string;
  readonly packVersion: string;
  readonly placeOfSupply: string;
  readonly supplyType: SupplyType;
  readonly reverseCharge: boolean;
  readonly totalTaxableBaseMinor: bigint;
  readonly totalTaxMinor: bigint;
  readonly totalGrossMinor: bigint;
  readonly components: readonly TaxComponentSummary[];
  readonly rateBreakdowns: readonly TaxRateBreakdown[];
}
