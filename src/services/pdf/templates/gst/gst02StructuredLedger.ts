/**
 * GST-02 — STRUCTURED LEDGER
 * 
 * Target Organizations:
 * Wholesalers, distributors, trading firms, parts suppliers, industrial suppliers
 * and businesses handling numerous product lines with dense line items.
 * 
 * Design Characteristics:
 * - 6-compartment horizontal metadata banner
 * - Dual shaded party cards (Bill To & Ship To)
 * - 11-column high-density item grid with separate Unit (UQC) and Total columns
 * - Bordered Tax Breakup table and structured totals box with currency symbols
 * - Shaded Amount in Words bar
 * - 3-column payment/terms/IRN block with explicit bottom declaration and company signatory
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { TemplateCustomization } from '../../types';
import { escapeHtml, parseGstInvoiceData, MONOCHROME_PRINT_CSS } from './gstCommon';

export function renderGst02StructuredLedgerHtml(
  doc: FullDocument,
  business: BusinessProfile,
  customization?: TemplateCustomization
): string {
  const d = parseGstInvoiceData(doc, business, customization);

  const emptyRowsCount = Math.max(0, 8 - d.processedItems.length);
  const emptyRowsHtml = Array.from({ length: emptyRowsCount })
    .map(
      (_, i) => `
      <tr style="height: 22px;">
        <td style="border: 1px solid #9CA3AF; text-align: center; color: #9CA3AF;">${d.processedItems.length + i + 1}</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
        <td style="border: 1px solid #9CA3AF;">&nbsp;</td>
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
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .org-title {
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #000000;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .org-meta {
      font-size: 8pt;
      color: #374151;
      line-height: 1.35;
    }
    .tax-invoice-heading {
      font-size: 19pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-align: right;
      color: #000000;
      line-height: 1.1;
    }
    .invoice-classification {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-align: right;
      color: #4B5563;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* 6-Cell Metadata Strip */
    .meta-strip {
      width: 100%;
      border: 1px solid #000000;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 7.5pt;
    }
    .meta-strip th {
      background: #F3F4F6;
      border: 1px solid #000000;
      padding: 3px 4px;
      text-align: center;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
    }
    .meta-strip td {
      border: 1px solid #000000;
      padding: 4px;
      text-align: center;
      font-weight: 700;
      color: #000000;
    }

    /* Dual Party Box */
    .party-grid {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 8pt;
    }
    .party-box {
      flex: 1;
      border: 1px solid #000000;
    }
    .party-header {
      background: #F3F4F6;
      border-bottom: 1px solid #000000;
      padding: 4px 6px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7.5pt;
      color: #000000;
    }
    .party-body {
      padding: 6px;
      line-height: 1.35;
    }
    .party-name {
      font-weight: 800;
      font-size: 9pt;
      color: #000000;
      margin-bottom: 2px;
    }

    /* Items Table (11 Columns) */
    .items-table {
      width: 100%;
      border: 1px solid #000000;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 7.5pt;
    }
    .items-table th {
      background: #F3F4F6;
      border: 1px solid #000000;
      padding: 5px 3px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      font-size: 7pt;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #9CA3AF;
      padding: 4px 3px;
      color: #000000;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    /* Tax Breakup & Ledger Totals */
    .summary-grid {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    .tax-breakup-box {
      flex: 1.2;
    }
    .totals-box {
      flex: 1;
    }
    .bordered-table {
      width: 100%;
      border: 1px solid #000000;
      border-collapse: collapse;
      font-size: 7.5pt;
    }
    .bordered-table th {
      background: #F3F4F6;
      border: 1px solid #000000;
      padding: 3.5px 5px;
      font-weight: 800;
      font-size: 7pt;
      text-transform: uppercase;
      text-align: left;
    }
    .bordered-table td {
      border: 1px solid #000000;
      padding: 3px 5px;
    }
    .grand-total-row {
      background: #F3F4F6;
      font-weight: 900;
      font-size: 9.5pt;
    }

    /* Words Box */
    .words-box {
      border: 1px solid #000000;
      margin-bottom: 8px;
    }
    .words-title {
      background: #F3F4F6;
      border-bottom: 1px solid #000000;
      padding: 3px 6px;
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
    }
    .words-content {
      padding: 5px 8px;
      font-size: 8.5pt;
      font-weight: 800;
      color: #000000;
    }

    /* 3-Column Footer */
    .footer-3col {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border: 1px solid #000000;
      padding: 6px;
      margin-bottom: 8px;
      font-size: 7.5pt;
    }
    .footer-col {
      flex: 1;
    }
    .footer-title {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7pt;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .irn-box {
      border: 1px dashed #4B5563;
      padding: 8px 6px;
      text-align: center;
      font-size: 6.5pt;
      color: #4B5563;
      height: 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    /* Bottom Declaration & Signatory */
    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #000000;
      padding-top: 6px;
      font-size: 7.5pt;
      margin-top: auto;
    }
    .dec-text {
      color: #4B5563;
      font-size: 7pt;
      max-width: 58%;
      line-height: 1.35;
    }
    .sig-area {
      text-align: right;
    }
    .sig-line {
      border-top: 1px solid #000000;
      width: 160px;
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
        <td style="width: 62%; vertical-align: top;">
          <div class="org-title">${escapeHtml(d.companyName)}</div>
          <div class="org-meta">
            ${escapeHtml(d.supplierAddress1)}, ${escapeHtml(d.supplierAddress2)}<br />
            <strong>GSTIN:</strong> ${escapeHtml(d.supplierGstin)} &nbsp;|&nbsp; 
            Phone: ${escapeHtml(d.supplierPhone)} &nbsp;|&nbsp; 
            Email: ${escapeHtml(d.supplierEmail)}<br />
            Website: ${escapeHtml(d.supplierWebsite)}
          </div>
        </td>
        <td style="width: 2%; border-left: 1px solid #000000;"></td>
        <td style="width: 36%; vertical-align: top; text-align: right;">
          <div class="tax-invoice-heading">TAX INVOICE</div>
          <div class="invoice-classification">ORIGINAL FOR RECIPIENT</div>
        </td>
      </tr>
    </table>

    <!-- 6-Cell Metadata Strip -->
    <table class="meta-strip">
      <thead>
        <tr>
          <th>Invoice No.</th>
          <th>Invoice Date</th>
          <th>Due Date</th>
          <th>Place of Supply</th>
          <th>Reverse Charge</th>
          <th>Invoice Type</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(d.invoiceNo)}</td>
          <td>${escapeHtml(d.issueDateStr)}</td>
          <td>${escapeHtml(d.dueDateStr)}</td>
          <td>${escapeHtml(d.placeOfSupply)} [${escapeHtml(d.placeOfSupplyCode)}]</td>
          <td>${escapeHtml(d.reverseChargeStr)}</td>
          <td>${escapeHtml(d.invoiceTypeStr)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Dual Party Box -->
    <div class="party-grid">
      <!-- Bill To -->
      <div class="party-box">
        <div class="party-header">BILL TO</div>
        <div class="party-body">
          <div class="party-name">${escapeHtml(d.buyerName)}</div>
          ${escapeHtml(d.buyerAddress1)}<br />
          ${escapeHtml(d.buyerCityStatePin)}<br />
          <strong>GSTIN:</strong> ${escapeHtml(d.buyerGstin || 'UNREGISTERED')}<br />
          State: ${escapeHtml(d.buyerState)} &nbsp;&nbsp; State Code: ${escapeHtml(d.buyerStateCode)}
        </div>
      </div>

      <!-- Ship To -->
      <div class="party-box">
        <div class="party-header">SHIP TO (If different)</div>
        <div class="party-body">
          <div class="party-name">${escapeHtml(d.deliveryName)}</div>
          ${escapeHtml(d.deliveryAddress1)}<br />
          ${escapeHtml(d.deliveryCityStatePin)}<br />
          <strong>GSTIN:</strong> ${escapeHtml(d.buyerGstin || 'UNREGISTERED')}<br />
          State: ${escapeHtml(d.deliveryState)} &nbsp;&nbsp; State Code: ${escapeHtml(d.deliveryStateCode)}
        </div>
      </div>
    </div>

    <!-- Items Table (11 Columns) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 3%;">#</th>
          <th style="width: 25%;" class="text-left">DESCRIPTION of Goods / Services</th>
          <th style="width: 9%;">HSN / SAC</th>
          <th style="width: 6%;">QTY</th>
          <th style="width: 7%;">UNIT (UQC)</th>
          <th style="width: 8%;" class="text-right">RATE (₹)</th>
          <th style="width: 8%;" class="text-right">DISCOUNT (₹)</th>
          <th style="width: 10%;" class="text-right">TAXABLE VAL (₹)</th>
          <th style="width: 7%;">TAX RATE (%)</th>
          <th style="width: 8%;" class="text-right">TAX AMT (₹)</th>
          <th style="width: 9%;" class="text-right">TOTAL (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${d.processedItems
          .map(
            (it) => `
          <tr>
            <td class="text-center">${it.index}</td>
            <td class="text-left">${escapeHtml(it.description)}</td>
            <td class="text-center">${escapeHtml(it.hsnSac)}</td>
            <td class="text-center">${escapeHtml(it.quantityStr)}</td>
            <td class="text-center">${escapeHtml(it.unitStr)}</td>
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

    <!-- Tax Breakup & Ledger Totals -->
    <div class="summary-grid">
      <!-- Tax Breakup Table -->
      <div class="tax-breakup-box">
        <table class="bordered-table">
          <thead>
            <tr>
              <th>TAX BREAKUP</th>
              <th class="text-right">TAXABLE VALUE (₹)</th>
              <th class="text-center">RATE (%)</th>
              <th class="text-right">TAX AMOUNT (₹)</th>
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
              <td>IGST (if applicable)</td>
              <td class="text-right tabular-nums">—</td>
              <td class="text-center">—</td>
              <td class="text-right tabular-nums">₹ 0.00</td>
            </tr>
            <tr>
              <td>UTGST (if applicable)</td>
              <td class="text-right tabular-nums">—</td>
              <td class="text-center">—</td>
              <td class="text-right tabular-nums">₹ 0.00</td>
            </tr>
            <tr>
              <td>CESS (if applicable)</td>
              <td class="text-right tabular-nums">—</td>
              <td class="text-center">—</td>
              <td class="text-right tabular-nums">${escapeHtml(d.totalCessStr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals Table -->
      <div class="totals-box">
        <table class="bordered-table">
          <tbody>
            <tr>
              <td>Total Taxable Value</td>
              <td class="text-right tabular-nums">${escapeHtml(d.totalTaxableStr)}</td>
            </tr>
            <tr>
              <td>Total Discount</td>
              <td class="text-right tabular-nums">${escapeHtml(d.totalDiscountStr)}</td>
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
            <tr class="grand-total-row">
              <td>Grand Total (₹)</td>
              <td class="text-right tabular-nums" style="font-size: 10pt;">${escapeHtml(d.grandTotalStr)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="words-box">
      <div class="words-title">Amount in Words</div>
      <div class="words-content">[ ${escapeHtml(d.amountInWords)} ]</div>
    </div>

    <!-- 3-Column Footer -->
    <div class="footer-3col">
      <!-- Bank -->
      <div class="footer-col">
        <div class="footer-title">Payment Details (Optional)</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 7pt;">
          <tr><td style="color: #4B5563;">Bank Name</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.bankName)}</td></tr>
          <tr><td style="color: #4B5563;">Account Name</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.accountName)}</td></tr>
          <tr><td style="color: #4B5563;">Account Number</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.accountNumber)}</td></tr>
          <tr><td style="color: #4B5563;">IFSC Code</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.ifscCode)}</td></tr>
          <tr><td style="color: #4B5563;">UPI ID (Optional)</td><td>:</td><td style="font-weight: 700;">${escapeHtml(d.upiId)}</td></tr>
        </table>
      </div>

      <!-- Terms -->
      <div class="footer-col">
        <div class="footer-title">Terms & Conditions (Optional)</div>
        <ol style="padding-left: 12px; color: #374151; font-size: 7pt; line-height: 1.35;">
          ${d.termsLines.slice(0, 4).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ol>
      </div>

      <!-- IRN / QR -->
      <div class="footer-col">
        <div class="irn-box">
          <strong>IRN / SIGNED QR CODE</strong>
          <span>(ONLY IF APPLICABLE)</span>
          <span style="font-size: 6pt; margin-top: 4px; color: #6B7280;">[To be displayed after generation from authorized IRP]</span>
        </div>
      </div>
    </div>

    <!-- Bottom Declaration & Signatory -->
    <div class="bottom-bar">
      <div>
        <div style="font-weight: 800; font-size: 7pt; text-transform: uppercase; margin-bottom: 2px;">Declaration (Optional)</div>
        <div class="dec-text">${escapeHtml(d.declarationText)}</div>
      </div>
      <div class="sig-area">
        <div style="font-weight: 700; margin-bottom: 24px;">For ${escapeHtml(d.companyName)}</div>
        <div class="sig-line"></div>
        <div style="font-weight: 800; text-transform: uppercase;">[${escapeHtml(d.signatoryName)}]</div>
        <div style="color: #4B5563; font-size: 7pt;">(Authorised Signatory)</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
