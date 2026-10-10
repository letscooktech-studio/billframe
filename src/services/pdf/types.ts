/**
 * PDF GENERATION ENGINE TYPES
 * Supports offline HTML template compilation, A4 and US Letter paper formats,
 * customized brand styles, column visibility, and high-fidelity rendering via expo-print.
 */

import { FullDocument } from '../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { ReceiptRecord } from '../../data/repositories/PaymentRepository';

export type PdfTemplateType =
  | 'standard'
  | 'compact'
  | 'modern'
  | 'executive'
  | 'minimal'
  | 'executive_ink'
  | 'ledger_navy'
  | 'architectural_grid'
  | 'modern_editorial'
  | 'commerce_compact'
  | 'service_record'
  | 'monochrome_minimal';

export type PdfPaperSize = 'a4' | 'letter';

export interface ColumnVisibilityConfig {
  hsn?: boolean;
  taxRate?: boolean;
  unit?: boolean;
  discount?: boolean;
  description?: boolean;
  total?: boolean;
}

export interface TemplateCustomization {
  id?: string;
  template_code: PdfTemplateType | string;
  business_profile_id?: string;
  brand_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_position?: 'left' | 'center' | 'right';
  show_logo?: boolean;
  show_tax_breakdown?: boolean;
  show_payment_qr?: boolean;
  show_signature?: boolean;
  show_terms?: boolean;
  custom_declaration?: string | null;
  custom_footer_notes?: string | null;
  column_visibility?: ColumnVisibilityConfig;
}

export interface PdfDocumentRenderData {
  document: FullDocument;
  business: BusinessProfile;
  template?: PdfTemplateType;
  paperSize?: PdfPaperSize;
  customization?: TemplateCustomization;
}

export interface PdfReceiptRenderData {
  receipt: ReceiptRecord;
  business: BusinessProfile;
  template?: PdfTemplateType;
  paperSize?: PdfPaperSize;
  customization?: TemplateCustomization;
}

export interface GeneratedPdfResult {
  uri: string;
  numberOfPages?: number;
}
