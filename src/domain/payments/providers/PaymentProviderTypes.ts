/**
 * PAYMENT GATEWAY PROVIDER DOMAIN TYPES
 * Interface contracts for Razorpay, Cashfree, Stripe, and unified online payment link workflows.
 */

export type PaymentGatewayId = 'razorpay' | 'cashfree' | 'stripe' | 'manual';

export interface ProviderCredentials {
  readonly keyId: string;
  readonly keySecret?: string;
  readonly webhookSecret?: string;
  readonly isTestnet?: boolean;
}

export interface PaymentLinkInput {
  readonly documentId: string;
  readonly invoiceNumber: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly customerName: string;
  readonly customerEmail?: string | null;
  readonly customerPhone?: string | null;
  readonly description: string;
  readonly expiryTimestamp?: number;
}

export interface PaymentLinkResult {
  readonly paymentLinkId: string;
  readonly shortUrl: string;
  readonly status: 'created' | 'active' | 'paid' | 'expired';
  readonly provider: PaymentGatewayId;
  readonly rawResponse?: any;
}

export interface NormalizedWebhookEvent {
  readonly eventId: string;
  readonly eventType: 'payment.captured' | 'payment_link.paid' | 'payment.failed' | 'refund.processed';
  readonly provider: PaymentGatewayId;
  readonly documentId?: string | null;
  readonly invoiceNumber?: string | null;
  readonly providerPaymentId: string;
  readonly providerOrderId?: string | null;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly paymentMethod: 'upi' | 'card' | 'bank_transfer' | 'other';
  readonly eventTimestamp: number;
  readonly status: 'completed' | 'failed' | 'refunded';
  readonly rawPayload: any;
}

export interface PaymentGatewayProvider {
  readonly providerId: PaymentGatewayId;
  createPaymentLink(
    input: PaymentLinkInput,
    credentials: ProviderCredentials
  ): Promise<PaymentLinkResult>;
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    webhookSecret: string
  ): boolean;
  parseWebhookPayload(body: any): NormalizedWebhookEvent | null;
}
