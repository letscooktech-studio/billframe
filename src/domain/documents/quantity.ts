/**
 * QUANTITY SCALING & CONVERSION ENGINE
 * Exact decimal scaling (4 decimal places: 10,000 scale factor).
 * Pure domain logic with zero React Native UI dependencies.
 */

export function parseQuantityStringToScaled(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) return 10_000n; // 1.0000
  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return 10_000n;
  }
  const parts = normalized.split('.');
  const whole = BigInt(parts[0]);
  const fractionStr = (parts[1] || '').padEnd(4, '0').slice(0, 4);
  return whole * 10_000n + BigInt(fractionStr);
}

export function quantityScaledToString(scaled: bigint): string {
  const whole = scaled / 10_000n;
  const fraction = scaled % 10_000n;
  if (fraction === 0n) return whole.toString();
  const fracStr = fraction.toString().padStart(4, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}
