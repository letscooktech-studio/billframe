/**
 * PDF GENERATION ENGINE TYPES
 * Supports offline HTML template compilation, A4 and US Letter paper formats,
 * and high-fidelity rendering via expo-print.
 */

import { FullDocument } from '../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { ReceiptRecord } from '../../data/repositories/PaymentRepository';

export type PdfTemplateType = 'standard' | 'compact' | 'modern';
export type PdfPaperSize = 'a4' | 'letter';

export interface PdfDocumentRenderData {
  document: FullDocument;
  business: BusinessProfile;
  template?: PdfTemplateType;
  paperSize?: PdfPaperSize;
}

export interface PdfReceiptRenderData {
  receipt: ReceiptRecord;
  business: BusinessProfile;
  template?: PdfTemplateType;
  paperSize?: PdfPaperSize;
}

export interface GeneratedPdfResult {
  uri: string;
  numberOfPages?: number;
}
