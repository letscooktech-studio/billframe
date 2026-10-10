/**
 * BUSINESS PROFILE TYPES
 * Defines the seller entity for invoices, tax identities, and localized settings.
 */

export interface BusinessProfile {
  id: string;
  name: string;
  legal_name?: string | null;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  country_iso2: string;
  subdivision_code?: string | null;
  subdivision_name?: string | null;
  phone_country_iso2?: string | null;
  phone_e164?: string | null;
  upi_vpa?: string | null;
  contact_person?: string | null;
  website?: string | null;
  tagline?: string | null;
  signatory_name?: string | null;
  signatory_title?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_branch?: string | null;
  bank_account_type?: string | null;
  header_style?: 'modern' | 'classic' | 'minimal' | null;
  footer_show_signature?: boolean | null;
  footer_show_stamp?: boolean | null;
  footer_show_address?: boolean | null;
  logo_uri?: string | null;
  default_currency: string;
  default_document_locale: string;
  default_payment_terms?: string | null;
  default_notes?: string | null;
  is_active: boolean | number;
  created_at: number;
  updated_at: number;
}
