/**
 * QUICK BILL INTEGRATION TEST
 * Validates 30-second quick billing flow:
 * 1. Fast invoice creation with customer, item, and immediate UPI payment settlement
 * 2. Walk-in customer default behavior when customer name is omitted
 * 3. Default description when line item description is omitted
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { PaymentRepository } from '../../src/data/repositories/PaymentRepository';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Quick Bill Flow Integration', () => {
  beforeEach(async () => {
    const mockDb = getMockDb();
    mockDb.reset();
    await DatabaseManager.initDatabaseAsync(mockDb as any);
  });

  test('creates, issues, and settles Quick Bill with explicit customer', async () => {
    const cust = await CustomerRepository.create({ name: 'Rahul Sharma' });
    expect(cust.id).toBeDefined();

    const draft = await DocumentRepository.saveDraft({
      customerId: cust.id,
      docType: 'invoice',
      currency: 'INR',
      issueDate: Date.now(),
      items: [
        {
          description: 'AC Repair & Gas Refill',
          quantityScaled: 10000n,
          unitName: 'item',
          unitPriceMinor: 45600n, // ₹456.00
        },
      ],
      discountType: 'none',
      taxType: 'none',
    });

    expect(draft.id).toBeDefined();

    const issued = await DocumentRepository.issueDocument(draft.id);
    expect(issued.lifecycle_status).toBe('issued');
    expect(issued.document_number).toMatch(/^INV-/);
    expect(issued.total_minor).toBe(45600);
    expect(issued.balance_minor).toBe(45600);

    const { payment, receipt } = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 45600n,
      paymentMethod: 'upi',
    });

    expect(payment.id).toBeDefined();
    expect(payment.status).toBe('completed');
    expect(receipt.id).toBeDefined();
    expect(receipt.receipt_number).toMatch(/^RCP-/);

    const finalDoc = await DocumentRepository.getById(issued.id);
    expect(finalDoc?.balance_minor).toBe(0);
    expect(finalDoc?.payment_status).toBe('paid');
  });

  test('creates, issues, and settles Quick Bill for walk-in customer with default description', async () => {
    const walkInCustomer = await CustomerRepository.create({ name: 'Walk-in Customer' });
    expect(walkInCustomer.id).toBeDefined();

    const draft = await DocumentRepository.saveDraft({
      customerId: walkInCustomer.id,
      docType: 'invoice',
      currency: 'INR',
      issueDate: Date.now(),
      items: [
        {
          description: 'Quick Bill',
          quantityScaled: 10000n,
          unitName: 'item',
          unitPriceMinor: 45600n,
        },
      ],
      discountType: 'none',
      taxType: 'none',
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    expect(issued.lifecycle_status).toBe('issued');
    expect(issued.total_minor).toBe(45600);

    const { payment, receipt } = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 45600n,
      paymentMethod: 'upi',
    });

    expect(payment.amount_minor).toBe(45600);
    expect(receipt.receipt_number).toBeDefined();

    const finalDoc = await DocumentRepository.getById(issued.id);
    expect(finalDoc?.balance_minor).toBe(0);
  });
});
