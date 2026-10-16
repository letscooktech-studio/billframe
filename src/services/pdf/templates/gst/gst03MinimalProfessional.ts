/**
 * GST-03 — MINIMAL PROFESSIONAL
 * 
 * Target Organizations:
 * Independent consultants, creative directors, architecture studios,
 * boutique tech firms and advisory practices wanting borderless elegance.
 * 
 * Design Characteristics:
 * - Giant, prominent left-aligned Invoice Number with small-caps Tax Invoice title
 * - Right-aligned minimalist organization header
 * - Pure typography without heavy card boxes
 * - Borderless item table with horizontal hairline rules and generous whitespace
 * - Split Amount in Words (left) and clean right-aligned totals stack
 * - Bold framed Total Invoice Value bar
 * - Minimal 3-column payment/terms/IRN footer with declaration
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { TemplateCustomization } from '../../types';
import { escapeHtml, parseGstInvoiceData, MONOCHROME_PRINT_CSS } from './gstCommon';

export function renderGst03MinimalProfessionalHtml(
  doc: FullDocument,
  business: BusinessProfile,
  customization?: TemplateCustomization
): string {
  const d = parseGstInvoiceData(doc, business, customization);

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
      border-bottom: 1.5px solid #000000;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .invoice-title-tag {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #000000;
      margin-bottom: 3px;
    }
    .big-invoice-number {
      font-size: 24pt;
      font-weight: 900;
      letter-spacing: -0.8px;
      color: #000000;
      line-height: 1.1;
      margin-bottom: 3px;
    }
    .original-recipient-tag {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #4B5563;
    }
    .org-block {
      text-align: right;
    }
    .org-name {
      font-size: 14pt;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .org-details {
      font-size: 8pt;
      color: #4B5563;
      line-height: 1.4;
    }

    /* 3-Column Metadata */
    .meta-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 12px;
      margin-bottom: 14px;
      font-size: 8pt;
    }
    .meta-col {
      flex: 1;
    }
    .meta-heading {
      font-weight: 800;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #000000;
      margin-bottom: 4px;
      letter-spacing: 0.3px;
    }
    .meta-name {
      font-weight: 700;
      font-size: 9pt;
      color: #000000;
      margin-bottom: 2px;
    }
    .meta-text {
      color: #4B5563;
      line-height: 1.35;
    }

    /* Items Table (Borderless, hairline rules) */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    .items-table th {
      border-bottom: 1.5px solid #000000;
      border-top: 1.5px solid #000000;
      padding: 6px 4px;
      font-weight: 800;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #000000;
    }
    .items-table td {
      border-bottom: 1px solid #E5E7EB;
      padding: 7px 4px;
      color: #1F2937;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    /* Totals & Summary Stack */
    .totals-summary-container {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 14px;
    }
    .words-container {
      flex: 1.1;
      padding-top: 6px;
    }
    .words-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      padding: 8px 10px;
      border-radius: 2px;
    }
    .words-title {
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #000000;
      margin-bottom: 4px;
    }
    .words-value {
      font-size: 8.5pt;
      font-weight: 700;
      color: #000000;
      font-style: italic;
    }

    .totals-stack {
      flex: 0.9;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .totals-table td {
      padding: 3px 0;
    }
    .grand-total-row td {
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
      padding: 7px 0;
      font-weight: 900;
      font-size: 10.5pt;
      color: #000000;
    }

    /* 3-Column Footer */
    .footer-section {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid #E5E7EB;
      padding-top: 10px;
      margin-top: auto;
      font-size: 7.5pt;
    }
    .footer-col {
      flex: 1;
    }
    .footer-heading {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7.5pt;
      color: #000000;
      margin-bottom: 4px;
    }
    .sig-block {
      text-align: right;
      margin-top: 14px;
    }
    .sig-line {
      border-top: 1px solid #000000;
      width: 140px;
      margin-left: auto;
      margin-bottom: 3px;
    }
    .dec-subfooter {
      border-top: 1px solid #E5E7EB;
      padding-top: 6px;
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
        <td style="width: 50%; vertical-align: bottom;">
          <div class="invoice-title-tag">${escapeHtml(d.documentTitle)}</div>
          <div class="big-invoice-number">[${escapeHtml(d.invoiceNo)}]</div>
          <div class="original-recipient-tag">ORIGINAL FOR RECIPIENT</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="org-block">
            <div class="org-name">${escapeHtml(d.companyName)}</div>
            <div class="org-details">
              ${escapeHtml(d.supplierAddress1)}<br />
              ${escapeHtml(d.supplierAddress2)}<br />
              <strong>GSTIN:</strong> ${escapeHtml(d.supplierGstin)}<br />
              Phone: ${escapeHtml(d.supplierPhone)} &nbsp;|&nbsp; Email: ${escapeHtml(d.supplierEmail)}<br />
              Website: ${escapeHtml(d.supplierWebsite)}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- 3-Column Top Metadata -->
    <div class="meta-grid">
      <!-- Bill To -->
      <div class="meta-col">
        <div class="meta-heading">BILL TO</div>
        <div class="meta-name">${escapeHtml(d.buyerName)}</div>
        <div class="meta-text">
          ${escapeHtml(d.buyerAddress1)}<br />
          ${escapeHtml(d.buyerCityStatePin)}
        </div>
        <div style="font-weight: 700; color: #000000; margin-top: 3px;">
          GSTIN: ${escapeHtml(d.buyerGstin || 'UNREGISTERED')}
        </div>
        <div class="meta-text">
          State: ${escapeHtml(d.buyerState)} &nbsp;&nbsp; State Code: ${escapeHtml(d.buyerStateCode)}
        </div>
      </div>

      <!-- Ship To -->
      <div class="meta-col">
        <div class="meta-heading">SHIP TO (If different)</div>
        <div class="meta-name">${escapeHtml(d.deliveryName)}</div>
        <div class="meta-text">
          ${escapeHtml(d.deliveryAddress1)}<br />
          ${escapeHtml(d.deliveryCityStatePin)}
        </div>
        <div class="meta-text" style="margin-top: 3px;">
          State: ${escapeHtml(d.deliveryState)} &nbsp;&nbsp; State Code: ${escapeHtml(d.deliveryStateCode)}
        </div>
      </div>

      <!-- Key Value Details -->
      <div class="meta-col">
        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
          <tr><td style="color: #6B7280; width: 44%;">Invoice Date</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.issueDateStr)}</td></tr>
          <tr><td style="color: #6B7280;">Due Date</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.dueDateStr)}</td></tr>
          <tr><td style="color: #6B7280;">Place of Supply</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.placeOfSupply)}</td></tr>
          <tr><td style="color: #6B7280;">State Code</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.placeOfSupplyCode)}</td></tr>
          <tr><td style="color: #6B7280;">Reverse Charge</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.reverseChargeStr)}</td></tr>
          <tr><td style="color: #6B7280;">Invoice Type</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.invoiceTypeStr)}</td></tr>
          <tr><td style="color: #6B7280;">Payment Terms</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.paymentTerms)}</td></tr>
          <tr><td style="color: #6B7280;">Reference</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.orderRef)}</td></tr>
        </table>
      </div>
    </div>

    <!-- Items Table (10 Columns, Clean Borderless) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;" class="text-center">#</th>
          <th style="width: 28%;" class="text-left">Description of Goods / Services</th>
          <th style="width: 10%;" class="text-center">HSN / SAC</th>
          <th style="width: 8%;" class="text-center">Qty (UQC)</th>
          <th style="width: 8%;" class="text-right">Unit Rate (₹)</th>
          <th style="width: 8%;" class="text-right">Discount (₹)</th>
          <th style="width: 11%;" class="text-right">Taxable Value (₹)</th>
          <th style="width: 7%;" class="text-center">Tax Rate (%)</th>
          <th style="width: 8%;" class="text-right">Tax Amount (₹)</th>
          <th style="width: 8%;" class="text-right">Line Total (₹)</th>
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
      </tbody>
    </table>

    <!-- Totals & Summary Stack -->
    <div class="totals-summary-container">
      <!-- Words Box -->
      <div class="words-container">
        <div class="words-title">Amount in Words</div>
        <div class="words-box">
          <div class="words-value">[ ${escapeHtml(d.amountInWords)} ]</div>
        </div>
      </div>

      <!-- Right Totals Stack -->
      <div class="totals-stack">
        <table class="totals-table">
          <tr>
            <td style="color: #4B5563;">Taxable Value</td>
            <td class="text-right tabular-nums" style="font-weight: 600;">${escapeHtml(d.totalTaxableStr)}</td>
          </tr>
          ${
            d.isInterState
              ? `<tr>
                  <td style="color: #4B5563;">IGST @ ${escapeHtml(d.taxRatePercent)}%</td>
                  <td class="text-right tabular-nums">${escapeHtml(d.totalIgstStr)}</td>
                </tr>`
              : `<tr>
                  <td style="color: #4B5563;">CGST @ ${escapeHtml(d.halfTaxRatePercent)}%</td>
                  <td class="text-right tabular-nums">${escapeHtml(d.totalCgstStr)}</td>
                </tr>
                <tr>
                  <td style="color: #4B5563;">SGST @ ${escapeHtml(d.halfTaxRatePercent)}%</td>
                  <td class="text-right tabular-nums">${escapeHtml(d.totalSgstStr)}</td>
                </tr>`
          }
          <tr>
            <td style="color: #4B5563;">UTGST @ [RATE]% (if applicable)</td>
            <td class="text-right tabular-nums">—</td>
          </tr>
          <tr>
            <td style="color: #4B5563;">Cess @ [RATE]% (if applicable)</td>
            <td class="text-right tabular-nums">${escapeHtml(d.totalCessStr)}</td>
          </tr>
          <tr>
            <td style="color: #4B5563;">Other Charges (if any)</td>
            <td class="text-right tabular-nums">${escapeHtml(d.otherChargesStr)}</td>
          </tr>
          <tr>
            <td style="color: #4B5563;">Round Off</td>
            <td class="text-right tabular-nums">${escapeHtml(d.roundOffStr)}</td>
          </tr>
          <tr class="grand-total-row">
            <td>TOTAL INVOICE VALUE</td>
            <td class="text-right tabular-nums">${escapeHtml(d.grandTotalStr)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- 3-Column Footer -->
    <div class="footer-section">
      <!-- Payment Details -->
      <div class="footer-col">
        <div class="footer-heading">Payment Details (Optional)</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt;">
          <tr><td style="color: #6B7280; width: 44%;">Bank Name</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.bankName)}</td></tr>
          <tr><td style="color: #6B7280;">Account Name</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.accountName)}</td></tr>
          <tr><td style="color: #6B7280;">Account Number</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.accountNumber)}</td></tr>
          <tr><td style="color: #6B7280;">IFSC Code</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.ifscCode)}</td></tr>
          <tr><td style="color: #6B7280;">UPI ID</td><td>:</td><td style="font-weight: 600;">${escapeHtml(d.upiId)}</td></tr>
        </table>
      </div>

      <!-- Terms & Conditions -->
      <div class="footer-col">
        <div class="footer-heading">Terms & Conditions (Optional)</div>
        <ol style="padding-left: 12px; color: #4B5563; font-size: 7.5pt; line-height: 1.35;">
          ${d.termsLines.slice(0, 4).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ol>
      </div>

      <!-- IRP / QR & Signatory -->
      <div class="footer-col" style="text-align: right;">
        <div class="footer-heading">Official IRP QR / IRN</div>
        <div style="font-size: 6.5pt; color: #6B7280; line-height: 1.3; margin-bottom: 8px;">
          (To be displayed only if generated through the authorized Invoice Registration Portal (IRP) for applicable taxpayers.)
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div style="font-weight: 800;">[${escapeHtml(d.signatoryName)}]</div>
          <div style="color: #4B5563; font-size: 7pt;">Authorised Signatory</div>
        </div>
      </div>
    </div>

    <!-- Sub-footer Declaration -->
    <div class="dec-subfooter">
      <strong>Declaration (Optional):</strong> ${escapeHtml(d.declarationText)}
    </div>
  </div>
</body>
</html>`;
}
