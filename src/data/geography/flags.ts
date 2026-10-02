/**
 * DETERMINISTIC LOCAL VECTOR/EMOJI FLAG RESOLVER
 * Converts ISO 3166-1 alpha-2 codes into Unicode Regional Indicator Sequences.
 * 
 * In Android (API 24 to 36), the system Noto Color Emoji font renders these
 * at native vector fidelity with zero raster PNG bloat and zero network requests.
 */

export function getCountryFlagEmoji(iso2: string): string {
  if (!iso2 || typeof iso2 !== 'string' || iso2.trim().length !== 2) {
    return '🌐';
  }
  const clean = iso2.trim().toUpperCase();
  // Regional indicator symbol letter A is U+1F1E6 (127397 + ASCII)
  const codePoints = clean
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

/**
 * Validates that an ISO 3166-1 alpha-2 code yields a valid 2-symbol indicator.
 */
export function isValidCountryFlag(iso2: string): boolean {
  if (!iso2 || typeof iso2 !== 'string' || iso2.trim().length !== 2) {
    return false;
  }
  const clean = iso2.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(clean);
}
