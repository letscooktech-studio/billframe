/**
 * GST-04 — CORPORATE B2B
 * 
 * Target Organizations:
 * Tier-1 suppliers, government contractors, corporate IT vendors, industrial manufacturers,
 * and high-value B2B enterprises requiring strict consignment vs buyer separation.
 * 
 * Design Characteristics:
 * - Two-column metadata block with explicit E-Invoice status and statutory reverse charge indicators
 * - Shaded Bill To (Registered Buyer) and Ship To party panels
 * - 7-column core items table with prominent Taxable Value column
 * - Dual split summary: Shaded TAX DETAILS table (left) + Shaded SUMMARY table (right)
 * - Inverted high-contrast black GRAND TOTAL bar (pure white text on black background)
 * - Bank details with branch code, terms, IRP QR box, and "Thank you for your business" closing
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { TemplateCustomization } from '../../types';
import { escapeHtml, parseGstInvoiceData, MONOCHROME_PRINT_CSS } from './gstCommon';

export function renderGst04CorporateB2BHtml(
  doc: FullDocument,
  business: BusinessProfile,
  customization?: TemplateCustomization
): string {
  const d = parseGstInvoiceData(doc, business, customization);

  const emptyRowsCount = Math.max(0, 4 - d.processedItems.length);
  const emptyRowsHtml = Array.from({ length: emptyRowsCount })
    .map(
      (_, i) => `
      <tr style="height: 24px;">
        <td style="border: 1px solid #D1D5DB; text-align: center; color: #9CA3AF;">${d.processedItems.length + i + 1}</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(d.documentTitle)} - ${escapeHtml(d.invoiceNo)}</title>
  <style>
    ${MONOCHROME_PRINT_CSS}

    /* Header */
    .header-table {
      width: 100%;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .org-title {
      font-size: 16pt;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: -0.3px;
      margin-bottom: 3px;
    }
    .org-meta {
      font-size: 8pt;
      color: #374151;
      line-height: 1.35;
    }
    .tax-heading {
      font-size: 20pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-align: right;
      color: #000000;
      line-height: 1.1;
    }
    .tax-subheading {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-align: right;
      color: #4B5563;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* 2-Column Metadata */
    .meta-2col {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 10px;
      font-size: 8pt;
    }
    .meta-2col-table {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-2col-table td {
      padding: 2px 0;
    }
    .k-cell {
      color: #4B5563;
      width: 44%;
    }
    .v-cell {
      font-weight: 700;
      color: #111827;
    }

    /* Party Panels */
    .party-grid {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    .party-panel {
      flex: 1;
      border: 1px solid #D1D5DB;
    }
    .panel-header {
      background: #F3F4F6;
      border-bottom: 1px solid #D1D5DB;
      padding: 4px 8px;
      font-weight: 800;
      font-size: 7.5pt;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .panel-body {
      padding: 8px;
      line-height: 1.35;
    }
    .panel-name {
      font-weight: 800;
      font-size: 9pt;
      color: #000000;
      margin-bottom: 2px;
    }

    /* Line Items (7 Columns) */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    .items-table th {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 6px 5px;
      font-weight: 800;
      font-size: 7.5pt;
      color: #111827;
      text-transform: uppercase;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #E5E7EB;
      padding: 6px 5px;
      color: #1F2937;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    /* Dual Split Summary */
    .summary-split {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 10px;
    }
    .split-box {
      flex: 1;
      border: 1px solid #D1D5DB;
    }
    .split-header {
      background: #F3F4F6;
      border-bottom: 1px solid #D1D5DB;
      padding: 4px 8px;
      font-weight: 800;
      font-size: 7.5pt;
      color: #111827;
      text-transform: uppercase;
    }
    .split-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
    }
    .split-table th {
      background: #FAFAFA;
      border-bottom: 1px solid #E5E7EB;
      padding: 4px 6px;
      font-weight: 700;
      color: #4B5563;
      text-align: left;
    }
    .split-table td {
      border-bottom: 1px solid #F3F4F6;
      padding: 3.5px 6px;
    }

    /* Inverted Grand Total & Words */
    .grand-total-section {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 12px;
    }
    .words-box {
      flex: 1.2;
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .words-label {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #4B5563;
      margin-bottom: 2px;
    }
    .words-text {
      font-size: 8.5pt;
      font-weight: 800;
      color: #000000;
      font-style: italic;
    }

    .inverted-grand-total {
      flex: 0.8;
      background: #000000;
      color: #FFFFFF;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 2px;
    }
    .inverted-label {
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .inverted-amount {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: -0.5px;
    }

    /* 3-Column Footer */
    .footer-grid {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      border-top: 1px solid #D1D5DB;
      padding-top: 8px;
      font-size: 7.5pt;
      margin-top: auto;
    }
    .footer-col {
      flex: 1;
    }
    .footer-title {
      font-weight: 800;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #000000;
      margin-bottom: 4px;
    }
    .irn-box {
      border: 1px dashed #6B7280;
      padding: 8px 6px;
      text-align: center;
      font-size: 6.5pt;
      color: #4B5563;
      line-height: 1.35;
    }

    /* Bottom Closing */
    .closing-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #000000;
      padding-top: 6px;
      margin-top: 8px;
      font-size: 7.5pt;
    }
    .closing-msg {
      font-size: 8pt;
      color: #374151;
      font-weight: 600;
      font-style: italic;
    }
    .closing-sig {
      text-align: right;
    }
    .sig-line {
      border-top: 1px solid #000000;
      width: 150px;
      margin-left: auto;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 60%; vertical-align: top;">
          <div class="org-title">${escapeHtml(d.companyName)}</div>
          <div class="org-meta">
            ${escapeHtml(d.supplierAddress1)}<br />
            ${escapeHtml(d.supplierAddress2)}<br />
            <strong>GSTIN:</strong> ${escapeHtml(d.supplierGstin)}<br />
            Phone: ${escapeHtml(d.supplierPhone)} &nbsp;|&nbsp; Email: ${escapeHtml(d.supplierEmail)} &nbsp;|&nbsp; Website: ${escapeHtml(d.supplierWebsite)}
          </div>
        </td>
        <td style="width: 2%; border-left: 1px solid #111827;"></td>
        <td style="width: 38%; vertical-align: top; text-align: right;">
          <div class="tax-heading">${escapeHtml(d.documentTitle)}</div>
          <div class="tax-subheading">ORIGINAL FOR RECIPIENT</div>
        </td>
      </tr>
    </table>

    <!-- 2-Column Metadata -->
    <div class="meta-2col">
      <div style="flex: 1;">
        <table class="meta-2col-table">
          <tr><td class="k-cell">Invoice No.</td><td>:</td><td class="v-cell">${escapeHtml(d.invoiceNo)}</td></tr>
          <tr><td class="k-cell">Invoice Date</td><td>:</td><td class="v-cell">${escapeHtml(d.issueDateStr)}</td></tr>
          <tr><td class="k-cell">Due Date</td><td>:</td><td class="v-cell">${escapeHtml(d.dueDateStr)}</td></tr>
          <tr><td class="k-cell">Place of Supply</td><td>:</td><td class="v-cell">${escapeHtml(d.placeOfSupply)} [${escapeHtml(d.placeOfSupplyCode)}]</td></tr>
        </table>
      </div>
      <div style="flex: 1;">
        <table class="meta-2col-table">
          <tr><td class="k-cell">Reverse Charge</td><td>:</td><td class="v-cell">${escapeHtml(d.reverseChargeStr)}</td></tr>
          <tr><td class="k-cell">Invoice Type</td><td>:</td><td class="v-cell">${escapeHtml(d.invoiceTypeStr)}</td></tr>
          <tr><td class="k-cell">E-Invoice Applicable</td><td>:</td><td class="v-cell">${d.irnNumber ? 'YES' : 'NO'}</td></tr>
          <tr><td class="k-cell">E-Invoice Status</td><td>:</td><td class="v-cell">${d.irnNumber ? 'GENERATED' : 'NOT GENERATED'}</td></tr>
        </table>
      </div>
    </div>

    <!-- Party Panels (Bill To & Ship To) -->
    <div class="party-grid">
      <!-- Bill To (Registered Buyer) -->
      <div class="party-panel">
        <div class="panel-header">BILL TO (Registered Buyer)</div>
        <div class="panel-body">
          <div class="panel-name">${escapeHtml(d.buyerName)}</div>
          ${escapeHtml(d.buyerAddress1)}<br />
          ${escapeHtml(d.buyerCityStatePin)}<br />
          <strong>GSTIN:</strong> ${escapeHtml(d.buyerGstin || 'UNREGISTERED')}<br />
          State: ${escapeHtml(d.buyerState)} &nbsp;&nbsp; State Code: ${escapeHtml(d.buyerStateCode)}
        </div>
      </div>

      <!-- Ship To (If different) -->
      <div class="party-panel">
        <div class="panel-header">SHIP TO (If different)</div>
        <div class="panel-body">
          <div class="panel-name">${escapeHtml(d.deliveryName)}</div>
          ${escapeHtml(d.deliveryAddress1)}<br />
          ${escapeHtml(d.deliveryCityStatePin)}<br />
          State: ${escapeHtml(d.deliveryState)} &nbsp;&nbsp; State Code: ${escapeHtml(d.deliveryStateCode)}
        </div>
      </div>
    </div>

    <!-- Line Items Table (7 Columns) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 38%;" class="text-left">DESCRIPTION of Goods / Services</th>
          <th style="width: 14%;">HSN / SAC</th>
          <th style="width: 10%;">QTY (UQC)</th>
          <th style="width: 11%;" class="text-right">RATE (₹)</th>
          <th style="width: 9%;" class="text-right">DISCOUNT (₹)</th>
          <th style="width: 14%;" class="text-right">TAXABLE VALUE (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${d.processedItems
          .map(
            (it) => `
          <tr>
            <td class="text-center">${it.index}</td>
            <td class="text-left"><strong>${escapeHtml(it.description)}</strong></td>
            <td class="text-center">${escapeHtml(it.hsnSac)}</td>
            <td class="text-center">${escapeHtml(it.quantityStr)} ${escapeHtml(it.unitStr)}</td>
            <td class="text-right tabular-nums">${escapeHtml(it.rateStr)}</td>
            <td class="text-right tabular-nums">${escapeHtml(it.discountStr)}</td>
            <td class="text-right tabular-nums" style="font-weight: 700;">${escapeHtml(it.taxableStr)}</td>
          </tr>`
          )
          .join('')}
        ${emptyRowsHtml}
      </tbody>
    </table>

    <!-- Dual Split Summary -->
    <div class="summary-split">
      <!-- Left: Tax Details -->
      <div class="split-box">
        <div class="split-header">TAX DETAILS</div>
        <table class="split-table">
          <thead>
            <tr>
              <th>Tax Type</th>
              <th class="text-right">Taxable Value (₹)</th>
              <th class="text-center">Rate (%)</th>
              <th class="text-right">Tax Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${
              d.isInterState
                ? `<tr>
                    <td>IGST (if applicable)</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalTaxableStr)}</td>
                    <td class="text-center">${escapeHtml(d.taxRatePercent)}%</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalIgstStr)}</td>
                  </tr>`
                : `<tr>
                    <td>CGST (if applicable)</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalTaxableStr)}</td>
                    <td class="text-center">${escapeHtml(d.halfTaxRatePercent)}%</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalCgstStr)}</td>
                  </tr>
                  <tr>
                    <td>SGST (if applicable)</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalTaxableStr)}</td>
                    <td class="text-center">${escapeHtml(d.halfTaxRatePercent)}%</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalSgstStr)}</td>
                  </tr>`
            }
            <tr>
              <td>UTGST (if applicable)</td>
              <td class="text-right tabular-nums">—</td>
              <td class="text-center">—</td>
              <td class="text-right tabular-nums">₹ 0.00</td>
            </tr>
            <tr>
              <td>Cess (if applicable)</td>
              <td class="text-right tabular-nums">—</td>
              <td class="text-center">—</td>
              <td class="text-right tabular-nums">${escapeHtml(d.totalCessStr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Right: Summary Table -->
      <div class="split-box">
        <div class="split-header">SUMMARY (₹)</div>
        <table class="split-table">
          <tbody>
            <tr><td>Total Taxable Value</td><td class="text-right tabular-nums" style="font-weight: 600;">${escapeHtml(d.totalTaxableStr)}</td></tr>
            ${
              d.isInterState
                ? `<tr><td>Total IGST</td><td class="text-right tabular-nums">${escapeHtml(d.totalIgstStr)}</td></tr>`
                : `<tr><td>Total CGST</td><td class="text-right tabular-nums">${escapeHtml(d.totalCgstStr)}</td></tr>
                   <tr><td>Total SGST</td><td class="text-right tabular-nums">${escapeHtml(d.totalSgstStr)}</td></tr>`
            }
            <tr><td>Total Cess</td><td class="text-right tabular-nums">${escapeHtml(d.totalCessStr)}</td></tr>
            <tr><td>Other Charges (if any)</td><td class="text-right tabular-nums">${escapeHtml(d.otherChargesStr)}</td></tr>
            <tr><td>Round Off</td><td class="text-right tabular-nums">${escapeHtml(d.roundOffStr)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inverted Black Grand Total & Amount in Words -->
    <div class="grand-total-section">
      <div class="words-box">
        <div class="words-label">Amount in Words</div>
        <div class="words-text">[ ${escapeHtml(d.amountInWords)} ]</div>
      </div>
      <div class="inverted-grand-total">
        <div class="inverted-label">GRAND TOTAL (₹)</div>
        <div class="inverted-amount">${escapeHtml(d.grandTotalStr)}</div>
      </div>
    </div>

    <!-- 3-Column Footer -->
    <div class="footer-grid">
      <!-- Bank -->
      <div class="footer-col">
        <div class="footer-title">Payment Details (Optional)</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 7pt;">
          <tr><td style="color: #4B5563; width: 44%;">Bank Name</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.bankName)}</td></tr>
          <tr><td style="color: #4B5563;">Account Name</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.accountName)}</td></tr>
          <tr><td style="color: #4B5563;">Account Number</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.accountNumber)}</td></tr>
          <tr><td style="color: #4B5563;">IFSC Code</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.ifscCode)}</td></tr>
          <tr><td style="color: #4B5563;">Branch</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.bankBranch)}</td></tr>
          <tr><td style="color: #4B5563;">UPI ID (Optional)</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.upiId)}</td></tr>
        </table>
      </div>

      <!-- Terms -->
      <div class="footer-col">
        <div class="footer-title">Terms & Conditions (Optional)</div>
        <ol style="padding-left: 12px; color: #4B5563; font-size: 7pt; line-height: 1.35;">
          ${d.termsLines.slice(0, 4).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ol>
      </div>

      <!-- IRN Box -->
      <div class="footer-col">
        <div class="irn-box">
          <strong style="color: #111827;">IRN / SIGNED QR CODE</strong><br />
          <span>(If e-invoice generated)</span><br />
          <span style="font-size: 6pt; color: #6B7280; margin-top: 4px; display: block;">
            To be displayed only if generated through the authorized Invoice Registration Portal (IRP).
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Closing -->
    <div class="closing-bar">
      <div class="closing-msg">Thank you for your business.</div>
      <div class="closing-sig">
        <div class="sig-line"></div>
        <div style="font-weight: 800; text-transform: uppercase;">[${escapeHtml(d.signatoryName)}]</div>
        <div style="color: #4B5563; font-size: 7pt;">(Authorised Signatory)</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
