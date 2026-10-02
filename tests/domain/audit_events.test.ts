import { AuditEventRepository } from '../../src/data/repositories/AuditEventRepository';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { PaymentRepository } from '../../src/data/repositories/PaymentRepository';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Audit Events & Financial Integrity Ledger', () => {
  beforeEach(() => {
    getMockDb().reset();
  });

  it('records immutable audit events when issuing documents', async () => {
    const cust = await CustomerRepository.createCustomer({ name: 'Omega Tech' });
    const draft = await DocumentRepository.saveDraft({
      businessProfileId: 'default_business_profile',
      customerId: cust.id,
      docType: 'invoice',
      currency: 'USD',
      issueDate: Date.now(),
      items: [
        {
          description: 'Security Audit',
          quantityScaled: 10000n,
          unitPriceMinor: 50000n,
          unitName: 'hour',
        },
      ],
    });

    const issued = await DocumentRepository.issueDocument(draft.id);

    const events = await AuditEventRepository.getEventsForEntity('document', issued.id);
    expect(events.length).toBe(1);
    expect(events[0].action).toBe('issue');
    expect(events[0].entity_type).toBe('document');
    expect(events[0].entity_id).toBe(issued.id);

    const payload = JSON.parse(events[0].payload_json || '{}');
    expect(payload.documentNumber).toBe(issued.document_number);
    expect(payload.totalMinor).toBe(50000);
  });

  it('records audit events when payments are recorded and documents are voided', async () => {
    const cust = await CustomerRepository.createCustomer({ name: 'Beta Logistics' });
    const draft = await DocumentRepository.saveDraft({
      businessProfileId: 'default_business_profile',
      customerId: cust.id,
      docType: 'invoice',
      currency: 'USD',
      issueDate: Date.now(),
      items: [
        {
          description: 'Freight Charges',
          quantityScaled: 10000n,
          unitPriceMinor: 100000n,
        },
      ],
    });

    const invoice = await DocumentRepository.issueDocument(draft.id);

    const { payment } = await PaymentRepository.recordPayment({
      invoiceId: invoice.id,
      amountMinor: 40000n,
      paymentMethod: 'bank_transfer',
    });

    const paymentEvents = await AuditEventRepository.getEventsForEntity('payment', payment.id);
    expect(paymentEvents.length).toBe(1);
    expect(paymentEvents[0].action).toBe('record_payment');

    await DocumentRepository.voidDocument(invoice.id);
    const docEvents = await AuditEventRepository.getEventsForEntity('document', invoice.id);
    expect(docEvents.length).toBe(2); // 'issue' and 'void'
    expect(docEvents.some((e) => e.action === 'void')).toBe(true);
  });
});
