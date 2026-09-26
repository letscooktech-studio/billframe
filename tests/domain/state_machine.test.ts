/**
 * DOCUMENT STATE MACHINE & NUMBERING UNIT TESTS
 */

import {
  canTransitionEstimateLifecycle,
  canTransitionInvoiceLifecycle,
  validateForIssuance,
} from '../../src/domain/documents/DocumentStateMachine';
import { formatDocumentNumber, isValidPrefix } from '../../src/domain/numbering/SequenceEngine';

describe('Document State Machine & Validation', () => {
  test('Draft permits 0 items for autosaving, but issuance strictly rejects 0 items', () => {
    const emptyDraft = {
      customerId: 'cust_123',
      items: [],
      issueDateTimestamp: Date.now(),
      currency: 'USD',
    };

    const result = validateForIssuance(emptyDraft);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('At least one line item is required');
  });

  test('Issuance rejects missing customer', () => {
    const noCustomer = {
      customerId: '',
      items: [{ description: 'Dev', quantityScaled: 10000n, unitPriceMinor: 1000n }],
      issueDateTimestamp: Date.now(),
      currency: 'USD',
    };

    const result = validateForIssuance(noCustomer);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('customer must be selected');
  });

  test('Issuance rejects zero or negative item quantities', () => {
    const zeroQty = {
      customerId: 'cust_123',
      items: [{ description: 'Dev', quantityScaled: 0n, unitPriceMinor: 1000n }],
      issueDateTimestamp: Date.now(),
      currency: 'USD',
    };

    const result = validateForIssuance(zeroQty);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('quantity greater than zero');
  });

  test('Issuance accepts valid complete document', () => {
    const validDoc = {
      customerId: 'cust_123',
      items: [{ description: 'Dev', quantityScaled: 10000n, unitPriceMinor: 1000n }],
      issueDateTimestamp: Date.now(),
      currency: 'USD',
    };

    const result = validateForIssuance(validDoc);
    expect(result.isValid).toBe(true);
  });

  test('Invoice lifecycle state transition matrix', () => {
    expect(canTransitionInvoiceLifecycle('draft', 'issued')).toBe(true);
    expect(canTransitionInvoiceLifecycle('draft', 'void')).toBe(true);
    expect(canTransitionInvoiceLifecycle('issued', 'void')).toBe(true);
    expect(canTransitionInvoiceLifecycle('void', 'draft')).toBe(false);
    expect(canTransitionInvoiceLifecycle('void', 'issued')).toBe(false);
  });

  test('Estimate lifecycle state transition matrix', () => {
    expect(canTransitionEstimateLifecycle('draft', 'issued')).toBe(true);
    expect(canTransitionEstimateLifecycle('issued', 'accepted')).toBe(true);
    expect(canTransitionEstimateLifecycle('issued', 'rejected')).toBe(true);
    expect(canTransitionEstimateLifecycle('issued', 'expired')).toBe(true);
    expect(canTransitionEstimateLifecycle('accepted', 'void')).toBe(true);
    expect(canTransitionEstimateLifecycle('void', 'accepted')).toBe(false);
  });
});

describe('Document Numbering Engine', () => {
  test('Monotonic sequence formatting with padding', () => {
    expect(formatDocumentNumber('INV-', 1, 4)).toBe('INV-0001');
    expect(formatDocumentNumber('INV-', 25, 4)).toBe('INV-0025');
    expect(formatDocumentNumber('EST-', 18, 4)).toBe('EST-0018');
    expect(formatDocumentNumber('RCP-', 1, 4)).toBe('RCP-0001');
    expect(formatDocumentNumber('INV-', 9999, 4)).toBe('INV-9999');
    expect(formatDocumentNumber('INV-', 10000, 4)).toBe('INV-10000');
  });

  test('Prefix validation', () => {
    expect(isValidPrefix('INV-')).toBe(true);
    expect(isValidPrefix('EST_')).toBe(true);
    expect(isValidPrefix('BILL2026')).toBe(true);
    expect(isValidPrefix('INVALID PREFIX WITH SPACES')).toBe(false);
    expect(isValidPrefix('')).toBe(false);
  });
});
