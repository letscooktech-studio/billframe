/**
 * CARD TYPES & DEFINITIONS
 * Authoritative ISO/IEC 7812 card definitions, schemes, and validation structures.
 */

export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'rupay'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'maestro'
  | 'unknown';

export type CardType = 'credit' | 'debit' | 'prepaid' | 'commercial' | 'unknown';

export interface CardBinDetails {
  readonly brand: CardBrand;
  readonly brandName: string;
  readonly cardType: CardType;
  readonly issuerName: string;
  readonly country: string;
  readonly tier?: string;
}

export interface CardValidationResult {
  readonly rawInput: string;
  readonly sanitizedNumber: string;
  readonly formattedNumber: string;
  readonly brand: CardBrand;
  readonly brandName: string;
  readonly cardType: CardType;
  readonly issuerName: string;
  readonly country: string;
  readonly tier?: string;
  readonly isValidLuhn: boolean;
  readonly isCompleteLength: boolean;
  readonly isValidOverall: boolean;
  readonly expectedLengths: readonly number[];
  readonly cvvLength: number;
  readonly last4: string;
  readonly maskedNumber: string;
  readonly errorMessage?: string;
}

export interface CardExpiryValidationResult {
  readonly isValid: boolean;
  readonly month?: number;
  readonly year?: number;
  readonly isExpired: boolean;
  readonly errorMessage?: string;
}
