/**
 * AGENT VERIFIER
 * Post-execution invariant validation engine.
 * Ensures that agent outputs adhere strictly to financial correctness,
 * state machine invariants, and snapshot immutability before user review or commit.
 */

import { VerificationResult, StepExecutionResult } from './types';
import { DocumentCalculationOutput } from '../../domain/documents/types';

export class Verifier {
  /**
   * Verifies execution results against financial and sovereign invariants.
   */
  public static verifyExecution(results: StepExecutionResult[]): VerificationResult {
    const checks: { rule: string; passed: boolean; details?: string }[] = [];

    for (const res of results) {
      if (!res.success) {
        checks.push({
          rule: `Step #${res.stepNumber} (${res.toolName}) execution success`,
          passed: false,
          details: res.error || 'Execution threw an error',
        });
        continue;
      }

      // 1. Invariant for calculate_document outputs
      if (res.toolName === 'calculate_document' && res.output) {
        const calc = res.output as DocumentCalculationOutput;
        const nonNegativeTotal = calc.grandTotal.amountMinor >= 0n;
        checks.push({
          rule: 'Grand total is non-negative',
          passed: nonNegativeTotal,
          details: `Grand total amount: ${calc.grandTotal.amountMinor}`,
        });

        const nonNegativeSubtotal = calc.subtotal.amountMinor >= 0n;
        checks.push({
          rule: 'Subtotal is non-negative',
          passed: nonNegativeSubtotal,
          details: `Subtotal amount: ${calc.subtotal.amountMinor}`,
        });

        // Balance reconciliation invariant: GrandTotal == Balance + Paid + Deposit (within clamp boundaries)
        const totalCredits = calc.paid.amountMinor + calc.deposit.amountMinor;
        const expectedBalance = calc.grandTotal.amountMinor > totalCredits ? calc.grandTotal.amountMinor - totalCredits : 0n;
        const balanceCorrect = calc.balance.amountMinor === expectedBalance;
        checks.push({
          rule: 'Balance matches GrandTotal minus TotalCredits',
          passed: balanceCorrect,
          details: `Computed: ${calc.balance.amountMinor}, Expected: ${expectedBalance}`,
        });
      }

      // 2. Invariant for issue_document outputs
      if (res.toolName === 'issue_document' && res.output) {
        const doc = res.output;
        const hasCustomer = Boolean(doc.customer_id);
        checks.push({
          rule: 'Issued document has assigned customer',
          passed: hasCustomer,
          details: `customer_id: ${doc.customer_id}`,
        });

        const hasNumber = Boolean(doc.document_number && doc.document_number.trim().length > 0);
        checks.push({
          rule: 'Issued document has allocated sequence number',
          passed: hasNumber,
          details: `document_number: ${doc.document_number}`,
        });
      }

      // 3. Invariant for record_payment outputs
      if (res.toolName === 'record_payment' && res.output) {
        const { payment, receipt } = res.output;
        const positivePayment = payment && payment.amount_minor > 0;
        checks.push({
          rule: 'Payment amount is strictly positive',
          passed: positivePayment,
          details: `Payment amountMinor: ${payment?.amount_minor}`,
        });

        const receiptLinked = receipt && receipt.payment_id === payment.id;
        checks.push({
          rule: 'Receipt is atomically linked to payment record',
          passed: Boolean(receiptLinked),
          details: `receipt_id: ${receipt?.id}`,
        });
      }
    }

    const isValid = checks.every((c) => c.passed);

    return {
      isValid,
      checks,
    };
  }
}
