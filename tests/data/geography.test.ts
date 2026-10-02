/**
 * GEOGRAPHY & PHONE REGRESSION SUITE
 * Validates integrity of offline countries, subdivisions, flags, and phone normalization.
 */

import { COUNTRIES, GeographyService } from '../../src/data/geography/countries';
import { SUBDIVISIONS, SubdivisionService } from '../../src/data/geography/subdivisions';
import { isValidCountryFlag, getCountryFlagEmoji } from '../../src/data/geography/flags';
import { normalizePhoneNumber, formatPhoneDisplay } from '../../src/data/geography/phone';

describe('Geography & Regional Reference Data Integrity', () => {
  test('all countries have unique ISO-2 and ISO-3 codes', () => {
    const iso2Set = new Set<string>();
    const iso3Set = new Set<string>();

    for (const country of COUNTRIES) {
      expect(country.iso2).toHaveLength(2);
      expect(iso2Set.has(country.iso2)).toBe(false);
      iso2Set.add(country.iso2);

      expect(country.iso3).toHaveLength(3);
      expect(iso3Set.has(country.iso3)).toBe(false);
      iso3Set.add(country.iso3);

      expect(country.name.trim().length).toBeGreaterThan(0);
      expect(country.callingCode.startsWith('+')).toBe(true);
      expect(country.currencyCode).toHaveLength(3);
    }
  });

  test('every active country produces a valid vector/emoji flag', () => {
    for (const country of COUNTRIES) {
      expect(isValidCountryFlag(country.iso2)).toBe(true);
      const emoji = getCountryFlagEmoji(country.iso2);
      expect(emoji).toBeTruthy();
      expect(emoji).not.toBe('🌐');
    }
  });

  test('no orphan subdivisions exist; all reference valid active countries', () => {
    const validIso2 = new Set(COUNTRIES.map((c) => c.iso2));
    const subCodes = new Set<string>();

    for (const sub of SUBDIVISIONS) {
      expect(sub.code.trim().length).toBeGreaterThan(0);
      expect(subCodes.has(sub.code)).toBe(false);
      subCodes.add(sub.code);

      expect(validIso2.has(sub.countryIso2)).toBe(true);
      expect(sub.name.trim().length).toBeGreaterThan(0);
      expect(sub.type).toBeTruthy();
    }
  });

  test('subdivisions filter correctly by country', () => {
    const indiaSubs = SubdivisionService.getSubdivisionsForCountry('IN');
    expect(indiaSubs.length).toBe(36); // 28 states + 8 UTs

    const usSubs = SubdivisionService.getSubdivisionsForCountry('US');
    expect(usSubs.length).toBeGreaterThanOrEqual(51); // 50 states + DC + territories

    const caSubs = SubdivisionService.getSubdivisionsForCountry('CA');
    expect(caSubs.length).toBe(13); // 10 provinces + 3 territories

    const ukSubs = SubdivisionService.getSubdivisionsForCountry('GB');
    expect(ukSubs.length).toBe(4);

    const aeSubs = SubdivisionService.getSubdivisionsForCountry('AE');
    expect(aeSubs.length).toBe(7); // 7 emirates
  });

  test('searchSubdivisions finds matching subdivisions case-insensitively', () => {
    const results = SubdivisionService.searchSubdivisions('IN', 'delhi');
    expect(results.length).toBe(1);
    expect(results[0].code).toBe('IN-DL');

    const mhResults = SubdivisionService.searchSubdivisions('IN', 'maharashtra');
    expect(mhResults.length).toBe(1);
    expect(mhResults[0].code).toBe('IN-MH');
  });

  test('GeographyService searches countries accurately by name, iso, or calling code', () => {
    expect(GeographyService.searchCountries('India')[0].iso2).toBe('IN');
    expect(GeographyService.searchCountries('91')[0].iso2).toBe('IN');
    expect(GeographyService.searchCountries('United States')[0].iso2).toBe('US');
    expect(GeographyService.searchCountries('CAN')[0].iso2).toBe('CA');
  });
});

describe('Phone Normalization & Libphonenumber Semantics', () => {
  test('normalizes India (+91) phone numbers to canonical E.164', () => {
    const res = normalizePhoneNumber('9876543210', 'IN');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+919876543210');
    expect(res.callingCode).toBe('+91');
    expect(res.countryIso2).toBe('IN');
  });

  test('normalizes UK (+44) phone numbers', () => {
    const res = normalizePhoneNumber('07911 123456', 'GB');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+447911123456');
    expect(res.callingCode).toBe('+44');
  });

  test('normalizes UAE (+971) phone numbers', () => {
    const res = normalizePhoneNumber('50 123 4567', 'AE');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+971501234567');
    expect(res.callingCode).toBe('+971');
  });

  test('normalizes Australia (+61) phone numbers', () => {
    const res = normalizePhoneNumber('0412 345 678', 'AU');
    expect(res.isValid).toBe(true);
    expect(res.e164).toBe('+61412345678');
    expect(res.callingCode).toBe('+61');
  });

  test('normalizes US (+1) and Canada (+1) with distinct ISO2', () => {
    const usRes = normalizePhoneNumber('415-555-2671', 'US');
    expect(usRes.isValid).toBe(true);
    expect(usRes.e164).toBe('+14155552671');
    expect(usRes.countryIso2).toBe('US');

    const caRes = normalizePhoneNumber('416-555-0199', 'CA');
    expect(caRes.isValid).toBe(true);
    expect(caRes.e164).toBe('+14165550199');
    expect(caRes.countryIso2).toBe('CA');
  });

  test('normalizes Caribbean NANP region (+1-876 Jamaica)', () => {
    const jmRes = normalizePhoneNumber('+18765551234', 'JM');
    expect(jmRes.callingCode).toBe('+1');
    expect(jmRes.countryIso2).toBe('JM');
    expect(jmRes.e164).toBe('+18765551234');
    expect(jmRes.isValid).toBe(true);
  });

  test('handles invalid, too short, and too long phone inputs gracefully', () => {
    const shortRes = normalizePhoneNumber('123', 'IN');
    expect(shortRes.isValid).toBe(false);
    expect(shortRes.error).toBeDefined();

    const longRes = normalizePhoneNumber('123456789012345678', 'IN');
    expect(longRes.isValid).toBe(false);
    expect(longRes.error).toBeDefined();

    const emptyRes = normalizePhoneNumber('', 'IN');
    expect(emptyRes.isValid).toBe(false);
  });
});
