/**
 * HISTORICAL DOCUMENT SNAPSHOT BUILDER
 * Freezes complete seller, buyer, line-item, tax, and calculation data upon document issuance.
 * Ensures subsequent edits to customers or business profile never rewrite issued financial documents.
 */

import { DocumentCalculationOutput } from './types';

export interface SellerSnapshot {
  readonly businessProfileId: string;
  readonly name: string;
  readonly legalName?: string | null;
  readonly taxId?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly postalCode?: string | null;
  readonly country?: string | null;
  readonly logoUri?: string | null;
  readonly paymentInstructions?: string | null;
}

export interface BuyerSnapshot {
  readonly customerId: string;
  readonly name: string;
  readonly businessName?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly billingAddress?: string | null;
  readonly shippingAddress?: string | null;
  readonly taxId?: string | null;
  readonly country?: string | null;
}

export interface DocumentSnapshotData {
  readonly snapshotVersion: 1;
  readonly documentId: string;
  readonly documentNumber: string;
  readonly docType: string;
  readonly issueDate: number;
  readonly dueDate?: number | null;
  readonly currency: string;
  readonly seller: SellerSnapshot;
  readonly buyer: BuyerSnapshot;
  readonly items: readonly {
    readonly id: string;
    readonly description: string;
    readonly quantityScaled: string; // Serialized BigInt
    readonly unitName: string;
    readonly unitPriceMinor: string; // Serialized BigInt
    readonly lineTotalMinor: string; // Serialized BigInt
  }[];
  readonly financials: {
    readonly subtotalMinor: string;
    readonly discountMinor: string;
    readonly discountType: string;
    readonly discountValue: string;
    readonly taxableBaseMinor: string;
    readonly taxType: string;
    readonly taxRateBasisPoints: string;
    readonly taxLabel: string;
    readonly taxMinor: string;
    readonly totalMinor: string;
    readonly depositMinor?: string;
  };
  readonly poNumber?: string | null;
  readonly paymentTermsPreset?: string | null;
  readonly shippingAddress?: string | null;
  readonly paymentInstructions?: string | null;
  readonly signatureUri?: string | null;
  readonly signatureDate?: number | null;
  readonly notes?: string | null;
  readonly terms?: string | null;
  readonly frozenAt: number;
}

export function buildDocumentSnapshot(
  documentId: string,
  documentNumber: string,
  docType: string,
  issueDate: number,
  dueDate: number | null | undefined,
  seller: SellerSnapshot,
  buyer: BuyerSnapshot,
  calc: DocumentCalculationOutput,
  discountType: string,
  discountValue: bigint,
  taxType: string,
  taxRateBasisPoints: bigint,
  taxLabel: string,
  notes?: string | null,
  terms?: string | null,
  extra?: {
    poNumber?: string | null;
    paymentTermsPreset?: string | null;
    shippingAddress?: string | null;
    paymentInstructions?: string | null;
    signatureUri?: string | null;
    signatureDate?: number | null;
  }
): DocumentSnapshotData {
  return {
    snapshotVersion: 1,
    documentId,
    documentNumber,
    docType,
    issueDate,
    dueDate: dueDate || null,
    currency: calc.currency,
    seller,
    buyer,
    items: calc.items.map((item) => ({
      id: item.id,
      description: item.description,
      itemNotes: item.itemNotes || null,
      quantityScaled: item.quantityScaled.toString(),
      unitName: item.unitName,
      unitPriceMinor: item.unitPriceMinor.toString(),
      lineTotalMinor: item.lineTotalMinor.toString(),
    })),
    financials: {
      subtotalMinor: calc.subtotal.amountMinor.toString(),
      discountMinor: calc.discount.amountMinor.toString(),
      discountType,
      discountValue: discountValue.toString(),
      taxableBaseMinor: calc.taxableBase.amountMinor.toString(),
      taxType,
      taxRateBasisPoints: taxRateBasisPoints.toString(),
      taxLabel,
      taxMinor: calc.tax.amountMinor.toString(),
      totalMinor: calc.grandTotal.amountMinor.toString(),
      depositMinor: calc.deposit.amountMinor.toString(),
    },
    poNumber: extra?.poNumber || null,
    paymentTermsPreset: extra?.paymentTermsPreset || null,
    shippingAddress: extra?.shippingAddress || null,
    paymentInstructions: extra?.paymentInstructions || null,
    signatureUri: extra?.signatureUri || null,
    signatureDate: extra?.signatureDate || null,
    notes: notes || null,
    terms: terms || null,
    frozenAt: Date.now(),
  };
}
