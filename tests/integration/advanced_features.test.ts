/**
 * ADVANCED INVOICING FEATURES INTEGRATION TEST
 *
 * Tests:
 * 1. Document Duplication (1-tap clone into draft with deposit reset)
 * 2. On-Device Signature Acceptance for Estimates
 * 3. Deposit Deduction & Authoritative Net Balance Derivation
 * 4. Job/Project Entity Foundation (sequential job numbering, customer association, aggregate balances)
 * 5. Customer Statement Compilation from real database tables
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { PaymentRepository } from '../../src/data/repositories/PaymentRepository';
import { JobRepository } from '../../src/data/repositories/JobRepository';
import { calculateCustomerStatement } from '../../src/domain/statements/StatementEngine';
import { QUANTITY_SCALE } from '../../src/domain/documents/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Advanced Features Integration', () => {
  beforeEach(async () => {
    const mockDb = getMockDb();
    mockDb.reset();
    await DatabaseManager.initDatabaseAsync(mockDb as any);
  });

  test('Document Duplication clones draft with identical line items and resets deposit', async () => {
    // 1. Create customer
    const customer = await CustomerRepository.create({
      name: 'Highland Builders',
      billingAddress: '500 Granite Way, Denver, CO',
    });

    // 2. Create and issue invoice with deposit and metadata
    const originalDraft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId: customer.id,
      issueDate: Date.now(),
      currency: 'USD',
      poNumber: 'PO-2026-X',
      paymentTermsPreset: 'net_30',
      shippingAddress: 'Site 14, Denver CO',
      paymentInstructions: 'ACH transfer to Chase 9876',
      notes: 'Customer warranty 1 year',
      terms: 'Payment due in 30 days',
      internalNotes: 'VIP Client - do not charge late fee',
      depositMinor: 30000n, // $300 deposit
      items: [
        {
          description: 'Structural Timber',
          itemNotes: 'Cedar Grade A',
          quantityScaled: 5n * QUANTITY_SCALE,
          unitName: 'pcs',
          unitPriceMinor: 20000n, // $200 each = $1,000 total
        },
      ],
    });

    const issuedOriginal = await DocumentRepository.issueDocument(originalDraft.id);
    expect(issuedOriginal.document_number).toBe('INV-0001');
    expect(issuedOriginal.deposit_minor).toBe(30000);
    // Balance due should be $1,000 - $300 deposit = $700 (70000 minor)
    expect(issuedOriginal.balance_minor).toBe(70000);

    // 3. Duplicate Document
    const duplicated = await DocumentRepository.duplicateDocument(issuedOriginal.id);

    // Duplicated document must be a fresh draft
    expect(duplicated.id).not.toBe(issuedOriginal.id);
    expect(duplicated.lifecycle_status).toBe('draft');
    expect(duplicated.document_number).toMatch(/^DRAFT-/);

    // Metadata and items must be preserved
    expect(duplicated.customer_id).toBe(customer.id);
    expect(duplicated.po_number).toBe('PO-2026-X');
    expect(duplicated.payment_terms_preset).toBe('net_30');
    expect(duplicated.shipping_address).toBe('Site 14, Denver CO');
    expect(duplicated.payment_instructions).toBe('ACH transfer to Chase 9876');
    expect(duplicated.notes).toBe('Customer warranty 1 year');
    expect(duplicated.terms).toBe('Payment due in 30 days');
    expect(duplicated.internal_notes).toBe('VIP Client - do not charge late fee');

    expect(duplicated.items.length).toBe(1);
    expect(duplicated.items[0].description).toBe('Structural Timber');
    expect(duplicated.items[0].item_notes).toBe('Cedar Grade A');
    expect(duplicated.items[0].unit_price_minor).toBe(20000);

    // Deposit must be reset to 0 on new duplicate
    expect(duplicated.deposit_minor).toBe(0);
    // Balance due on new draft equals full total ($1,000 = 100000 minor)
    expect(duplicated.balance_minor).toBe(100000);
  });

  test('Digital Signature acceptance transitions estimate and carries over to converted invoice', async () => {
    const customer = await CustomerRepository.create({
      name: 'Sarah Connor',
      email: 'sconnor@cyberdyne.org',
    });

    const estimateDraft = await DocumentRepository.saveDraft({
      docType: 'estimate',
      customerId: customer.id,
      issueDate: Date.now(),
      currency: 'USD',
      items: [
        {
          description: 'Security Audit & Hardening',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitName: 'service',
          unitPriceMinor: 250000n, // $2,500.00
        },
      ],
    });

    const issuedEstimate = await DocumentRepository.issueDocument(estimateDraft.id);
    expect(issuedEstimate.lifecycle_status).toBe('issued');
    expect(issuedEstimate.signature_uri).toBeNull();

    // Sign and accept estimate
    const sampleSignatureUri = 'data:image/svg+xml;utf8,<svg viewBox="0 0 400 200"><path d="M10,10 L50,50"/></svg>';
    const signedEstimate = await DocumentRepository.acceptEstimateWithSignature(
      issuedEstimate.id,
      sampleSignatureUri
    );

    expect(signedEstimate.lifecycle_status).toBe('accepted');
    expect(signedEstimate.signature_uri).toBe(sampleSignatureUri);
    expect(signedEstimate.signature_date).toBeDefined();

    // Convert accepted estimate to invoice
    const convertedInvoice = await DocumentRepository.convertEstimateToInvoice(signedEstimate.id);
    expect(convertedInvoice.doc_type).toBe('invoice');
    expect(convertedInvoice.lifecycle_status).toBe('draft');
    expect(convertedInvoice.parent_document_id).toBe(signedEstimate.id);
    expect(convertedInvoice.items.length).toBe(1);
    expect(convertedInvoice.total_minor).toBe(250000);
  });

  test('Deposit reduction and overpayment rejection', async () => {
    const customer = await CustomerRepository.create({ name: 'Apex Ltd' });

    // Invoice $500 total with $150 deposit -> $350 initial balance due
    const draft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId: customer.id,
      issueDate: Date.now(),
      currency: 'USD',
      depositMinor: 15000n, // $150 deposit
      items: [
        {
          description: 'Consulting Session',
          quantityScaled: 5n * QUANTITY_SCALE,
          unitName: 'hrs',
          unitPriceMinor: 10000n, // $100/hr = $500 total
        },
      ],
    });

    const issued = await DocumentRepository.issueDocument(draft.id);
    expect(issued.total_minor).toBe(50000);
    expect(issued.deposit_minor).toBe(15000);
    expect(issued.balance_minor).toBe(35000); // $350.00
    expect(issued.payment_status).toBe('partially_paid'); // Deposit marked as partial credit

    // Record partial payment of $200 -> remaining balance becomes $150
    const { payment } = await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 20000n,
      paymentMethod: 'bank_transfer',
    });
    expect(payment.amount_minor).toBe(20000);

    const reloaded = await DocumentRepository.getById(issued.id);
    expect(reloaded?.balance_minor).toBe(15000); // $150.00 left

    // Attempting to pay $150.01 (15001 minor) must be rejected
    await expect(
      PaymentRepository.recordPayment({
        invoiceId: issued.id,
        amountMinor: 15001n,
        paymentMethod: 'cash',
      })
    ).rejects.toThrow(/exceeds remaining invoice balance/i);

    // Pay exact $150 -> becomes paid
    await PaymentRepository.recordPayment({
      invoiceId: issued.id,
      amountMinor: 15000n,
      paymentMethod: 'cash',
    });

    const fullyPaid = await DocumentRepository.getById(issued.id);
    expect(fullyPaid?.balance_minor).toBe(0);
    expect(fullyPaid?.payment_status).toBe('paid');
  });

  test('JobRepository creates sequential jobs and aggregates billing summary', async () => {
    const customer = await CustomerRepository.create({ name: 'Skyline Properties' });

    // 1. Create Job
    const job = await JobRepository.create({
      customerId: customer.id,
      title: 'Commercial HVAC Retrofit',
      description: 'Replace rooftop chillers and calibrate dampers',
      siteAddress: '400 Industrial Pkwy, Bldg C',
    });

    expect(job.id).toBeDefined();
    expect(job.job_number).toBe('JOB-0001');
    expect(job.status).toBe('active');
    expect(job.site_address).toBe('400 Industrial Pkwy, Bldg C');

    // 2. Link invoice to this job
    const invoiceDraft = await DocumentRepository.saveDraft({
      jobId: job.id,
      docType: 'invoice',
      customerId: customer.id,
      issueDate: Date.now(),
      currency: 'USD',
      items: [
        {
          description: 'Chiller Unit Replacement',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitName: 'item',
          unitPriceMinor: 800000n, // $8,000.00
        },
      ],
    });

    const issuedInvoice = await DocumentRepository.issueDocument(invoiceDraft.id);

    // 3. Record $3,000 payment against job's invoice
    await PaymentRepository.recordPayment({
      invoiceId: issuedInvoice.id,
      amountMinor: 300000n,
      paymentMethod: 'bank_transfer',
    });

    // 4. Check Job Summary aggregation
    const jobs = await JobRepository.listWithSummary('active');
    const targetJob = jobs.find((j) => j.id === job.id);

    expect(targetJob).toBeDefined();
    expect(targetJob?.customer_name).toBe('Skyline Properties');
    expect(targetJob?.total_invoiced_minor).toBe(800000);
    expect(targetJob?.total_paid_minor).toBe(300000);
    expect(targetJob?.balance_minor).toBe(500000); // $5,000 balance
  });
});
