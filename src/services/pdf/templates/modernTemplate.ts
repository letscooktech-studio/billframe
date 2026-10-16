/**
 * MODERN INVOICE / ESTIMATE PDF TEMPLATE
 * Minimalist, high-typography layout with crisp horizontal dividers
 * and prominent project/contractor site details.
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney } from '../../../domain/money/Money';
import { quantityScaledToString } from '../../../domain/documents/quantity';
import { escapeHtml, formatDate, getBaseCss } from './commonStyles';
import { TemplateCustomization } from '../types';
import { DocumentTypeRegistry } from '../../../domain/documents/DocumentTypeRegistry';

export function renderModernTemplate(
  doc: FullDocument,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4',
  customization?: TemplateCustomization
): string {
  const currency = doc.currency || 'USD';

  const docDef = DocumentTypeRegistry.get(doc.doc_type);
  const docTitle =
    docDef?.name?.toUpperCase() ||
    (doc.doc_type === 'estimate'
      ? 'ESTIMATE'
      : doc.doc_type === 'receipt'
      ? 'PAYMENT RECEIPT'
      : doc.doc_type === 'credit_note'
      ? 'CREDIT NOTE'
      : doc.doc_type === 'proforma'
      ? 'PROFORMA'
      : doc.doc_type === 'delivery_note'
      ? 'DELIVERY NOTE'
      : doc.doc_type === 'work_order'
      ? 'WORK ORDER'
      : 'INVOICE');

  const itemsHtml = (doc.items || [])
    .map((item, idx) => {
      const qtyStr = quantityScaledToString(BigInt(item.quantity_scaled));
      const rateStr = formatMoney({ amountMinor: BigInt(item.unit_price_minor), currency });
      const totalStr = formatMoney({ amountMinor: BigInt(item.line_total_minor), currency });

      return `
        <tr>
          <td style="color: #94a3b8; font-weight: 500;">0${idx + 1}</td>
          <td>
            <div style="font-weight: 600; color: #0f172a; font-size: 12.5px;">${escapeHtml(item.description)}</div>
            ${item.item_notes ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(item.item_notes)}</div>` : ''}
          </td>
          <td class="text-right" style="color: #334155;">${qtyStr} ${escapeHtml(item.unit_name || '')}</td>
          <td class="text-right" style="color: #334155;">${rateStr}</td>
          <td class="text-right" style="font-weight: 700; color: #0f172a;">${totalStr}</td>
        </tr>
      `;
    })
    .join('');

  const subtotalStr = formatMoney({ amountMinor: BigInt(doc.subtotal_minor), currency });
  const totalStr = formatMoney({ amountMinor: BigInt(doc.total_minor), currency });
  const depositStr = doc.deposit_minor ? formatMoney({ amountMinor: BigInt(doc.deposit_minor), currency }) : null;
  const paidStr = doc.total_paid_minor ? formatMoney({ amountMinor: BigInt(doc.total_paid_minor), currency }) : null;
  const balanceStr = formatMoney({ amountMinor: BigInt(doc.balance_minor ?? doc.total_minor), currency });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(docTitle)} ${escapeHtml(doc.document_number)}</title>
      <style>
        ${getBaseCss(paperSize)}

        .modern-hero {
          background-color: #0f172a;
          color: #ffffff;
          padding: 24px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .modern-hero h1 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .modern-hero-sub {
          font-size: 11px;
          color: #94a3b8;
        }

        .modern-hero-right {
          text-align: right;
        }

        .modern-hero-type {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #38bdf8;
        }

        .modern-hero-number {
          font-size: 20px;
          font-weight: 900;
          color: #ffffff;
          margin: 2px 0 6px 0;
        }

        .meta-strip {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 20px;
          font-size: 12px;
        }

        .meta-col h5 {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .meta-col p {
          color: #0f172a;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Hero Band -->
        <div class="modern-hero">
          <div>
            <h1>${escapeHtml(business.name)}</h1>
            <div class="modern-hero-sub">
              ${escapeHtml([business.legal_name, business.tax_id ? `Tax ID: ${business.tax_id}` : '', business.phone, business.email].filter(Boolean).join(' • '))}
            </div>
            ${business.address_line1 ? `<div class="modern-hero-sub" style="margin-top: 2px;">${escapeHtml(business.address_line1)}</div>` : ''}
          </div>
          <div class="modern-hero-right">
            <div class="modern-hero-type">${escapeHtml(docTitle)}</div>
            <div class="modern-hero-number">#${escapeHtml(doc.document_number)}</div>
            <div style="font-size: 11px; color: #cbd5e1;">Issue Date: ${formatDate(doc.issue_date)}</div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="meta-strip avoid-break">
          <div class="meta-col" style="flex: 2;">
            <h5>Client</h5>
            <p>${escapeHtml(doc.customer_name || 'Client')}</p>
            ${doc.customer_business_name ? `<div style="font-size: 11px; color: #475569;">${escapeHtml(doc.customer_business_name)}</div>` : ''}
            ${doc.customer_billing_address ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(doc.customer_billing_address)}</div>` : ''}
          </div>

          ${doc.due_date ? `
            <div class="meta-col" style="flex: 1;">
              <h5>Payment Due</h5>
              <p style="color: #1e3a8a;">${formatDate(doc.due_date)}</p>
            </div>
          ` : ''}

          ${doc.po_number ? `
            <div class="meta-col" style="flex: 1;">
              <h5>PO Reference</h5>
              <p>${escapeHtml(doc.po_number)}</p>
            </div>
          ` : ''}

          ${doc.shipping_address ? `
            <div class="meta-col" style="flex: 2;">
              <h5>Job / Site Address</h5>
              <div style="font-size: 11px; color: #334155;">${escapeHtml(doc.shipping_address)}</div>
            </div>
          ` : ''}
        </div>

        <!-- Items Table -->
        <table class="table">
          <thead>
            <tr>
              <th style="width: 5%;">Item</th>
              <th style="width: 55%;">Description</th>
              <th class="text-right" style="width: 12%;">Qty</th>
              <th class="text-right" style="width: 14%;">Rate</th>
              <th class="text-right" style="width: 14%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-grid">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${subtotalStr}</span>
            </div>
            ${doc.discount_minor ? `
              <div class="totals-row">
                <span>Discount:</span>
                <span style="color: #059669;">-${formatMoney({ amountMinor: BigInt(doc.discount_minor), currency })}</span>
              </div>
            ` : ''}
            ${doc.tax_minor ? `
              <div class="totals-row">
                <span>${escapeHtml(doc.tax_label || 'Tax')} (${(doc.tax_rate_bp / 100).toFixed(2)}%):</span>
                <span>${formatMoney({ amountMinor: BigInt(doc.tax_minor), currency })}</span>
              </div>
            ` : ''}
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
                <span>Total Paid:</span>
                <span style="color: #059669;">-${paidStr}</span>
              </div>
            ` : ''}
            <div class="totals-row balance-due">
              <span>Balance Due:</span>
              <span>${balanceStr}</span>
            </div>
          </div>
        </div>

        <!-- Notes & Instructions -->
        ${(doc.payment_instructions || doc.notes || doc.terms) ? `
          <div class="footer-block">
            ${doc.payment_instructions ? `<p style="margin-bottom: 8px;"><strong>Payment Details:</strong> ${escapeHtml(doc.payment_instructions)}</p>` : ''}
            ${doc.notes ? `<p style="margin-bottom: 8px;"><strong>Notes:</strong> ${escapeHtml(doc.notes)}</p>` : ''}
            ${doc.terms ? `<p style="color: #94a3b8; font-size: 10px;">${escapeHtml(doc.terms)}</p>` : ''}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
