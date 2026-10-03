/**
 * COLLECTIONS & AGING DOMAIN TYPES
 * Authoritative types for accounts receivable aging, debtor exposure,
 * risk scoring, and multi-channel collection reminders.
 */

export type AgingBucket =
  | 'current'
  | 'overdue_1_30'
  | 'overdue_31_60'
  | 'overdue_61_90'
  | 'overdue_90_plus';

export type DebtorRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface InvoiceAgingRecord {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerPhone?: string | null;
  readonly customerEmail?: string | null;
  readonly issueDate: number;
  readonly dueDate: number;
  readonly totalMinor: bigint;
  readonly balanceMinor: bigint;
  readonly currency: string;
  readonly daysOverdue: number; // 0 if not yet overdue
  readonly bucket: AgingBucket;
}

export interface AgingBucketSummary {
  readonly bucket: AgingBucket;
  readonly label: string;
  readonly count: number;
  readonly amountMinor: bigint;
}

export interface AgingReport {
  readonly asOfDate: number;
  readonly currency: string;
  readonly totalOutstandingMinor: bigint;
  readonly totalOverdueMinor: bigint;
  readonly overdueCount: number;
  readonly weightedAverageDaysOverdue: number;
  readonly buckets: Record<AgingBucket, AgingBucketSummary>;
  readonly records: readonly InvoiceAgingRecord[];
}

export interface CustomerExposure {
  readonly customerId: string;
  readonly customerName: string;
  readonly customerPhone?: string | null;
  readonly customerEmail?: string | null;
  readonly currency: string;
  readonly totalInvoicedMinor: bigint;
  readonly totalPaidMinor: bigint;
  readonly balanceMinor: bigint;
  readonly overdueMinor: bigint;
  readonly oldestOverdueDays: number;
  readonly invoiceCount: number;
  readonly overdueInvoiceCount: number;
  readonly riskLevel: DebtorRiskLevel;
}

export interface ReminderTemplateInput {
  readonly customerName: string;
  readonly businessName: string;
  readonly invoiceNumber: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly dueDate: number;
  readonly daysOverdue: number;
  readonly customerPhone?: string | null;
  readonly upiVpa?: string | null;
  readonly upiUri?: string | null;
  readonly bankDetails?: string | null;
  readonly tone?: 'friendly' | 'firm' | 'urgent';
}

export interface FormattedReminder {
  readonly tone: 'friendly' | 'firm' | 'urgent';
  readonly subject: string;
  readonly message: string;
  readonly whatsAppLink: string | null;
  readonly smsLink: string | null;
}
