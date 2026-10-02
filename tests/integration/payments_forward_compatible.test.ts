/**
 * FORWARD-COMPATIBLE PAYMENTS & HOME METRICS INTEGRATION TESTS
 * Verifies expanded payment attributes, overpayment guards with deposits,
 * and canonical home dashboard metrics derivation.
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { PaymentRepository } from '../../src/data/repositories/PaymentRepository';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Forward-Compatible Payments & Home Metrics Integration', () => {
  let mockDb: ReturnType<typeof getMockDb>;
  let customerId: string;

  beforeEach(async () => {
    mockDb = getMockDb();
    mockDb.reset();
    await DatabaseManager.initDatabaseAsync(mockDb as any);

    const customer = await CustomerRepository.create({
      name: 'Alpha Construction Ltd',
      businessName: 'Alpha Builders',
      email: 'finance@alphabuilders.com',
    });
    customerId = customer.id;
  });

  it('records payment with forward-compatible status, provider, and verification attributes', async () => {
    // 1. Create and issue invoice
    const draft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: Date.now(),
      currency: 'USD',
      items: [
        {
          description: 'Structural Engineering Review',
          quantityScaled: 10000n,
          unitPriceMinor: 15000n, // $150.00
        },
      ],
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    expect(issued.lifecycle_status).toBe('issued');
    expect(issued.balance_minor).toBe(15000);

    // 2. Record payment via direct UPI
    const paymentResult = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 15000n,
      paymentMethod: 'upi',
      reference: 'UPI/REF/998877',
      provider: 'direct_upi',
      verificationState: 'manual_confirmed',
      source: 'quick_bill',
    });

    expect(paymentResult.payment.status).toBe('completed');
    expect(paymentResult.payment.provider).toBe('direct_upi');
    expect(paymentResult.payment.verification_state).toBe('manual_confirmed');
    expect(paymentResult.payment.settlement_state).toBe('settled');
    expect(paymentResult.payment.source).toBe('quick_bill');
    expect(paymentResult.payment.refund_state).toBe('none');
    expect(paymentResult.payment.amount_minor).toBe(15000);

    // 3. Verify invoice is now paid
    const updatedInvoice = await DocumentRepository.getById(issued.id);
    expect(updatedInvoice?.balance_minor).toBe(0);
    expect(updatedInvoice?.payment_status).toBe('paid');
  });

  it('strictly enforces overpayment guard considering applied deposits', async () => {
    // Invoice: $200.00 with $50.00 deposit => remaining balance = $150.00
    const draft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: Date.now(),
      currency: 'USD',
      depositMinor: 5000n, // $50.00 deposit
      items: [
        {
          description: 'Electrical Rough-in',
          quantityScaled: 10000n,
          unitPriceMinor: 20000n, // $200.00
        },
      ],
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    expect(issued.total_minor).toBe(20000);
    expect(issued.deposit_minor).toBe(5000);
    expect(issued.balance_minor).toBe(15000); // 20000 - 5000 = 15000

    // Overpayment attempt: trying to pay $160 when balance is $150
    await expect(
      PaymentRepository.recordPayment({
        invoiceId: issued.id,
        amountMinor: 16000n,
        paymentMethod: 'bank_transfer',
      })
    ).rejects.toThrow(/exceeds remaining invoice balance/);

    // Partial payment: pay $100 => remaining balance should be $50
    await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 10000n,
      paymentMethod: 'bank_transfer',
    });

    const afterPartial = await DocumentRepository.getById(issued.id);
    expect(afterPartial?.total_paid_minor).toBe(10000);
    expect(afterPartial?.balance_minor).toBe(5000);
    expect(afterPartial?.payment_status).toBe('partially_paid');

    // Settle remainder: pay $50 => balance $0, paid
    await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 5000n,
      paymentMethod: 'cash',
    });

    const afterFull = await DocumentRepository.getById(issued.id);
    expect(afterFull?.total_paid_minor).toBe(15000);
    expect(afterFull?.balance_minor).toBe(0);
    expect(afterFull?.payment_status).toBe('paid');
  });

  it('computes home dashboard metrics authoritatively through canonical formula', async () => {
    const now = Date.now();
    const pastDueDate = now - 86400000 * 5; // 5 days overdue

    // Invoice 1: $100.00, deposit $30.00, paid $70.00 => Outstanding: $0
    const inv1 = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: now,
      currency: 'USD',
      depositMinor: 3000n,
      items: [{ description: 'Item 1', quantityScaled: 10000n, unitPriceMinor: 10000n }],
    });
    const issued1 = await DocumentRepository.issueDocument(inv1.id);
    await PaymentRepository.recordPayment({
      invoiceId: issued1.id,
      amountMinor: 7000n,
      paymentMethod: 'cash',
    });

    // Invoice 2: $250.00, deposit $50.00, no payment => Outstanding: $200.00
    const inv2 = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: now,
      currency: 'USD',
      depositMinor: 5000n,
      items: [{ description: 'Item 2', quantityScaled: 10000n, unitPriceMinor: 25000n }],
    });
    await DocumentRepository.issueDocument(inv2.id);

    // Invoice 3: $80.00, overdue, no deposit, no payment => Outstanding: $80.00, Overdue: $80.00
    const inv3 = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: now - 86400000 * 10,
      dueDate: pastDueDate,
      currency: 'USD',
      items: [{ description: 'Item 3', quantityScaled: 10000n, unitPriceMinor: 8000n }],
    });
    await DocumentRepository.issueDocument(inv3.id);

    // Invoice 4: Draft ($500.00) => Must NOT count in outstanding
    await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: now,
      currency: 'USD',
      items: [{ description: 'Item 4 (Draft)', quantityScaled: 10000n, unitPriceMinor: 50000n }],
    });

    // Compute canonical metrics
    const metrics = await DocumentRepository.getHomeDashboardMetricsAsync();

    // Outstanding = Inv 2 ($200.00) + Inv 3 ($80.00) = $280.00 = 28000n
    expect(metrics.outstandingMinor).toBe(28000n);
    // Overdue = Inv 3 ($80.00) = 8000n
    expect(metrics.overdueMinor).toBe(8000n);
    expect(metrics.overdueInvoicesCount).toBe(1);
    // Paid this month = Inv 1 ($70.00) = 7000n
    expect(metrics.paidThisMonthMinor).toBe(7000n);
  });
});
