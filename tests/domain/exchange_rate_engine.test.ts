/**
 * EXCHANGE RATE ENGINE TEST SUITE
 * Validates deterministic integer cross-rate math, 0-decimal exponent scaling (JPY),
 * European Central Bank (ECB) reference rate provenance, and zero-float-drift invariants.
 */

import {
  ExchangeRateEngine,
  FX_RATE_SCALE,
  OFFICIAL_ECB_REFERENCE_RATES,
} from '../../src/domain/money/ExchangeRateEngine';
import { createMoney, formatMoney } from '../../src/domain/money/Money';

describe('ExchangeRateEngine — ECB SDMX Reference Infrastructure', () => {
  describe('1. Reference Table Integrity', () => {
    it('contains official reference rates for major trading currencies', () => {
      expect(ExchangeRateEngine.hasRate('EUR')).toBe(true);
      expect(ExchangeRateEngine.hasRate('USD')).toBe(true);
      expect(ExchangeRateEngine.hasRate('INR')).toBe(true);
      expect(ExchangeRateEngine.hasRate('GBP')).toBe(true);
      expect(ExchangeRateEngine.hasRate('JPY')).toBe(true);
      expect(ExchangeRateEngine.hasRate('CAD')).toBe(true);
      expect(ExchangeRateEngine.hasRate('AUD')).toBe(true);
      expect(ExchangeRateEngine.hasRate('SGD')).toBe(true);
      expect(ExchangeRateEngine.hasRate('AED')).toBe(true);
    });

    it('returns exact 1:1 scale factor for identity conversion', () => {
      const rateUsd = ExchangeRateEngine.getCrossRateScaled('USD', 'USD');
      expect(rateUsd).toBe(FX_RATE_SCALE);

      const rateInr = ExchangeRateEngine.getCrossRateScaled('INR', 'INR');
      expect(rateInr).toBe(FX_RATE_SCALE);
    });
  });

  describe('2. Decimal-Safe Cross Rate Mathematics', () => {
    it('computes triangular cross-rate for USD to INR via EUR anchor', () => {
      // 1 EUR = 1.085 USD, 1 EUR = 90.25 INR
      // 1 USD = 90.25 / 1.085 = 83.17972350... INR
      const crossRate = ExchangeRateEngine.getCrossRateScaled('USD', 'INR');
      const whole = crossRate / FX_RATE_SCALE;
      expect(whole).toBe(83n);

      const result = ExchangeRateEngine.convert(createMoney(10_000n, 'USD'), 'INR'); // $100.00
      // 100 USD * 83.1797... = 8317.97 INR -> 831797 minor units
      expect(result.targetMoney.currency).toBe('INR');
      expect(result.targetMoney.amountMinor).toBe(831797n);
      expect(result.provenanceLabel).toContain('ECB Official Reference Rate');
      expect(result.effectiveDate).toBe('2026-03-31');
    });

    it('computes triangular cross-rate for EUR to USD directly', () => {
      // 100 EUR to USD: 1 EUR = 1.085 USD -> 100 EUR = 108.50 USD (10850 minor units)
      const eurMoney = createMoney(10_000n, 'EUR');
      const result = ExchangeRateEngine.convert(eurMoney, 'USD');
      expect(result.targetMoney.amountMinor).toBe(10_850n);
      expect(result.crossRateDisplay).toBe('1 EUR = 1.0850 USD');
    });

    it('handles zero-decimal currencies like Japanese Yen (JPY) with exact exponent scaling', () => {
      // 100 USD (10,000 minor units, exponent 2) to JPY (exponent 0)
      // 1 EUR = 1.085 USD, 1 EUR = 164.50 JPY
      // 1 USD = 164.50 / 1.085 = ~151.6129 JPY
      // 100 USD = 15,161 JPY (no minor units)
      const usdMoney = createMoney(10_000n, 'USD');
      const result = ExchangeRateEngine.convert(usdMoney, 'JPY');
      expect(result.targetMoney.currency).toBe('JPY');
      expect(result.targetMoney.amountMinor).toBe(15_161n);
    });

    it('reverses conversion symmetrically from JPY to USD', () => {
      // 15,161 JPY (exponent 0) to USD (exponent 2)
      // 15,161 / 151.6129 = ~100.00 USD (10,000 minor units)
      const jpyMoney = createMoney(15_161n, 'JPY');
      const result = ExchangeRateEngine.convert(jpyMoney, 'USD');
      expect(result.targetMoney.currency).toBe('USD');
      expect(result.targetMoney.amountMinor).toBe(10_000n);
    });
  });

  describe('3. Provenance and Transparency Guarantees', () => {
    it('strictly tags all conversion results with verifiable provenance labels', () => {
      const gbpMoney = createMoney(5_000n, 'GBP');
      const result = ExchangeRateEngine.convert(gbpMoney, 'EUR');
      expect(result.provenanceLabel).toBe('ECB Official Reference Rate (2026-03-31)');
      expect(result.crossRateDisplay).toContain('1 GBP =');
    });

    it('throws descriptive error on unknown currency without reference rate', () => {
      const money = createMoney(1_000n, 'XYZ');
      expect(() => ExchangeRateEngine.convert(money, 'USD')).toThrow(
        'No official reference rate for currency: XYZ'
      );
    });
  });

  describe('4. Real-Time Live Market Exchange Rate Feeds & Offline Fallback', () => {
    beforeEach(() => {
      ExchangeRateEngine.resetToOfficialReferenceRates();
    });

    afterEach(() => {
      ExchangeRateEngine.resetToOfficialReferenceRates();
      jest.restoreAllMocks();
    });

    it('indicates default state uses bundled reference rates', () => {
      expect(ExchangeRateEngine.isUsingLiveRates()).toBe(false);
    });

    it('applies live market rates with exact scaling and updates provenance', () => {
      // Feed live market rates (e.g. 1 EUR = 1.125175 USD, 1 EUR = 108.378991 INR)
      ExchangeRateEngine.applyLiveRates(
        {
          USD: 1.125175,
          INR: 108.378991,
          GBP: 0.850777,
        },
        '2026-10-03'
      );

      expect(ExchangeRateEngine.isUsingLiveRates()).toBe(true);

      // Check live USD to INR cross-rate calculation:
      // 108.378991 / 1.125175 = ~96.3218 INR per USD
      const result = ExchangeRateEngine.convert(createMoney(2300n, 'USD'), 'INR'); // $23.00 USD
      expect(result.targetMoney.currency).toBe('INR');
      // At ~96.3218 INR/USD, $23.00 USD converts to ₹2,215.40 INR (221540 minor units)
      expect(result.targetMoney.amountMinor).toBe(221540n);
      expect(result.provenanceLabel).toBe('Live Market Rate (2026-10-03)');
      expect(result.crossRateDisplay).toBe('1 USD = 96.3218 INR');
    });

    it('fetches live rates via mocked network API and updates engine', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: 'success',
          time_last_update_utc: 'Sat, 03 Oct 2026 00:00:00 +0000',
          rates: {
            USD: 1.125,
            INR: 108.0,
          },
        }),
      });
      (global as any).fetch = mockFetch;

      const success = await ExchangeRateEngine.fetchLiveRatesAsync(true);
      expect(success).toBe(true);
      expect(ExchangeRateEngine.isUsingLiveRates()).toBe(true);

      // 108.0 / 1.125 = 96.0000 INR per USD
      const conv = ExchangeRateEngine.convert(createMoney(1000n, 'USD'), 'INR'); // $10.00 USD
      expect(conv.targetMoney.amountMinor).toBe(96000n); // ₹960.00 INR
      expect(conv.crossRateDisplay).toBe('1 USD = 96.0000 INR');
    });

    it('gracefully falls back to bundled reference rates when network fails', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      (global as any).fetch = mockFetch;

      const success = await ExchangeRateEngine.fetchLiveRatesAsync(true);
      expect(success).toBe(false);
      expect(ExchangeRateEngine.isUsingLiveRates()).toBe(false);

      // Offline rate is used without throwing
      const conv = ExchangeRateEngine.convert(createMoney(10000n, 'USD'), 'INR');
      expect(conv.targetMoney.amountMinor).toBe(831797n);
      expect(conv.provenanceLabel).toContain('ECB Official Reference Rate');
    });

    it('resets cleanly back to official reference rates', () => {
      ExchangeRateEngine.applyLiveRates({ USD: 2.0, INR: 200.0 }, '2026-10-03');
      expect(ExchangeRateEngine.isUsingLiveRates()).toBe(true);

      ExchangeRateEngine.resetToOfficialReferenceRates();
      expect(ExchangeRateEngine.isUsingLiveRates()).toBe(false);

      const conv = ExchangeRateEngine.convert(createMoney(10000n, 'USD'), 'INR');
      expect(conv.targetMoney.amountMinor).toBe(831797n);
    });
  });
});
