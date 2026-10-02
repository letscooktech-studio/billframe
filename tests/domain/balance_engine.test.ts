/**
 * BALANCE ENGINE GOLDEN TESTS
 * Tests canonical document balance, deposit deduction, payment allocation,
 * refund handling, and lifecycle status derivation.
 */

import {
  calculateDocumentBalance,
  calculateNetPaymentCredit,
  isPaymentValidForCredit,
} from '../../src/domain/accounting/BalanceEngine';

describe('BalanceEngine Domain Tests', () => {
  describe('isPaymentValidForCredit', () => {
    it('treats completed payments as valid for credit', () => {
      expect(isPaymentValidForCredit({ amountMinor: 1000n, status: 'completed' })).toBe(true);
    });

    it('treats legacy null status as valid completed payment', () => {
      expect(isPaymentValidForCredit({ amountMinor: 1000n, status: null })).toBe(true);
    });

    it('treats pending, failed, refunded, and reversed payments as invalid for credit', () => {
      expect(isPaymentValidForCredit({ amountMinor: 1000n, status: 'pending' })).toBe(false);
      expect(isPaymentValidForCredit({ amountMinor: 1000n, status: 'failed' })).toBe(false);
      expect(isPaymentValidForCredit({ amountMinor: 1000n, status: 'refunded' })).toBe(false);
      expect(isPaymentValidForCredit({ amountMinor: 1000n, status: 'reversed' })).toBe(false);
    });

    it('treats fully refunded payments as invalid for credit', () => {
      expect(
        isPaymentValidForCredit({
          amountMinor: 1000n,
          status: 'completed',
          refundState: 'full',
        })
      ).toBe(false);
    });
  });

  describe('calculateNetPaymentCredit', () => {
    it('returns full amount for completed unrefunded payment', () => {
      const credit = calculateNetPaymentCredit({
        amountMinor: 5000n,
        status: 'completed',
        refundState: 'none',
      });
      expect(credit).toBe(5000n);
    });

    it('returns reduced amount for partially refunded payment', () => {
      const credit = calculateNetPaymentCredit({
        amountMinor: 5000n,
        status: 'completed',
        refundState: 'partial',
        refundedAmountMinor: 1500n,
      });
      expect(credit).toBe(3500n);
    });

    it('returns 0n for fully refunded payment', () => {
      const credit = calculateNetPaymentCredit({
        amountMinor: 5000n,
        status: 'completed',
        refundState: 'full',
        refundedAmountMinor: 5000n,
      });
      expect(credit).toBe(0n);
    });

    it('returns 0n if refunded amount exceeds original amount', () => {
      const credit = calculateNetPaymentCredit({
        amountMinor: 5000n,
        status: 'completed',
        refundState: 'partial',
        refundedAmountMinor: 6000n,
      });
      expect(credit).toBe(0n);
    });
  });

  describe('calculateDocumentBalance', () => {
    it('computes balance correctly with zero payments and zero deposit', () => {
      const result = calculateDocumentBalance({
        grandTotalMinor: 10000n,
        depositMinor: 0n,
        payments: [],
      });

      expect(result.grandTotalMinor).toBe(10000n);
      expect(result.depositMinor).toBe(0n);
      expect(result.validPaymentsMinor).toBe(0n);
      expect(result.totalCreditsMinor).toBe(0n);
      expect(result.balanceMinor).toBe(10000n);
      expect(result.paymentStatus).toBe('unpaid');
      expect(result.isOverpaid).toBe(false);
    });

    it('subtracts deposits from balance before payments', () => {
      const result = calculateDocumentBalance({
        grandTotalMinor: 10000n,
        depositMinor: 3000n,
        payments: [],
      });

      expect(result.depositMinor).toBe(3000n);
      expect(result.totalCreditsMinor).toBe(3000n);
      expect(result.balanceMinor).toBe(7000n);
      expect(result.paymentStatus).toBe('partially_paid');
    });

    it('subtracts both deposits and valid completed payments', () => {
      const result = calculateDocumentBalance({
        grandTotalMinor: 10000n,
        depositMinor: 3000n,
        payments: [
          { amountMinor: 2000n, status: 'completed' },
          { amountMinor: 5000n, status: 'completed' },
        ],
      });

      expect(result.validPaymentsMinor).toBe(7000n);
      expect(result.totalCreditsMinor).toBe(10000n);
      expect(result.balanceMinor).toBe(0n);
      expect(result.paymentStatus).toBe('paid');
    });

    it('ignores pending or failed payments when computing balance', () => {
      const result = calculateDocumentBalance({
        grandTotalMinor: 10000n,
        depositMinor: 1000n,
        payments: [
          { amountMinor: 4000n, status: 'completed' },
          { amountMinor: 3000n, status: 'pending' },
          { amountMinor: 2000n, status: 'failed' },
        ],
      });

      expect(result.validPaymentsMinor).toBe(4000n);
      expect(result.totalCreditsMinor).toBe(5000n);
      expect(result.balanceMinor).toBe(5000n);
      expect(result.paymentStatus).toBe('partially_paid');
    });

    it('accounts for partial refunds on payments', () => {
      const result = calculateDocumentBalance({
        grandTotalMinor: 10000n,
        depositMinor: 0n,
        payments: [
          {
            amountMinor: 8000n,
            status: 'completed',
            refundState: 'partial',
            refundedAmountMinor: 3000n,
          },
        ],
      });

      expect(result.validPaymentsMinor).toBe(5000n);
      expect(result.totalCreditsMinor).toBe(5000n);
      expect(result.balanceMinor).toBe(5000n);
      expect(result.paymentStatus).toBe('partially_paid');
    });

    it('handles overpayment scenario without negative balance', () => {
      const result = calculateDocumentBalance({
        grandTotalMinor: 10000n,
        depositMinor: 5000n,
        payments: [{ amountMinor: 7000n, status: 'completed' }],
      });

      expect(result.totalCreditsMinor).toBe(12000n);
      expect(result.balanceMinor).toBe(0n);
      expect(result.paymentStatus).toBe('paid');
      expect(result.isOverpaid).toBe(true);
    });
  });
});
