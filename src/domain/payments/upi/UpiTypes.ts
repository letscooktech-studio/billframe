/**
 * DIRECT UPI DOMAIN TYPES & SPECIFICATION CONTRACTS
 * Strict zero-fee peer-to-merchant UPI payments specifications (NPCI UPI standard).
 */

export interface UpiPayload {
  readonly vpa: string; // Virtual Payment Address (e.g. merchant@bank)
  readonly payeeName: string; // Business or merchant legal name
  readonly amountMinor?: bigint; // Minor units (e.g. paise: 10000n = ₹100.00). If omitted, generates open-amount static QR
  readonly currency: 'INR';
  readonly transactionNote?: string; // e.g. "Invoice INV-0001"
  readonly transactionRef?: string; // Unique document ID or invoice number
  readonly merchantCategoryCode?: string; // Optional MCC code
}

export interface UpiValidationResult {
  readonly isValid: boolean;
  readonly normalizedVpa?: string;
  readonly error?: string;
}

export interface UpiPaymentConfirmationInput {
  readonly invoiceId: string;
  readonly amountMinor: bigint;
  readonly utrReference?: string | null; // Bank 12-digit UTR
  readonly notes?: string | null;
  readonly paymentDate?: number;
}

export interface UpiConversionResult {
  readonly upiUri: string;
  readonly inrAmountMinor?: bigint;
  readonly isConverted: boolean;
  readonly conversionSummary?: string;
  readonly exchangeRateLabel?: string;
}
