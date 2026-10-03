/**
 * PROVIDER WEBHOOK SERVICE INTERFACE
 * Backend verification and ingestion interface for gateway events.
 */

export interface WebhookVerificationContext {
  rawBody: string;
  signature: string;
  provider: 'razorpay' | 'cashfree' | 'stripe';
  headers?: Record<string, string>;
}

export interface IngestedWebhookResult {
  eventId: string;
  eventType: string;
  provider: string;
  isVerified: boolean;
  businessId?: string;
  documentId?: string;
  amountMinor?: bigint;
  status: 'processed' | 'ignored' | 'failed';
}

export interface ProviderWebhookService {
  /**
   * Verifies incoming webhook cryptographic signature against server vault secret.
   */
  verifySignature(context: WebhookVerificationContext): Promise<boolean>;

  /**
   * Ingests, dedupes, and processes an incoming webhook event.
   */
  ingestEvent(context: WebhookVerificationContext): Promise<IngestedWebhookResult>;
}
