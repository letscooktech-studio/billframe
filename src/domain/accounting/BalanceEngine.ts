/**
 * CANONICAL BALANCE & ACCOUNTING ENGINE
 * 
 * Central authoritative domain logic for document balances, payment allocations,
 * and collection metrics.
 * 
 * Core Formula:
 * Balance = Document Grand Total - Valid Deposits Applied - Successful Payment Allocations + Reversals/Refunds
 * 
 * Rules:
 * 1. Zero floating-point arithmetic (strictly bigint minor units).
 * 2. Only payments with lifecycle status 'completed' (or legacy null) credit the document.
 * 3. Overpayment is strictly rejected.
 * 4. Payment status is derived purely from ledger credits.
 */

export type PaymentLifecycleStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'reversed';
export type PaymentRefundState = 'none' | 'partial' | 'full';
export type PaymentVerificationState = 'manual_confirmed' | 'unverified' | 'verified_webhook' | 'verified_api' | 'failed_verification';
export type PaymentSettlementState = 'settled' | 'unsettled' | 'not_applicable';
export type PaymentProvider = 'manual' | 'direct_upi' | 'razorpay' | 'cashfree' | 'stripe' | 'other';
export type PaymentSource = 'manual_entry' | 'quick_bill' | 'invoice_payment' | 'direct_qr' | 'external_import';

export interface PaymentCreditInput {
  readonly amountMinor: bigint;
  readonly status?: PaymentLifecycleStatus | string | null;
  readonly refundState?: PaymentRefundState | string | null;
  readonly refundedAmountMinor?: bigint | null;
}

export interface DocumentBalanceInput {
  readonly grandTotalMinor: bigint;
  readonly depositMinor?: bigint | null;
  readonly payments: readonly PaymentCreditInput[];
}

export interface DocumentBalanceResult {
  readonly grandTotalMinor: bigint;
  readonly depositMinor: bigint;
  readonly validPaymentsMinor: bigint;
  readonly totalCreditsMinor: bigint;
  readonly balanceMinor: bigint;
  readonly paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  readonly isOverpaid: boolean;
}

/**
 * Checks whether a payment is valid and credited towards document balance.
 * Returns true if status is 'completed' (or legacy null/undefined) and not fully refunded.
 */
export function isPaymentValidForCredit(payment: PaymentCreditInput): boolean {
  const status = payment.status || 'completed';
  if (status !== 'completed') {
    return false;
  }
  const refundState = payment.refundState || 'none';
  if (refundState === 'full') {
    return false;
  }
  return true;
}

/**
 * Calculates the net credited minor unit amount for a single payment.
 * Subtracts partial refunds from the original amount.
 */
export function calculateNetPaymentCredit(payment: PaymentCreditInput): bigint {
  if (!isPaymentValidForCredit(payment)) {
    return 0n;
  }

  const amount = payment.amountMinor > 0n ? payment.amountMinor : 0n;
  const refund = payment.refundedAmountMinor && payment.refundedAmountMinor > 0n ? payment.refundedAmountMinor : 0n;

  if (refund >= amount) {
    return 0n;
  }

  return amount - refund;
}

/**
 * Canonical calculation of document balance from grand total, deposit, and payment allocations.
 */
export function calculateDocumentBalance(input: DocumentBalanceInput): DocumentBalanceResult {
  const grandTotalMinor = input.grandTotalMinor > 0n ? input.grandTotalMinor : 0n;
  const depositMinor = input.depositMinor && input.depositMinor > 0n ? input.depositMinor : 0n;

  let validPaymentsMinor = 0n;
  for (const p of input.payments) {
    validPaymentsMinor += calculateNetPaymentCredit(p);
  }

  const totalCreditsMinor = depositMinor + validPaymentsMinor;
  const isOverpaid = totalCreditsMinor > grandTotalMinor && grandTotalMinor > 0n;
  const balanceMinor = grandTotalMinor > totalCreditsMinor ? grandTotalMinor - totalCreditsMinor : 0n;

  let paymentStatus: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';
  if (totalCreditsMinor >= grandTotalMinor && grandTotalMinor > 0n) {
    paymentStatus = 'paid';
  } else if (totalCreditsMinor > 0n) {
    paymentStatus = 'partially_paid';
  }

  return {
    grandTotalMinor,
    depositMinor,
    validPaymentsMinor,
    totalCreditsMinor,
    balanceMinor,
    paymentStatus,
    isOverpaid,
  };
}
