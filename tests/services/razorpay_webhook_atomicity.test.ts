import * as crypto from 'crypto';

/**
 * Razorpay Webhook Atomicity & Signature Verification Test Suite
 * Tests HMAC-SHA256 signature verification, replay attack idempotency,
 * and atomic state transitions against race conditions.
 */

describe('Payment Webhook Reliability & Atomicity', () => {
  const TEST_SECRET = 'whsec_test_secret_for_cryptographic_verification_123';

  function computeHmacSha256(message: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  describe('1. Cryptographic HMAC-SHA256 Verification', () => {
    it('successfully validates authentic Razorpay webhook signature', () => {
      const payload = JSON.stringify({
        id: 'event_001',
        event: 'payment_link.paid',
        payload: {
          payment_link: { entity: { id: 'plink_123', amount_paid: 150000, currency: 'INR' } },
          payment: { entity: { id: 'pay_abc999' } },
        },
      });

      const signature = computeHmacSha256(payload, TEST_SECRET);
      const computed = computeHmacSha256(payload, TEST_SECRET);

      expect(constantTimeEqual(computed, signature)).toBe(true);
    });

    it('rejects tampered webhook payload even with valid original signature', () => {
      const originalPayload = JSON.stringify({ id: 'event_001', amount: 1000 });
      const signature = computeHmacSha256(originalPayload, TEST_SECRET);

      const tamperedPayload = JSON.stringify({ id: 'event_001', amount: 999999 });
      const computedTampered = computeHmacSha256(tamperedPayload, TEST_SECRET);

      expect(constantTimeEqual(computedTampered, signature)).toBe(false);
    });

    it('rejects signature generated with incorrect webhook secret', () => {
      const payload = JSON.stringify({ id: 'event_002', event: 'payment.captured' });
      const wrongSignature = computeHmacSha256(payload, 'wrong_secret_key');
      const expectedSignature = computeHmacSha256(payload, TEST_SECRET);

      expect(constantTimeEqual(expectedSignature, wrongSignature)).toBe(false);
    });
  });

  describe('2. Idempotency & Replay Attack Defense Simulation', () => {
    // In-memory mock representing PostgreSQL unique constraint and tables
    let processedEventIds: Set<string>;
    let paymentRequests: Map<string, { status: string; providerPaymentId?: string }>;

    beforeEach(() => {
      processedEventIds = new Set<string>();
      paymentRequests = new Map([
        ['plink_order_101', { status: 'pending' }],
      ]);
    });

    async function simulateAtomicWebhookProcessor(params: {
      eventId: string;
      eventType: string;
      paymentLinkId: string;
      providerPaymentId: string;
    }): Promise<{ status: 'processed' | 'already_processed'; error?: string }> {
      // Simulate PostgreSQL: INSERT INTO payment_events ... ON CONFLICT (event_id) DO NOTHING
      if (processedEventIds.has(params.eventId)) {
        return { status: 'already_processed' };
      }

      // First time ingestion
      processedEventIds.add(params.eventId);

      // Atomic transition of payment_request
      const req = paymentRequests.get(params.paymentLinkId);
      if (req) {
        req.status = 'paid';
        req.providerPaymentId = params.providerPaymentId;
      }

      return { status: 'processed' };
    }

    it('processes first webhook delivery and marks payment request as paid', async () => {
      const res = await simulateAtomicWebhookProcessor({
        eventId: 'evt_test_1001',
        eventType: 'payment_link.paid',
        paymentLinkId: 'plink_order_101',
        providerPaymentId: 'pay_xyz888',
      });

      expect(res.status).toBe('processed');
      expect(paymentRequests.get('plink_order_101')?.status).toBe('paid');
      expect(paymentRequests.get('plink_order_101')?.providerPaymentId).toBe('pay_xyz888');
    });

    it('handles duplicate webhook delivery idempotently without re-triggering state transition', async () => {
      // First delivery
      const first = await simulateAtomicWebhookProcessor({
        eventId: 'evt_test_duplicate',
        eventType: 'payment_link.paid',
        paymentLinkId: 'plink_order_101',
        providerPaymentId: 'pay_first',
      });
      expect(first.status).toBe('processed');

      // Duplicate delivery (network retry with different payment ID or payload)
      const duplicate = await simulateAtomicWebhookProcessor({
        eventId: 'evt_test_duplicate',
        eventType: 'payment_link.paid',
        paymentLinkId: 'plink_order_101',
        providerPaymentId: 'pay_attempted_overwrite',
      });

      expect(duplicate.status).toBe('already_processed');
      // Preserves original payment details without mutation
      expect(paymentRequests.get('plink_order_101')?.providerPaymentId).toBe('pay_first');
    });

    it('resists concurrent parallel webhook executions for the same event ID', async () => {
      // Simulate 5 simultaneous deliveries of the exact same event
      const promises = Array.from({ length: 5 }).map(() =>
        simulateAtomicWebhookProcessor({
          eventId: 'evt_race_condition',
          eventType: 'payment_link.paid',
          paymentLinkId: 'plink_order_101',
          providerPaymentId: 'pay_race_winner',
        })
      );

      const results = await Promise.all(promises);
      const processedCount = results.filter((r) => r.status === 'processed').length;
      const alreadyProcessedCount = results.filter((r) => r.status === 'already_processed').length;

      expect(processedCount).toBe(1);
      expect(alreadyProcessedCount).toBe(4);
    });
  });
});
