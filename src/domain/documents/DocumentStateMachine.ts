/**
 * DOCUMENT STATE MACHINE & ISSUANCE VALIDATOR
 * Enforces valid state transitions and guarantees drafts allow zero items while issuance requires >= 1 valid item.
 */

import { DocumentLifecycleStatus, EstimateLifecycleStatus, LineItemInput } from './types';

export interface DocumentValidationTarget {
  readonly customerId?: string | null;
  readonly items: readonly LineItemInput[];
  readonly issueDateTimestamp?: number | null;
  readonly currency: string;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

/**
 * Validates whether a draft document is eligible for issuance.
 * Invariant: Drafts permit 0 items (for autosave), but issuance strictly requires:
 * 1. Customer assigned
 * 2. At least 1 valid line item with positive quantity and unit price >= 0
 * 3. Valid issue date timestamp
 * 4. Valid currency
 */
export function validateForIssuance(doc: DocumentValidationTarget): ValidationResult {
  if (!doc.customerId || !doc.customerId.trim()) {
    return {
      isValid: false,
      error: 'A customer must be selected before issuing this document.',
    };
  }

  if (!doc.currency || !doc.currency.trim()) {
    return {
      isValid: false,
      error: 'Currency must be specified.',
    };
  }

  if (!doc.issueDateTimestamp || doc.issueDateTimestamp <= 0) {
    return {
      isValid: false,
      error: 'Issue date must be specified.',
    };
  }

  if (!doc.items || doc.items.length === 0) {
    return {
      isValid: false,
      error: 'At least one line item is required to issue this document.',
    };
  }

  for (let i = 0; i < doc.items.length; i++) {
    const item = doc.items[i];
    if (!item.description || !item.description.trim()) {
      return {
        isValid: false,
        error: `Item #${i + 1} is missing a description.`,
      };
    }
    if (item.quantityScaled <= 0n) {
      return {
        isValid: false,
        error: `Item #${i + 1} ("${item.description}") must have a quantity greater than zero.`,
      };
    }
    if (item.unitPriceMinor < 0n) {
      return {
        isValid: false,
        error: `Item #${i + 1} ("${item.description}") cannot have a negative unit price.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates Invoice lifecycle state transitions.
 */
export function canTransitionInvoiceLifecycle(
  from: DocumentLifecycleStatus,
  to: DocumentLifecycleStatus
): boolean {
  if (from === to) return true;

  switch (from) {
    case 'draft':
      return to === 'issued' || to === 'void';
    case 'issued':
      return to === 'void';
    case 'void':
      return false; // Terminal state
    default:
      return false;
  }
}

/**
 * Validates Estimate lifecycle state transitions.
 */
export function canTransitionEstimateLifecycle(
  from: EstimateLifecycleStatus,
  to: EstimateLifecycleStatus
): boolean {
  if (from === to) return true;

  switch (from) {
    case 'draft':
      return to === 'issued' || to === 'void';
    case 'issued':
      return to === 'accepted' || to === 'rejected' || to === 'expired' || to === 'void';
    case 'accepted':
      return to === 'void';
    case 'rejected':
      return to === 'void';
    case 'expired':
      return to === 'void';
    case 'void':
      return false; // Terminal state
    default:
      return false;
  }
}
