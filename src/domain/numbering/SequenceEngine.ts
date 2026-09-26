/**
 * DOCUMENT NUMBERING ENGINE
 * Monotonic formatting and sequence formatting scoped to business profiles.
 */

export interface NumberSequenceConfig {
  readonly prefix: string;
  readonly nextSequenceNumber: number;
  readonly suffix: string;
  readonly padding: number;
}

export const DEFAULT_SEQUENCE_CONFIGS: Record<string, Omit<NumberSequenceConfig, 'nextSequenceNumber'>> = {
  invoice: {
    prefix: 'INV-',
    suffix: '',
    padding: 4,
  },
  estimate: {
    prefix: 'EST-',
    suffix: '',
    padding: 4,
  },
  receipt: {
    prefix: 'RCP-',
    suffix: '',
    padding: 4,
  },
};

/**
 * Formats a sequence number into a standard business document identifier (e.g. "INV-0001").
 */
export function formatDocumentNumber(
  prefix: string,
  sequenceNumber: number,
  padding: number = 4,
  suffix: string = ''
): string {
  const padded = sequenceNumber.toString().padStart(padding, '0');
  return `${prefix}${padded}${suffix}`;
}

/**
 * Validates whether a prefix string is valid (letters, numbers, hyphens).
 */
export function isValidPrefix(prefix: string): boolean {
  return /^[A-Za-z0-9_-]{1,10}$/.test(prefix);
}
