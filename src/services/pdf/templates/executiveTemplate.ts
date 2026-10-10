/**
 * EXECUTIVE MONO PDF TEMPLATE
 * Elite monochrome executive layout: Swiss modernist typography,
 * crisp hairline rules, monospace tabular alignment, and zero fluff.
 * Designed for corporate B2B, legal, architecture, and executive consulting.
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney, createMoney, moneyToDecimalString } from '../../../domain/money/Money';
import { quantityScaledToString } from '../../../domain/documents/quantity';
import { escapeHtml, formatDate, getBaseCss } from './commonStyles';
import { DirectUpiEngine } from '../../../domain/payments/upi/DirectUpiEngine';
import { QrCodeGenerator } from '../../../domain/payments/upi/QrCodeGenerator';
import { TemplateCustomization } from '../types';

export function renderExecutiveTemplate(
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
      ? 'RECEIPT'
      : doc.doc_type === 'credit_note'
      ? 'CREDIT NOTE'
      : doc.doc_type === 'proforma'
      ? 'PROFORMA INVOICE'
      : doc.doc_type === 'delivery_note'
      ? 'DELIVERY NOTE'
      : doc.doc_type === 'work_order'
      ? 'WORK ORDER'
      : doc.doc_type === 'sow'
      ? 'STATEMENT OF WORK'
      : doc.doc_type === 'proposal'
      ? 'PROPOSAL'
      : 'INVOICE';

  const itemsHtml = (doc.items || [])
    .map((item, idx) => {
      const qtyStr = quantityScaledToString(BigInt(item.quantity_scaled));
      const rateStr = formatMoney({ amountMinor: BigInt(item.unit_price_minor), currency });
      const totalStr = formatMoney({ amountMinor: BigInt(item.line_total_minor), currency });

      return `
        <tr>
          <td style="width: 6%; color: #6b7280; font-family: monospace;">${(idx + 1).toString().padStart(2, '0')}</td>
          <td style="width: 48%;">
            <div style="font-weight: 700; color: #111827; letter-spacing: -0.2px;">${escapeHtml(item.description)}</div>
            ${item.item_notes ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${escapeHtml(item.item_notes)}</div>` : ''}
          </td>
          <td class="text-right" style="width: 14%; font-family: monospace; color: #374151;">${qtyStr} ${escapeHtml(item.unit_name || '')}</td>
          <td class="text-right" style="width: 16%; font-family: monospace; color: #374151;">${rateStr}</td>
          <td class="text-right" style="width: 16%; font-family: monospace; font-weight: 700; color: #111827;">${totalStr}</td>
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
      <div class="exec-totals-row">
        <span>Discount:</span>
        <span style="font-family: monospace;">-${discStr}</span>
      </div>
    `;
  }

  let taxRow = '';
  if (doc.tax_minor && doc.tax_minor > 0) {
    const taxStr = formatMoney({ amountMinor: BigInt(doc.tax_minor), currency });
    const taxRateStr = (doc.tax_rate_bp / 100).toFixed(2);
    taxRow = `
      <div class="exec-totals-row">
        <span>${escapeHtml(doc.tax_label || 'Tax')} (${taxRateStr}%):</span>
        <span style="font-family: monospace;">${taxStr}</span>
      </div>
    `;
  }

  const brandColor = customization?.brand_color || '#111827';
  const secondaryColor = customization?.secondary_color || '#4b5563';
  const showLogo = customization?.show_logo !== false && !!business.logo_uri;
  const showQr = customization?.show_payment_qr !== false;
  const showTerms = customization?.show_terms !== false;
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

      const qrSvg = QrCodeGenerator.generateSvg(conversion.upiUri, 96, { color: brandColor, backgroundColor: '#ffffff' });

      const amountSub = conversion.isConverted
        ? `Scan to pay ₹${moneyToDecimalString(createMoney(conversion.inrAmountMinor!, 'INR'))} INR (${escapeHtml(conversion.conversionSummary || '')})`
        : `Scan to pay ${balanceStr} zero fees`;

      upiSection = `
        <div class="exec-upi-box">
          <div style="margin-right: 14px;">${qrSvg}</div>
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Instant Settlement</div>
            <div style="font-size: 12px; margin-top: 2px; font-family: monospace;">${escapeHtml(business.upi_vpa)}</div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">${amountSub}</div>
          </div>
        </div>
      `;
    } catch {
      // Fallback
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(docTitle)} ${escapeHtml(doc.document_number)}</title>
      <style>
        ${getBaseCss(paperSize)}

        .exec-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid ${brandColor};
          padding-bottom: 20px;
          margin-bottom: 24px;
        }

        .exec-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: ${brandColor};
          margin: 0 0 4px 0;
        }

        .exec-doc-num {
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }

        .exec-seller-info {
          text-align: right;
          font-size: 11.5px;
          color: #374151;
          line-height: 1.5;
        }

        .exec-seller-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2px;
        }

        .exec-parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
          font-size: 11.5px;
          line-height: 1.5;
        }

        .exec-party-col {
          width: 46%;
        }

        .exec-party-heading {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }

        .exec-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 11px;
        }

        .exec-meta-item strong {
          display: block;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .exec-meta-item span {
          font-family: monospace;
          font-size: 12px;
          font-weight: 600;
          color: #111827;
        }

        .exec-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }

        .exec-table th {
          border-bottom: 1.5px solid #111827;
          padding: 8px 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #111827;
        }

        .exec-table td {
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 6px;
        }

        .exec-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 16px;
        }

        .exec-notes-col {
          width: 52%;
          font-size: 11px;
          line-height: 1.5;
          color: #4b5563;
        }

        .exec-notes-box {
          border-left: 2px solid #111827;
          padding-left: 10px;
          margin-bottom: 14px;
        }

        .exec-totals-col {
          width: 42%;
        }

        .exec-totals-box {
          border: 1px solid #111827;
          padding: 14px;
          background: #ffffff;
        }

        .exec-totals-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 11.5px;
          color: #4b5563;
        }

        .exec-totals-divider {
          height: 1px;
          background: #111827;
          margin: 8px 0;
        }

        .exec-total-grand {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 15px;
          font-weight: 800;
          color: #111827;
        }

        .exec-balance-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 10px;
          margin-top: 10px;
          background: ${brandColor};
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
        }

        .exec-upi-box {
          display: flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          padding: 10px;
          background: #f9fafb;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="exec-header">
        <div>
          ${showLogo ? `<div style="margin-bottom: 8px;"><img src="${escapeHtml(business.logo_uri!)}" style="max-height: 48px; max-width: 140px; object-fit: contain;" alt="Logo" /></div>` : ''}
          <h1 class="exec-title">${escapeHtml(docTitle)}</h1>
          <div class="exec-doc-num">${escapeHtml(doc.document_number)}</div>
        </div>
        <div class="exec-seller-info">
          <div class="exec-seller-name">${escapeHtml(business.legal_name || business.name)}</div>
          ${business.tax_id ? `<div>Tax ID: ${escapeHtml(business.tax_id)}</div>` : ''}
          ${business.address_line1 ? `<div>${escapeHtml(business.address_line1)}</div>` : ''}
          ${business.city || business.state ? `<div>${escapeHtml([business.city, business.state].filter(Boolean).join(', '))} ${escapeHtml(business.postal_code || '')}</div>` : ''}
          ${business.email || business.phone ? `<div>${escapeHtml([business.email, business.phone].filter(Boolean).join(' • '))}</div>` : ''}
        </div>
      </div>

      <!-- Parties -->
      <div class="exec-parties">
        <div class="exec-party-col">
          <div class="exec-party-heading">Client / Bill To</div>
          <div style="font-size: 13px; font-weight: 700; color: #111827;">${escapeHtml(doc.customer_name || 'Client')}</div>
          ${doc.customer_business_name ? `<div>${escapeHtml(doc.customer_business_name)}</div>` : ''}
          ${doc.customer_billing_address ? `<div style="white-space: pre-line; color: #4b5563;">${escapeHtml(doc.customer_billing_address)}</div>` : ''}
          ${doc.customer_email || doc.customer_phone ? `<div style="color: #6b7280;">${escapeHtml([doc.customer_email, doc.customer_phone].filter(Boolean).join(' • '))}</div>` : ''}
        </div>

        ${doc.shipping_address ? `
          <div class="exec-party-col">
            <div class="exec-party-heading">Project / Site Delivery</div>
            <div style="white-space: pre-line; color: #374151;">${escapeHtml(doc.shipping_address)}</div>
          </div>
        ` : '<div class="exec-party-col"></div>'}
      </div>

      <!-- Metadata Strip -->
      <div class="exec-meta-grid">
        <div class="exec-meta-item">
          <strong>Issue Date</strong>
          <span>${formatDate(doc.issue_date)}</span>
        </div>
        <div class="exec-meta-item">
          <strong>Due Date</strong>
          <span>${doc.due_date ? formatDate(doc.due_date) : 'On Receipt'}</span>
        </div>
        <div class="exec-meta-item">
          <strong>PO Number</strong>
          <span>${doc.po_number ? escapeHtml(doc.po_number) : '—'}</span>
        </div>
        <div class="exec-meta-item">
          <strong>Payment Terms</strong>
          <span>${doc.payment_terms_preset ? escapeHtml(doc.payment_terms_preset.replace('_', ' ').toUpperCase()) : 'NET 30'}</span>
        </div>
      </div>

      <!-- Line Items Table -->
      <table class="exec-table">
        <thead>
          <tr>
            <th class="text-left">#</th>
            <th class="text-left">Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Bottom: Notes & Totals -->
      <div class="exec-bottom">
        <div class="exec-notes-col">
          ${doc.notes ? `
            <div class="exec-notes-box">
              <strong style="display: block; font-size: 10px; text-transform: uppercase; color: #111827; margin-bottom: 2px;">Notes & Instructions</strong>
              ${escapeHtml(doc.notes)}
            </div>
          ` : ''}

          ${(doc.terms && showTerms) ? `
            <div class="exec-notes-box">
              <strong style="display: block; font-size: 10px; text-transform: uppercase; color: ${brandColor}; margin-bottom: 2px;">Terms & Conditions</strong>
              ${escapeHtml(doc.terms)}
            </div>
          ` : ''}

          ${customDeclaration ? `
            <div class="exec-notes-box">
              <strong style="display: block; font-size: 10px; text-transform: uppercase; color: ${brandColor}; margin-bottom: 2px;">Declaration</strong>
              ${escapeHtml(customDeclaration)}
            </div>
          ` : ''}

          ${doc.payment_instructions ? `
            <div class="exec-notes-box">
              <strong style="display: block; font-size: 10px; text-transform: uppercase; color: ${brandColor}; margin-bottom: 2px;">Payment Instructions</strong>
              ${escapeHtml(doc.payment_instructions)}
            </div>
          ` : ''}

          ${upiSection}
        </div>

        <div class="exec-totals-col">
          <div class="exec-totals-box">
            <div class="exec-totals-row">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">${subtotalStr}</span>
            </div>
            ${discountRow}
            ${taxRow}
            <div class="exec-totals-divider"></div>
            <div class="exec-total-grand">
              <span>Total:</span>
              <span style="font-family: monospace;">${totalStr}</span>
            </div>
            ${depositStr ? `
              <div class="exec-totals-row">
                <span>Deposit / Advance:</span>
                <span style="font-family: monospace;">-${depositStr}</span>
              </div>
            ` : ''}
            ${paidStr ? `
              <div class="exec-totals-row">
                <span>Total Paid:</span>
                <span style="font-family: monospace; color: #059669;">-${paidStr}</span>
              </div>
            ` : ''}

            <div class="exec-balance-row">
              <span>Balance Due:</span>
              <span style="font-family: monospace;">${balanceStr}</span>
            </div>
          </div>
        </div>
      </div>

      ${customFooterNotes ? `
        <div style="margin-top: 24px; text-align: center; font-size: 11px; color: ${secondaryColor}; border-top: 1px dashed #d1d5db; padding-top: 8px;">
          ${escapeHtml(customFooterNotes)}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}
