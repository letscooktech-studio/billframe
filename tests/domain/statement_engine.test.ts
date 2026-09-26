import {
  calculateCustomerStatement,
  formatStatementAsText,
  StatementInvoiceItem,
  StatementPaymentItem,
} from '../../src/domain/statements/StatementEngine';

describe('StatementEngine', () => {
  const mockInvoices: StatementInvoiceItem[] = [
    {
      id: 'inv_1',
      document_number: 'INV-0001',
      issue_date: new Date('2026-01-10T10:00:00Z').getTime(),
      total_minor: 100000, // $1,000.00
      deposit_minor: 20000, // $200.00 deposit
      currency: 'USD',
      lifecycle_status: 'issued',
      po_number: 'PO-99',
    },
    {
      id: 'inv_2',
      document_number: 'INV-0002',
      issue_date: new Date('2026-02-15T12:00:00Z').getTime(),
      total_minor: 50000, // $500.00
      deposit_minor: 0,
      currency: 'USD',
      lifecycle_status: 'issued',
    },
    {
      id: 'inv_draft',
      document_number: 'DRAFT-003',
      issue_date: new Date('2026-02-20T12:00:00Z').getTime(),
      total_minor: 99900,
      deposit_minor: 0,
      currency: 'USD',
      lifecycle_status: 'draft', // Must be ignored
    },
  ];

  const mockPayments: StatementPaymentItem[] = [
    {
      id: 'pay_1',
      invoice_id: 'inv_1',
      amount_minor: 30000, // $300.00
      payment_date: new Date('2026-01-20T14:00:00Z').getTime(),
      payment_method: 'bank_transfer',
      reference: 'TXN-101',
    },
    {
      id: 'pay_2',
      invoice_id: 'inv_2',
      amount_minor: 25000, // $250.00
      payment_date: new Date('2026-02-18T16:00:00Z').getTime(),
      payment_method: 'upi',
    },
  ];

  test('calculates All Time customer statement accurately with deposits and payments', () => {
    const summary = calculateCustomerStatement({
      customerId: 'cust_1',
      currency: 'USD',
      preset: 'all',
      invoices: mockInvoices,
      payments: mockPayments,
    });

    expect(summary.customerId).toBe('cust_1');
    expect(summary.periodLabel).toBe('All Time');
    expect(summary.openingBalanceMinor).toBe(0n);

    // Total invoiced: $1,000 + $500 = $1,500.00 (150000 minor)
    expect(summary.totalInvoicedMinor).toBe(150000n);

    // Total paid/credits: $200 (deposit) + $300 (pay 1) + $250 (pay 2) = $750.00 (75000 minor)
    expect(summary.totalPaidMinor).toBe(75000n);

    // Closing balance: $1,500 - $750 = $750.00 (75000 minor)
    expect(summary.closingBalanceMinor).toBe(75000n);

    // Check ledger sequencing:
    // 1. INV-0001 (Jan 10) Debit $1000 -> Bal $1000
    // 2. Deposit on INV-0001 (Jan 10) Credit $200 -> Bal $800
    // 3. Payment 1 (Jan 20) Credit $300 -> Bal $500
    // 4. INV-0002 (Feb 15) Debit $500 -> Bal $1000
    // 5. Payment 2 (Feb 18) Credit $250 -> Bal $750
    expect(summary.ledger.length).toBe(5);

    expect(summary.ledger[0].type).toBe('invoice');
    expect(summary.ledger[0].referenceNumber).toBe('INV-0001');
    expect(summary.ledger[0].debitMinor).toBe(100000n);
    expect(summary.ledger[0].runningBalanceMinor).toBe(100000n);

    expect(summary.ledger[1].type).toBe('deposit');
    expect(summary.ledger[1].creditMinor).toBe(20000n);
    expect(summary.ledger[1].runningBalanceMinor).toBe(80000n);

    expect(summary.ledger[2].type).toBe('payment');
    expect(summary.ledger[2].creditMinor).toBe(30000n);
    expect(summary.ledger[2].runningBalanceMinor).toBe(50000n);

    expect(summary.ledger[3].type).toBe('invoice');
    expect(summary.ledger[3].referenceNumber).toBe('INV-0002');
    expect(summary.ledger[3].debitMinor).toBe(50000n);
    expect(summary.ledger[3].runningBalanceMinor).toBe(100000n);

    expect(summary.ledger[4].type).toBe('payment');
    expect(summary.ledger[4].creditMinor).toBe(25000n);
    expect(summary.ledger[4].runningBalanceMinor).toBe(75000n);
  });

  test('calculates filtered statement with accurate opening balance carryforward', () => {
    // Test February 2026:
    // Prior activity (January):
    // INV-0001 ($1,000) - Deposit ($200) - Pay 1 ($300) = $500 remaining balance carried forward
    const febTime = new Date('2026-02-15T00:00:00Z').getTime();

    const summary = calculateCustomerStatement({
      customerId: 'cust_1',
      currency: 'USD',
      preset: 'this_month',
      invoices: mockInvoices,
      payments: mockPayments,
      now: febTime,
    });

    // Opening balance should be $500.00 (50000 minor)
    expect(summary.openingBalanceMinor).toBe(50000n);

    // In-period activity (Feb):
    // INV-0002 billed: $500
    // Pay 2 paid: $250
    expect(summary.totalInvoicedMinor).toBe(50000n);
    expect(summary.totalPaidMinor).toBe(25000n);

    // Closing balance: $500 (open) + $500 (billed) - $250 (paid) = $750.00 (75000 minor)
    expect(summary.closingBalanceMinor).toBe(75000n);

    // Ledger only contains Feb items
    expect(summary.ledger.length).toBe(2);
    expect(summary.ledger[0].referenceNumber).toBe('INV-0002');
    expect(summary.ledger[0].runningBalanceMinor).toBe(100000n); // 500 open + 500 billed = 1000
    expect(summary.ledger[1].type).toBe('payment');
    expect(summary.ledger[1].runningBalanceMinor).toBe(75000n); // 1000 - 250 = 750
  });

  test('formats clean shareable text statement for WhatsApp/SMS/Email', () => {
    const summary = calculateCustomerStatement({
      customerId: 'cust_1',
      currency: 'USD',
      preset: 'all',
      invoices: mockInvoices,
      payments: mockPayments,
    });

    const text = formatStatementAsText({
      statement: summary,
      customerName: 'John Doe',
      customerBusinessName: 'Acme Corp',
      businessName: 'Apex Construction',
      businessPhone: '+1-555-0199',
      paymentInstructions: 'Bank Transfer to Chase Acct 123456789',
    });

    expect(text).toContain('STATEMENT OF ACCOUNT');
    expect(text).toContain('Apex Construction');
    expect(text).toContain('John Doe (Acme Corp)');
    expect(text).toContain('INV-0001');
    expect(text).toContain('Bank Transfer to Chase Acct 123456789');
    expect(text).toContain('BALANCE DUE:');
  });
});
