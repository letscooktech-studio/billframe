/**
 * Domain document definitions, lifecycle enums, and calculation contracts.
 */

import { Money } from '../money/Money';
import {
  CustomerTaxContext,
  DocumentTaxSummary,
  TaxComponentSummary,
  TaxDecision,
  TaxProfileContext,
  TaxType,
} from '../tax/TaxTypes';

/**
 * Domain constant: 1 unit = 10_000n scaled integer (supports 4 decimal places, e.g. 0.0001 precision)
 */
export const QUANTITY_SCALE = 10_000n;

export type DocumentType =
  | 'invoice'
  | 'estimate'
  | 'receipt'
  | 'credit_note'
  | 'proforma'
  | 'delivery_note'
  | 'work_order'
  | 'proposal'
  | 'sow'
  | 'tax_invoice'
  | 'commercial_invoice'
  | 'bill_of_supply'
  | 'invoice_cum_bill_of_supply'
  | 'cash_bill'
  | 'pos_receipt'
  | 'service_invoice'
  | 'milestone_invoice'
  | 'progress_invoice'
  | 'recurring_invoice'
  | 'advance_invoice'
  | 'revised_tax_invoice'
  | 'debit_note'
  | 'sales_return_note'
  | 'export_invoice'
  | 'quotation'
  | 'purchase_order'
  | 'delivery_challan'
  | 'payment_voucher'
  | 'sales_order'
  | 'order_confirmation'
  | 'goods_received_note'
  | 'packing_list'
  | 'customer_account_statement'
  | 'invoice_aging_report'
  | 'payment_reminder'
  | 'salary_slip'
  | 'job_offer_letter'
  | 'experience_certificate'
  | 'rent_receipt'
  | 'student_fee_receipt'
  | 'equipment_responsibility_letter'
  | 'meeting_minutes'
  | 'site_inspection_report'
  | 'nda_agreement'
  | 'job_application';

/**
 * Orthogonal document lifecycle statuses
 */
export type DocumentLifecycleStatus = 'draft' | 'issued' | 'void';

export type EstimateLifecycleStatus =
  | 'draft'
  | 'issued'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'void';

export type DiscountType = 'none' | 'percentage' | 'fixed';

/**
 * Authoritative payment status derived strictly from payments applied
 */
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export type PaymentTermsPreset =
  | 'due_on_receipt'
  | 'net_7'
  | 'net_15'
  | 'net_30'
  | 'net_45'
  | 'net_60'
  | 'custom';

export interface LineItemCalculation {
  readonly id: string;
  readonly description: string;
  readonly itemNotes?: string | null;
  readonly quantityScaled: bigint;
  readonly unitName: string;
  readonly unitPriceMinor: bigint;
  readonly lineTotalMinor: bigint;
  readonly internalCostMinor: bigint;
  readonly profitMinor: bigint;
  readonly category?: string | null;
  readonly hsnSacCode?: string | null;
  readonly taxRateBasisPoints?: bigint;
  readonly taxMinor?: bigint;
  readonly taxDecision?: TaxDecision;
}

export interface LineItemInput {
  readonly id?: string;
  readonly catalogItemId?: string | null;
  readonly description: string;
  readonly itemNotes?: string | null;
  readonly quantityScaled: bigint;
  readonly unitName?: string;
  readonly unitPriceMinor: bigint;
  readonly internalCostMinor?: bigint;
  readonly category?: string | null;
  readonly hsnSacCode?: string | null;
  readonly taxRateBasisPoints?: bigint;
  readonly taxType?: TaxType;
}

export interface DocumentCalculationInput {
  readonly currency: string;
  readonly items: readonly LineItemInput[];
  readonly discountType: DiscountType;
  readonly discountValue: bigint; // Minor units if fixed, basis points if percentage
  readonly taxType: TaxType;
  readonly taxRateBasisPoints: bigint;
  readonly taxLabel: string;
  readonly depositMinor?: bigint;
  readonly totalPaymentsMinor: bigint;
  readonly dueDateTimestamp?: number | null;
  readonly currentTimestamp?: number;
  readonly lifecycleStatus?: DocumentLifecycleStatus;
  readonly taxContext?: {
    readonly businessProfile: TaxProfileContext;
    readonly customer?: CustomerTaxContext | null;
  };
}

export interface DocumentCalculationOutput {
  readonly currency: string;
  readonly items: readonly LineItemCalculation[];
  readonly subtotal: Money;
  readonly discount: Money;
  readonly taxableBase: Money;
  readonly tax: Money;
  readonly grandTotal: Money;
  readonly deposit: Money;
  readonly paid: Money;
  readonly balance: Money;
  readonly totalInternalCost: Money;
  readonly grossProfit: Money;
  readonly marginBasisPoints: number; // e.g. 2500 bp = 25.00%
  readonly paymentStatus: PaymentStatus;
  readonly isOverdue: boolean;
  readonly taxSummary?: DocumentTaxSummary;
  readonly taxComponents?: readonly TaxComponentSummary[];
}
