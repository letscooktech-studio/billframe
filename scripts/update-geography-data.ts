/**
 * GEOGRAPHY DATASET VALIDATION & UPDATE SCRIPT
 * Validates integrity of offline countries and subdivisions datasets:
 * - Checks ISO 3166-1 alpha-2 / alpha-3 uniqueness
 * - Asserts no orphan subdivisions exist
 * - Asserts all active countries have valid flag representations
 * - Checks calling codes and ISO-4217 currencies
 */

import { COUNTRIES, GEOGRAPHY_DATASET_VERSION } from '../src/data/geography/countries';
import { SUBDIVISIONS } from '../src/data/geography/subdivisions';
import { isValidCountryFlag, getCountryFlagEmoji } from '../src/data/geography/flags';
import { normalizePhoneNumber } from '../src/data/geography/phone';

export function validateGeographyDataset(): {
  isValid: boolean;
  version: string;
  countryCount: number;
  subdivisionCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  const iso2Set = new Set<string>();
  const iso3Set = new Set<string>();

  // 1. Validate Countries
  for (const c of COUNTRIES) {
    if (!c.iso2 || c.iso2.length !== 2) {
      errors.push(`Country ${c.name} has invalid ISO2 code: "${c.iso2}"`);
    }
    if (iso2Set.has(c.iso2)) {
      errors.push(`Duplicate ISO2 code found: "${c.iso2}"`);
    }
    iso2Set.add(c.iso2);

    if (!c.iso3 || c.iso3.length !== 3) {
      errors.push(`Country ${c.name} has invalid ISO3 code: "${c.iso3}"`);
    }
    if (iso3Set.has(c.iso3)) {
      errors.push(`Duplicate ISO3 code found: "${c.iso3}"`);
    }
    iso3Set.add(c.iso3);

    if (!isValidCountryFlag(c.iso2)) {
      errors.push(`Country ${c.name} (${c.iso2}) does not have a valid flag`);
    }

    const emoji = getCountryFlagEmoji(c.iso2);
    if (!emoji || emoji === '🌐') {
      errors.push(`Country ${c.name} (${c.iso2}) produced fallback flag emoji`);
    }

    if (!c.callingCode || !c.callingCode.startsWith('+')) {
      errors.push(`Country ${c.name} (${c.iso2}) has invalid calling code: "${c.callingCode}"`);
    }

    if (!c.currencyCode || c.currencyCode.length !== 3) {
      errors.push(`Country ${c.name} (${c.iso2}) has invalid currency code: "${c.currencyCode}"`);
    }
  }

  // 2. Validate Subdivisions
  const subCodeSet = new Set<string>();
  for (const sub of SUBDIVISIONS) {
    if (!sub.code) {
      errors.push(`Subdivision has missing code`);
    }
    if (subCodeSet.has(sub.code)) {
      errors.push(`Duplicate subdivision code: "${sub.code}"`);
    }
    subCodeSet.add(sub.code);

    if (!iso2Set.has(sub.countryIso2)) {
      errors.push(`Orphan subdivision found: ${sub.name} (${sub.code}) references unknown country "${sub.countryIso2}"`);
    }

    if (!sub.name || !sub.name.trim()) {
      errors.push(`Subdivision ${sub.code} has empty name`);
    }
  }

  return {
    isValid: errors.length === 0,
    version: GEOGRAPHY_DATASET_VERSION,
    countryCount: COUNTRIES.length,
    subdivisionCount: SUBDIVISIONS.length,
    errors,
  };
}

if (typeof require !== 'undefined' && require.main === module) {
  const result = validateGeographyDataset();
  console.log('Geography Dataset Validation:');
  console.log(`Version: ${result.version}`);
  console.log(`Countries: ${result.countryCount}`);
  console.log(`Subdivisions: ${result.subdivisionCount}`);
  if (result.isValid) {
    console.log('✓ All integrity constraints passed successfully with 0 errors.');
  } else {
    console.error('✗ Validation errors detected:');
    result.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
}
