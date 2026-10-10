/**
 * STANDARD INVOICE / ESTIMATE / RECEIPT PDF TEMPLATE
 * Restrained, professional corporate/freelancer layout.
 * Pure offline HTML/CSS with deterministic formatting.
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney, createMoney, moneyToDecimalString } from '../../../domain/money/Money';
import { quantityScaledToString } from '../../../domain/documents/quantity';
import { escapeHtml, formatDate, getBaseCss } from './commonStyles';
import { DirectUpiEngine } from '../../../domain/payments/upi/DirectUpiEngine';
import { QrCodeGenerator } from '../../../domain/payments/upi/QrCodeGenerator';
import { TemplateCustomization } from '../types';

export function renderStandardTemplate(
  doc: FullDocument,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4',
  customization?: TemplateCustomization
): string {
  const currency = doc.currency || 'USD';

  const docTitle =
    doc.doc_type === 'estimate'
      ? 'ESTIMATE'
      : doc.doc_type === 'receipt'
      ? 'PAYMENT RECEIPT'
      : doc.doc_type === 'credit_note'
      ? 'CREDIT NOTE'
      : doc.doc_type === 'proforma'
      ? 'PROFORMA INVOICE'
      : doc.doc_type === 'delivery_note'
      ? 'DELIVERY NOTE'
      : doc.doc_type === 'work_order'
      ? 'WORK ORDER'
      : 'INVOICE';

  const itemsHtml = (doc.items || [])
    .map((item, idx) => {
      const qtyStr = quantityScaledToString(BigInt(item.quantity_scaled));
      const rateStr = formatMoney({ amountMinor: BigInt(item.unit_price_minor), currency });
      const totalStr = formatMoney({ amountMinor: BigInt(item.line_total_minor), currency });

      return `
        <tr>
          <td style="width: 5%;"><strong>${idx + 1}</strong></td>
          <td style="width: 50%;">
            <div style="font-weight: 600; color: #0f172a;">${escapeHtml(item.description)}</div>
            ${item.item_notes ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(item.item_notes)}</div>` : ''}
          </td>
          <td class="text-right" style="width: 15%;">${qtyStr} <span style="font-size: 10px; color: #64748b;">${escapeHtml(item.unit_name || '')}</span></td>
          <td class="text-right" style="width: 15%;">${rateStr}</td>
          <td class="text-right" style="width: 15%; font-weight: 600;">${totalStr}</td>
        </tr>
      `;
    })
    .join('');

  const subtotalStr = formatMoney({ amountMinor: BigInt(doc.subtotal_minor), currency });
  const totalStr = formatMoney({ amountMinor: BigInt(doc.total_minor), currency });
  const depositStr = doc.deposit_minor ? formatMoney({ amountMinor: BigInt(doc.deposit_minor), currency }) : null;
  const paidStr = doc.total_paid_minor ? formatMoney({ amountMinor: BigInt(doc.total_paid_minor), currency }) : null;
  const balanceStr = formatMoney({ amountMinor: BigInt(doc.balance_minor ?? doc.total_minor), currency });

  let discountRow = '';
  if (doc.discount_minor && doc.discount_minor > 0) {
    const discStr = formatMoney({ amountMinor: BigInt(doc.discount_minor), currency });
    discountRow = `
      <div class="totals-row">
        <span>Discount:</span>
        <span style="color: #059669;">-${discStr}</span>
      </div>
    `;
  }

  let taxRow = '';
  if (doc.tax_minor && doc.tax_minor > 0) {
    const taxStr = formatMoney({ amountMinor: BigInt(doc.tax_minor), currency });
    const taxRateStr = (doc.tax_rate_bp / 100).toFixed(2);
    taxRow = `
      <div class="totals-row">
        <span>${escapeHtml(doc.tax_label || 'Tax')} (${taxRateStr}%):</span>
        <span>${taxStr}</span>
      </div>
    `;
  }

  let statusBadge = '';
  if (doc.payment_status === 'paid') {
    statusBadge = '<span class="badge badge-paid">Paid</span>';
  } else if (doc.payment_status === 'partially_paid') {
    statusBadge = '<span class="badge badge-partial">Partially Paid</span>';
  } else if (doc.lifecycle_status === 'issued') {
    statusBadge = '<span class="badge badge-unpaid">Payment Due</span>';
  } else if (doc.lifecycle_status === 'draft') {
    statusBadge = '<span class="badge badge-draft">Draft</span>';
  }

  const brandColor = customization?.brand_color || '#0f172a';
  const secondaryColor = customization?.secondary_color || '#475569';
  const showLogo = customization?.show_logo !== false && !!business.logo_uri;
  const showQr = customization?.show_payment_qr !== false;
  const showTerms = customization?.show_terms !== false;
  const showSignature = customization?.show_signature !== false;
  const customDeclaration = customization?.custom_declaration;
  const customFooterNotes = customization?.custom_footer_notes;

  let upiSection = '';
  if (
    doc.doc_type === 'invoice' &&
    business.upi_vpa &&
    (doc.balance_minor ?? doc.total_minor) > 0 &&
    showQr
  ) {
    try {
      const balanceMinorBig = BigInt(doc.balance_minor ?? doc.total_minor);
      const conversion = DirectUpiEngine.buildUpiUriWithCurrencyConversion({
        vpa: business.upi_vpa,
        payeeName: business.legal_name || business.name || 'Merchant',
        sourceAmountMinor: balanceMinorBig,
        sourceCurrency: currency,
        transactionRef: doc.document_number,
        transactionNote: `Invoice ${doc.document_number}`,
      });
      const qrSvg = QrCodeGenerator.generateSvg(conversion.upiUri, 110, { color: brandColor, backgroundColor: '#ffffff' });

      const amountDisplay = conversion.isConverted
        ? `<div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 2px;">Pay: ₹${moneyToDecimalString(createMoney(conversion.inrAmountMinor!, 'INR'))} INR <span style="font-size: 10px; color: #64748b; font-weight: normal;">(${escapeHtml(conversion.conversionSummary || '')})</span></div>`
        : `<div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 2px;">Amount: ${balanceStr}</div>`;

      upiSection = `
        <div style="margin-top: 14px; margin-bottom: 14px; padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 700; color: ${brandColor}; font-size: 12px; margin-bottom: 3px;">Scan &amp; Pay via UPI (0% Fee)</div>
            <div style="font-size: 11px; color: #475569;">GPay, PhonePe, Paytm, BHIM, or any UPI app</div>
            <div style="font-size: 11px; color: ${brandColor}; font-weight: 600; margin-top: 5px;">UPI ID: ${escapeHtml(business.upi_vpa)}</div>
            ${amountDisplay}
          </div>
          <div style="background-color: #ffffff; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; display: inline-block;">
            ${qrSvg}
          </div>
        </div>
      `;
    } catch {
      // Non-blocking fallback
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(docTitle)} - ${escapeHtml(doc.document_number)}</title>
      <style>
        ${getBaseCss(paperSize)}

        .header-layout {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid ${brandColor};
          padding-bottom: 20px;
          margin-bottom: 20px;
        }

        .biz-title {
          font-size: 20px;
          font-weight: 800;
          color: ${brandColor};
          letter-spacing: -0.3px;
        }

        .doc-header-right {
          text-align: right;
        }

        .doc-title-main {
          font-size: 24px;
          font-weight: 900;
          color: ${brandColor};
          letter-spacing: 0.5px;
          line-height: 1.1;
        }

        .meta-table {
          margin-top: 10px;
          font-size: 12px;
          color: #334155;
        }

        .meta-table td {
          padding: 2px 0 2px 14px;
          text-align: right;
        }

        .meta-table td.label {
          color: ${secondaryColor};
          font-weight: 600;
        }

        .parties-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 20px;
        }

        .party-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 14px;
          font-size: 12px;
        }

        .party-card h4 {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${secondaryColor};
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header-layout">
          <div>
            ${showLogo ? `<div style="margin-bottom: 8px;"><img src="${escapeHtml(business.logo_uri!)}" style="max-height: 48px; max-width: 140px; object-fit: contain;" alt="Logo" /></div>` : ''}
            <div class="biz-title">${escapeHtml(business.name)}</div>
            ${business.legal_name && business.legal_name !== business.name ? `<div style="color: #64748b; font-size: 12px;">${escapeHtml(business.legal_name)}</div>` : ''}
            ${business.address_line1 ? `<div style="margin-top: 4px; color: #475569;">${escapeHtml(business.address_line1)}</div>` : ''}
            ${business.city || business.state || business.postal_code ? `<div style="color: #475569;">${escapeHtml([business.city, business.state, business.postal_code].filter(Boolean).join(', '))}</div>` : ''}
            ${business.tax_id ? `<div style="color: #64748b; font-size: 11px; margin-top: 4px;"><strong>Tax ID / GSTIN:</strong> ${escapeHtml(business.tax_id)}</div>` : ''}
            ${business.email ? `<div style="color: #475569; font-size: 11px;">${escapeHtml(business.email)}</div>` : ''}
            ${business.phone ? `<div style="color: #475569; font-size: 11px;">${escapeHtml(business.phone)}</div>` : ''}
          </div>

          <div class="doc-header-right">
            <div class="doc-title-main">${escapeHtml(docTitle)}</div>
            <div style="margin-top: 4px;">${statusBadge}</div>

            <table class="meta-table" align="right">
              <tr>
                <td class="label">${escapeHtml(docTitle)} #:</td>
                <td><strong>${escapeHtml(doc.document_number)}</strong></td>
              </tr>
              <tr>
                <td class="label">Date:</td>
                <td>${formatDate(doc.issue_date)}</td>
              </tr>
              ${doc.due_date ? `
                <tr>
                  <td class="label">Due Date:</td>
                  <td><strong>${formatDate(doc.due_date)}</strong></td>
                </tr>
              ` : ''}
              ${doc.po_number ? `
                <tr>
                  <td class="label">PO / Job Ref:</td>
                  <td>${escapeHtml(doc.po_number)}</td>
                </tr>
              ` : ''}
              ${doc.payment_terms_preset ? `
                <tr>
                  <td class="label">Terms:</td>
                  <td>${escapeHtml(doc.payment_terms_preset.replace('_', ' ').toUpperCase())}</td>
                </tr>
              ` : ''}
            </table>
          </div>
        </div>

        <!-- Parties Section -->
        <div class="parties-grid avoid-break">
          <div class="party-card">
            <h4>Billed To</h4>
            <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${escapeHtml(doc.customer_name || 'Valued Client')}</div>
            ${doc.customer_business_name ? `<div style="color: #475569;">${escapeHtml(doc.customer_business_name)}</div>` : ''}
            ${doc.customer_billing_address ? `<div style="color: #475569; margin-top: 4px; white-space: pre-line;">${escapeHtml(doc.customer_billing_address)}</div>` : ''}
            ${doc.customer_email ? `<div style="color: #64748b; font-size: 11px; margin-top: 4px;">${escapeHtml(doc.customer_email)}</div>` : ''}
            ${doc.customer_phone ? `<div style="color: #64748b; font-size: 11px;">${escapeHtml(doc.customer_phone)}</div>` : ''}
          </div>

          ${doc.shipping_address ? `
            <div class="party-card">
              <h4>Shipping / Site Address</h4>
              <div style="color: #475569; white-space: pre-line;">${escapeHtml(doc.shipping_address)}</div>
            </div>
          ` : ''}
        </div>

        <!-- Line Items Table -->
        <table class="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-grid">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${subtotalStr}</span>
            </div>
            ${discountRow}
            ${taxRow}
            <div class="totals-row grand-total">
              <span>Total:</span>
              <span>${totalStr}</span>
            </div>
            ${depositStr ? `
              <div class="totals-row">
                <span>Deposit Applied:</span>
                <span style="color: #059669;">-${depositStr}</span>
              </div>
            ` : ''}
            ${paidStr ? `
              <div class="totals-row">
                <span>Payments Received:</span>
                <span style="color: #059669;">-${paidStr}</span>
              </div>
            ` : ''}
            <div class="totals-row balance-due">
              <span>Balance Due:</span>
              <span>${balanceStr}</span>
            </div>
          </div>
        </div>

        <!-- Direct UPI QR Code Section -->
        ${upiSection}

        <!-- Payment Instructions & Notes -->
        ${(doc.payment_instructions || doc.notes || (doc.terms && showTerms)) ? `
          <div class="footer-block">
            ${doc.payment_instructions ? `
              <div style="margin-bottom: 12px;">
                <strong style="color: #334155; font-size: 12px;">Payment Instructions:</strong>
                <div style="margin-top: 3px; white-space: pre-line; color: #475569;">${escapeHtml(doc.payment_instructions)}</div>
              </div>
            ` : ''}
            ${doc.notes ? `
              <div style="margin-bottom: 12px;">
                <strong style="color: #334155; font-size: 12px;">Notes:</strong>
                <div style="margin-top: 3px; white-space: pre-line; color: #475569;">${escapeHtml(doc.notes)}</div>
              </div>
            ` : ''}
            ${(doc.terms && showTerms) ? `
              <div style="margin-bottom: 8px;">
                <strong style="color: #334155; font-size: 12px;">Terms & Conditions:</strong>
                <div style="margin-top: 3px; white-space: pre-line; color: #64748b; font-size: 10.5px;">${escapeHtml(doc.terms)}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Custom Declaration -->
        ${customDeclaration ? `
          <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11.5px; color: ${secondaryColor};">
            <strong style="color: ${brandColor};">Declaration:</strong>
            <div style="margin-top: 2px; white-space: pre-line;">${escapeHtml(customDeclaration)}</div>
          </div>
        ` : ''}

        <!-- Signature Section if applicable -->
        ${(doc.signature_uri && showSignature) ? `
          <div class="signature-box">
            <div class="signature-inner">
              <div style="color: #059669; margin-bottom: 4px; font-size: 12px;">Accepted &amp; Signed</div>
              ${doc.signature_date ? `<div>${formatDate(doc.signature_date)}</div>` : ''}
              <div style="margin-top: 4px; color: #64748b;">Authorized Signature</div>
            </div>
          </div>
        ` : ''}

        <!-- Custom Footer Notes -->
        ${customFooterNotes ? `
          <div style="margin-top: 20px; text-align: center; font-size: 11px; color: ${secondaryColor}; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
            ${escapeHtml(customFooterNotes)}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
