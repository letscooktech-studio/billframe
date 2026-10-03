/**
 * OUTSTANDING EXPOSURE ENGINE
 * Aggregates receivables exposure at customer and portfolio levels,
 * calculates risk indicators, and surfaces high-risk overdue debtors.
 */

import { CustomerExposure, DebtorRiskLevel } from './CollectionTypes';
import { AgingEngine, RawInvoiceForAging } from './AgingEngine';

export interface GlobalExposureSummary {
  readonly totalReceivablesMinor: bigint;
  readonly totalOverdueMinor: bigint;
  readonly totalDebtorsCount: number;
  readonly highRiskDebtorsCount: number;
  readonly criticalDebtorsCount: number;
  readonly topDebtors: readonly CustomerExposure[];
}

export class OutstandingEngine {
  /**
   * Evaluates debtor risk level based on overdue age and delinquency severity.
   */
  static evaluateRiskLevel(oldestOverdueDays: number, overdueMinor: bigint, totalBalanceMinor: bigint): DebtorRiskLevel {
    if (oldestOverdueDays > 60) {
      return 'critical';
    }
    if (oldestOverdueDays > 30) {
      return 'high';
    }
    if (oldestOverdueDays > 0) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Aggregates and returns debtor exposure breakdown grouped by customer.
   */
  static calculateCustomerExposures(
    invoices: readonly RawInvoiceForAging[],
    asOfDate: number = Date.now()
  ): CustomerExposure[] {
    const customerMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        customerPhone: string | null;
        customerEmail: string | null;
        currency: string;
        totalInvoicedMinor: bigint;
        balanceMinor: bigint;
        overdueMinor: bigint;
        oldestOverdueDays: number;
        invoiceCount: number;
        overdueInvoiceCount: number;
      }
    >();

    for (const inv of invoices) {
      const balanceMinor = BigInt(inv.balance_minor);
      const totalMinor = BigInt(inv.total_minor);
      const custId = inv.customer_id || 'unknown';

      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: custId,
          customerName: inv.customer_name || 'Cash Customer',
          customerPhone: inv.customer_phone || null,
          customerEmail: inv.customer_email || null,
          currency: inv.currency,
          totalInvoicedMinor: 0n,
          balanceMinor: 0n,
          overdueMinor: 0n,
          oldestOverdueDays: 0,
          invoiceCount: 0,
          overdueInvoiceCount: 0,
        });
      }

      const cust = customerMap.get(custId)!;
      cust.totalInvoicedMinor += totalMinor;
      cust.invoiceCount += 1;

      if (balanceMinor > 0n) {
        cust.balanceMinor += balanceMinor;
        const effectiveDueDate = inv.due_date || inv.issue_date;
        const { daysOverdue } = AgingEngine.resolveAgingBucket(effectiveDueDate, asOfDate);

        if (daysOverdue > 0) {
          cust.overdueMinor += balanceMinor;
          cust.overdueInvoiceCount += 1;
          if (daysOverdue > cust.oldestOverdueDays) {
            cust.oldestOverdueDays = daysOverdue;
          }
        }
      }
    }

    const exposures: CustomerExposure[] = [];

    for (const entry of customerMap.values()) {
      // Only include customers with non-zero historical invoices
      if (entry.invoiceCount === 0) continue;

      const totalPaidMinor =
        entry.totalInvoicedMinor >= entry.balanceMinor
          ? entry.totalInvoicedMinor - entry.balanceMinor
          : 0n;

      const riskLevel = this.evaluateRiskLevel(
        entry.oldestOverdueDays,
        entry.overdueMinor,
        entry.balanceMinor
      );

      exposures.push({
        customerId: entry.customerId,
        customerName: entry.customerName,
        customerPhone: entry.customerPhone,
        customerEmail: entry.customerEmail,
        currency: entry.currency,
        totalInvoicedMinor: entry.totalInvoicedMinor,
        totalPaidMinor,
        balanceMinor: entry.balanceMinor,
        overdueMinor: entry.overdueMinor,
        oldestOverdueDays: entry.oldestOverdueDays,
        invoiceCount: entry.invoiceCount,
        overdueInvoiceCount: entry.overdueInvoiceCount,
        riskLevel,
      });
    }

    // Sort: highest overdue first, then highest balance
    exposures.sort((a, b) => {
      if (b.overdueMinor !== a.overdueMinor) {
        return Number(b.overdueMinor - a.overdueMinor);
      }
      return Number(b.balanceMinor - a.balanceMinor);
    });

    return exposures;
  }

  /**
   * Computes portfolio-level exposure metrics across all active accounts receivable.
   */
  static calculateGlobalExposure(
    invoices: readonly RawInvoiceForAging[],
    asOfDate: number = Date.now()
  ): GlobalExposureSummary {
    const customerExposures = this.calculateCustomerExposures(invoices, asOfDate);

    let totalReceivablesMinor = 0n;
    let totalOverdueMinor = 0n;
    let highRiskDebtorsCount = 0;
    let criticalDebtorsCount = 0;

    for (const cust of customerExposures) {
      totalReceivablesMinor += cust.balanceMinor;
      totalOverdueMinor += cust.overdueMinor;

      if (cust.riskLevel === 'high') {
        highRiskDebtorsCount += 1;
      } else if (cust.riskLevel === 'critical') {
        criticalDebtorsCount += 1;
      }
    }

    const debtorsWithBalance = customerExposures.filter((c) => c.balanceMinor > 0n);

    return {
      totalReceivablesMinor,
      totalOverdueMinor,
      totalDebtorsCount: debtorsWithBalance.length,
      highRiskDebtorsCount,
      criticalDebtorsCount,
      topDebtors: debtorsWithBalance.slice(0, 5),
    };
  }
}
