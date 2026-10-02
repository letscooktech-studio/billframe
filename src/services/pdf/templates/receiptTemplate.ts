/**
 * OFFICIAL PAYMENT RECEIPT PDF TEMPLATE
 * Clean proof-of-payment document decoupled from invoice.
 */

import { ReceiptRecord } from '../../../data/repositories/PaymentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney } from '../../../domain/money/Money';
import { escapeHtml, formatDate, getBaseCss } from './commonStyles';

export function renderReceiptTemplate(
  receipt: ReceiptRecord,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4'
): string {
  // Parse snapshot for detailed invoice context
  let snap: any = {};
  try {
    snap = JSON.parse(receipt.receipt_snapshot_json);
  } catch {
    snap = {};
  }

  const currency = snap.currency || 'USD';
  const amountStr = formatMoney({ amountMinor: BigInt(snap.amount_minor || 0), currency });
  const remainingStr = snap.remaining_balance_minor !== undefined
    ? formatMoney({ amountMinor: BigInt(snap.remaining_balance_minor), currency })
    : null;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>RECEIPT - ${escapeHtml(receipt.receipt_number)}</title>
      <style>
        ${getBaseCss(paperSize)}

        .receipt-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 24px;
          margin-top: 10px;
        }

        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #059669;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .receipt-badge {
          background-color: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .receipt-details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }

        .receipt-details-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }

        .receipt-details-table td.field-label {
          color: #64748b;
          font-weight: 600;
          width: 35%;
        }

        .receipt-details-table td.field-val {
          color: #0f172a;
          font-weight: 700;
        }

        .paid-hero {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 16px;
          text-align: center;
          margin: 20px 0;
        }

        .paid-hero-amount {
          font-size: 28px;
          font-weight: 900;
          color: #15803d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="receipt-card">
          <!-- Header -->
          <div class="receipt-header">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; color: #0f172a;">${escapeHtml(business.name)}</h2>
              ${business.address_line1 ? `<div style="font-size: 11px; color: #475569;">${escapeHtml(business.address_line1)}</div>` : ''}
              ${business.phone ? `<div style="font-size: 11px; color: #475569;">${escapeHtml(business.phone)}</div>` : ''}
              ${business.tax_id ? `<div style="font-size: 11px; color: #64748b;">Tax ID: ${escapeHtml(business.tax_id)}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <span class="receipt-badge">Payment Received</span>
              <div style="font-size: 16px; font-weight: 800; margin-top: 6px; color: #0f172a;">${escapeHtml(receipt.receipt_number)}</div>
              <div style="font-size: 11px; color: #64748b;">Date: ${formatDate(receipt.issue_date)}</div>
            </div>
          </div>

          <!-- Paid Amount Box -->
          <div class="paid-hero">
            <div style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase;">Amount Received</div>
            <div class="paid-hero-amount">${amountStr}</div>
          </div>

          <!-- Details Table -->
          <table class="receipt-details-table">
            <tr>
              <td class="field-label">Received From:</td>
              <td class="field-val">${escapeHtml(snap.customer_name || 'Client')}</td>
            </tr>
            <tr>
              <td class="field-label">Invoice Number:</td>
              <td class="field-val">${escapeHtml(snap.invoice_number || '—')}</td>
            </tr>
            <tr>
              <td class="field-label">Payment Date:</td>
              <td class="field-val">${formatDate(snap.payment_date || receipt.issue_date)}</td>
            </tr>
            <tr>
              <td class="field-label">Payment Method:</td>
              <td class="field-val">${escapeHtml((snap.payment_method || 'other').replace('_', ' ').toUpperCase())}</td>
            </tr>
            ${snap.reference ? `
              <tr>
                <td class="field-label">Transaction Reference:</td>
                <td class="field-val">${escapeHtml(snap.reference)}</td>
              </tr>
            ` : ''}
            ${remainingStr !== null ? `
              <tr>
                <td class="field-label">Remaining Balance on Invoice:</td>
                <td class="field-val" style="color: #1e3a8a;">${remainingStr}</td>
              </tr>
            ` : ''}
            ${snap.notes ? `
              <tr>
                <td class="field-label">Payment Notes:</td>
                <td class="field-val" style="font-weight: normal; color: #475569;">${escapeHtml(snap.notes)}</td>
              </tr>
            ` : ''}
          </table>

          <div style="text-align: center; margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            Thank you for your business! This is an official digital payment receipt generated by Billframe.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
