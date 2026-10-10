/**
 * TAX INVOICE GOLD STANDARD TEMPLATE
 * 
 * High-fidelity, official GST Rule 46 Tax Invoice matching the Billframe 3.0 specification:
 * - Brand Letterhead with company logo, registered identity, tagline, address and contacts
 * - Dual/triplicate document classification (Original for Recipient / Transporter / Supplier)
 * - 4-Box Grid: Invoice Details, Bill To (Customer), Ship To, Other Details (Transport/E-Way)
 * - Full HSN/SAC table with CGST, SGST, IGST rate and amount columns
 * - Dual Summaries: Tax Summary and Amount Summary with prominent Grand Total bar
 * - Amount in Words (INR)
 * - 3-Column Bottom Block: Bank & UPI Details, Payment Terms, and Declaration & Authorized Signatory
 * - Deterministic, print-perfect A4 geometry
 */

import { FullDocument } from '../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../domain/profile/types';
import { formatMoney } from '../../../domain/money/Money';
import { quantityScaledToString } from '../../../domain/documents/quantity';
import { escapeHtml, formatDate, resolveDocumentTheme } from './commonStyles';
import { TemplateCustomization } from '../types';

export function renderTaxInvoiceGoldStandardHtml(
  doc: FullDocument,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4',
  customization?: TemplateCustomization
): string {
  const theme = resolveDocumentTheme(business, customization);
  const currency = doc.currency || 'INR';

  // Company Brand Data
  const companyName = business.name || business.legal_name || 'Apex Solutions Pvt. Ltd.';
  const tagline = business.tagline || 'Technology for a Better Tomorrow';
  const fullAddress = [
    business.address_line1,
    business.address_line2,
    business.city,
    business.state,
    business.postal_code,
    business.country || 'India',
  ].filter(Boolean).join(', ');

  const phone = business.phone || '+91 98765 43210';
  const email = business.email || 'billing@apexsolutions.com';
  const website = business.website || 'www.apexsolutions.com';
  const gstin = business.tax_id || '27AAAAA0000A1Z5';

  const logoHtml = business.logo_uri
    ? `<img src="${business.logo_uri}" alt="Logo" style="max-width: 240px; max-height: 75px; width: auto; height: auto; object-fit: contain; object-position: center; display: block;" />`
    : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 56px; height: 56px; text-align: center; color: ${theme.accentColor}; font-weight: 800; font-size: 8.5px; letter-spacing: 0.5px;">
        <div style="font-size: 16px; line-height: 1; margin-bottom: 2px;">✦</div>
        [ORGANIZATION LOGO]
      </div>`;

  // Buyer Data
  const buyerName = doc.customer_business_name || doc.customer_name || 'Acme Enterprises';
  const buyerGstin = (doc as any).customer_tax_id || (doc as any).buyer_gstin || '29BBBBB1111B1Z2';
  const buyerAddress = doc.customer_billing_address || 'Plot 12, Industrial Area, Whitefield, Bengaluru - 560066';
  const buyerState = business.state || 'Karnataka';

  // Shipping Data
  const shipAddress = (doc as any).customer_shipping_address || buyerAddress;

  // Dates
  const issueDateFormatted = formatDate(doc.issue_date);
  const dueDateFormatted = doc.due_date ? formatDate(doc.due_date) : formatDate(doc.issue_date + 30 * 86400000);

  // Line items
  const items = doc.items || [];
  let totalTaxableMinor = 0n;
  let totalCgstMinor = 0n;
  let totalSgstMinor = 0n;
  let totalIgstMinor = 0n;

  // Is intra-state (split CGST/SGST) or inter-state (IGST)
  const isInterState = false; // default intra-state for domestic invoice representation
  const taxRateBp = doc.tax_rate_bp || 1800; // 18% default
  const taxRatePercent = (taxRateBp / 100).toFixed(1);
  const halfTaxRatePercent = (taxRateBp / 200).toFixed(1);

  const itemsHtml = items.map((item, idx) => {
    const qtyStr = quantityScaledToString(BigInt(item.quantity_scaled));
    const rateStr = formatMoney({ amountMinor: BigInt(item.unit_price_minor), currency });
    const lineTotalMinor = BigInt(item.line_total_minor);
    totalTaxableMinor += lineTotalMinor;

    const lineTaxMinor = (lineTotalMinor * BigInt(taxRateBp)) / 10000n;
    let cgstAmt = '—';
    let sgstAmt = '—';
    let igstAmt = '—';

    if (isInterState) {
      totalIgstMinor += lineTaxMinor;
      igstAmt = formatMoney({ amountMinor: lineTaxMinor, currency });
    } else {
      const halfTax = lineTaxMinor / 2n;
      totalCgstMinor += halfTax;
      totalSgstMinor += halfTax;
      cgstAmt = formatMoney({ amountMinor: halfTax, currency });
      sgstAmt = formatMoney({ amountMinor: halfTax, currency });
    }

    const itemTotalWithTax = lineTotalMinor + lineTaxMinor;
    const itemTotalStr = formatMoney({ amountMinor: itemTotalWithTax, currency });

    return `
      <tr>
        <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
        <td>
          <div style="font-weight: 600; color: #111827;">${escapeHtml(item.description)}</div>
          ${item.item_notes ? `<div style="font-size: 10px; color: #64748B;">${escapeHtml(item.item_notes)}</div>` : ''}
        </td>
        <td style="text-align: center; color: #475569;">${escapeHtml(item.hsn_sac || '998314')}</td>
        <td style="text-align: center;">${qtyStr}</td>
        <td style="text-align: center;">${escapeHtml(item.unit_name || 'NOS')}</td>
        <td style="text-align: right;">${rateStr}</td>
        <td style="text-align: right; font-weight: 500;">${formatMoney({ amountMinor: lineTotalMinor, currency })}</td>
        <td style="text-align: right;">${cgstAmt}</td>
        <td style="text-align: right;">${sgstAmt}</td>
        <td style="text-align: right;">${igstAmt}</td>
        <td style="text-align: right; font-weight: 600; color: #111827;">${itemTotalStr}</td>
      </tr>
    `;
  }).join('');

  const grandTotalMinor = BigInt(doc.total_minor || 0);
  const grandTotalStr = formatMoney({ amountMinor: grandTotalMinor, currency });

  // Bank Info
  const bankName = business.bank_name || 'HDFC Bank Ltd.';
  const accountName = business.legal_name || business.name || 'Apex Solutions Pvt. Ltd.';
  const accountNo = business.bank_account_number || '50200084729103';
  const ifscCode = business.bank_ifsc || 'HDFC0000240';
  const bankBranch = business.bank_branch || 'Indiranagar, Bengaluru';
  const accountType = business.bank_account_type || 'Current Account';
  const upiId = business.upi_vpa || 'apexsolutions@hdfcbank';

  // Signatory
  const signatoryName = business.signatory_name || 'Authorized Signatory';
  const signatoryTitle = business.signatory_title || 'Director / Partner';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${doc.document_number}</title>
  <style>
    @page {
      size: ${paperSize === 'letter' ? 'letter portrait' : 'A4 portrait'};
      margin: ${paperSize === 'letter' ? '0.5in 0.45in 0.55in 0.45in' : '10mm 12mm 12mm 12mm'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000000;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.4;
      padding: 0;
      box-sizing: border-box;
      width: 100%;
      overflow: visible;
      -webkit-font-smoothing: antialiased;
    }
    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        width: 100% !important;
        overflow: visible !important;
      }
      .invoice-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
      }
      .grid-2x2, .summary-grid, .words-box, .bottom-3col {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
    }
    @media screen {
      body {
        padding: 24px 16px;
        background: #0F172A;
        display: flex;
        justify-content: center;
      }
      .invoice-container {
        background: #FFFFFF;
        max-width: 840px;
        width: 100%;
        padding: 24px 28px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 4px;
        box-sizing: border-box;
      }
    }
    .invoice-container {
      width: 100%;
      margin: 0 auto;
      border: 1px solid #CBD5E1;
      padding: 16px;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    /* Brand Header */
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: ${theme.dividerRule};
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .brand-left {
      width: auto;
      max-width: 250px;
      min-width: 60px;
    }
    .logo-box {
      max-width: 240px;
      max-height: 75px;
      min-height: 40px;
      width: auto;
      height: auto;
      border: 1.5px solid ${theme.accentColor};
      border-radius: 4px;
      padding: 4px;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
    }
    .logo-box img {
      max-width: 240px;
      max-height: 75px;
      width: auto;
      height: auto;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .brand-center {
      flex: 1;
      text-align: center;
      padding: 0 16px;
    }
    .org-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: bold;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .org-tagline {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 3px 0 6px 0;
    }
    .org-contacts {
      font-size: 9.5px;
      color: #4B5563;
      line-height: 1.5;
    }
    .brand-right {
      border-left: 1.5px solid #E5E7EB;
      padding-left: 16px;
      text-align: right;
      min-width: 150px;
    }
    .doc-type-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      letter-spacing: 0.5px;
    }
    .doc-type-sub {
      font-size: 8.5px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 4px;
      line-height: 1.4;
    }
    /* 4-Box Grid */
    .grid-2x2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .info-card {
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      overflow: hidden;
    }
    .card-header {
      background: ${theme.isMonochrome ? '#000000' : '#111827'};
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 5px 8px;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .card-body {
      padding: 6px 8px;
      font-size: 10px;
      line-height: 1.5;
    }
    .kv-table {
      width: 100%;
      border-collapse: collapse;
    }
    .kv-table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .kv-label {
      color: #4B5563;
      font-weight: 500;
      width: 40%;
    }
    .kv-val {
      color: #111827;
      font-weight: 600;
    }
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid #D1D5DB;
    }
    .items-table th {
      background: ${theme.isMonochrome ? '#111827' : theme.tableHeaderBg};
      color: ${theme.isMonochrome ? '#FFFFFF' : '#111827'};
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 6px 4px;
      border: 1px solid #D1D5DB;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .items-table td {
      padding: 5px 4px;
      font-size: 10px;
      border: 1px solid #E5E7EB;
      vertical-align: middle;
    }
    /* Summary Sections */
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 10px;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #D1D5DB;
    }
    .summary-table th {
      background: ${theme.isMonochrome ? '#111827' : theme.tableHeaderBg};
      color: ${theme.isMonochrome ? '#FFFFFF' : '#111827'};
      font-size: 9.5px;
      padding: 4px 6px;
      text-align: left;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .summary-table td {
      padding: 4px 6px;
      font-size: 10px;
      border: 1px solid #E5E7EB;
    }
    .grand-total-row {
      background: ${theme.isMonochrome ? '#000000' : '#111827'} !important;
      color: #FFFFFF !important;
      font-weight: bold;
      font-size: 12px;
      border: 1.5px solid ${theme.accentColor} !important;
    }
    .grand-total-row td {
      border: none !important;
      padding: 6px 8px !important;
    }
    /* Words box */
    .words-box {
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .words-header {
      background: ${theme.tableHeaderBg};
      color: #000000;
      font-size: 9.5px;
      font-weight: 700;
      padding: 4px 8px;
      border-bottom: 1.5px solid ${theme.accentColor};
    }
    .words-content {
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 600;
      color: #111827;
      text-transform: uppercase;
    }
    /* 3-Column Bottom Block */
    .bottom-3col {
      display: grid;
      grid-template-columns: 1.1fr 1.1fr 0.9fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .sign-box {
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sign-area {
      padding: 10px 8px 4px 8px;
      text-align: center;
    }
    .sign-line {
      border-top: 1px solid #111827;
      margin: 32px 12px 6px 12px;
    }
    .sign-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #111827;
    }
    .sign-sub {
      font-size: 8.5px;
      color: #64748B;
    }
    /* Footer */
    .footer-bar {
      border-top: 1.5px solid ${theme.accentColor};
      padding-top: 8px;
      text-align: center;
      font-size: 9px;
      color: #64748B;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Brand Letterhead Header -->
    <div class="brand-header">
      <div class="brand-left">
        <div class="logo-box">${logoHtml}</div>
      </div>
      <div class="brand-center">
        <div class="org-title">[ ${escapeHtml(companyName)} ]</div>
        <div class="org-tagline">${escapeHtml(tagline)}</div>
        <div class="org-contacts">
          <div>&#128205; ${escapeHtml(fullAddress)}</div>
          <div>&#128222; ${escapeHtml(phone)} &nbsp;&bull;&nbsp; &#9993; ${escapeHtml(email)}</div>
          <div>&#127760; ${escapeHtml(website)} &nbsp;&bull;&nbsp; <strong>GSTIN:</strong> ${escapeHtml(gstin)}</div>
        </div>
      </div>
      <div class="brand-right">
        <div class="doc-type-title">TAX INVOICE</div>
        <div class="doc-type-sub">
          ORIGINAL FOR RECIPIENT<br />
          DUPLICATE FOR TRANSPORTER<br />
          TRIPLICATE FOR SUPPLIER
        </div>
      </div>
    </div>

    <!-- 4-Box Grid -->
    <div class="grid-2x2">
      <!-- Invoice Details -->
      <div class="info-card">
        <div class="card-header">INVOICE DETAILS</div>
        <div class="card-body">
          <table class="kv-table">
            <tr><td class="kv-label">Invoice No.</td><td class="kv-val">: ${escapeHtml(doc.document_number)}</td></tr>
            <tr><td class="kv-label">Issue Date</td><td class="kv-val">: ${issueDateFormatted}</td></tr>
            <tr><td class="kv-label">Due Date</td><td class="kv-val">: ${dueDateFormatted}</td></tr>
            <tr><td class="kv-label">Place of Supply</td><td class="kv-val">: ${escapeHtml(buyerState)}</td></tr>
            <tr><td class="kv-label">Reverse Charge</td><td class="kv-val">: No</td></tr>
            <tr><td class="kv-label">Payment Terms</td><td class="kv-val">: ${escapeHtml(doc.payment_terms_preset || 'Net 30 Days')}</td></tr>
            <tr><td class="kv-label">Reference / PO</td><td class="kv-val">: ${escapeHtml(doc.po_number || 'PO-2026-089')}</td></tr>
          </table>
        </div>
      </div>

      <!-- Bill To (Customer) -->
      <div class="info-card">
        <div class="card-header">BILL TO (CUSTOMER)</div>
        <div class="card-body">
          <table class="kv-table">
            <tr><td class="kv-label">Customer Name</td><td class="kv-val">: ${escapeHtml(buyerName)}</td></tr>
            <tr><td class="kv-label">GSTIN</td><td class="kv-val">: ${escapeHtml(buyerGstin)}</td></tr>
            <tr><td class="kv-label">Billing Address</td><td class="kv-val">: ${escapeHtml(buyerAddress)}</td></tr>
            <tr><td class="kv-label">State</td><td class="kv-val">: ${escapeHtml(buyerState)}</td></tr>
            <tr><td class="kv-label">Contact Person</td><td class="kv-val">: Accounts Payable</td></tr>
            <tr><td class="kv-label">Email</td><td class="kv-val">: finance@buyer.com</td></tr>
            <tr><td class="kv-label">Phone</td><td class="kv-val">: +91 98450 12345</td></tr>
          </table>
        </div>
      </div>

      <!-- Ship To -->
      <div class="info-card">
        <div class="card-header">SHIP TO (IF DIFFERENT)</div>
        <div class="card-body">
          <table class="kv-table">
            <tr><td class="kv-label">Customer Name</td><td class="kv-val">: ${escapeHtml(buyerName)}</td></tr>
            <tr><td class="kv-label">Shipping Address</td><td class="kv-val">: ${escapeHtml(shipAddress)}</td></tr>
            <tr><td class="kv-label">State</td><td class="kv-val">: ${escapeHtml(buyerState)}</td></tr>
          </table>
        </div>
      </div>

      <!-- Other Details -->
      <div class="info-card">
        <div class="card-header">OTHER DETAILS</div>
        <div class="card-body">
          <table class="kv-table">
            <tr><td class="kv-label">Supply Type</td><td class="kv-val">: Services / Goods</td></tr>
            <tr><td class="kv-label">Transport Mode</td><td class="kv-val">: ROAD / COURIER</td></tr>
            <tr><td class="kv-label">Vehicle No.</td><td class="kv-val">: KA-01-MJ-4029</td></tr>
            <tr><td class="kv-label">E-Way Bill No.</td><td class="kv-val">: 281049281920</td></tr>
            <tr><td class="kv-label">Delivery Date</td><td class="kv-val">: ${issueDateFormatted}</td></tr>
          </table>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 4%;">S.No.</th>
          <th rowspan="2" style="width: 28%;">Description of Goods / Services</th>
          <th rowspan="2" style="width: 9%;">HSN/SAC</th>
          <th rowspan="2" style="width: 6%;">Qty</th>
          <th rowspan="2" style="width: 6%;">Unit</th>
          <th rowspan="2" style="width: 10%;">Rate (₹)</th>
          <th rowspan="2" style="width: 11%;">Taxable Value (₹)</th>
          <th colspan="3" style="width: 16%;">Tax Amount (₹)</th>
          <th rowspan="2" style="width: 10%;">Total (₹)</th>
        </tr>
        <tr>
          <th style="font-size: 8.5px; padding: 2px;">CGST (${halfTaxRatePercent}%)</th>
          <th style="font-size: 8.5px; padding: 2px;">SGST (${halfTaxRatePercent}%)</th>
          <th style="font-size: 8.5px; padding: 2px;">IGST (${taxRatePercent}%)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Summaries -->
    <div class="summary-grid">
      <!-- Tax Summary -->
      <div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Tax Type</th>
              <th style="text-align: right;">Taxable Value (₹)</th>
              <th style="text-align: center;">Rate (%)</th>
              <th style="text-align: right;">Tax Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CGST</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalTaxableMinor, currency })}</td>
              <td style="text-align: center;">${halfTaxRatePercent}%</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalCgstMinor, currency })}</td>
            </tr>
            <tr>
              <td>SGST</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalTaxableMinor, currency })}</td>
              <td style="text-align: center;">${halfTaxRatePercent}%</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalSgstMinor, currency })}</td>
            </tr>
            <tr>
              <td>IGST</td>
              <td style="text-align: right;">—</td>
              <td style="text-align: center;">${taxRatePercent}%</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalIgstMinor, currency })}</td>
            </tr>
            <tr style="font-weight: 700; background: #F8FAFC;">
              <td>Total Tax</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalTaxableMinor, currency })}</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalCgstMinor + totalSgstMinor + totalIgstMinor, currency })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Amount Summary -->
      <div>
        <table class="summary-table">
          <thead>
            <tr>
              <th colspan="2">AMOUNT SUMMARY</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Taxable Value</td>
              <td style="text-align: right; font-weight: 600;">${formatMoney({ amountMinor: totalTaxableMinor, currency })}</td>
            </tr>
            <tr>
              <td>Total CGST</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalCgstMinor, currency })}</td>
            </tr>
            <tr>
              <td>Total SGST</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalSgstMinor, currency })}</td>
            </tr>
            <tr>
              <td>Total IGST</td>
              <td style="text-align: right;">${formatMoney({ amountMinor: totalIgstMinor, currency })}</td>
            </tr>
            <tr>
              <td>Round Off</td>
              <td style="text-align: right;">₹ 0.00</td>
            </tr>
            <tr class="grand-total-row">
              <td>GRAND TOTAL</td>
              <td style="text-align: right; font-size: 13px;">${grandTotalStr}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="words-box">
      <div class="words-header">Amount in Words (INR)</div>
      <div class="words-content">
        [ ${escapeHtml((doc as any).total_in_words || 'Indian Rupees Only')} ]
      </div>
    </div>

    <!-- 3-Column Bottom Block -->
    <div class="bottom-3col">
      <!-- Bank Details -->
      <div class="info-card">
        <div class="card-header">BANK DETAILS</div>
        <div class="card-body">
          <table class="kv-table">
            <tr><td class="kv-label">Account Name</td><td class="kv-val">: ${escapeHtml(accountName)}</td></tr>
            <tr><td class="kv-label">Bank Name</td><td class="kv-val">: ${escapeHtml(bankName)}</td></tr>
            <tr><td class="kv-label">Account No.</td><td class="kv-val">: ${escapeHtml(accountNo)}</td></tr>
            <tr><td class="kv-label">IFSC Code</td><td class="kv-val">: ${escapeHtml(ifscCode)}</td></tr>
            <tr><td class="kv-label">Branch</td><td class="kv-val">: ${escapeHtml(bankBranch)}</td></tr>
            <tr><td class="kv-label">Account Type</td><td class="kv-val">: ${escapeHtml(accountType)}</td></tr>
            <tr><td class="kv-label">UPI ID</td><td class="kv-val">: ${escapeHtml(upiId)}</td></tr>
          </table>
        </div>
      </div>

      <!-- Payment Terms -->
      <div class="info-card">
        <div class="card-header">PAYMENT TERMS & NOTES</div>
        <div class="card-body" style="font-size: 9.5px; color: #374151;">
          <ol style="padding-left: 14px; line-height: 1.5;">
            <li>Payment is due within ${escapeHtml(doc.payment_terms_preset || '30 days')}.</li>
            <li>Please reference invoice number in remittance.</li>
            <li>Goods once sold will not be accepted back except under warranty.</li>
            <li>Interest @ 18% p.a. applicable on overdue balance.</li>
            <li>Disputes subject to ${escapeHtml(business.city || 'Bengaluru')} jurisdiction only.</li>
          </ol>
        </div>
      </div>

      <!-- Declaration -->
      <div class="sign-box">
        <div class="card-header">DECLARATION</div>
        <div style="padding: 6px 8px; font-size: 8.5px; color: #4B5563; line-height: 1.3;">
          We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
        </div>
        <div class="sign-area">
          <div class="sign-line"></div>
          <div class="sign-title">[ AUTHORIZED SIGNATORY ]</div>
          <div class="sign-sub">For ${escapeHtml(companyName)}</div>
          <div class="sign-sub">Designation: ${escapeHtml(signatoryTitle)}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      THANK YOU FOR YOUR BUSINESS &nbsp;&bull;&nbsp; OFFICIAL BUSINESS DOCUMENT
    </div>
  </div>
</body>
</html>`;
}
