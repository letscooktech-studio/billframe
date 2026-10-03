/**
 * PROVIDER PAYMENT REQUEST SERVICE INTERFACE
 * Handles backend creation, expiry, and querying of online payment links.
 */

export interface CreatePaymentRequestInput {
  businessId: string;
  documentId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amountMinor: bigint;
  currency: string;
  provider: 'razorpay' | 'cashfree' | 'stripe';
  expiryTimestamp?: number;
}

export interface PaymentRequestResult {
  paymentRequestId: string;
  providerReferenceId: string;
  paymentUrl: string;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  rawResponse?: any;
}

export interface ProviderPaymentRequestService {
  /**
   * Generates an official payment link using backend partner credentials.
   */
  createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentRequestResult>;

  /**
   * Cancels or expires an active payment link.
   */
  cancelPaymentRequest(businessId: string, paymentRequestId: string): Promise<boolean>;

  /**
   * Queries payment status directly from provider API.
   */
  getPaymentRequestStatus(businessId: string, paymentRequestId: string): Promise<PaymentRequestResult | null>;
}
