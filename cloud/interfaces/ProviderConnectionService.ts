/**
 * PROVIDER CONNECTION SERVICE INTERFACE
 * Backend interface for merchant OAuth onboarding and status synchronization.
 */

import { ConnectedMerchantAccount, PartnerCapabilityState } from './PartnerCapabilityModel';

export interface AuthorizeMerchantInput {
  businessId: string;
  provider: 'razorpay' | 'cashfree' | 'stripe';
  authCode: string;
  redirectUri: string;
}

export interface AuthorizeMerchantResult {
  businessId: string;
  provider: string;
  gatewayAccountId: string;
  status: PartnerCapabilityState;
}

export interface ProviderConnectionService {
  /**
   * Exchanges OAuth authorization code with partner gateway securely server-side.
   */
  authorizeMerchant(input: AuthorizeMerchantInput): Promise<AuthorizeMerchantResult>;

  /**
   * Retrieves current connection status and enabled capabilities for a merchant.
   */
  getMerchantStatus(businessId: string, provider: string): Promise<ConnectedMerchantAccount | null>;

  /**
   * Revokes or disconnects a merchant gateway connection.
   */
  revokeConnection(businessId: string, provider: string): Promise<void>;
}
