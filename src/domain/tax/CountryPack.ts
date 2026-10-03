/**
 * COUNTRY PACK INTERFACE
 * Standard contract implemented by all country-specific tax rules engines.
 */

import {
  CountryPackMetadata,
  HsnSacEntry,
  TaxContext,
  TaxDecision,
} from './TaxTypes';

export interface CountryPack {
  readonly metadata: CountryPackMetadata;

  /**
   * Evaluates tax rules deterministically for a single line item within context.
   */
  resolveItemTax(context: TaxContext): TaxDecision;

  /**
   * Returns standard classification codes for this country, if supported.
   */
  getHsnSacCatalog?(): readonly HsnSacEntry[];

  /**
   * Search classification codes by query.
   */
  searchHsnSac?(query: string): readonly HsnSacEntry[];
}
