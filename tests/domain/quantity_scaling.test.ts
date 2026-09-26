/**
 * QUANTITY SCALING UNIT TESTS
 * Tests exact decimal scaling (4 decimal places: 10,000 scale factor),
 * locale-tolerant decimal separator normalization, and string rendering.
 */

import {
  parseQuantityStringToScaled,
  quantityScaledToString,
} from '../../src/domain/documents/quantity';

describe('Quantity Scaling & Parsing', () => {
  describe('parseQuantityStringToScaled', () => {
    it('parses integer strings to scaled BigInt', () => {
      expect(parseQuantityStringToScaled('1')).toBe(10_000n);
      expect(parseQuantityStringToScaled('5')).toBe(50_000n);
      expect(parseQuantityStringToScaled('100')).toBe(1_000_000n);
    });

    it('parses decimal strings with dot', () => {
      expect(parseQuantityStringToScaled('1.5')).toBe(15_000n);
      expect(parseQuantityStringToScaled('0.25')).toBe(2_500n);
      expect(parseQuantityStringToScaled('0.0001')).toBe(1n);
      expect(parseQuantityStringToScaled('12.3456')).toBe(123_456n);
    });

    it('parses decimal strings with European comma separator', () => {
      expect(parseQuantityStringToScaled('1,5')).toBe(15_000n);
      expect(parseQuantityStringToScaled('0,75')).toBe(7_500n);
      expect(parseQuantityStringToScaled('10,0005')).toBe(100_005n);
    });

    it('truncates beyond 4 decimal places without crashing', () => {
      expect(parseQuantityStringToScaled('1.123499')).toBe(11_234n);
    });

    it('falls back safely to 1.0000 (10000n) on empty or invalid input', () => {
      expect(parseQuantityStringToScaled('')).toBe(10_000n);
      expect(parseQuantityStringToScaled('   ')).toBe(10_000n);
      expect(parseQuantityStringToScaled('invalid')).toBe(10_000n);
      expect(parseQuantityStringToScaled('12.34.56')).toBe(10_000n);
    });
  });

  describe('quantityScaledToString', () => {
    it('formats exact integers cleanly without trailing zeros or decimal points', () => {
      expect(quantityScaledToString(10_000n)).toBe('1');
      expect(quantityScaledToString(50_000n)).toBe('5');
      expect(quantityScaledToString(0n)).toBe('0');
    });

    it('formats fractional values stripping unnecessary trailing zeros', () => {
      expect(quantityScaledToString(15_000n)).toBe('1.5');
      expect(quantityScaledToString(2_500n)).toBe('0.25');
      expect(quantityScaledToString(125n)).toBe('0.0125');
      expect(quantityScaledToString(1n)).toBe('0.0001');
    });
  });
});
