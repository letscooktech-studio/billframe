/**
 * CUSTOMER STATEMENT ENGINE
 * Pure domain engine for calculating customer statements, date-filtered ledgers,
 * opening balances, and shareable plain-text exports.
 * Strict integer-only BigInt arithmetic (zero floating-point).
 */

import { formatMoney, createMoney, Money } from '../money/Money';

export type StatementPeriodPreset = 'all' | 'this_month' | 'last_month' | 'this_year';

export interface StatementInvoiceItem {
  id: string;
  document_number: string;
  issue_date: number;
  total_minor: number;
  deposit_minor: number;
  currency: string;
  lifecycle_status: string;
  po_number?: string | null;
}

export interface StatementPaymentItem {
  id: string;
  invoice_id: string;
  document_number?: string;
  amount_minor: number;
  payment_date: number;
  payment_method: string;
  reference?: string | null;
}

export interface StatementLedgerRow {
  id: string;
  date: number;
  type: 'invoice' | 'payment' | 'deposit';
  referenceNumber: string;
  description: string;
  debitMinor: bigint;
  creditMinor: bigint;
  runningBalanceMinor: bigint;
}

export interface StatementSummary {
  customerId: string;
  currency: string;
  periodPreset: StatementPeriodPreset;
  periodLabel: string;
  startDate?: number;
  endDate?: number;
  openingBalanceMinor: bigint;
  totalInvoicedMinor: bigint;
  totalPaidMinor: bigint;
  closingBalanceMinor: bigint;
  ledger: StatementLedgerRow[];
}

export function getDateRangeForPreset(
  preset: StatementPeriodPreset,
  now: number = Date.now()
): { startDate?: number; endDate?: number; label: string } {
  const current = new Date(now);

  switch (preset) {
    case 'this_month': {
      const start = new Date(current.getFullYear(), current.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = start.toLocaleString('default', { month: 'short', year: 'numeric' });
      return { startDate: start.getTime(), endDate: end.getTime(), label: monthName };
    }
    case 'last_month': {
      const start = new Date(current.getFullYear(), current.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(current.getFullYear(), current.getMonth(), 0, 23, 59, 59, 999);
      const monthName = start.toLocaleString('default', { month: 'short', year: 'numeric' });
      return { startDate: start.getTime(), endDate: end.getTime(), label: monthName };
    }
    case 'this_year': {
      const start = new Date(current.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(current.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { startDate: start.getTime(), endDate: end.getTime(), label: `Year ${current.getFullYear()}` };
    }
    case 'all':
    default:
      return { label: 'All Time' };
  }
}

export function calculateCustomerStatement(params: {
  customerId: string;
  currency: string;
  preset: StatementPeriodPreset;
  invoices: StatementInvoiceItem[];
  payments: StatementPaymentItem[];
  now?: number;
}): StatementSummary {
  const { customerId, currency, preset, invoices, payments, now = Date.now() } = params;
  const { startDate, endDate, label } = getDateRangeForPreset(preset, now);

  // Eligible invoices: must be issued, accepted, or paid (exclude drafts and voids)
  const validInvoices = invoices.filter(
    (inv) => inv.lifecycle_status === 'issued' || inv.lifecycle_status === 'paid' || inv.lifecycle_status === 'accepted'
  );

  // 1. Calculate opening balance for items prior to startDate
  let priorInvoiced = 0n;
  let priorPaid = 0n;

  if (startDate !== undefined) {
    for (const inv of validInvoices) {
      if (inv.issue_date < startDate) {
        priorInvoiced += BigInt(inv.total_minor);
        if (inv.deposit_minor > 0) {
          priorPaid += BigInt(inv.deposit_minor);
        }
      }
    }

    for (const pay of payments) {
      if (pay.payment_date < startDate) {
        priorPaid += BigInt(pay.amount_minor);
      }
    }
  }

  const openingBalanceMinor = priorInvoiced > priorPaid ? priorInvoiced - priorPaid : 0n;

  // 2. Collect in-period ledger items
  type UncalculatedRow = Omit<StatementLedgerRow, 'runningBalanceMinor'>;
  const rawRows: UncalculatedRow[] = [];

  for (const inv of validInvoices) {
    const isInsidePeriod =
      (startDate === undefined || inv.issue_date >= startDate) &&
      (endDate === undefined || inv.issue_date <= endDate);

    if (isInsidePeriod) {
      // Invoice debit
      rawRows.push({
        id: `row_inv_${inv.id}`,
        date: inv.issue_date,
        type: 'invoice',
        referenceNumber: inv.document_number,
        description: inv.po_number ? `Invoice #${inv.document_number} (PO: ${inv.po_number})` : `Invoice #${inv.document_number}`,
        debitMinor: BigInt(inv.total_minor),
        creditMinor: 0n,
      });

      // Deposit credit if applied at issuance
      if (inv.deposit_minor > 0) {
        rawRows.push({
          id: `row_dep_${inv.id}`,
          date: inv.issue_date,
          type: 'deposit',
          referenceNumber: `DEP-${inv.document_number}`,
          description: `Deposit credited on #${inv.document_number}`,
          debitMinor: 0n,
          creditMinor: BigInt(inv.deposit_minor),
        });
      }
    }
  }

  for (const pay of payments) {
    const isInsidePeriod =
      (startDate === undefined || pay.payment_date >= startDate) &&
      (endDate === undefined || pay.payment_date <= endDate);

    if (isInsidePeriod) {
      const methodLabel = pay.payment_method.replace('_', ' ').toUpperCase();
      const desc = pay.reference
        ? `Payment (${methodLabel}) • Ref: ${pay.reference}`
        : `Payment (${methodLabel})`;

      rawRows.push({
        id: `row_pay_${pay.id}`,
        date: pay.payment_date,
        type: 'payment',
        referenceNumber: pay.reference || 'PAYMENT',
        description: desc,
        debitMinor: 0n,
        creditMinor: BigInt(pay.amount_minor),
      });
    }
  }

  // 3. Sort chronologically:
  // Date ascending; if same timestamp, debits (invoices) before deposits before payments
  rawRows.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date - b.date;
    }
    const orderScore = (type: StatementLedgerRow['type']) => {
      if (type === 'invoice') return 1;
      if (type === 'deposit') return 2;
      return 3;
    };
    return orderScore(a.type) - orderScore(b.type);
  });

  // 4. Calculate running balance and totals
  let running = openingBalanceMinor;
  let totalInvoicedMinor = 0n;
  let totalPaidMinor = 0n;

  const ledger: StatementLedgerRow[] = rawRows.map((row) => {
    totalInvoicedMinor += row.debitMinor;
    totalPaidMinor += row.creditMinor;
    running = running + row.debitMinor - row.creditMinor;
    return {
      ...row,
      runningBalanceMinor: running < 0n ? 0n : running,
    };
  });

  const closingBalanceMinor = running < 0n ? 0n : running;

  return {
    customerId,
    currency,
    periodPreset: preset,
    periodLabel: label,
    startDate,
    endDate,
    openingBalanceMinor,
    totalInvoicedMinor,
    totalPaidMinor,
    closingBalanceMinor,
    ledger,
  };
}

export function formatStatementAsText(params: {
  statement: StatementSummary;
  customerName: string;
  customerBusinessName?: string | null;
  customerEmail?: string | null;
  businessName: string;
  businessPhone?: string | null;
  businessEmail?: string | null;
  paymentInstructions?: string | null;
}): string {
  const {
    statement,
    customerName,
    customerBusinessName,
    customerEmail,
    businessName,
    businessPhone,
    businessEmail,
    paymentInstructions,
  } = params;

  const currency = statement.currency;
  const divider = '----------------------------------------';
  const lines: string[] = [];

  lines.push('STATEMENT OF ACCOUNT');
  lines.push(divider);
  lines.push(`From: ${businessName}`);
  if (businessEmail) lines.push(`Email: ${businessEmail}`);
  if (businessPhone) lines.push(`Phone: ${businessPhone}`);
  lines.push('');
  lines.push(`To: ${customerName}${customerBusinessName ? ` (${customerBusinessName})` : ''}`);
  if (customerEmail) lines.push(`Email: ${customerEmail}`);
  lines.push(`Period: ${statement.periodLabel}`);
  lines.push(`Date Generated: ${new Date().toLocaleDateString()}`);
  lines.push(divider);

  lines.push('SUMMARY');
  if (statement.startDate !== undefined) {
    lines.push(`Opening Balance:  ${formatMoney(createMoney(statement.openingBalanceMinor, currency))}`);
  }
  lines.push(`Total Invoiced:   ${formatMoney(createMoney(statement.totalInvoicedMinor, currency))}`);
  lines.push(`Total Received:   ${formatMoney(createMoney(statement.totalPaidMinor, currency))}`);
  lines.push(divider);
  lines.push(`BALANCE DUE:      ${formatMoney(createMoney(statement.closingBalanceMinor, currency))}`);
  lines.push(divider);

  if (statement.ledger.length > 0) {
    lines.push('ACTIVITY:');
    for (const item of statement.ledger) {
      const dateStr = new Date(item.date).toLocaleDateString();
      if (item.type === 'invoice') {
        const amt = formatMoney(createMoney(item.debitMinor, currency));
        const bal = formatMoney(createMoney(item.runningBalanceMinor, currency));
        lines.push(`• ${dateStr} | ${item.description} | Billed: ${amt} | Bal: ${bal}`);
      } else {
        const amt = formatMoney(createMoney(item.creditMinor, currency));
        const bal = formatMoney(createMoney(item.runningBalanceMinor, currency));
        lines.push(`• ${dateStr} | ${item.description} | Paid: ${amt} | Bal: ${bal}`);
      }
    }
    lines.push(divider);
  } else {
    lines.push('No activity recorded during this period.');
    lines.push(divider);
  }

  if (paymentInstructions) {
    lines.push('PAYMENT DETAILS:');
    lines.push(paymentInstructions);
    lines.push(divider);
  }

  lines.push('Generated via Billframe');

  return lines.join('\n');
}
