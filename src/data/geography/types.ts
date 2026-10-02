/**
 * GEOGRAPHY & REGIONAL REFERENCE DATA TYPES
 * Standards-compliant ISO 3166-1 alpha-2/alpha-3, E.164 calling codes,
 * and ISO 3166-2 country subdivisions.
 */

export type SubdivisionType =
  | 'State'
  | 'Union Territory'
  | 'Province'
  | 'Territory'
  | 'Emirate'
  | 'County'
  | 'Region'
  | 'Prefecture'
  | 'Canton'
  | 'Department'
  | 'District'
  | 'Governorate'
  | 'Country';

export interface CountryMetadata {
  iso2: string; // ISO 3166-1 alpha-2, e.g. "IN", "US", "GB"
  iso3: string; // ISO 3166-1 alpha-3, e.g. "IND", "USA", "GBR"
  name: string; // Common English display name
  callingCode: string; // E.164 prefix, e.g. "+91", "+1", "+44"
  currencyCode: string; // ISO 4217, e.g. "INR", "USD", "GBP"
  currencySymbol: string; // Display symbol, e.g. "₹", "$", "£"
  defaultLocale: string; // BCP 47 locale, e.g. "en-IN", "en-US"
  subdivisionType: SubdivisionType; // Local designation for subdivisions
  taxSystemName?: string; // e.g. "GST", "Sales Tax", "VAT"
  active: boolean;
  metadataVersion: string;
}

export interface SubdivisionMetadata {
  code: string; // ISO 3166-2 code, e.g. "IN-DL", "US-CA", "CA-ON"
  countryIso2: string; // References CountryMetadata.iso2
  name: string; // Common name of state/province/territory
  type: SubdivisionType;
  parentCode?: string | null;
  active: boolean;
  metadataVersion: string;
}

export interface NormalizedPhoneResult {
  isValid: boolean;
  e164: string; // Canonical E.164, e.g. "+919876543210"
  nationalFormatted: string; // Human-friendly, e.g. "98765 43210"
  countryIso2: string;
  callingCode: string;
  error?: string;
}
