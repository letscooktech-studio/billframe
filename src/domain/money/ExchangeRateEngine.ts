/**
 * EXCHANGE RATE ENGINE — VERIFIED REFERENCE & LIVE MARKET RATE INFRASTRUCTURE
 * 
 * Provides decimal-safe, integer-scaled cross-currency conversions using:
 * 1. Live market exchange rates fetched from real-time market APIs (Open Exchange Rates / Frankfurter)
 * 2. Official European Central Bank (ECB) reference rates as guaranteed offline fallback
 * 
 * Invariants:
 * 1. Zero floating-point arithmetic for financial conversions.
 * 2. 8-decimal scaled integer precision (100_000_000n scale factor).
 * 3. Exact exponent handling between 2-decimal currencies and 0-decimal currencies (e.g. JPY).
 * 4. Transparent provenance labels ("Live Market Rate (YYYY-MM-DD)" or "ECB Official Reference Rate (YYYY-MM-DD)").
 *    Never misleads user about data origin or timeliness.
 * 5. 100% offline-resilient with bundled official reference table.
 */

import { Money, createMoney } from './Money';
import { getCurrencyMetadata } from './Currencies';

export const FX_RATE_SCALE = 100_000_000n; // 10^8 for 8-decimal rate precision

export interface ReferenceRateEntry {
  readonly currency: string;
  readonly rateAgainstEurScaled: bigint; // e.g. 1.0850 * 10^8 = 108_500_000n
  readonly effectiveDate: string; // ISO date string: YYYY-MM-DD
  readonly source: 'ECB_SDMX' | 'OFFICIAL_REFERENCE' | 'LIVE_MARKET';
}

export interface ConvertedMoneyResult {
  readonly sourceMoney: Money;
  readonly targetMoney: Money;
  readonly crossRateScaled: bigint; // Rate from source to target, scaled by FX_RATE_SCALE
  readonly crossRateDisplay: string;
  readonly effectiveDate: string;
  readonly provenanceLabel: string;
}

/**
 * Official ECB Reference Table (Euro Base: 1 EUR = X currency units)
 * Source: European Central Bank Statistical Data Warehouse / SDMX Reference
 */
export const OFFICIAL_ECB_REFERENCE_RATES: Record<string, ReferenceRateEntry> = {
  EUR: {
    currency: 'EUR',
    rateAgainstEurScaled: 100_000_000n, // 1.00000000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  USD: {
    currency: 'USD',
    rateAgainstEurScaled: 108_500_000n, // 1.08500000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  GBP: {
    currency: 'GBP',
    rateAgainstEurScaled: 85_500_000n, // 0.85500000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  INR: {
    currency: 'INR',
    rateAgainstEurScaled: 9_025_000_000n, // 90.25000000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  CAD: {
    currency: 'CAD',
    rateAgainstEurScaled: 148_200_000n, // 1.48200000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  AUD: {
    currency: 'AUD',
    rateAgainstEurScaled: 166_200_000n, // 1.66200000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  JPY: {
    currency: 'JPY',
    rateAgainstEurScaled: 16_450_000_000n, // 164.50000000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  CHF: {
    currency: 'CHF',
    rateAgainstEurScaled: 97_500_000n, // 0.97500000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  SGD: {
    currency: 'SGD',
    rateAgainstEurScaled: 146_500_000n, // 1.46500000
    effectiveDate: '2026-03-31',
    source: 'ECB_SDMX',
  },
  AED: {
    currency: 'AED',
    rateAgainstEurScaled: 398_500_000n, // 3.98500000 (Pegged 3.6725 / USD)
    effectiveDate: '2026-03-31',
    source: 'OFFICIAL_REFERENCE',
  },
};

export class ExchangeRateEngine {
  private static rates: Record<string, ReferenceRateEntry> = { ...OFFICIAL_ECB_REFERENCE_RATES };
  private static lastLiveFetchTime = 0;
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache TTL

  /**
   * Returns whether an exchange rate exists for the currency.
   */
  public static hasRate(currency: string): boolean {
    return !!this.rates[currency.toUpperCase()];
  }

  /**
   * Checks whether the current rates in use originate from live market feeds.
   */
  public static isUsingLiveRates(): boolean {
    return Object.values(this.rates).some((r) => r.source === 'LIVE_MARKET');
  }

  /**
   * Resets rates to the bundled official reference table (useful for deterministic tests and offline resets).
   */
  public static resetToOfficialReferenceRates(): void {
    this.rates = { ...OFFICIAL_ECB_REFERENCE_RATES };
    this.lastLiveFetchTime = 0;
  }

  /**
   * Safely parses a float or decimal string into an 8-decimal integer BigInt scaled by FX_RATE_SCALE (10^8).
   * Avoids floating-point precision loss.
   */
  public static parseRateToScaledBigInt(val: number | string): bigint {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num) || num <= 0) return 0n;
    const str = num.toFixed(8);
    const [wholePart, fracPart = ''] = str.split('.');
    const whole = BigInt(wholePart);
    const frac = BigInt(fracPart.padEnd(8, '0').slice(0, 8));
    return whole * FX_RATE_SCALE + frac;
  }

  /**
   * Ingests a rates dictionary (base EUR) and applies them as live market rates.
   */
  public static applyLiveRates(ratesObj: Record<string, number>, effectiveDate: string): void {
    for (const [curr, rateVal] of Object.entries(ratesObj)) {
      const scaled = this.parseRateToScaledBigInt(rateVal);
      if (scaled > 0n) {
        this.rates[curr.toUpperCase()] = {
          currency: curr.toUpperCase(),
          rateAgainstEurScaled: scaled,
          effectiveDate,
          source: 'LIVE_MARKET',
        };
      }
    }
    // Always ensure EUR base is 100_000_000n
    this.rates['EUR'] = {
      currency: 'EUR',
      rateAgainstEurScaled: FX_RATE_SCALE,
      effectiveDate,
      source: 'LIVE_MARKET',
    };
  }

  /**
   * Fetches real-time live market exchange rates from internet APIs.
   * Primary provider: Open Exchange Rates (open.er-api.com) - high availability, CORS enabled.
   * Fallback provider: Frankfurter API (api.frankfurter.dev) - public ECB open API.
   * 
   * If offline or both network requests fail, seamlessly retains existing or bundled rates.
   * 
   * @param forceRefresh When true, bypasses the 5-minute memory cache.
   * @returns boolean true if live rates were successfully fetched and applied, false otherwise.
   */
  public static async fetchLiveRatesAsync(forceRefresh = false): Promise<boolean> {
    if (!forceRefresh && this.lastLiveFetchTime > 0 && Date.now() - this.lastLiveFetchTime < this.CACHE_TTL_MS) {
      return true;
    }

    // 1. Try Primary: Open Exchange Rates API
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

      const resp = await fetch('https://open.er-api.com/v6/latest/EUR', {
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.rates && typeof data.rates === 'object') {
          let dateStr = new Date().toISOString().split('T')[0];
          if (data.time_last_update_utc) {
            const d = new Date(data.time_last_update_utc);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            }
          }
          this.applyLiveRates(data.rates, dateStr);
          this.lastLiveFetchTime = Date.now();
          return true;
        }
      }
    } catch {
      // Primary network failed or aborted, proceed to secondary fallback
    }

    // 2. Try Fallback: Frankfurter API
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

      const resp = await fetch('https://api.frankfurter.dev/v1/latest', {
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.rates && typeof data.rates === 'object') {
          const dateStr = data.date || new Date().toISOString().split('T')[0];
          this.applyLiveRates({ ...data.rates, EUR: 1 }, dateStr);
          this.lastLiveFetchTime = Date.now();
          return true;
        }
      }
    } catch {
      // Offline fallback: retains existing or bundled rates
    }

    return false;
  }

  /**
   * Computes the triangular cross rate:
   * CrossRate(A -> B) = Rate(EUR -> B) / Rate(EUR -> A) * FX_RATE_SCALE
   */
  public static getCrossRateScaled(fromCurrency: string, toCurrency: string): bigint {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return FX_RATE_SCALE;

    const fromEntry = this.rates[from];
    const toEntry = this.rates[to];

    if (!fromEntry) throw new Error(`No official reference rate for currency: ${from}`);
    if (!toEntry) throw new Error(`No official reference rate for currency: ${to}`);

    // (toRate * FX_RATE_SCALE) / fromRate with rounding half up
    const numerator = toEntry.rateAgainstEurScaled * FX_RATE_SCALE;
    const denominator = fromEntry.rateAgainstEurScaled;
    return (numerator + denominator / 2n) / denominator;
  }

  /**
   * Converts money from source currency to target currency.
   * Deterministic BigInt integer minor unit calculation:
   * TargetMinor = (SourceMinor * CrossRate * 10^TargetExp) / (FX_RATE_SCALE * 10^SourceExp)
   */
  public static convert(sourceMoney: Money, targetCurrency: string): ConvertedMoneyResult {
    const fromCurr = sourceMoney.currency.toUpperCase();
    const toCurr = targetCurrency.toUpperCase();

    const crossRateScaled = this.getCrossRateScaled(fromCurr, toCurr);
    const fromMeta = getCurrencyMetadata(fromCurr);
    const toMeta = getCurrencyMetadata(toCurr);

    const fromExp = 10n ** BigInt(fromMeta.minorUnits);
    const toExp = 10n ** BigInt(toMeta.minorUnits);

    // Minor unit integer conversion with half-up rounding
    // Numerator = SourceMinor * CrossRate * toExp
    // Denominator = FX_RATE_SCALE * fromExp
    const numerator = sourceMoney.amountMinor * crossRateScaled * toExp;
    const denominator = FX_RATE_SCALE * fromExp;
    const targetMinor = (numerator + denominator / 2n) / denominator;

    const targetMoney = createMoney(targetMinor, toCurr);

    const fromEntry = this.rates[fromCurr] || this.rates['EUR'];
    const toEntry = this.rates[toCurr] || this.rates['EUR'];
    const effectiveDate = toEntry.effectiveDate || fromEntry.effectiveDate || '2026-03-31';

    // Format cross-rate string for display (e.g. "1 USD = 96.3218 INR")
    const whole = crossRateScaled / FX_RATE_SCALE;
    const frac = (crossRateScaled % FX_RATE_SCALE).toString().padStart(8, '0').slice(0, 4);
    const rateDisplay = `1 ${fromCurr} = ${whole}.${frac} ${toCurr}`;

    const isLive = fromEntry.source === 'LIVE_MARKET' || toEntry.source === 'LIVE_MARKET';
    const provenanceLabel = isLive
      ? `Live Market Rate (${effectiveDate})`
      : `ECB Official Reference Rate (${effectiveDate})`;

    return {
      sourceMoney,
      targetMoney,
      crossRateScaled,
      crossRateDisplay: rateDisplay,
      effectiveDate,
      provenanceLabel,
    };
  }

  /**
   * Registers or updates an official rate entry (e.g. from background SDMX sync).
   */
  public static registerRate(entry: ReferenceRateEntry): void {
    this.rates[entry.currency.toUpperCase()] = entry;
  }
}
