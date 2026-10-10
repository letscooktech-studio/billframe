/**
 * COMPACT INVOICE / RECEIPT PDF TEMPLATE
 * High-density layout optimized for single-page printing, quick trade jobs, and receipts.
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney } from '../../../domain/money/Money';
import { quantityScaledToString } from '../../../domain/documents/quantity';
import { escapeHtml, formatDate, getBaseCss } from './commonStyles';
import { TemplateCustomization } from '../types';

export function renderCompactTemplate(
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
      ? 'PROFORMA'
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
          <td style="width: 6%; color: #64748b;">${idx + 1}</td>
          <td style="width: 52%;">
            <span style="font-weight: 600; color: #0f172a;">${escapeHtml(item.description)}</span>
            ${item.item_notes ? `<span style="font-size: 11px; color: #64748b; margin-left: 6px;">(${escapeHtml(item.item_notes)})</span>` : ''}
          </td>
          <td class="text-right" style="width: 14%;">${qtyStr} ${escapeHtml(item.unit_name || '')}</td>
          <td class="text-right" style="width: 14%;">${rateStr}</td>
          <td class="text-right" style="width: 14%; font-weight: 600;">${totalStr}</td>
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
      <title>${escapeHtml(docTitle)} - ${escapeHtml(doc.document_number)}</title>
      <style>
        ${getBaseCss(paperSize)}

        .compact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }

        .compact-header h1 {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .compact-parties {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          margin-bottom: 14px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }

        .table th, .table td {
          padding: 6px 10px;
          font-size: 11.5px;
        }

        .compact-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 14px;
          gap: 20px;
        }

        .compact-notes {
          flex: 1;
          font-size: 11px;
          color: #475569;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Compact Header -->
        <div class="compact-header">
          <div>
            <h1>${escapeHtml(business.name)}</h1>
            <div style="font-size: 11px; color: #475569;">
              ${escapeHtml([business.phone, business.email, business.tax_id ? `Tax ID: ${business.tax_id}` : ''].filter(Boolean).join(' • '))}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${escapeHtml(docTitle)} #${escapeHtml(doc.document_number)}</div>
            <div style="font-size: 11px; color: #64748b;">Date: ${formatDate(doc.issue_date)} ${doc.due_date ? `| Due: ${formatDate(doc.due_date)}` : ''}</div>
          </div>
        </div>

        <!-- Compact Parties -->
        <div class="compact-parties">
          <div>
            <strong style="color: #64748b; text-transform: uppercase; font-size: 10px;">Billed To:</strong><br />
            <strong>${escapeHtml(doc.customer_name || 'Client')}</strong>
            ${doc.customer_business_name ? ` - ${escapeHtml(doc.customer_business_name)}` : ''}
            ${doc.customer_email ? ` • ${escapeHtml(doc.customer_email)}` : ''}
          </div>
          ${doc.po_number ? `
            <div style="text-align: right;">
              <strong style="color: #64748b; text-transform: uppercase; font-size: 10px;">PO / Job #:</strong><br />
              <strong>${escapeHtml(doc.po_number)}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Table -->
        <table class="table table-striped" style="margin-top: 4px; margin-bottom: 10px;">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Bottom section: Notes & Totals -->
        <div class="compact-bottom avoid-break">
          <div class="compact-notes">
            ${doc.payment_instructions ? `<div style="margin-bottom: 6px;"><strong>Payment Info:</strong> ${escapeHtml(doc.payment_instructions)}</div>` : ''}
            ${doc.notes ? `<div><strong>Notes:</strong> ${escapeHtml(doc.notes)}</div>` : ''}
          </div>

          <div class="totals-box" style="width: 250px;">
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
                <span>${escapeHtml(doc.tax_label || 'Tax')}:</span>
                <span>${formatMoney({ amountMinor: BigInt(doc.tax_minor), currency })}</span>
              </div>
            ` : ''}
            <div class="totals-row grand-total" style="padding: 4px 0;">
              <span>Total:</span>
              <span>${totalStr}</span>
            </div>
            ${depositStr ? `
              <div class="totals-row">
                <span>Deposit:</span>
                <span style="color: #059669;">-${depositStr}</span>
              </div>
            ` : ''}
            ${paidStr ? `
              <div class="totals-row">
                <span>Paid:</span>
                <span style="color: #059669;">-${paidStr}</span>
              </div>
            ` : ''}
            <div class="totals-row balance-due" style="padding: 6px 8px;">
              <span>Balance:</span>
              <span>${balanceStr}</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
