import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { AuditEventRepository } from '../../src/data/repositories/AuditEventRepository';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { QUANTITY_SCALE } from '../../src/domain/documents/types';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Document Operating System Graph Conversion', () => {
  let customerId: string;

  beforeEach(async () => {
    const mockDb = getMockDb();
    mockDb.reset();
    await DatabaseManager.initDatabaseAsync(mockDb as any);

    const customer = await CustomerRepository.create({
      name: 'Acme Global Corp',
      email: 'finance@acmeglobal.com',
    });
    customerId = customer.id;
  });

  it('converts an accepted estimate to invoice with lineage tracking', async () => {
    const estimate = await DocumentRepository.saveDraft({
      docType: 'estimate',
      customerId,
      issueDate: Date.now(),
      currency: 'USD',
      items: [
        {
          description: 'Architecture Audit',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitName: 'service',
          unitPriceMinor: 100000n,
        },
      ],
    });

    const issuedEst = await DocumentRepository.issueDocument(estimate.id);
    expect(issuedEst.lifecycle_status).toBe('issued');

    const invoiceDraft = await DocumentRepository.convertDocument(issuedEst.id, 'invoice');

    expect(invoiceDraft.doc_type).toBe('invoice');
    expect(invoiceDraft.lifecycle_status).toBe('draft');
    expect(invoiceDraft.parent_document_id).toBe(issuedEst.id);
    expect(invoiceDraft.customer_id).toBe(customerId);
    expect(invoiceDraft.items.length).toBe(1);
    expect(invoiceDraft.items[0].description).toBe('Architecture Audit');
    expect(invoiceDraft.total_minor).toBe(100000);

    // Verify source estimate was marked accepted
    const reloadedEst = await DocumentRepository.getById(issuedEst.id);
    expect(reloadedEst!.lifecycle_status).toBe('accepted');
  });

  it('converts an issued invoice to a delivery note retaining lineage', async () => {
    const invoiceDraft = await DocumentRepository.saveDraft({
      docType: 'invoice',
      customerId,
      issueDate: Date.now(),
      currency: 'USD',
      shippingAddress: '42 Freight Blvd, Port Logistics Hub',
      items: [
        {
          description: 'Industrial Sensor Pack',
          quantityScaled: 5n * QUANTITY_SCALE,
          unitName: 'box',
          unitPriceMinor: 20000n,
        },
      ],
    });

    const issuedInvoice = await DocumentRepository.issueDocument(invoiceDraft.id);
    expect(issuedInvoice.lifecycle_status).toBe('issued');

    const deliveryNoteDraft = await DocumentRepository.convertDocument(issuedInvoice.id, 'delivery_note');

    expect(deliveryNoteDraft.doc_type).toBe('delivery_note');
    expect(deliveryNoteDraft.lifecycle_status).toBe('draft');
    expect(deliveryNoteDraft.parent_document_id).toBe(issuedInvoice.id);
    expect(deliveryNoteDraft.shipping_address).toBe('42 Freight Blvd, Port Logistics Hub');
    expect(deliveryNoteDraft.items.length).toBe(1);
    expect(deliveryNoteDraft.items[0].description).toBe('Industrial Sensor Pack');

    // Verify audit event
    const events = await AuditEventRepository.getEventsForEntity('document', deliveryNoteDraft.id);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].action).toBe('convert_invoice_to_delivery_note');
  });
});
