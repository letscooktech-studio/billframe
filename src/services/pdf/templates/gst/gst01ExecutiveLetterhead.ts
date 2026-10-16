/**
 * GST-01 — EXECUTIVE LETTERHEAD
 * 
 * Target Organizations:
 * GST-registered IT agencies, design studios, marketing agencies, consultancies,
 * engineering firms and professional service providers.
 * 
 * Design Characteristics:
 * - Large, dominant organization identity & contact banner
 * - Right-aligned TAX INVOICE header with vertical divider and key statutory particulars
 * - 3-column party metadata (Bill To, Ship To, Other Commercial Details)
 * - 10-column comprehensive service/goods table with HSN/SAC, rates, and line totals
 * - Side-by-side Tax Summary table and Amount Summary with shaded Grand Total bar
 * - Full-width Amount in Words ribbon
 * - Bank details, terms, optional IRP QR placeholder, and Authorised Signatory block
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { TemplateCustomization } from '../../types';
import { escapeHtml, parseGstInvoiceData, MONOCHROME_PRINT_CSS } from './gstCommon';

export function renderGst01ExecutiveLetterheadHtml(
  doc: FullDocument,
  business: BusinessProfile,
  customization?: TemplateCustomization
): string {
  const d = parseGstInvoiceData(doc, business, customization);

  // Pad table with empty rows to match visual rhythm if items are few
  const emptyRowsCount = Math.max(0, 5 - d.processedItems.length);
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

    .header-table {
      width: 100%;
      border-bottom: 1.5px solid #111827;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .org-title {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #000000;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .org-meta {
      font-size: 8.5pt;
      color: #374151;
      line-height: 1.4;
    }
    .tax-invoice-heading {
      font-family: Georgia, serif;
      font-size: 20pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-align: right;
      color: #000000;
      line-height: 1;
      margin-bottom: 8px;
    }
    .invoice-meta-kv {
      font-size: 8.5pt;
      text-align: right;
      border-collapse: collapse;
      margin-left: auto;
    }
    .invoice-meta-kv td {
      padding: 1.5px 0;
    }
    .invoice-meta-kv .k {
      color: #4B5563;
      padding-right: 6px;
      text-align: left;
    }
    .invoice-meta-kv .v {
      font-weight: 700;
      color: #111827;
      text-align: left;
    }

    /* 3-Column Party Block */
    .party-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      font-size: 8.5pt;
    }
    .party-col {
      flex: 1;
    }
    .col-header {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 8pt;
      color: #111827;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 3px;
      margin-bottom: 5px;
      letter-spacing: 0.3px;
    }
    .party-name {
      font-weight: 700;
      font-size: 9.5pt;
      color: #000000;
      margin-bottom: 2px;
    }
    .party-text {
      color: #4B5563;
      line-height: 1.35;
    }
    .party-gstin {
      font-weight: 700;
      color: #111827;
      margin-top: 3px;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
      font-size: 8pt;
    }
    .items-table th {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 6px 4px;
      font-weight: 700;
      text-transform: uppercase;
      color: #111827;
      font-size: 7.5pt;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #E5E7EB;
      padding: 5px 4px;
      color: #1F2937;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .table-caption-bar {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #6B7280;
      font-style: italic;
      margin-bottom: 12px;
    }

    /* Tax Summary & Totals */
    .summary-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
    }
    .tax-summary-box {
      flex: 1.3;
    }
    .amount-summary-box {
      flex: 1;
    }
    .box-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .box-table th {
      background: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 4px 6px;
      font-weight: 700;
      font-size: 7.5pt;
      text-align: left;
      text-transform: uppercase;
    }
    .box-table td {
      border: 1px solid #E5E7EB;
      padding: 3.5px 6px;
    }
    .grand-total-bar {
      background: #F3F4F6;
      font-weight: 800;
      font-size: 9.5pt;
      border: 1px solid #111827 !important;
    }

    /* Words Box */
    .words-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      padding: 6px 10px;
      margin-bottom: 12px;
      border-radius: 2px;
    }
    .words-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #4B5563;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .words-text {
      font-size: 8.5pt;
      font-weight: 700;
      color: #111827;
      font-style: italic;
    }

    /* Bottom 3 Columns */
    .bottom-grid {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      font-size: 7.5pt;
      border-top: 1px solid #E5E7EB;
      padding-top: 8px;
      margin-top: auto;
    }
    .bottom-col {
      flex: 1;
    }
    .bottom-title {
      font-weight: 800;
      text-transform: uppercase;
      color: #111827;
      margin-bottom: 4px;
    }
    .qr-placeholder-box {
      border: 1px dashed #9CA3AF;
      border-radius: 3px;
      padding: 10px 6px;
      text-align: center;
      font-size: 7pt;
      color: #6B7280;
      margin-bottom: 14px;
    }
    .signatory-block {
      text-align: right;
      margin-top: 10px;
    }
    .sign-line {
      border-top: 1px solid #000000;
      width: 140px;
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
        <td style="width: 58%; vertical-align: top;">
          <div class="org-title">${escapeHtml(d.companyName)}</div>
          <div class="org-meta">
            ${escapeHtml(d.supplierAddress1)}<br />
            ${escapeHtml(d.supplierAddress2)}<br />
            <strong>GSTIN:</strong> ${escapeHtml(d.supplierGstin)}<br />
            Phone: ${escapeHtml(d.supplierPhone)} &nbsp;|&nbsp; Email: ${escapeHtml(d.supplierEmail)} &nbsp;|&nbsp; Website: ${escapeHtml(d.supplierWebsite)}
          </div>
        </td>
        <td style="width: 2%; border-left: 1px solid #D1D5DB;"></td>
        <td style="width: 40%; vertical-align: top;">
          <div class="tax-invoice-heading">${escapeHtml(d.documentTitle)}</div>
          <table class="invoice-meta-kv">
            <tr><td class="k">Invoice No.</td><td>:</td><td class="v">${escapeHtml(d.invoiceNo)}</td></tr>
            <tr><td class="k">Invoice Date</td><td>:</td><td class="v">${escapeHtml(d.issueDateStr)}</td></tr>
            <tr><td class="k">Place of Supply</td><td>:</td><td class="v">${escapeHtml(d.placeOfSupply)} [${escapeHtml(d.placeOfSupplyCode)}]</td></tr>
            <tr><td class="k">Reverse Charge</td><td>:</td><td class="v">${escapeHtml(d.reverseChargeStr)}</td></tr>
            <tr><td class="k">IRN</td><td>:</td><td class="v">${escapeHtml(d.irnNumber || 'Not Applicable')}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- 3-Column Party Block -->
    <div class="party-grid">
      <!-- Buyer (Bill To) -->
      <div class="party-col">
        <div class="col-header">BUYER (BILL TO)</div>
        <div class="party-name">${escapeHtml(d.buyerName)}</div>
        <div class="party-text">
          ${escapeHtml(d.buyerAddress1)}<br />
          ${escapeHtml(d.buyerCityStatePin)}
        </div>
        <div class="party-gstin">GSTIN: ${escapeHtml(d.buyerGstin || 'UNREGISTERED')}</div>
        <div class="party-text">State: ${escapeHtml(d.buyerState)} &nbsp; Code: ${escapeHtml(d.buyerStateCode)}</div>
      </div>

      <!-- Delivery (Ship To) -->
      <div class="party-col">
        <div class="col-header">DELIVERY (SHIP TO)</div>
        <div class="party-name">${escapeHtml(d.deliveryName)}</div>
        <div class="party-text">
          ${escapeHtml(d.deliveryAddress1)}<br />
          ${escapeHtml(d.deliveryCityStatePin)}
        </div>
        <div class="party-text" style="margin-top: 3px;">
          State: ${escapeHtml(d.deliveryState)} &nbsp; Code: ${escapeHtml(d.deliveryStateCode)}
        </div>
      </div>

      <!-- Other Details -->
      <div class="party-col">
        <div class="col-header">OTHER DETAILS</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
          <tr><td style="color: #6B7280; padding: 1px 0;">Invoice Type</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.invoiceTypeStr)}</td></tr>
          <tr><td style="color: #6B7280; padding: 1px 0;">Supply Type</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.supplyTypeStr)}</td></tr>
          <tr><td style="color: #6B7280; padding: 1px 0;">Order Ref.</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.orderRef)}</td></tr>
          <tr><td style="color: #6B7280; padding: 1px 0;">Order Date</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.orderDateStr)}</td></tr>
          <tr><td style="color: #6B7280; padding: 1px 0;">Payment Terms</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.paymentTerms)}</td></tr>
          <tr><td style="color: #6B7280; padding: 1px 0;">Due Date</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.dueDateStr)}</td></tr>
          <tr><td style="color: #6B7280; padding: 1px 0;">Currency</td><td>:</td><td style="font-weight: 600;">INR (₹)</td></tr>
        </table>
      </div>
    </div>

    <!-- Items Table (10 Columns) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 28%;" class="text-left">DESCRIPTION (Goods / Services)</th>
          <th style="width: 10%;">HSN / SAC</th>
          <th style="width: 8%;">QTY / UQC</th>
          <th style="width: 9%;" class="text-right">RATE (₹)</th>
          <th style="width: 8%;" class="text-right">DISCOUNT</th>
          <th style="width: 11%;" class="text-right">TAXABLE VAL</th>
          <th style="width: 7%;">TAX %</th>
          <th style="width: 7%;" class="text-right">TAX AMT</th>
          <th style="width: 8%;" class="text-right">TOTAL (₹)</th>
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
            <td class="text-right tabular-nums">${escapeHtml(it.taxableStr)}</td>
            <td class="text-center">${escapeHtml(it.taxRatePercentStr)}</td>
            <td class="text-right tabular-nums">${escapeHtml(it.taxAmountStr)}</td>
            <td class="text-right tabular-nums" style="font-weight: 700;">${escapeHtml(it.lineTotalStr)}</td>
          </tr>`
          )
          .join('')}
        ${emptyRowsHtml}
      </tbody>
    </table>

    <div class="table-caption-bar">
      <span>Table repeats and continues on subsequent pages when necessary.</span>
      <span>PAGE 1 / 1</span>
    </div>

    <!-- Tax Summary & Totals -->
    <div class="summary-grid">
      <!-- Tax Summary Table -->
      <div class="tax-summary-box">
        <table class="box-table">
          <thead>
            <tr>
              <th colspan="4">TAX SUMMARY (As applicable)</th>
            </tr>
            <tr style="background: #FAFAFA; font-size: 7pt; color: #4B5563;">
              <th>COMPONENT</th>
              <th class="text-right">TAXABLE VAL (₹)</th>
              <th class="text-center">RATE</th>
              <th class="text-right">TAX AMT (₹)</th>
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

      <!-- Amount Summary -->
      <div class="amount-summary-box">
        <table class="box-table">
          <tbody>
            <tr>
              <td>Total Taxable Value</td>
              <td class="text-right tabular-nums" style="font-weight: 600;">${escapeHtml(d.totalTaxableStr)}</td>
            </tr>
            ${
              d.isInterState
                ? `<tr><td>Total IGST</td><td class="text-right tabular-nums">${escapeHtml(d.totalIgstStr)}</td></tr>`
                : `<tr><td>Total CGST</td><td class="text-right tabular-nums">${escapeHtml(d.totalCgstStr)}</td></tr>
                   <tr><td>Total SGST</td><td class="text-right tabular-nums">${escapeHtml(d.totalSgstStr)}</td></tr>`
            }
            <tr><td>Total Cess</td><td class="text-right tabular-nums">${escapeHtml(d.totalCessStr)}</td></tr>
            <tr><td>Other Charges (if any)</td><td class="text-right tabular-nums">${escapeHtml(d.otherChargesStr)}</td></tr>
            <tr><td>Round Off</td><td class="text-right tabular-nums">${escapeHtml(d.roundOffStr)}</td></tr>
            <tr class="grand-total-bar">
              <td style="font-weight: 800;">GRAND TOTAL (₹)</td>
              <td class="text-right tabular-nums" style="font-weight: 800; font-size: 10pt;">${escapeHtml(d.grandTotalStr)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="words-box">
      <div class="words-label">Amount in Words</div>
      <div class="words-text">[ ${escapeHtml(d.amountInWords)} ]</div>
    </div>

    <!-- Bottom 3 Columns -->
    <div class="bottom-grid">
      <!-- Bank Details -->
      <div class="bottom-col">
        <div class="bottom-title">Bank / Payment Details (Optional)</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; color: #374151;">
          <tr><td style="color: #6B7280; width: 42%;">Bank Name</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.bankName)}</td></tr>
          <tr><td style="color: #6B7280;">Account Name</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.accountName)}</td></tr>
          <tr><td style="color: #6B7280;">Account Number</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.accountNumber)}</td></tr>
          <tr><td style="color: #6B7280;">IFSC Code</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.ifscCode)}</td></tr>
          <tr><td style="color: #6B7280;">UPI ID (Optional)</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.upiId)}</td></tr>
        </table>
      </div>

      <!-- Terms & Conditions -->
      <div class="bottom-col">
        <div class="bottom-title">Terms & Conditions (Optional)</div>
        <ol style="padding-left: 14px; color: #4B5563; line-height: 1.35;">
          ${d.termsLines.slice(0, 4).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ol>
      </div>

      <!-- QR & Signatory -->
      <div class="bottom-col" style="text-align: right;">
        <div class="qr-placeholder-box">
          SIGNED IRP QR CODE<br />ONLY IF APPLICABLE
        </div>
        <div class="signatory-block">
          <div class="sign-line"></div>
          <div style="font-weight: 700; color: #111827;">Authorised Signatory</div>
          <div style="color: #6B7280; font-size: 7pt;">[${escapeHtml(d.signatoryName)}]</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
