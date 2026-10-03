/**
 * AGING ENGINE
 * Authoritative financial aging engine for accounts receivable.
 * Strict BigInt minor-unit arithmetic, deterministic bucket classification,
 * and weighted days-sales-outstanding (DSO) calculation.
 */

import {
  AgingBucket,
  AgingBucketSummary,
  AgingReport,
  InvoiceAgingRecord,
} from './CollectionTypes';

export interface RawInvoiceForAging {
  id: string;
  document_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  issue_date: number;
  due_date?: number | null;
  total_minor: number | bigint;
  balance_minor: number | bigint;
  currency: string;
}

export class AgingEngine {
  private static readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  /**
   * Resolves the aging bucket and days overdue for a given due date.
   */
  static resolveAgingBucket(
    dueDate: number,
    asOfDate: number = Date.now()
  ): { bucket: AgingBucket; daysOverdue: number } {
    const diffDays = Math.floor((asOfDate - dueDate) / this.MS_PER_DAY);

    if (diffDays <= 0) {
      return { bucket: 'current', daysOverdue: 0 };
    }
    if (diffDays <= 30) {
      return { bucket: 'overdue_1_30', daysOverdue: diffDays };
    }
    if (diffDays <= 60) {
      return { bucket: 'overdue_31_60', daysOverdue: diffDays };
    }
    if (diffDays <= 90) {
      return { bucket: 'overdue_61_90', daysOverdue: diffDays };
    }
    return { bucket: 'overdue_90_plus', daysOverdue: diffDays };
  }

  /**
   * Calculates comprehensive accounts receivable aging report.
   */
  static calculateAging(
    invoices: readonly RawInvoiceForAging[],
    asOfDate: number = Date.now()
  ): AgingReport {
    const primaryCurrency = invoices[0]?.currency || 'USD';

    const buckets: Record<AgingBucket, { label: string; count: number; amountMinor: bigint }> = {
      current: { label: 'Current / Not Overdue', count: 0, amountMinor: 0n },
      overdue_1_30: { label: '1 - 30 Days', count: 0, amountMinor: 0n },
      overdue_31_60: { label: '31 - 60 Days', count: 0, amountMinor: 0n },
      overdue_61_90: { label: '61 - 90 Days', count: 0, amountMinor: 0n },
      overdue_90_plus: { label: '90+ Days', count: 0, amountMinor: 0n },
    };

    let totalOutstandingMinor = 0n;
    let totalOverdueMinor = 0n;
    let overdueCount = 0;
    let weightedDaysNumerator = 0n;

    const records: InvoiceAgingRecord[] = [];

    for (const inv of invoices) {
      const balanceMinor = BigInt(inv.balance_minor);
      // Skip fully paid invoices
      if (balanceMinor <= 0n) continue;

      const totalMinor = BigInt(inv.total_minor);
      const effectiveDueDate = inv.due_date || inv.issue_date;
      const { bucket, daysOverdue } = this.resolveAgingBucket(effectiveDueDate, asOfDate);

      totalOutstandingMinor += balanceMinor;

      if (daysOverdue > 0) {
        totalOverdueMinor += balanceMinor;
        overdueCount += 1;
        weightedDaysNumerator += balanceMinor * BigInt(daysOverdue);
      }

      buckets[bucket].count += 1;
      buckets[bucket].amountMinor += balanceMinor;

      records.push({
        invoiceId: inv.id,
        invoiceNumber: inv.document_number,
        customerId: inv.customer_id || 'unknown',
        customerName: inv.customer_name || 'Cash Customer',
        customerPhone: inv.customer_phone || null,
        customerEmail: inv.customer_email || null,
        issueDate: inv.issue_date,
        dueDate: effectiveDueDate,
        totalMinor,
        balanceMinor,
        currency: inv.currency,
        daysOverdue,
        bucket,
      });
    }

    // Sort records: oldest overdue first, then largest balance
    records.sort((a, b) => {
      if (b.daysOverdue !== a.daysOverdue) {
        return b.daysOverdue - a.daysOverdue;
      }
      return Number(b.balanceMinor - a.balanceMinor);
    });

    const weightedAverageDaysOverdue =
      totalOverdueMinor > 0n
        ? Number(weightedDaysNumerator / totalOverdueMinor)
        : 0;

    const finalizedBuckets: Record<AgingBucket, AgingBucketSummary> = {
      current: { bucket: 'current', ...buckets.current },
      overdue_1_30: { bucket: 'overdue_1_30', ...buckets.overdue_1_30 },
      overdue_31_60: { bucket: 'overdue_31_60', ...buckets.overdue_31_60 },
      overdue_61_90: { bucket: 'overdue_61_90', ...buckets.overdue_61_90 },
      overdue_90_plus: { bucket: 'overdue_90_plus', ...buckets.overdue_90_plus },
    };

    return {
      asOfDate,
      currency: primaryCurrency,
      totalOutstandingMinor,
      totalOverdueMinor,
      overdueCount,
      weightedAverageDaysOverdue,
      buckets: finalizedBuckets,
      records,
    };
  }
}
