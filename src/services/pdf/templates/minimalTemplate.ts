/**
 * MINIMAL CLEAN PDF TEMPLATE
 * Restrained minimalist layout with generous whitespace, subtle hairline rules,
 * and elegant typography. Ideal for creative agencies, design studios, and consultants.
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney } from '../../../domain/money/Money';
import { quantityScaledToString } from '../../../domain/documents/quantity';
import { escapeHtml, formatDate, getBaseCss } from './commonStyles';

export function renderMinimalTemplate(
  doc: FullDocument,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4'
): string {
  const currency = doc.currency || 'USD';

  const docTitle =
    doc.doc_type === 'estimate'
      ? 'Estimate'
      : doc.doc_type === 'receipt'
      ? 'Payment Receipt'
      : doc.doc_type === 'credit_note'
      ? 'Credit Note'
      : doc.doc_type === 'proforma'
      ? 'Proforma'
      : doc.doc_type === 'delivery_note'
      ? 'Delivery Note'
      : doc.doc_type === 'work_order'
      ? 'Work Order'
      : doc.doc_type === 'sow'
      ? 'Statement of Work'
      : doc.doc_type === 'proposal'
      ? 'Proposal'
      : 'Invoice';

  const itemsHtml = (doc.items || [])
    .map((item) => {
      const qtyStr = quantityScaledToString(BigInt(item.quantity_scaled));
      const rateStr = formatMoney({ amountMinor: BigInt(item.unit_price_minor), currency });
      const totalStr = formatMoney({ amountMinor: BigInt(item.line_total_minor), currency });

      return `
        <tr>
          <td style="padding: 12px 0;">
            <div style="font-weight: 600; color: #1e293b; font-size: 13px;">${escapeHtml(item.description)}</div>
            ${item.item_notes ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${escapeHtml(item.item_notes)}</div>` : ''}
          </td>
          <td class="text-right" style="padding: 12px 0; color: #64748b;">${qtyStr} ${escapeHtml(item.unit_name || '')}</td>
          <td class="text-right" style="padding: 12px 0; color: #64748b;">${rateStr}</td>
          <td class="text-right" style="padding: 12px 0; font-weight: 600; color: #0f172a;">${totalStr}</td>
        </tr>
      `;
    })
    .join('');

  const subtotalStr = formatMoney({ amountMinor: BigInt(doc.subtotal_minor), currency });
  const totalStr = formatMoney({ amountMinor: BigInt(doc.total_minor), currency });
  const balanceStr = formatMoney({ amountMinor: BigInt(doc.balance_minor ?? doc.total_minor), currency });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(docTitle)} ${escapeHtml(doc.document_number)}</title>
      <style>
        ${getBaseCss(paperSize)}

        .min-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .min-title {
          font-size: 28px;
          font-weight: 300;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .min-number {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        .min-seller {
          text-align: right;
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.6;
        }

        .min-seller strong {
          color: #0f172a;
          font-size: 13px;
        }

        .min-meta-row {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          padding: 16px 0;
          margin-bottom: 32px;
          font-size: 11.5px;
        }

        .min-meta-col strong {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .min-meta-col span {
          color: #1e293b;
          font-weight: 500;
        }

        .min-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }

        .min-table th {
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 0;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          font-weight: 500;
        }

        .min-table td {
          border-bottom: 1px solid #f8fafc;
        }

        .min-summary {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .min-totals-box {
          width: 260px;
        }

        .min-total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 12px;
          color: #64748b;
        }

        .min-total-final {
          border-top: 1px solid #0f172a;
          margin-top: 8px;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
      </style>
    </head>
    <body>
      <div class="min-header">
        <div>
          <h1 class="min-title">${escapeHtml(docTitle)}</h1>
          <div class="min-number"># ${escapeHtml(doc.document_number)}</div>
        </div>
        <div class="min-seller">
          <strong>${escapeHtml(business.legal_name || business.name)}</strong>
          ${business.email ? `<div>${escapeHtml(business.email)}</div>` : ''}
          ${business.phone ? `<div>${escapeHtml(business.phone)}</div>` : ''}
          ${business.tax_id ? `<div>Tax ID: ${escapeHtml(business.tax_id)}</div>` : ''}
        </div>
      </div>

      <div class="min-meta-row">
        <div class="min-meta-col">
          <strong>Billed To</strong>
          <span>${escapeHtml(doc.customer_name || 'Client')}</span>
          ${doc.customer_business_name ? `<div style="color: #64748b; font-size: 11px;">${escapeHtml(doc.customer_business_name)}</div>` : ''}
        </div>
        <div class="min-meta-col">
          <strong>Date Issued</strong>
          <span>${formatDate(doc.issue_date)}</span>
        </div>
        <div class="min-meta-col">
          <strong>Due Date</strong>
          <span>${doc.due_date ? formatDate(doc.due_date) : 'On Receipt'}</span>
        </div>
        <div class="min-meta-col">
          <strong>Amount Due</strong>
          <span style="font-weight: 700;">${balanceStr}</span>
        </div>
      </div>

      <table class="min-table">
        <thead>
          <tr>
            <th class="text-left" style="width: 55%;">Description</th>
            <th class="text-right" style="width: 15%;">Qty</th>
            <th class="text-right" style="width: 15%;">Price</th>
            <th class="text-right" style="width: 15%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="min-summary">
        <div class="min-totals-box">
          <div class="min-total-row">
            <span>Subtotal</span>
            <span>${subtotalStr}</span>
          </div>
          ${doc.discount_minor && doc.discount_minor > 0 ? `
            <div class="min-total-row">
              <span>Discount</span>
              <span style="color: #059669;">-${formatMoney({ amountMinor: BigInt(doc.discount_minor), currency })}</span>
            </div>
          ` : ''}
          ${doc.tax_minor && doc.tax_minor > 0 ? `
            <div class="min-total-row">
              <span>${escapeHtml(doc.tax_label || 'Tax')}</span>
              <span>${formatMoney({ amountMinor: BigInt(doc.tax_minor), currency })}</span>
            </div>
          ` : ''}
          <div class="min-total-row" style="font-weight: 600; color: #0f172a; border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 4px;">
            <span>Total</span>
            <span>${totalStr}</span>
          </div>
          ${doc.total_paid_minor && doc.total_paid_minor > 0 ? `
            <div class="min-total-row">
              <span>Paid</span>
              <span style="color: #059669;">-${formatMoney({ amountMinor: BigInt(doc.total_paid_minor), currency })}</span>
            </div>
          ` : ''}
          <div class="min-total-final">
            <span>Balance Due</span>
            <span>${balanceStr}</span>
          </div>
        </div>
      </div>

      ${doc.notes ? `
        <div style="margin-top: 40px; font-size: 11px; color: #64748b; line-height: 1.6;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Notes</strong>
          ${escapeHtml(doc.notes)}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}
