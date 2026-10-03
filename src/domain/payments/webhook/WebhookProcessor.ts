/**
 * PAYMENT GATEWAY WEBHOOK PROCESSOR
 * 
 * Invariants:
 * 1. Cryptographic HMAC-SHA256 signature verification before inspecting payload.
 * 2. Strict idempotency guard against provider_payment_id to prevent double-crediting.
 * 3. Authoritative atomic payment recording + receipt issuance via PaymentRepository.
 * 4. Zero floating-point operations; pure BigInt minor units.
 */

import { DocumentRepository } from '../../../data/repositories/DocumentRepository';
import { PaymentRepository } from '../../../data/repositories/PaymentRepository';
import { PaymentGatewayProvider } from '../providers/PaymentProviderTypes';
import { RazorpayProvider } from '../providers/RazorpayProvider';

export interface WebhookProcessResult {
  readonly success: boolean;
  readonly isDuplicate?: boolean;
  readonly status: 'payment_recorded' | 'already_processed' | 'invoice_already_paid' | 'error';
  readonly error?: string;
  readonly paymentId?: string;
  readonly receiptNumber?: string;
  readonly details?: Record<string, any>;
}

export class WebhookProcessor {
  private static defaultRazorpay = new RazorpayProvider();

  /**
   * Authoritatively processes an incoming payment gateway webhook.
   */
  static async processWebhook(options: {
    rawBody: string;
    signatureHeader: string;
    webhookSecret: string;
    provider?: PaymentGatewayProvider;
  }): Promise<WebhookProcessResult> {
    const { rawBody, signatureHeader, webhookSecret } = options;
    const provider = options.provider || this.defaultRazorpay;

    // 1. Signature Verification
    if (!signatureHeader || !webhookSecret || !rawBody) {
      return {
        success: false,
        status: 'error',
        error: 'missing_signature_or_secret',
      };
    }

    const isValidSig = provider.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
    if (!isValidSig) {
      return {
        success: false,
        status: 'error',
        error: 'invalid_signature',
      };
    }

    // 2. Parse JSON & Normalize Event
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        error: 'malformed_json_body',
        details: { message: err?.message },
      };
    }

    const event = provider.parseWebhookPayload(parsedBody);
    if (!event) {
      return {
        success: false,
        status: 'error',
        error: 'unsupported_event_type',
        details: { event: parsedBody?.event },
      };
    }

    // 3. Strict Idempotency Protection: Check existing payment by provider_payment_id
    const existing = await PaymentRepository.getPaymentByProviderPaymentId(event.providerPaymentId);
    if (existing) {
      return {
        success: true,
        isDuplicate: true,
        status: 'already_processed',
        paymentId: existing.id,
      };
    }

    // 4. Resolve Target Document
    let doc = event.documentId ? await DocumentRepository.getById(event.documentId) : null;
    if (!doc && event.invoiceNumber) {
      doc = await DocumentRepository.getByDocumentNumber(event.invoiceNumber);
    }

    if (!doc) {
      return {
        success: false,
        status: 'error',
        error: 'invoice_not_found',
        details: {
          documentId: event.documentId,
          invoiceNumber: event.invoiceNumber,
        },
      };
    }

    if (doc.lifecycle_status !== 'issued') {
      return {
        success: false,
        status: 'error',
        error: `invoice_not_in_issued_state: current=${doc.lifecycle_status}`,
      };
    }

    // 5. Check Balance
    const balanceMinor = BigInt(doc.balance_minor);
    if (balanceMinor <= 0n) {
      return {
        success: true,
        isDuplicate: false,
        status: 'invoice_already_paid',
      };
    }

    // 6. Record Payment with Webhook Verification Flag
    const amountToApply = event.amountMinor > balanceMinor ? balanceMinor : event.amountMinor;

    const { payment, receipt } = await PaymentRepository.recordPayment({
      invoiceId: doc.id,
      amountMinor: amountToApply,
      paymentMethod: event.paymentMethod,
      reference: event.providerPaymentId,
      notes: `Online payment received via ${event.provider.toUpperCase()} (${event.providerPaymentId})`,
      provider: event.provider,
      providerPaymentId: event.providerPaymentId,
      providerOrderId: event.providerOrderId,
      verificationState: 'verified_webhook',
      verifiedAt: event.eventTimestamp,
      settlementState: 'settled',
      source: 'invoice_payment',
    });

    return {
      success: true,
      isDuplicate: false,
      status: 'payment_recorded',
      paymentId: payment.id,
      receiptNumber: receipt.receipt_number,
    };
  }
}
