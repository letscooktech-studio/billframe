import { AiRagRegistry } from '../../src/services/ai/AiRagRegistry';
import { AiDocumentAgent } from '../../src/services/ai/AiDocumentAgent';

describe('AiRagRegistry & Multi-Document Archetype Disambiguation', () => {
  it('correctly classifies Quotation/Estimate instead of defaulting to Invoice', () => {
    const results = AiRagRegistry.retrieve('Create a commercial quotation for Acme Corp for 5 enterprise laptops at 60000 INR');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('quotation');
    expect(results[0].name).toContain('Quotation');
  });

  it('correctly classifies Delivery Challan / Dispatch Note instead of Invoice', () => {
    const results = AiRagRegistry.retrieve('Generate a delivery challan for 20 monitors shipped to Warehouse B via MH-02-1234');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('delivery_challan');
    expect(results[0].name).toContain('Delivery Challan');
  });

  it('correctly classifies Purchase Order', () => {
    const results = AiRagRegistry.retrieve('Issue purchase order PO-2026-99 to Intel Corporation for 50 chipsets at 12000 INR');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('purchase_order');
    expect(results[0].name).toContain('Purchase Order');
  });

  it('correctly classifies Credit Note', () => {
    const results = AiRagRegistry.retrieve('Draft a credit note for damaged goods return for Apex Ltd 5000 INR');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('credit_note');
  });

  it('correctly classifies Payment Receipt', () => {
    const results = AiRagRegistry.retrieve('Create a payment receipt for 15,000 INR received from Global Systems via UPI');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('receipt');
  });

  it('correctly classifies Meeting Minutes', () => {
    const results = AiRagRegistry.retrieve('Prepare meeting minutes for quarterly architectural review');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('meeting_minutes');
  });

  it('correctly classifies Equipment Responsibility Letter', () => {
    const results = AiRagRegistry.retrieve('Create an equipment handover responsibility letter for MacBook Pro assigned to David');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('equipment_responsibility');
  });

  it('detects multi-document compound request ("invoice and delivery challan")', () => {
    const detection = AiRagRegistry.detectMultiDocumentRequest('Create an invoice and a delivery challan for Acme Corp for 10 monitors at 15000 INR');
    expect(detection.isMulti).toBe(true);
    expect(detection.archetypes.length).toBeGreaterThanOrEqual(2);
    const ids = detection.archetypes.map((a) => a.id);
    expect(ids).toContain('invoice');
    expect(ids).toContain('delivery_challan');
  });

  it('detects multi-document quantity multiplier ("create 2 invoices")', () => {
    const detection = AiRagRegistry.detectMultiDocumentRequest('Create 2 invoices for Acme Corp and Beta LLC');
    expect(detection.isMulti).toBe(true);
    expect(detection.archetypes.length).toBe(2);
  });

  it('generates multi-document drafts in deterministic heuristic mode', async () => {
    const result = await AiDocumentAgent.runDeterministicHeuristic(
      'Create a quotation and a delivery challan for Apex Corp for 5 laptops at 50000 each'
    );
    expect(result.drafts).toBeDefined();
    expect(result.drafts!.length).toBe(2);
    expect(result.drafts![0].docType).toBe('quotation');
    expect(result.drafts![1].docType).toBe('delivery_challan');
    expect(result.drafts![0].partyName).toContain('Apex Corp');
    expect(result.drafts![1].partyName).toContain('Apex Corp');
  });
});
