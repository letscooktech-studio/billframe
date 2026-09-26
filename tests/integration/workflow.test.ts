/**
 * COMPLETE CONNECTED REAL-WORLD WORKFLOW INTEGRATION TEST
 *
 * Validates the core production lifecycle:
 * Customer -> Estimate Draft -> Autosave -> Issue Estimate (EST-0001) ->
 * Accept Estimate -> Convert to Invoice Draft -> Issue Invoice (INV-0001) ->
 * 3 Sequential Partial/Full Payments -> Balance Recalculations ->
 * 3 Sequential Payment-Linked Receipts (RCP-0001, RCP-0002, RCP-0003) ->
 * Overpayment Rejection -> Database Persistence & Snapshot Integrity.
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { PaymentRepository } from '../../src/data/repositories/PaymentRepository';
import { QUANTITY_SCALE } from '../../src/domain/documents/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Real-World Invoicing Workflow Integration', () => {
  beforeEach(async () => {
    // Reset in-memory database and seed default profile & sequences
    const mockDb = getMockDb();
    mockDb.reset();
    await DatabaseManager.initDatabaseAsync(mockDb as any);
  });

  it('executes full end-to-end connected workflow with exact invariants', async () => {
    // -------------------------------------------------------------
    // 1. CUSTOMER CREATION
    // -------------------------------------------------------------
    const customer = await CustomerRepository.create({
      name: 'Acme Corporation',
      businessName: 'Acme Global Industries Ltd',
      email: 'finance@acmeglobal.com',
      phone: '+1 555-0199',
      billingAddress: '100 Enterprise Way, Suite 400, Austin, TX 78701',
      taxId: 'US-84920192',
      notes: 'Net 30 preferred client',
    });

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Acme Corporation');
    expect(customer.business_name).toBe('Acme Global Industries Ltd');

    // -------------------------------------------------------------
    // 2. ESTIMATE CREATION AS DRAFT (AUTOSAVE INVARIANT: 0 ITEMS ALLOWED)
    // -------------------------------------------------------------
    const emptyDraft = await DocumentRepository.saveDraft({
      docType: 'estimate',
      customerId: customer.id,
      issueDate: 1774704000000,
      currency: 'USD',
      items: [], // 0 items must be permitted for autosave
    });

    expect(emptyDraft.lifecycle_status).toBe('draft');
    expect(emptyDraft.document_number).toMatch(/^DRAFT-/);
    expect(emptyDraft.items.length).toBe(0);
    expect(emptyDraft.total_minor).toBe(0);

    // -------------------------------------------------------------
    // 3. ESTIMATE LINE ITEMS ADDITION & DRAFT UPDATE
    // -------------------------------------------------------------
    // Item 1: 10 hours @ $150.00/hr ($1,500.00 = 150000 minor)
    // Item 2: 1 unit @ $500.00 ($500.00 = 50000 minor)
    // Subtotal = $2,000.00 (200000 minor)
    // Tax = Exclusive 10% (1000 bp) = $200.00 (20000 minor)
    // Total = $2,200.00 (220000 minor)
    const estimateWithItems = await DocumentRepository.saveDraft({
      id: emptyDraft.id,
      docType: 'estimate',
      customerId: customer.id,
      issueDate: 1774704000000,
      currency: 'USD',
      taxType: 'exclusive',
      taxRateBp: 1000n, // 10%
      taxLabel: 'Sales Tax',
      notes: 'Estimate valid for 30 days.',
      items: [
        {
          description: 'Custom Software Architecture',
          quantityScaled: 10n * QUANTITY_SCALE, // 10 units
          unitName: 'hrs',
          unitPriceMinor: 15000n, // $150.00
        },
        {
          description: 'Cloud Infrastructure Provisioning',
          quantityScaled: 1n * QUANTITY_SCALE, // 1 unit
          unitName: 'service',
          unitPriceMinor: 50000n, // $500.00
        },
      ],
    });

    expect(estimateWithItems.items.length).toBe(2);
    expect(estimateWithItems.subtotal_minor).toBe(200000);
    expect(estimateWithItems.tax_minor).toBe(20000);
    expect(estimateWithItems.total_minor).toBe(220000);
    expect(estimateWithItems.lifecycle_status).toBe('draft');

    // -------------------------------------------------------------
    // 4. ESTIMATE ISSUANCE -> ATOMIC SEQUENTIAL EST-0001 ALLOCATION
    // -------------------------------------------------------------
    const issuedEstimate = await DocumentRepository.issueDocument(estimateWithItems.id);

    expect(issuedEstimate.lifecycle_status).toBe('issued');
    expect(issuedEstimate.document_number).toBe('EST-0001');
    expect(issuedEstimate.sequence_number).toBe(1);
    expect(issuedEstimate.snapshot_json).toBeDefined();

    // Verify snapshot immutability
    const estimateSnapshot = JSON.parse(issuedEstimate.snapshot_json!);
    expect(estimateSnapshot.documentNumber).toBe('EST-0001');
    expect(estimateSnapshot.buyer.name).toBe('Acme Corporation');
    expect(estimateSnapshot.financials.totalMinor).toBe('220000');

    // -------------------------------------------------------------
    // 5. ESTIMATE ACCEPTANCE
    // -------------------------------------------------------------
    const acceptedEstimate = await DocumentRepository.acceptEstimate(issuedEstimate.id);
    expect(acceptedEstimate.lifecycle_status).toBe('accepted');

    // -------------------------------------------------------------
    // 6. ESTIMATE CONVERSION TO INVOICE DRAFT
    // -------------------------------------------------------------
    const invoiceDraft = await DocumentRepository.convertEstimateToInvoice(acceptedEstimate.id);

    expect(invoiceDraft.doc_type).toBe('invoice');
    expect(invoiceDraft.lifecycle_status).toBe('draft');
    expect(invoiceDraft.parent_document_id).toBe(acceptedEstimate.id);
    expect(invoiceDraft.customer_id).toBe(customer.id);
    expect(invoiceDraft.items.length).toBe(2);
    expect(invoiceDraft.total_minor).toBe(220000);
    expect(invoiceDraft.document_number).toMatch(/^DRAFT-/);

    // -------------------------------------------------------------
    // 7. INVOICE ISSUANCE -> ATOMIC SEQUENTIAL INV-0001 ALLOCATION
    // -------------------------------------------------------------
    const issuedInvoice = await DocumentRepository.issueDocument(invoiceDraft.id);

    expect(issuedInvoice.lifecycle_status).toBe('issued');
    expect(issuedInvoice.document_number).toBe('INV-0001');
    expect(issuedInvoice.sequence_number).toBe(1);
    expect(issuedInvoice.total_minor).toBe(220000);
    expect(issuedInvoice.total_paid_minor).toBe(0);
    expect(issuedInvoice.balance_minor).toBe(220000);
    expect(issuedInvoice.payment_status).toBe('unpaid');

    // -------------------------------------------------------------
    // 8. PARTIAL PAYMENT 1 ($700.00 = 70000 minor)
    // -------------------------------------------------------------
    const pay1Result = await PaymentRepository.recordPayment({
      invoiceId: issuedInvoice.id,
      amountMinor: 70000n,
      paymentMethod: 'bank_transfer',
      reference: 'WIRE-98214',
      notes: 'First milestone deposit',
    });

    expect(pay1Result.payment.amount_minor).toBe(70000);
    expect(pay1Result.payment.payment_method).toBe('bank_transfer');
    expect(pay1Result.receipt.receipt_number).toBe('RCP-0001');
    expect(pay1Result.receipt.sequence_number).toBe(1);

    // Verify receipt snapshot
    const rec1Snapshot = JSON.parse(pay1Result.receipt.receipt_snapshot_json);
    expect(rec1Snapshot.receiptNumber).toBe('RCP-0001');
    expect(rec1Snapshot.amountMinor).toBe('70000');
    expect(rec1Snapshot.invoiceReference.number).toBe('INV-0001');
    expect(rec1Snapshot.invoiceReference.remainingBalanceMinor).toBe('150000');

    // Check authoritative invoice balance after payment 1
    const invoiceAfterPay1 = await DocumentRepository.getById(issuedInvoice.id);
    expect(invoiceAfterPay1!.total_paid_minor).toBe(70000);
    expect(invoiceAfterPay1!.balance_minor).toBe(150000);
    expect(invoiceAfterPay1!.payment_status).toBe('partially_paid');

    // -------------------------------------------------------------
    // 9. PARTIAL PAYMENT 2 ($800.00 = 80000 minor)
    // -------------------------------------------------------------
    const pay2Result = await PaymentRepository.recordPayment({
      invoiceId: issuedInvoice.id,
      amountMinor: 80000n,
      paymentMethod: 'card',
      reference: 'TXN-44829',
      notes: 'Second milestone payment',
    });

    expect(pay2Result.receipt.receipt_number).toBe('RCP-0002');
    expect(pay2Result.receipt.sequence_number).toBe(2);

    const invoiceAfterPay2 = await DocumentRepository.getById(issuedInvoice.id);
    expect(invoiceAfterPay2!.total_paid_minor).toBe(150000);
    expect(invoiceAfterPay2!.balance_minor).toBe(70000);
    expect(invoiceAfterPay2!.payment_status).toBe('partially_paid');

    // -------------------------------------------------------------
    // 10. OVERPAYMENT REJECTION ASSERTION
    // -------------------------------------------------------------
    // Remaining balance is $700.00 (70000 minor).
    // Attempting to pay $700.01 (70001 minor) must be rejected!
    await expect(
      PaymentRepository.recordPayment({
        invoiceId: issuedInvoice.id,
        amountMinor: 70001n,
        paymentMethod: 'cash',
      })
    ).rejects.toThrow(/exceeds remaining invoice balance/i);

    // Verify invoice was not mutated by the rejected transaction
    const invoiceAfterRejected = await DocumentRepository.getById(issuedInvoice.id);
    expect(invoiceAfterRejected!.total_paid_minor).toBe(150000);
    expect(invoiceAfterRejected!.balance_minor).toBe(70000);

    // -------------------------------------------------------------
    // 11. FINAL PAYMENT 3 ($700.00 = 70000 minor)
    // -------------------------------------------------------------
    const pay3Result = await PaymentRepository.recordPayment({
      invoiceId: issuedInvoice.id,
      amountMinor: 70000n,
      paymentMethod: 'upi',
      reference: 'UPI-3029104',
      notes: 'Final balance settlement',
    });

    expect(pay3Result.receipt.receipt_number).toBe('RCP-0003');
    expect(pay3Result.receipt.sequence_number).toBe(3);

    // -------------------------------------------------------------
    // 12. FULL SETTLEMENT & ZERO BALANCE VERIFICATION
    // -------------------------------------------------------------
    const settledInvoice = await DocumentRepository.getById(issuedInvoice.id);
    expect(settledInvoice!.total_paid_minor).toBe(220000);
    expect(settledInvoice!.balance_minor).toBe(0);
    expect(settledInvoice!.payment_status).toBe('paid');

    // -------------------------------------------------------------
    // 13. RECEIPT HISTORY RETRIEVAL
    // -------------------------------------------------------------
    const allReceipts = await PaymentRepository.getReceiptsForInvoice(issuedInvoice.id);
    expect(allReceipts.length).toBe(3);
    expect(allReceipts[0].receipt_number).toBe('RCP-0001');
    expect(allReceipts[1].receipt_number).toBe('RCP-0002');
    expect(allReceipts[2].receipt_number).toBe('RCP-0003');

    const allPayments = await PaymentRepository.getPaymentsForInvoice(issuedInvoice.id);
    expect(allPayments.length).toBe(3);
    expect(allPayments.reduce((acc, p) => acc + p.amount_minor, 0)).toBe(220000);
  });

  it('rejects issuance when draft has zero items or missing customer', async () => {
    const cust = await CustomerRepository.create({ name: 'Valid Customer' });

    // Draft with no items
    const emptyDraft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId: cust.id,
      issueDate: Date.now(),
      currency: 'USD',
      items: [],
    });

    await expect(DocumentRepository.issueDocument(emptyDraft.id)).rejects.toThrow(
      /at least one line item/i
    );

    // Draft with no customer
    const noCustDraft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId: null,
      issueDate: Date.now(),
      currency: 'USD',
      items: [
        {
          description: 'Consulting',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitPriceMinor: 1000n,
        },
      ],
    });

    await expect(DocumentRepository.issueDocument(noCustDraft.id)).rejects.toThrow(
      /customer must be selected/i
    );
  });
});
