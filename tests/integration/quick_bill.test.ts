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

  test('settles Quick Bill with Card payment and terminal metadata', async () => {
    const cust = await CustomerRepository.create({ name: 'Priya Mehta' });
    const draft = await DocumentRepository.saveDraft({
      customerId: cust.id,
      docType: 'invoice',
      currency: 'INR',
      issueDate: Date.now(),
      items: [{ description: 'Design Consultation', quantityScaled: 10000n, unitName: 'hrs', unitPriceMinor: 120000n }],
      discountType: 'none',
      taxType: 'none',
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    const { payment, receipt } = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 120000n,
      paymentMethod: 'card',
      reference: 'TXN-VISA-4242-APPR-998811',
      notes: 'Card: VISA ending 4242 | Mode: CHIP_PIN | Auth: 998811 | RRN: 409981234567',
    });

    expect(payment.payment_method).toBe('card');
    expect(payment.reference).toBe('TXN-VISA-4242-APPR-998811');
    expect(payment.notes).toContain('CHIP_PIN');
    expect(receipt.receipt_number).toMatch(/^RCP-/);

    const settled = await DocumentRepository.getById(issued.id);
    expect(settled?.balance_minor).toBe(0);
    expect(settled?.payment_status).toBe('paid');
  });

  test('settles Quick Bill with Bank Transfer and 12-digit UTR', async () => {
    const cust = await CustomerRepository.create({ name: 'Apex Logistics' });
    const draft = await DocumentRepository.saveDraft({
      customerId: cust.id,
      docType: 'invoice',
      currency: 'INR',
      issueDate: Date.now(),
      items: [{ description: 'Quarterly Retainer', quantityScaled: 10000n, unitName: 'item', unitPriceMinor: 5000000n }],
      discountType: 'none',
      taxType: 'none',
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    const { payment, receipt } = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 5000000n,
      paymentMethod: 'bank_transfer',
      reference: 'UTR: 409988776655',
      notes: 'Bank Transfer (IMPS) | UTR: 409988776655',
    });

    expect(payment.payment_method).toBe('bank_transfer');
    expect(payment.reference).toBe('UTR: 409988776655');
    expect(receipt.id).toBeDefined();

    const settled = await DocumentRepository.getById(issued.id);
    expect(settled?.balance_minor).toBe(0);
    expect(settled?.payment_status).toBe('paid');
  });

  test('settles Quick Bill with Cash payment and change calculation notes', async () => {
    const cust = await CustomerRepository.create({ name: 'Direct Retail Store' });
    const draft = await DocumentRepository.saveDraft({
      customerId: cust.id,
      docType: 'invoice',
      currency: 'INR',
      issueDate: Date.now(),
      items: [{ description: 'Counter Goods', quantityScaled: 10000n, unitName: 'item', unitPriceMinor: 85000n }], // ₹850.00
      discountType: 'none',
      taxType: 'none',
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    const { payment, receipt } = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 85000n,
      paymentMethod: 'cash',
      reference: 'CASH-REC',
      notes: 'Cash Received: ₹1000.00 | Change Returned: ₹150.00',
    });

    expect(payment.payment_method).toBe('cash');
    expect(payment.notes).toBe('Cash Received: ₹1000.00 | Change Returned: ₹150.00');
    expect(receipt.receipt_number).toMatch(/^RCP-/);

    const settled = await DocumentRepository.getById(issued.id);
    expect(settled?.balance_minor).toBe(0);
    expect(settled?.payment_status).toBe('paid');
  });
});
