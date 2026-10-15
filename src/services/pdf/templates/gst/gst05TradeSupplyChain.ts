/**
 * GST-05 — TRADE SUPPLY CHAIN / ADAPTIVE LONG-FORM
 * 
 * Target Organizations:
 * Freight forwarders, manufacturing plants, FMCG distributors, logistics fleets,
 * raw material traders, and heavy multi-item supply-chain shippers.
 * 
 * Design Characteristics:
 * - 4-column horizontal metadata strip with prominent Place of Supply & State code
 * - Specialized column layout: HSN/SAC placed immediately beside serial number (#)
 * - Clean Bill To & Ship To party sections with transport/dispatch alignment
 * - Side-by-side Tax Breakup & Totals table with shaded Grand Total row
 * - Amount in Words ribbon
 * - 4-section footer: Bank details, Terms, IRP QR placeholder, and Company Signatory
 * - Running page numbering and document identity footer (Page X of Y)
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { TemplateCustomization } from '../../types';
import { escapeHtml, parseGstInvoiceData, MONOCHROME_PRINT_CSS } from './gstCommon';

export function renderGst05TradeSupplyChainHtml(
  doc: FullDocument,
  business: BusinessProfile,
  customization?: TemplateCustomization
): string {
  const d = parseGstInvoiceData(doc, business, customization);

  const emptyRowsCount = Math.max(0, 6 - d.processedItems.length);
  const emptyRowsHtml = Array.from({ length: emptyRowsCount })
    .map(
      (_, i) => `
      <tr style="height: 22px;">
        <td style="border: 1px solid #D1D5DB; text-align: center; color: #9CA3AF;">${d.processedItems.length + i + 1}</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
        <td style="border: 1px solid #D1D5DB;">&nbsp;</td>
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
  <title>Tax Invoice - ${escapeHtml(d.invoiceNo)}</title>
  <style>
    ${MONOCHROME_PRINT_CSS}

    /* Header */
    .header-table {
      width: 100%;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .org-title {
      font-size: 17pt;
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
      line-height: 1;
      margin-bottom: 4px;
    }
    .invoice-no-box {
      font-size: 8.5pt;
      text-align: right;
      color: #374151;
    }
    .invoice-no-val {
      font-weight: 800;
      font-size: 10pt;
      color: #000000;
    }

    /* 4-Column Metadata Strip */
    .meta-strip {
      display: flex;
      justify-content: space-between;
      border: 1px solid #D1D5DB;
      background: #FAFAFA;
      padding: 6px 12px;
      margin-bottom: 10px;
      font-size: 8pt;
    }
    .meta-item {
      flex: 1;
    }
    .meta-label {
      color: #4B5563;
      font-size: 7.5pt;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .meta-value {
      color: #000000;
      font-weight: 800;
    }

    /* 2-Column Party Area */
    .party-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
      font-size: 8pt;
    }
    .party-col {
      flex: 1;
    }
    .party-header {
      font-weight: 800;
      font-size: 8.5pt;
      color: #000000;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .party-name {
      font-weight: 800;
      font-size: 9pt;
      color: #000000;
      margin-bottom: 2px;
    }
    .party-desc {
      color: #4B5563;
      line-height: 1.35;
    }

    /* Supply Chain Table (HSN in column 2!) */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 7.5pt;
    }
    .items-table th {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 5px 3px;
      font-weight: 800;
      font-size: 7pt;
      color: #000000;
      text-transform: uppercase;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #E5E7EB;
      padding: 5px 3px;
      color: #1F2937;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    /* Summary Grid */
    .summary-grid {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 8px;
    }
    .tax-box {
      flex: 1.2;
    }
    .totals-box {
      flex: 1;
    }
    .box-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
    }
    .box-table th {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 4px 6px;
      font-weight: 800;
      font-size: 7pt;
      color: #111827;
      text-align: left;
    }
    .box-table td {
      border: 1px solid #E5E7EB;
      padding: 3px 6px;
    }
    .grand-total-row {
      background: #F3F4F6;
      font-weight: 900;
      border: 1.5px solid #111827 !important;
    }

    /* Words Box */
    .words-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      padding: 6px 10px;
      margin-bottom: 10px;
    }
    .words-label {
      font-size: 7pt;
      font-weight: 800;
      color: #4B5563;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .words-content {
      font-size: 8.5pt;
      font-weight: 800;
      color: #000000;
      font-style: italic;
    }

    /* 4-Section Footer */
    .footer-grid {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid #D1D5DB;
      padding-top: 8px;
      margin-top: auto;
      font-size: 7pt;
    }
    .footer-col {
      flex: 1;
    }
    .footer-heading {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7pt;
      color: #000000;
      margin-bottom: 4px;
    }
    .irn-box {
      border: 1px dashed #9CA3AF;
      border-radius: 2px;
      padding: 6px;
      text-align: center;
      font-size: 6.5pt;
      color: #4B5563;
      line-height: 1.3;
    }
    .sig-area {
      text-align: right;
    }
    .sig-line {
      border-top: 1px solid #000000;
      width: 140px;
      margin-left: auto;
      margin-bottom: 3px;
    }

    /* Running Bottom Page Banner */
    .running-banner {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #000000;
      padding-top: 5px;
      margin-top: 8px;
      font-size: 7pt;
      color: #4B5563;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 62%; vertical-align: top;">
          <div class="org-title">${escapeHtml(d.companyName)}</div>
          <div class="org-meta">
            ${escapeHtml(d.supplierAddress1)}<br />
            ${escapeHtml(d.supplierAddress2)}<br />
            <strong>GSTIN:</strong> ${escapeHtml(d.supplierGstin)}<br />
            Phone: ${escapeHtml(d.supplierPhone)} &nbsp;|&nbsp; Email: ${escapeHtml(d.supplierEmail)} &nbsp;|&nbsp; Website: ${escapeHtml(d.supplierWebsite)}
          </div>
        </td>
        <td style="width: 38%; vertical-align: top; text-align: right;">
          <div class="tax-heading">TAX INVOICE</div>
          <div class="invoice-no-box">
            Invoice No.<br />
            <span class="invoice-no-val">[${escapeHtml(d.invoiceNo)}]</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- 4-Column Metadata Strip -->
    <div class="meta-strip">
      <div class="meta-item">
        <div class="meta-label">Invoice Date</div>
        <div class="meta-value">[${escapeHtml(d.issueDateStr)}]</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Due Date</div>
        <div class="meta-value">[${escapeHtml(d.dueDateStr)}]</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Place of Supply</div>
        <div class="meta-value">[${escapeHtml(d.placeOfSupply)}] ([${escapeHtml(d.placeOfSupplyCode)}])</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Reverse Charge</div>
        <div class="meta-value">[${escapeHtml(d.reverseChargeStr)}]</div>
      </div>
    </div>

    <!-- 2-Column Party Area -->
    <div class="party-grid">
      <!-- Bill To -->
      <div class="party-col">
        <div class="party-header">Bill To</div>
        <div class="party-name">[${escapeHtml(d.buyerName)}]</div>
        <div class="party-desc">
          [${escapeHtml(d.buyerAddress1)}]<br />
          [${escapeHtml(d.buyerCityStatePin)}]<br />
          <strong>GSTIN:</strong> [${escapeHtml(d.buyerGstin || 'UNREGISTERED')}]
        </div>
      </div>

      <!-- Ship To -->
      <div class="party-col">
        <div class="party-header">Ship To (If different)</div>
        <div class="party-name">[${escapeHtml(d.deliveryName)}]</div>
        <div class="party-desc">
          [${escapeHtml(d.deliveryAddress1)}]<br />
          [${escapeHtml(d.deliveryCityStatePin)}]<br />
          State: [${escapeHtml(d.deliveryState)}] &nbsp;&nbsp; State Code: [${escapeHtml(d.deliveryStateCode)}]
        </div>
      </div>
    </div>

    <!-- Items Table (HSN in column 2!) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 11%;">HSN / SAC</th>
          <th style="width: 27%;" class="text-left">Description of Goods / Services</th>
          <th style="width: 6%;">Qty</th>
          <th style="width: 7%;">Unit (UQC)</th>
          <th style="width: 9%;" class="text-right">Unit Rate (₹)</th>
          <th style="width: 8%;" class="text-right">Discount (₹)</th>
          <th style="width: 11%;" class="text-right">Taxable Value (₹)</th>
          <th style="width: 9%;">Tax Rate / Type</th>
          <th style="width: 8%;" class="text-right">Tax Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${d.processedItems
          .map(
            (it) => `
          <tr>
            <td class="text-center">${it.index}</td>
            <td class="text-center">${escapeHtml(it.hsnSac)}</td>
            <td class="text-left"><strong>${escapeHtml(it.description)}</strong></td>
            <td class="text-center">${escapeHtml(it.quantityStr)}</td>
            <td class="text-center">${escapeHtml(it.unitStr)}</td>
            <td class="text-right tabular-nums">${escapeHtml(it.rateStr)}</td>
            <td class="text-right tabular-nums">${escapeHtml(it.discountStr)}</td>
            <td class="text-right tabular-nums">${escapeHtml(it.taxableStr)}</td>
            <td class="text-center">${escapeHtml(it.taxRatePercentStr)}</td>
            <td class="text-right tabular-nums" style="font-weight: 700;">${escapeHtml(it.taxAmountStr)}</td>
          </tr>`
          )
          .join('')}
        ${emptyRowsHtml}
      </tbody>
    </table>

    <!-- Tax Summary & Totals -->
    <div class="summary-grid">
      <!-- Tax Breakup Table -->
      <div class="tax-box">
        <table class="box-table">
          <thead>
            <tr><th colspan="4">Tax Breakup (As applicable)</th></tr>
            <tr style="background: #FAFAFA; font-size: 6.5pt;">
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
                    <td>IGST</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalTaxableStr)}</td>
                    <td class="text-center">${escapeHtml(d.taxRatePercent)}%</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalIgstStr)}</td>
                  </tr>`
                : `<tr>
                    <td>CGST</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalTaxableStr)}</td>
                    <td class="text-center">${escapeHtml(d.halfTaxRatePercent)}%</td>
                    <td class="text-right tabular-nums">${escapeHtml(d.totalCgstStr)}</td>
                  </tr>
                  <tr>
                    <td>SGST</td>
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

      <!-- Totals Table -->
      <div class="totals-box">
        <table class="box-table">
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
            <tr class="grand-total-row">
              <td style="font-weight: 900; font-size: 8.5pt;">GRAND TOTAL</td>
              <td class="text-right tabular-nums" style="font-weight: 900; font-size: 9.5pt;">${escapeHtml(d.grandTotalStr)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="words-box">
      <div class="words-label">Amount in Words</div>
      <div class="words-content">[ ${escapeHtml(d.amountInWords)} ]</div>
    </div>

    <!-- 4-Section Footer -->
    <div class="footer-grid">
      <!-- Payment Details -->
      <div class="footer-col">
        <div class="footer-heading">Payment Details (Optional)</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;">
          <tr><td style="color: #6B7280; width: 44%;">Bank Name</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.bankName)}</td></tr>
          <tr><td style="color: #6B7280;">Account Name</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.accountName)}</td></tr>
          <tr><td style="color: #6B7280;">Account Number</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.accountNumber)}</td></tr>
          <tr><td style="color: #6B7280;">IFSC Code</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.ifscCode)}</td></tr>
          <tr><td style="color: #6B7280;">UPI ID (Optional)</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.upiId)}</td></tr>
        </table>
      </div>

      <!-- Terms & Conditions -->
      <div class="footer-col">
        <div class="footer-heading">Terms & Conditions (Optional)</div>
        <ol style="padding-left: 10px; color: #4B5563; font-size: 6.5pt; line-height: 1.3;">
          ${d.termsLines.slice(0, 4).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ol>
      </div>

      <!-- IRN Box -->
      <div class="footer-col">
        <div class="footer-heading">IRN / Signed QR Code</div>
        <div style="font-size: 6pt; color: #6B7280; margin-bottom: 2px;">(If e-invoicing applies)</div>
        <div class="irn-box">
          IRP SUPPLIED<br />
          SIGNED QR CODE<br />
          TO BE DISPLAYED<br />
          HERE
        </div>
      </div>

      <!-- Signatory Area -->
      <div class="footer-col">
        <div class="sig-area">
          <div style="font-size: 6.5pt; font-weight: 700; margin-bottom: 24px;">For [${escapeHtml(d.companyName)}]</div>
          <div class="sig-line"></div>
          <div style="font-weight: 800; font-size: 7pt; text-transform: uppercase;">[${escapeHtml(d.signatoryName)}]</div>
          <div style="color: #6B7280; font-size: 6.5pt;">(Authorised Signatory)</div>
        </div>
      </div>
    </div>

    <!-- Running Bottom Page Banner -->
    <div class="running-banner">
      <div>Page 1 of 1 — Continued on next page when required</div>
      <div>[${escapeHtml(d.invoiceNo)}] &nbsp;|&nbsp; [${escapeHtml(d.companyName)}]</div>
    </div>
  </div>
</body>
</html>`;
}
