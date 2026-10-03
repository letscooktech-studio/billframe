/**
 * PARTNER CAPABILITY MODEL & CONNECTION STATES
 * Provider-agnostic lifecycle states for connected financial gateways.
 */

export type PartnerCapabilityState =
  | 'NOT_CONFIGURED'             // Gateway is unconfigured; Direct UPI is the sole digital method
  | 'SANDBOX'                    // Local/testnet simulation mode for developer testing
  | 'PARTNER_APPROVAL_REQUIRED'  // Production registration pending approval with gateway partner
  | 'PRODUCTION_AVAILABLE'       // Partner application approved; ready for merchant OAuth onboarding
  | 'CONNECTED'                  // Merchant account active and processing live payments
  | 'SUSPENDED';                 // Merchant connection disabled or paused

export interface GatewayCapabilities {
  paymentLinks: boolean;
  upiAutopay: boolean;
  instantRefunds: boolean;
  internationalCards: boolean;
  webhookReconciliation: boolean;
}

export interface ConnectedMerchantAccount {
  businessId: string;
  legalName: string;
  countryIso2: string;
  provider: 'razorpay' | 'cashfree' | 'stripe' | 'other';
  partnerMerchantId?: string;
  gatewayAccountId?: string;
  status: PartnerCapabilityState;
  capabilities: GatewayCapabilities;
  createdAt: number;
  updatedAt: number;
}
