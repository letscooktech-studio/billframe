/**
 * COLLECTIONS, AGING & REMINDERS DOMAIN TESTS
 * Verifies strict BigInt arithmetic, aging bucket resolution,
 * weighted days sales outstanding (DSO), risk assessment, and reminder dispatch.
 */

import { AgingEngine, RawInvoiceForAging } from '../../src/domain/collections/AgingEngine';
import { OutstandingEngine } from '../../src/domain/collections/OutstandingEngine';
import { ReminderEngine } from '../../src/domain/collections/ReminderEngine';

describe('Collections, Aging & Reminder Engines', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const AS_OF_DATE = 1775000000000; // Fixed epoch for deterministic testing

  describe('1. AgingEngine', () => {
    test('resolves aging bucket correctly for varying overdue timelines', () => {
      // Due in 5 days (future)
      const futureRes = AgingEngine.resolveAgingBucket(AS_OF_DATE + 5 * ONE_DAY_MS, AS_OF_DATE);
      expect(futureRes.bucket).toBe('current');
      expect(futureRes.daysOverdue).toBe(0);

      // Due today
      const todayRes = AgingEngine.resolveAgingBucket(AS_OF_DATE, AS_OF_DATE);
      expect(todayRes.bucket).toBe('current');
      expect(todayRes.daysOverdue).toBe(0);

      // 10 days overdue
      const r1 = AgingEngine.resolveAgingBucket(AS_OF_DATE - 10 * ONE_DAY_MS, AS_OF_DATE);
      expect(r1.bucket).toBe('overdue_1_30');
      expect(r1.daysOverdue).toBe(10);

      // 45 days overdue
      const r2 = AgingEngine.resolveAgingBucket(AS_OF_DATE - 45 * ONE_DAY_MS, AS_OF_DATE);
      expect(r2.bucket).toBe('overdue_31_60');
      expect(r2.daysOverdue).toBe(45);

      // 75 days overdue
      const r3 = AgingEngine.resolveAgingBucket(AS_OF_DATE - 75 * ONE_DAY_MS, AS_OF_DATE);
      expect(r3.bucket).toBe('overdue_61_90');
      expect(r3.daysOverdue).toBe(75);

      // 120 days overdue
      const r4 = AgingEngine.resolveAgingBucket(AS_OF_DATE - 120 * ONE_DAY_MS, AS_OF_DATE);
      expect(r4.bucket).toBe('overdue_90_plus');
      expect(r4.daysOverdue).toBe(120);
    });

    test('calculates aging report with exact bucket totals and weighted DSO', () => {
      const mockInvoices: RawInvoiceForAging[] = [
        {
          id: 'inv_1',
          document_number: 'INV-001',
          customer_id: 'cust_1',
          customer_name: 'Client Alpha',
          issue_date: AS_OF_DATE - 15 * ONE_DAY_MS,
          due_date: AS_OF_DATE + 5 * ONE_DAY_MS, // Not overdue
          total_minor: 10000n, // $100.00
          balance_minor: 10000n,
          currency: 'USD',
        },
        {
          id: 'inv_2',
          document_number: 'INV-002',
          customer_id: 'cust_2',
          customer_name: 'Client Beta',
          issue_date: AS_OF_DATE - 30 * ONE_DAY_MS,
          due_date: AS_OF_DATE - 10 * ONE_DAY_MS, // 10 days overdue
          total_minor: 20000n, // $200.00
          balance_minor: 20000n,
          currency: 'USD',
        },
        {
          id: 'inv_3',
          document_number: 'INV-003',
          customer_id: 'cust_3',
          customer_name: 'Client Gamma',
          issue_date: AS_OF_DATE - 60 * ONE_DAY_MS,
          due_date: AS_OF_DATE - 40 * ONE_DAY_MS, // 40 days overdue
          total_minor: 40000n, // $400.00
          balance_minor: 40000n,
          currency: 'USD',
        },
        {
          id: 'inv_paid',
          document_number: 'INV-PAID',
          customer_id: 'cust_1',
          customer_name: 'Client Alpha',
          issue_date: AS_OF_DATE - 100 * ONE_DAY_MS,
          due_date: AS_OF_DATE - 80 * ONE_DAY_MS,
          total_minor: 50000n,
          balance_minor: 0n, // Fully paid -> must be excluded
          currency: 'USD',
        },
      ];

      const report = AgingEngine.calculateAging(mockInvoices, AS_OF_DATE);

      // Total outstanding: 100 + 200 + 400 = 700 ($700.00 / 70000 minor)
      expect(report.totalOutstandingMinor).toBe(70000n);

      // Total overdue: 200 + 400 = 600 ($600.00 / 60000 minor)
      expect(report.totalOverdueMinor).toBe(60000n);
      expect(report.overdueCount).toBe(2);

      // Buckets
      expect(report.buckets.current.amountMinor).toBe(10000n);
      expect(report.buckets.current.count).toBe(1);

      expect(report.buckets.overdue_1_30.amountMinor).toBe(20000n);
      expect(report.buckets.overdue_1_30.count).toBe(1);

      expect(report.buckets.overdue_31_60.amountMinor).toBe(40000n);
      expect(report.buckets.overdue_31_60.count).toBe(1);

      expect(report.buckets.overdue_61_90.amountMinor).toBe(0n);
      expect(report.buckets.overdue_90_plus.amountMinor).toBe(0n);

      // Weighted average days overdue:
      // (20000 * 10 + 40000 * 40) / 60000 = (200000 + 1600000) / 60000 = 1800000 / 60000 = 30 days
      expect(report.weightedAverageDaysOverdue).toBe(30);

      // Records must be sorted by days overdue descending
      expect(report.records[0].invoiceId).toBe('inv_3'); // 40 days
      expect(report.records[1].invoiceId).toBe('inv_2'); // 10 days
      expect(report.records[2].invoiceId).toBe('inv_1'); // 0 days
    });
  });

  describe('2. OutstandingEngine', () => {
    test('aggregates exposure by customer and assigns correct risk levels', () => {
      const mockInvoices: RawInvoiceForAging[] = [
        {
          id: 'inv_a1',
          document_number: 'INV-A1',
          customer_id: 'cust_safe',
          customer_name: 'Safe Client Inc',
          customer_phone: '+1 555-0101',
          issue_date: AS_OF_DATE - 10 * ONE_DAY_MS,
          due_date: AS_OF_DATE + 10 * ONE_DAY_MS, // Current
          total_minor: 50000n,
          balance_minor: 50000n,
          currency: 'USD',
        },
        {
          id: 'inv_b1',
          document_number: 'INV-B1',
          customer_id: 'cust_delinquent',
          customer_name: 'Slow Payer LLC',
          customer_phone: '+1 555-0102',
          issue_date: AS_OF_DATE - 90 * ONE_DAY_MS,
          due_date: AS_OF_DATE - 70 * ONE_DAY_MS, // 70 days overdue (>60 -> critical)
          total_minor: 120000n,
          balance_minor: 80000n,
          currency: 'USD',
        },
        {
          id: 'inv_c1',
          document_number: 'INV-C1',
          customer_id: 'cust_medium',
          customer_name: 'Medium Risk Corp',
          customer_phone: '+1 555-0103',
          issue_date: AS_OF_DATE - 20 * ONE_DAY_MS,
          due_date: AS_OF_DATE - 5 * ONE_DAY_MS, // 5 days overdue (medium)
          total_minor: 30000n,
          balance_minor: 30000n,
          currency: 'USD',
        },
      ];

      const exposures = OutstandingEngine.calculateCustomerExposures(mockInvoices, AS_OF_DATE);

      expect(exposures.length).toBe(3);

      // Sorted by highest overdue first
      expect(exposures[0].customerId).toBe('cust_delinquent');
      expect(exposures[0].riskLevel).toBe('critical');
      expect(exposures[0].overdueMinor).toBe(80000n);
      expect(exposures[0].oldestOverdueDays).toBe(70);

      expect(exposures[1].customerId).toBe('cust_medium');
      expect(exposures[1].riskLevel).toBe('medium');
      expect(exposures[1].overdueMinor).toBe(30000n);
      expect(exposures[1].oldestOverdueDays).toBe(5);

      expect(exposures[2].customerId).toBe('cust_safe');
      expect(exposures[2].riskLevel).toBe('low');
      expect(exposures[2].overdueMinor).toBe(0n);
      expect(exposures[2].oldestOverdueDays).toBe(0);

      // Portfolio summary
      const global = OutstandingEngine.calculateGlobalExposure(mockInvoices, AS_OF_DATE);
      expect(global.totalReceivablesMinor).toBe(160000n);
      expect(global.totalOverdueMinor).toBe(110000n);
      expect(global.totalDebtorsCount).toBe(3);
      expect(global.criticalDebtorsCount).toBe(1);
    });
  });

  describe('3. ReminderEngine', () => {
    test('generates contextual reminder text and WhatsApp/SMS links with UPI integration', () => {
      const friendlyReminder = ReminderEngine.generateReminder({
        customerName: 'Alice Smith',
        businessName: 'Apex Studio',
        invoiceNumber: 'INV-1001',
        amountMinor: 150000n, // ₹1,500.00
        currency: 'INR',
        dueDate: AS_OF_DATE + 3 * ONE_DAY_MS,
        daysOverdue: 0,
        customerPhone: '+91 98765 43210',
        upiVpa: 'apex@okaxis',
        upiUri: 'upi://pay?pa=apex@okaxis&pn=Apex%20Studio&am=1500.00&cu=INR',
      });

      expect(friendlyReminder.tone).toBe('friendly');
      expect(friendlyReminder.subject).toContain('Payment Reminder');
      expect(friendlyReminder.message).toContain('Alice Smith');
      expect(friendlyReminder.message).toContain('INV-1001');
      expect(friendlyReminder.message).toContain('upi://pay?pa=apex@okaxis');
      expect(friendlyReminder.whatsAppLink).toContain('https://wa.me/919876543210?text=');
      expect(friendlyReminder.smsLink).toContain('sms:+919876543210?body=');

      // Urgent reminder when >30 days overdue
      const urgentReminder = ReminderEngine.generateReminder({
        customerName: 'Bob Builder',
        businessName: 'Apex Studio',
        invoiceNumber: 'INV-0888',
        amountMinor: 250000n, // ₹2,500.00
        currency: 'INR',
        dueDate: AS_OF_DATE - 40 * ONE_DAY_MS,
        daysOverdue: 40,
        customerPhone: '+91 98765 43210',
        upiVpa: 'apex@okaxis',
      });

      expect(urgentReminder.tone).toBe('urgent');
      expect(urgentReminder.subject).toContain('URGENT: Overdue');
      expect(urgentReminder.message).toContain('40 days overdue');
      expect(urgentReminder.message).toContain('UPI ID: apex@okaxis');
    });

    test('enforces financial rule: auto-stops reminder and throws on settled or zero balance', () => {
      expect(ReminderEngine.canSendReminder({ amountMinor: 0n }).canSend).toBe(false);
      expect(ReminderEngine.canSendReminder({ amountMinor: -500n }).canSend).toBe(false);
      expect(ReminderEngine.canSendReminder({ amountMinor: 1000n }).canSend).toBe(true);

      expect(() => {
        ReminderEngine.generateReminder({
          customerName: 'Settled Client',
          businessName: 'Apex Studio',
          invoiceNumber: 'INV-PAID',
          amountMinor: 0n,
          currency: 'INR',
          dueDate: AS_OF_DATE,
          daysOverdue: 0,
        });
      }).toThrow('Cannot generate payment reminder: invoice balance is zero or settled.');
    });
  });
});
