/**
 * COUNTRY PACK REGISTRY
 * Singleton repository of certified offline country tax packs.
 * Resolves the appropriate tax rules engine deterministically by ISO 3166-1 alpha-2 code.
 */

import { CountryPack } from './CountryPack';
import { IndiaGstPack } from './packs/IndiaGstPack';
import {
  AustraliaGstPack,
  CanadaGstHstPack,
  GenericCountryPack,
  GermanyVatPack,
  SingaporeGstPack,
  UaeVatPack,
  UkVatPack,
  UsSalesTaxPack,
} from './packs/GlobalCountryPacks';

export class CountryPackRegistry {
  private static readonly packs: Map<string, CountryPack> = new Map();

  static {
    // Register built-in packs
    const indiaPack = new IndiaGstPack();
    const usPack = new UsSalesTaxPack();
    const ukPack = new UkVatPack();
    const caPack = new CanadaGstHstPack();
    const auPack = new AustraliaGstPack();
    const aePack = new UaeVatPack();
    const dePack = new GermanyVatPack();
    const sgPack = new SingaporeGstPack();

    this.packs.set('IN', indiaPack);
    this.packs.set('US', usPack);
    this.packs.set('GB', ukPack);
    this.packs.set('UK', ukPack);
    this.packs.set('CA', caPack);
    this.packs.set('AU', auPack);
    this.packs.set('AE', aePack);
    this.packs.set('DE', dePack);
    this.packs.set('SG', sgPack);
  }

  /**
   * Registers or replaces a country pack in the registry.
   */
  static registerPack(pack: CountryPack): void {
    this.packs.set(pack.metadata.countryCode.toUpperCase(), pack);
  }

  /**
   * Resolves the country pack for a country code. Returns GenericCountryPack if not explicitly defined.
   */
  static getPack(countryIso2?: string | null, fallbackCurrency: string = 'USD'): CountryPack {
    if (!countryIso2) {
      return new GenericCountryPack('GENERIC', fallbackCurrency);
    }
    const clean = countryIso2.trim().toUpperCase();
    const found = this.packs.get(clean);
    if (found) {
      return found;
    }
    return new GenericCountryPack(clean, fallbackCurrency);
  }

  /**
   * Returns all pre-registered certified packs.
   */
  static getAllRegisteredPacks(): CountryPack[] {
    return Array.from(this.packs.values());
  }
}
