/**
 * COMPREHENSIVE OFFLINE SUBDIVISIONS REFERENCE DATASET
 * Version: 2026.01
 * Standards: ISO 3166-2 & Unicode CLDR
 * 
 * Normalized country subdivisions (States, Provinces, Territories, Emirates, etc.)
 */

import { SubdivisionMetadata } from './types';
import { GEOGRAPHY_DATASET_VERSION } from './countries';

export const SUBDIVISIONS: SubdivisionMetadata[] = [
  // ── INDIA (28 States + 8 Union Territories) ──
  { code: 'IN-AP', countryIso2: 'IN', name: 'Andhra Pradesh', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-AR', countryIso2: 'IN', name: 'Arunachal Pradesh', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-AS', countryIso2: 'IN', name: 'Assam', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-BR', countryIso2: 'IN', name: 'Bihar', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-CT', countryIso2: 'IN', name: 'Chhattisgarh', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-GA', countryIso2: 'IN', name: 'Goa', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-GJ', countryIso2: 'IN', name: 'Gujarat', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-HR', countryIso2: 'IN', name: 'Haryana', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-HP', countryIso2: 'IN', name: 'Himachal Pradesh', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-JH', countryIso2: 'IN', name: 'Jharkhand', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-KA', countryIso2: 'IN', name: 'Karnataka', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-KL', countryIso2: 'IN', name: 'Kerala', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-MP', countryIso2: 'IN', name: 'Madhya Pradesh', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-MH', countryIso2: 'IN', name: 'Maharashtra', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-MN', countryIso2: 'IN', name: 'Manipur', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-ML', countryIso2: 'IN', name: 'Meghalaya', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-MZ', countryIso2: 'IN', name: 'Mizoram', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-NL', countryIso2: 'IN', name: 'Nagaland', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-OD', countryIso2: 'IN', name: 'Odisha', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-PB', countryIso2: 'IN', name: 'Punjab', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-RJ', countryIso2: 'IN', name: 'Rajasthan', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-SK', countryIso2: 'IN', name: 'Sikkim', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-TN', countryIso2: 'IN', name: 'Tamil Nadu', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-TG', countryIso2: 'IN', name: 'Telangana', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-TR', countryIso2: 'IN', name: 'Tripura', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-UP', countryIso2: 'IN', name: 'Uttar Pradesh', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-UT', countryIso2: 'IN', name: 'Uttarakhand', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-WB', countryIso2: 'IN', name: 'West Bengal', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-AN', countryIso2: 'IN', name: 'Andaman and Nicobar Islands', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-CH', countryIso2: 'IN', name: 'Chandigarh', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-DH', countryIso2: 'IN', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-DL', countryIso2: 'IN', name: 'Delhi', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-JK', countryIso2: 'IN', name: 'Jammu and Kashmir', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-LA', countryIso2: 'IN', name: 'Ladakh', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-LD', countryIso2: 'IN', name: 'Lakshadweep', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'IN-PY', countryIso2: 'IN', name: 'Puducherry', type: 'Union Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },

  // ── UNITED STATES (50 States + DC + Territories) ──
  { code: 'US-AL', countryIso2: 'US', name: 'Alabama', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-AK', countryIso2: 'US', name: 'Alaska', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-AZ', countryIso2: 'US', name: 'Arizona', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-AR', countryIso2: 'US', name: 'Arkansas', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-CA', countryIso2: 'US', name: 'California', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-CO', countryIso2: 'US', name: 'Colorado', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-CT', countryIso2: 'US', name: 'Connecticut', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-DE', countryIso2: 'US', name: 'Delaware', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-FL', countryIso2: 'US', name: 'Florida', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-GA', countryIso2: 'US', name: 'Georgia', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-HI', countryIso2: 'US', name: 'Hawaii', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-ID', countryIso2: 'US', name: 'Idaho', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-IL', countryIso2: 'US', name: 'Illinois', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-IN', countryIso2: 'US', name: 'Indiana', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-IA', countryIso2: 'US', name: 'Iowa', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-KS', countryIso2: 'US', name: 'Kansas', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-KY', countryIso2: 'US', name: 'Kentucky', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-LA', countryIso2: 'US', name: 'Louisiana', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-ME', countryIso2: 'US', name: 'Maine', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MD', countryIso2: 'US', name: 'Maryland', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MA', countryIso2: 'US', name: 'Massachusetts', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MI', countryIso2: 'US', name: 'Michigan', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MN', countryIso2: 'US', name: 'Minnesota', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MS', countryIso2: 'US', name: 'Mississippi', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MO', countryIso2: 'US', name: 'Missouri', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-MT', countryIso2: 'US', name: 'Montana', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NE', countryIso2: 'US', name: 'Nebraska', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NV', countryIso2: 'US', name: 'Nevada', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NH', countryIso2: 'US', name: 'New Hampshire', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NJ', countryIso2: 'US', name: 'New Jersey', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NM', countryIso2: 'US', name: 'New Mexico', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NY', countryIso2: 'US', name: 'New York', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-NC', countryIso2: 'US', name: 'North Carolina', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-ND', countryIso2: 'US', name: 'North Dakota', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-OH', countryIso2: 'US', name: 'Ohio', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-OK', countryIso2: 'US', name: 'Oklahoma', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-OR', countryIso2: 'US', name: 'Oregon', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-PA', countryIso2: 'US', name: 'Pennsylvania', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-RI', countryIso2: 'US', name: 'Rhode Island', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-SC', countryIso2: 'US', name: 'South Carolina', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-SD', countryIso2: 'US', name: 'South Dakota', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-TN', countryIso2: 'US', name: 'Tennessee', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-TX', countryIso2: 'US', name: 'Texas', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-UT', countryIso2: 'US', name: 'Utah', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-VT', countryIso2: 'US', name: 'Vermont', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-VA', countryIso2: 'US', name: 'Virginia', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-WA', countryIso2: 'US', name: 'Washington', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-WV', countryIso2: 'US', name: 'West Virginia', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-WI', countryIso2: 'US', name: 'Wisconsin', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-WY', countryIso2: 'US', name: 'Wyoming', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-DC', countryIso2: 'US', name: 'District of Columbia', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'US-PR', countryIso2: 'US', name: 'Puerto Rico', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },

  // ── CANADA (10 Provinces + 3 Territories) ──
  { code: 'CA-AB', countryIso2: 'CA', name: 'Alberta', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-BC', countryIso2: 'CA', name: 'British Columbia', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-MB', countryIso2: 'CA', name: 'Manitoba', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-NB', countryIso2: 'CA', name: 'New Brunswick', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-NL', countryIso2: 'CA', name: 'Newfoundland and Labrador', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-NS', countryIso2: 'CA', name: 'Nova Scotia', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-ON', countryIso2: 'CA', name: 'Ontario', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-PE', countryIso2: 'CA', name: 'Prince Edward Island', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-QC', countryIso2: 'CA', name: 'Quebec', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-SK', countryIso2: 'CA', name: 'Saskatchewan', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-NT', countryIso2: 'CA', name: 'Northwest Territories', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-NU', countryIso2: 'CA', name: 'Nunavut', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'CA-YT', countryIso2: 'CA', name: 'Yukon', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },

  // ── UNITED KINGDOM ──
  { code: 'GB-ENG', countryIso2: 'GB', name: 'England', type: 'Country', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'GB-SCT', countryIso2: 'GB', name: 'Scotland', type: 'Country', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'GB-WLS', countryIso2: 'GB', name: 'Wales', type: 'Country', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'GB-NIR', countryIso2: 'GB', name: 'Northern Ireland', type: 'Province', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },

  // ── AUSTRALIA (6 States + 2 Territories) ──
  { code: 'AU-NSW', countryIso2: 'AU', name: 'New South Wales', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-VIC', countryIso2: 'AU', name: 'Victoria', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-QLD', countryIso2: 'AU', name: 'Queensland', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-WA', countryIso2: 'AU', name: 'Western Australia', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-SA', countryIso2: 'AU', name: 'South Australia', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-TAS', countryIso2: 'AU', name: 'Tasmania', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-ACT', countryIso2: 'AU', name: 'Australian Capital Territory', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AU-NT', countryIso2: 'AU', name: 'Northern Territory', type: 'Territory', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },

  // ── UNITED ARAB EMIRATES (7 Emirates) ──
  { code: 'AE-AZ', countryIso2: 'AE', name: 'Abu Dhabi', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AE-DU', countryIso2: 'AE', name: 'Dubai', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AE-SH', countryIso2: 'AE', name: 'Sharjah', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AE-AJ', countryIso2: 'AE', name: 'Ajman', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AE-UM', countryIso2: 'AE', name: 'Umm Al Quwain', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AE-RK', countryIso2: 'AE', name: 'Ras Al Khaimah', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'AE-FU', countryIso2: 'AE', name: 'Fujairah', type: 'Emirate', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },

  // ── GERMANY (16 Federal States) ──
  { code: 'DE-BW', countryIso2: 'DE', name: 'Baden-Württemberg', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-BY', countryIso2: 'DE', name: 'Bavaria (Bayern)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-BE', countryIso2: 'DE', name: 'Berlin', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-BB', countryIso2: 'DE', name: 'Brandenburg', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-HB', countryIso2: 'DE', name: 'Bremen', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-HH', countryIso2: 'DE', name: 'Hamburg', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-HE', countryIso2: 'DE', name: 'Hesse (Hessen)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-MV', countryIso2: 'DE', name: 'Mecklenburg-Vorpommern', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-NI', countryIso2: 'DE', name: 'Lower Saxony (Niedersachsen)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-NW', countryIso2: 'DE', name: 'North Rhine-Westphalia (Nordrhein-Westfalen)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-RP', countryIso2: 'DE', name: 'Rhineland-Palatinate (Rheinland-Pfalz)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-SL', countryIso2: 'DE', name: 'Saarland', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-SN', countryIso2: 'DE', name: 'Saxony (Sachsen)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-ST', countryIso2: 'DE', name: 'Saxony-Anhalt (Sachsen-Anhalt)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-SH', countryIso2: 'DE', name: 'Schleswig-Holstein', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
  { code: 'DE-TH', countryIso2: 'DE', name: 'Thuringia (Thüringen)', type: 'State', active: true, metadataVersion: GEOGRAPHY_DATASET_VERSION },
];

export class SubdivisionService {
  /**
   * Retrieves active subdivisions for a given country ISO-2.
   */
  public static getSubdivisionsForCountry(countryIso2: string): SubdivisionMetadata[] {
    if (!countryIso2) return [];
    const clean = countryIso2.trim().toUpperCase();
    return SUBDIVISIONS.filter((s) => s.countryIso2 === clean && s.active);
  }

  /**
   * Searches subdivisions within a specific country.
   */
  public static searchSubdivisions(countryIso2: string, query: string): SubdivisionMetadata[] {
    const list = this.getSubdivisionsForCountry(countryIso2);
    const clean = (query || '').trim().toLowerCase();
    if (!clean) return list;

    return list.filter((s) => {
      if (s.name.toLowerCase().includes(clean)) return true;
      if (s.code.toLowerCase().includes(clean)) return true;
      return false;
    });
  }

  public static getSubdivisionByCode(code: string): SubdivisionMetadata | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    return SUBDIVISIONS.find((s) => s.code === clean);
  }
}
