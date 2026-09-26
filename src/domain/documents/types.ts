/**
 * Domain document definitions, lifecycle enums, and calculation contracts.
 */

import { Money } from '../money/Money';
import { TaxType } from '../tax/TaxEngine';

/**
 * Domain constant: 1 unit = 10_000n scaled integer (supports 4 decimal places, e.g. 0.0001 precision)
 */
export const QUANTITY_SCALE = 10_000n;

export type DocumentType = 'invoice' | 'estimate' | 'receipt';

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
}

export interface LineItemInput {
  readonly id?: string;
  readonly description: string;
  readonly itemNotes?: string | null;
  readonly quantityScaled: bigint;
  readonly unitName?: string;
  readonly unitPriceMinor: bigint;
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
  readonly paymentStatus: PaymentStatus;
  readonly isOverdue: boolean;
}
