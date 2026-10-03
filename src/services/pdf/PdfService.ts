/**
 * PDF GENERATION & SHARING SERVICE
 * Orchestrates HTML template rendering, native PDF printing via expo-print,
 * and system share intent via expo-sharing.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { FullDocument } from '../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { ReceiptRecord } from '../../data/repositories/PaymentRepository';
import { PdfPaperSize, PdfTemplateType } from './types';
import { renderStandardTemplate } from './templates/standardTemplate';
import { renderCompactTemplate } from './templates/compactTemplate';
import { renderModernTemplate } from './templates/modernTemplate';
import { renderExecutiveTemplate } from './templates/executiveTemplate';
import { renderMinimalTemplate } from './templates/minimalTemplate';
import { renderReceiptTemplate } from './templates/receiptTemplate';

export class PdfService {
  /**
   * Compiles complete self-contained HTML for an invoice, estimate, or order.
   */
  static generateDocumentHtml(
    doc: FullDocument,
    business: BusinessProfile,
    template: PdfTemplateType = 'standard',
    paperSize: PdfPaperSize = 'a4'
  ): string {
    switch (template) {
      case 'compact':
        return renderCompactTemplate(doc, business, paperSize);
      case 'modern':
        return renderModernTemplate(doc, business, paperSize);
      case 'executive':
        return renderExecutiveTemplate(doc, business, paperSize);
      case 'minimal':
        return renderMinimalTemplate(doc, business, paperSize);
      case 'standard':
      default:
        return renderStandardTemplate(doc, business, paperSize);
    }
  }

  /**
   * Compiles self-contained HTML for a payment receipt.
   */
  static generateReceiptHtml(
    receipt: ReceiptRecord,
    business: BusinessProfile,
    paperSize: PdfPaperSize = 'a4'
  ): string {
    return renderReceiptTemplate(receipt, business, paperSize);
  }

  /**
   * Renders HTML to a local PDF file and returns the file URI.
   */
  static async createPdfFileAsync(html: string): Promise<string> {
    if (Platform.OS === 'web') {
      // On web, open print dialogue for direct PDF generation / save
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 350);
        }
      }
      return 'web_preview';
    }

    const { uri } = await Print.printToFileAsync({
      html,
    });
    return uri;
  }

  /**
   * Generates PDF and presents the native Android/iOS system share sheet.
   */
  static async shareDocumentPdfAsync(
    doc: FullDocument,
    business: BusinessProfile,
    template: PdfTemplateType = 'standard',
    paperSize: PdfPaperSize = 'a4'
  ): Promise<void> {
    const html = this.generateDocumentHtml(doc, business, template, paperSize);

    if (Platform.OS === 'web') {
      await this.createPdfFileAsync(html);
      return;
    }

    const uri = await this.createPdfFileAsync(html);
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      const docTypeLabel = doc.doc_type.replace('_', ' ').toUpperCase();
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${docTypeLabel} #${doc.document_number}`,
        UTI: 'com.adobe.pdf',
      });
    }
  }

  /**
   * Generates receipt PDF and triggers share sheet.
   */
  static async shareReceiptPdfAsync(
    receipt: ReceiptRecord,
    business: BusinessProfile,
    paperSize: PdfPaperSize = 'a4'
  ): Promise<void> {
    const html = this.generateReceiptHtml(receipt, business, paperSize);

    if (Platform.OS === 'web') {
      await this.createPdfFileAsync(html);
      return;
    }

    const uri = await this.createPdfFileAsync(html);
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Receipt #${receipt.receipt_number}`,
        UTI: 'com.adobe.pdf',
      });
    }
  }
}
