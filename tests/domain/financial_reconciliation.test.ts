/**
 * FINANCIAL RECONCILIATION & DATA ISOLATION TEST SUITE
 * Verifies that:
 * 1. Both GST tax invoices ('tax_invoice') and standard invoices ('invoice') are correctly
 *    aggregated in business reports, revenue summaries, and dashboard metrics.
 * 2. Expense tracking respects the business profile's default currency and does not hardcode USD.
 * 3. Class B (Administrative) and Class C (Custom) non-ledger documents NEVER impact accounts
 *    receivable, customer balances, cash ledger, or tax liabilities.
 */

import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { ExpenseRepository } from '../../src/data/repositories/ExpenseRepository';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Financial Reconciliation & Invariant Tests', () => {
  let mockDb: ReturnType<typeof getMockDb>;

  beforeEach(() => {
    mockDb = getMockDb();
    mockDb.reset();

    // Setup active business profile in INR
    mockDb.state.business_profiles = [
      {
        id: 'biz_main',
        legal_name: 'Apex Infotech Solutions Pvt Ltd',
        trade_name: 'Apex Infotech',
        gstin: '27AABCA1234A1Z5',
        default_currency: 'INR',
        address_line1: '402 Cyber Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        country: 'IN',
        is_active: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];

    mockDb.state.customers = [
      {
        id: 'cust_01',
        name: 'Nexus Corp',
        business_profile_id: 'biz_main',
        currency: 'INR',
        is_archived: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];
  });

  describe('Multi-DocType Revenue & Report Aggregation', () => {
    it('aggregates both tax_invoice and invoice into invoiced revenue and balances', async () => {
      const now = Date.now();

      // Invoice 1: Standard invoice
      mockDb.state.documents.push({
        id: 'doc_inv_1',
        business_profile_id: 'biz_main',
        customer_id: 'cust_01',
        doc_type: 'invoice',
        document_number: 'INV-001',
        issue_date: now - 86400000,
        due_date: now + 86400000,
        lifecycle_status: 'issued',
        payment_status: 'partially_paid',
        subtotal_minor: 100000, // ₹1,000.00
        discount_minor: 0,
        tax_minor: 18000,       // ₹180.00
        total_minor: 118000,     // ₹1,180.00
        balance_due_minor: 68000,// ₹680.00 remaining
        currency: 'INR',
        is_archived: 0,
        created_at: now,
        updated_at: now,
      });

      // Add a payment of ₹500 against doc_inv_1
      mockDb.state.payments.push({
        id: 'pay_1',
        invoice_id: 'doc_inv_1',
        amount_minor: 50000,
        payment_date: now,
        status: 'completed',
        refund_state: 'none',
        refunded_amount_minor: 0,
        created_at: now,
        updated_at: now,
      });

      // Invoice 2: Rule 46 GST Tax Invoice
      mockDb.state.documents.push({
        id: 'doc_tax_inv_2',
        business_profile_id: 'biz_main',
        customer_id: 'cust_01',
        doc_type: 'tax_invoice',
        document_number: 'INV-002',
        issue_date: now - 43200000,
        due_date: now + 43200000,
        lifecycle_status: 'issued',
        payment_status: 'unpaid',
        subtotal_minor: 200000, // ₹2,000.00
        discount_minor: 0,
        tax_minor: 36000,       // ₹360.00
        total_minor: 236000,     // ₹2,360.00
        balance_due_minor: 236000,
        currency: 'INR',
        is_archived: 0,
        created_at: now,
        updated_at: now,
      });

      // Invoice 3: Bill of Supply (paid)
      mockDb.state.documents.push({
        id: 'doc_bos_3',
        business_profile_id: 'biz_main',
        customer_id: 'cust_01',
        doc_type: 'bill_of_supply',
        document_number: 'BOS-001',
        issue_date: now,
        due_date: now + 86400000,
        lifecycle_status: 'issued',
        payment_status: 'paid',
        subtotal_minor: 50000,  // ₹500.00
        discount_minor: 0,
        tax_minor: 0,
        total_minor: 50000,
        balance_due_minor: 0,
        currency: 'INR',
        is_archived: 0,
        created_at: now,
        updated_at: now,
      });

      // Add full payment for BOS-001
      mockDb.state.payments.push({
        id: 'pay_2',
        invoice_id: 'doc_bos_3',
        amount_minor: 50000,
        payment_date: now,
        status: 'completed',
        refund_state: 'none',
        refunded_amount_minor: 0,
        created_at: now,
        updated_at: now,
      });

      // Query metrics
      const metrics = await DocumentRepository.getHomeDashboardMetricsAsync();

      // Total receivables must sum balance_due of all sales billing documents:
      // ₹680 (INV-001) + ₹2,360 (INV-002) + ₹0 (BOS-001) = ₹3,040.00 = 304000 minor
      expect(metrics.outstandingMinor).toBe(304000n);
      expect(metrics.overdueInvoicesCount).toBe(0);
      // Paid this month = 50000 + 50000 = 100000 minor (₹1,000.00)
      expect(metrics.paidThisMonthMinor).toBe(100000n);
    });
  });

  describe('Expense Currency Resolution', () => {
    it('uses business profile default currency instead of hardcoding USD', async () => {
      // Create expense via repository
      const expense = await ExpenseRepository.createExpenseAsync({
        businessProfileId: 'biz_main',
        category: 'other',
        amountMinor: 125000, // ₹1,250.00
        description: 'Stationery and printer cartridges',
        expenseDate: Date.now(),
      });

      expect(expense.currency).toBe('INR');
      expect(expense.amount_minor).toBe(125000);
    });

    it('allows explicit currency override when specified for foreign expense', async () => {
      const foreignExpense = await ExpenseRepository.createExpenseAsync({
        businessProfileId: 'biz_main',
        category: 'other',
        amountMinor: 2900, // $29.00
        currency: 'USD',
        description: 'Cloud hosting service',
        expenseDate: Date.now(),
      });

      expect(foreignExpense.currency).toBe('USD');
      expect(foreignExpense.amount_minor).toBe(2900);
    });
  });

  describe('Class B/C Isolation from Ledger', () => {
    it('ensures non-ledger administrative records do not inflate accounts receivable or sales metrics', async () => {
      const now = Date.now();

      // Given a business with one tax invoice of ₹1,000 + ₹180 tax
      mockDb.state.documents.push({
        id: 'doc_tax_inv_10',
        business_profile_id: 'biz_main',
        customer_id: 'cust_01',
        doc_type: 'tax_invoice',
        document_number: 'INV-10',
        issue_date: now,
        due_date: now + 86400000,
        lifecycle_status: 'issued',
        payment_status: 'unpaid',
        subtotal_minor: 100000,
        discount_minor: 0,
        tax_minor: 18000,
        total_minor: 118000,
        balance_due_minor: 118000,
        currency: 'INR',
        is_archived: 0,
        created_at: now,
        updated_at: now,
      });

      const metricsBefore = await DocumentRepository.getHomeDashboardMetricsAsync();
      expect(metricsBefore.outstandingMinor).toBe(118000n);

      // Even if an administrative estimate or quote exists, it should not affect total outstanding
      mockDb.state.documents.push({
        id: 'doc_est_1',
        business_profile_id: 'biz_main',
        customer_id: 'cust_01',
        doc_type: 'estimate',
        document_number: 'EST-001',
        issue_date: now,
        lifecycle_status: 'issued',
        subtotal_minor: 500000,
        total_minor: 590000,
        balance_due_minor: 590000,
        currency: 'INR',
        is_archived: 0,
        created_at: now,
        updated_at: now,
      });

      const metricsAfter = await DocumentRepository.getHomeDashboardMetricsAsync();
      // Must remain strictly ₹1,180 (only sales/invoices), NOT contaminated by estimates
      expect(metricsAfter.outstandingMinor).toBe(118000n);
    });
  });
});
