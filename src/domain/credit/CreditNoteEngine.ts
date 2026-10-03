/**
 * CREDIT NOTE ENGINE
 * Generates and validates immutable credit notes linked to original issued invoices,
 * calculates tax reversals, and adjusts outstanding customer balances.
 */

import { roundHalfUp } from '../money/Money';

export type CreditNoteStatus = 'issued' | 'applied' | 'refunded' | 'void';

export interface CreateCreditNoteInput {
  businessProfileId: string;
  customerId: string;
  originalInvoiceId: string;
  creditNoteNumber: string;
  reason: string;
  creditAmountMinor: bigint;
  taxAmountMinor?: bigint;
  currency: string;
  issueDate?: number;
}

export interface CreditNoteCalculationResult {
  creditAmountMinor: bigint;
  taxAmountMinor: bigint;
  totalCreditMinor: bigint;
  netInvoiceBalanceMinor: bigint;
}

export class CreditNoteEngine {
  /**
   * Calculates net remaining invoice balance after applying a credit note.
   */
  static calculateCreditEffect(
    invoiceTotalMinor: bigint,
    totalPaidMinor: bigint,
    creditAmountMinor: bigint
  ): CreditNoteCalculationResult {
    if (creditAmountMinor <= 0n) {
      throw new Error('Credit note amount must be greater than zero.');
    }

    const currentOutstanding = invoiceTotalMinor > totalPaidMinor ? invoiceTotalMinor - totalPaidMinor : 0n;
    const netBalance = currentOutstanding > creditAmountMinor ? currentOutstanding - creditAmountMinor : 0n;

    return {
      creditAmountMinor,
      taxAmountMinor: 0n,
      totalCreditMinor: creditAmountMinor,
      netInvoiceBalanceMinor: netBalance,
    };
  }

  /**
   * Validates if a credit note can be issued against an invoice.
   */
  static validateCreditIssuance(
    invoiceStatus: string,
    invoiceTotalMinor: bigint,
    alreadyCreditedMinor: bigint,
    requestedCreditMinor: bigint
  ): { isValid: boolean; error?: string } {
    if (invoiceStatus === 'draft' || invoiceStatus === 'void') {
      return { isValid: false, error: 'Cannot issue credit notes against draft or void invoices.' };
    }

    if (requestedCreditMinor <= 0n) {
      return { isValid: false, error: 'Credit amount must be greater than zero.' };
    }

    const maxCreditable = invoiceTotalMinor > alreadyCreditedMinor ? invoiceTotalMinor - alreadyCreditedMinor : 0n;
    if (requestedCreditMinor > maxCreditable) {
      return {
        isValid: false,
        error: `Credit note exceeds remaining invoice total. Maximum creditable: ${maxCreditable}.`,
      };
    }

    return { isValid: true };
  }
}
