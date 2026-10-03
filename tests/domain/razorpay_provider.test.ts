import { HmacSha256 } from '../../src/domain/payments/crypto/HmacSha256';
import { RazorpayProvider } from '../../src/domain/payments/providers/RazorpayProvider';
import { WebhookProcessor } from '../../src/domain/payments/webhook/WebhookProcessor';
import { PaymentConnectionRepository } from '../../src/data/repositories/PaymentConnectionRepository';
import { PaymentRepository } from '../../src/data/repositories/PaymentRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { BusinessProfileRepository } from '../../src/data/repositories/BusinessProfileRepository';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Phase 2D/2E: Razorpay Provider, HMAC-SHA256, and Webhook Processing', () => {
  beforeEach(async () => {
    const db = getMockDb();
    db.reset();
    await DatabaseManager.initDatabaseAsync(db as any);
  });

  describe('HmacSha256 Cryptographic Primitives', () => {
    it('computes correct HMAC-SHA256 hash matching known reference values', () => {
      // Test vector RFC 4231 Case 2: key = "Jefe", data = "what do ya want for nothing?"
      const key = 'Jefe';
      const data = 'what do ya want for nothing?';
      const expected = '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843';

      const computed = HmacSha256.compute(data, key);
      expect(computed.toLowerCase()).toBe(expected.toLowerCase());
    });

    it('verifies timing-safe equality correctly', () => {
      const a = '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843';
      const b = '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843';
      const tampered = '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3844';
      const short = '5bdcc146bf60';

      expect(HmacSha256.timingSafeEqual(a, b)).toBe(true);
      expect(HmacSha256.timingSafeEqual(a, tampered)).toBe(false);
      expect(HmacSha256.timingSafeEqual(a, short)).toBe(false);
      expect(HmacSha256.timingSafeEqual('', '')).toBe(true);
    });
  });

  describe('RazorpayProvider', () => {
    const provider = new RazorpayProvider();
    const webhookSecret = 'test_webhook_secret_9988';

    it('verifies valid webhook signature and rejects tampered bodies', () => {
      const rawPayload = JSON.stringify({
        event: 'payment_link.paid',
        payload: { payment_link: { entity: { id: 'plink_123', amount: 50000 } } },
      });

      const validSig = HmacSha256.compute(rawPayload, webhookSecret);
      expect(provider.verifyWebhookSignature(rawPayload, validSig, webhookSecret)).toBe(true);

      // Tampered payload
      const tamperedPayload = rawPayload + ' ';
      expect(provider.verifyWebhookSignature(tamperedPayload, validSig, webhookSecret)).toBe(false);

      // Wrong secret
      expect(provider.verifyWebhookSignature(rawPayload, validSig, 'wrong_secret')).toBe(false);
    });

    it('generates offline deterministic payment link fallback', async () => {
      const link = await provider.createPaymentLink(
        {
          documentId: 'doc_inv_101',
          invoiceNumber: 'INV-2026-001',
          amountMinor: 250000n,
          currency: 'INR',
          customerName: 'Aditi Sharma',
          customerPhone: '+919876543210',
          description: 'Invoice INV-2026-001',
        },
        { keyId: 'rzp_test_key_123', isTestnet: true }
      );

      expect(link.paymentLinkId).toBeDefined();
      expect(link.shortUrl).toContain('rzp.io/i/');
      expect(link.provider).toBe('razorpay');
      expect(link.status).toBe('active');
    });

    it('rejects payment link generation if amount is zero or negative', async () => {
      await expect(
        provider.createPaymentLink(
          {
            documentId: 'doc_1',
            invoiceNumber: 'INV-1',
            amountMinor: 0n,
            currency: 'INR',
            customerName: 'Test',
            description: 'Test',
          },
          { keyId: 'k1' }
        )
      ).rejects.toThrow('Payment link amount must be greater than zero.');
    });

    it('parses and normalizes payment_link.paid webhook event', () => {
      const mockPayload = {
        id: 'evt_rzp_999',
        event: 'payment_link.paid',
        created_at: 1774000000,
        payload: {
          payment_link: {
            entity: {
              id: 'plink_abc123',
              reference_id: 'doc_test_inv_001',
              description: 'INV-001',
              amount_paid: 150000,
              currency: 'INR',
            },
          },
          payment: {
            entity: {
              id: 'pay_rzp_pay_777',
              order_id: 'order_rzp_ord_444',
              method: 'upi',
            },
          },
        },
      };

      const normalized = provider.parseWebhookPayload(mockPayload);
      expect(normalized).not.toBeNull();
      expect(normalized!.eventType).toBe('payment_link.paid');
      expect(normalized!.documentId).toBe('doc_test_inv_001');
      expect(normalized!.providerPaymentId).toBe('pay_rzp_pay_777');
      expect(normalized!.providerOrderId).toBe('order_rzp_ord_444');
      expect(normalized!.amountMinor).toBe(150000n);
      expect(normalized!.currency).toBe('INR');
      expect(normalized!.paymentMethod).toBe('upi');
      expect(normalized!.status).toBe('completed');
    });

    it('returns null for unsupported event types', () => {
      const mockPayload = {
        event: 'refund.failed',
        payload: {},
      };
      expect(provider.parseWebhookPayload(mockPayload)).toBeNull();
    });
  });

  describe('PaymentConnectionRepository', () => {
    it('upserts and retrieves Razorpay gateway credentials for a profile', async () => {
      const profile = await BusinessProfileRepository.getActiveProfile();
      expect(profile).not.toBeNull();

      const saved = await PaymentConnectionRepository.upsertConnection({
        businessProfileId: profile!.id,
        provider: 'razorpay',
        keyId: 'rzp_test_Ac99B4cdef',
        merchantAccountReference: 'acc_test_12345',
        isActive: true,
        isTestnet: true,
        status: 'sandbox',
      });

      expect(saved.key_id).toBe('rzp_test_Ac99B4cdef');
      expect(saved.merchant_account_reference).toBe('acc_test_12345');
      expect(saved.is_active).toBe(1);
      expect(saved.is_testnet).toBe(1);
      expect(saved.status).toBe('sandbox');

      const retrieved = await PaymentConnectionRepository.getConnection(profile!.id, 'razorpay');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.key_id).toBe('rzp_test_Ac99B4cdef');

      // Toggle active
      await PaymentConnectionRepository.toggleActive(profile!.id, 'razorpay', false);
      const disabled = await PaymentConnectionRepository.getConnection(profile!.id, 'razorpay');
      expect(disabled!.is_active).toBe(0);
    });
  });

  describe('WebhookProcessor and Idempotency Guard', () => {
    const webhookSecret = 'test_webhook_sec_12345';
    let invoiceId: string;
    let invoiceNumber: string;

    beforeEach(async () => {
      const profile = await BusinessProfileRepository.getActiveProfile();
      const customer = await CustomerRepository.create({
        name: 'Tech Ventures Ltd',
        email: 'billing@techventures.in',
        phone: '+919988776655',
      });

      const draft = await DocumentRepository.saveDraft({
        businessProfileId: profile!.id,
        customerId: customer.id,
        docType: 'invoice',
        issueDate: Date.now(),
        currency: 'INR',
        items: [
          {
            description: 'Software Consulting Services',
            quantityScaled: 10000n, // 1.0 unit
            unitPriceMinor: 100000n, // ₹1,000.00
          },
        ],
      });

      const issued = await DocumentRepository.issueDocument(draft.id);
      invoiceId = issued.id;
      invoiceNumber = issued.document_number;
    });

    it('rejects webhooks with invalid signatures', async () => {
      const payload = JSON.stringify({
        event: 'payment_link.paid',
        payload: {
          payment_link: {
            entity: {
              id: 'plink_abc',
              reference_id: invoiceId,
              amount_paid: 100000,
              currency: 'INR',
            },
          },
        },
      });

      const result = await WebhookProcessor.processWebhook({
        rawBody: payload,
        signatureHeader: 'invalid_tampered_signature',
        webhookSecret,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('invalid_signature');
    });

    it('records payment, issues receipt, and strictly enforces idempotency against duplicate webhooks', async () => {
      const mockWebhookBody = {
        id: 'evt_123456789',
        event: 'payment_link.paid',
        created_at: 1774001000,
        payload: {
          payment_link: {
            entity: {
              id: 'plink_inv_test_01',
              reference_id: invoiceId,
              description: invoiceNumber,
              amount_paid: 100000, // ₹1,000.00 (full invoice)
              currency: 'INR',
            },
          },
          payment: {
            entity: {
              id: 'pay_rzp_unique_tx_888',
              order_id: 'order_rzp_888',
              method: 'upi',
            },
          },
        },
      };

      const rawBody = JSON.stringify(mockWebhookBody);
      const validSig = HmacSha256.compute(rawBody, webhookSecret);

      // 1. First execution: should record payment successfully
      const result1 = await WebhookProcessor.processWebhook({
        rawBody,
        signatureHeader: validSig,
        webhookSecret,
      });

      expect(result1.success).toBe(true);
      expect(result1.isDuplicate).toBe(false);
      expect(result1.status).toBe('payment_recorded');
      expect(result1.paymentId).toBeDefined();
      expect(result1.receiptNumber).toBeDefined();

      // Verify invoice balance is now 0 and paid
      const updatedInvoice = await DocumentRepository.getById(invoiceId);
      expect(updatedInvoice!.balance_minor).toBe(0);
      expect(updatedInvoice!.payment_status).toBe('paid');

      // Verify payment record in DB
      const payments = await PaymentRepository.getPaymentsForInvoice(invoiceId);
      expect(payments.length).toBe(1);
      expect(payments[0].provider_payment_id).toBe('pay_rzp_unique_tx_888');
      expect(payments[0].verification_state).toBe('verified_webhook');
      expect(payments[0].provider).toBe('razorpay');

      // 2. Second execution with identical payload (Webhook retry / re-delivery)
      const result2 = await WebhookProcessor.processWebhook({
        rawBody,
        signatureHeader: validSig,
        webhookSecret,
      });

      // Must be flagged as duplicate and NOT create duplicate payments or corrupt balance
      expect(result2.success).toBe(true);
      expect(result2.isDuplicate).toBe(true);
      expect(result2.status).toBe('already_processed');
      expect(result2.paymentId).toBe(result1.paymentId);

      // Verify payments count is still exactly 1
      const paymentsAfterRetry = await PaymentRepository.getPaymentsForInvoice(invoiceId);
      expect(paymentsAfterRetry.length).toBe(1);
      expect(paymentsAfterRetry[0].id).toBe(result1.paymentId);

      // Balance remains strictly zero
      const recheckedInvoice = await DocumentRepository.getById(invoiceId);
      expect(recheckedInvoice!.balance_minor).toBe(0);
    });
  });
});
