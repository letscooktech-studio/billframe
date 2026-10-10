/**
 * PURCHASE ORDER RENDERER
 * 
 * High-fidelity HTML generator matching media_1791553779171_d05c53ce.png:
 * - Brand header with organization logo, name, tagline, address and tax IDs
 * - Title: PURCHASE ORDER (GOODS • SERVICES • PROJECTS)
 * - 5-Box Grid: PO Details, Buyer (Billing), Procurement Terms, Supplier (Vendor), Delivery & Invoice To
 * - Items Table with gold header: #, Item Code, Description, Qty, UOM, Unit Price, Tax %, Line Total
 * - Terms & Conditions list & Totals summary table with gold Grand Total bar
 * - Triple sign-off: Delivery Acknowledgement, Approved By (Buyer), and For Supplier Use
 * - Page footer
 */

import { BusinessProfile } from '../../../domain/profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../../domain/documents/universal/types';
import { TemplateCustomization } from '../types';
import { escapeHtml, resolveDocumentTheme } from './commonStyles';

export function renderPurchaseOrderHtml(
  instance: UniversalDocumentInstance,
  schema: UniversalDocumentSchema,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4',
  customization?: TemplateCustomization
): string {
  const theme = resolveDocumentTheme(business, customization);
  const content = instance.content || {};
  const partyDetails = instance.partyDetails || {};

  const companyName = business.name || business.legal_name || 'Apex Solutions Pvt. Ltd.';
  const tagline = business.tagline || 'GLOBAL PROCUREMENT & SUPPLY CHAIN';
  const companyAddress1 = business.address_line1 || 'Tech Park Campus, Tower A, Indiranagar';
  const companyAddress2 = [business.city, business.state, business.postal_code].filter(Boolean).join(', ') || 'Bengaluru, Karnataka - 560038';

  const companyPhone = business.phone || '+91 98765 43210';
  const companyEmail = business.email || 'procurement@apexsolutions.com';
  const companyWebsite = business.website || 'www.apexsolutions.com';
  const regNo = business.tax_id || 'GSTIN: 27AAAAA0000A1Z5';

  const logoHtml = business.logo_uri
    ? `<img src="${business.logo_uri}" alt="Logo" style="max-width: 240px; max-height: 75px; width: auto; height: auto; object-fit: contain; object-position: center; display: block;" />`
    : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 56px; height: 56px; text-align: center; color: ${theme.accentColor}; font-weight: 800; font-size: 10px; letter-spacing: 0.5px;">
        <div style="font-size: 16px; line-height: 1; margin-bottom: 2px;">✦</div>
        LOGO
      </div>`;

  const issueDateFormatted = new Date(instance.issueDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const poNumber = instance.documentNumber || 'PO-2026-0812';
  const revision = content.revision_number || 'REV-00';
  const reference = content.reference_project || 'Project Horizon Infrastructure';

  // Buyer details
  const buyerName = business.legal_name || companyName;
  const buyerContact = business.contact_person || 'Director of Procurement';

  // Supplier / Vendor details
  const supplierName = instance.partyName || content.supplier_name || 'Global Industrial Components Ltd.';
  const supplierAddress1 = partyDetails.address || content.supplier_address_1 || 'Phase 2, Peenya Industrial Area';
  const supplierAddress2 = content.supplier_address_2 || 'Bengaluru, Karnataka - 560058';
  const supplierContact = partyDetails.contact_person || content.supplier_contact || 'Mahesh Sharma';
  const supplierPhone = partyDetails.phone || content.supplier_phone || '+91 98450 67890';
  const supplierEmail = partyDetails.email || content.supplier_email || 'orders@globalindustrial.com';
  const supplierGstin = partyDetails.tax_id || content.supplier_gstin || '29AAAAA1111A1Z1';
  const vendorCode = content.vendor_code || 'VND-9042';

  // Procurement terms
  const currency = content.currency || business.default_currency || 'INR';
  const paymentTerms = content.payment_terms || 'Net 45 Days Post Delivery';
  const deliveryTerms = content.delivery_terms || 'FOB Destination / Door Delivery';
  const deliveryDate = content.delivery_date ? new Date(content.delivery_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : '25 Oct 2026';
  const placeOfDelivery = content.place_of_delivery || 'Central Warehouse, Whitefield, Bengaluru';
  const projectDept = content.project_department || 'Capital Projects / Infrastructure';

  // Delivery & Invoice To
  const deliveryToName = content.delivery_site_name || `${companyName} Logistics Hub`;
  const specialInstructions = content.special_delivery_instructions || 
    'Advance dispatch intimation required 24 hours prior. Delivery between 9:00 AM - 4:00 PM on business days only. Material test certificate to accompany challan.';

  // Line items
  const items: any[] = Array.isArray(content.items) && content.items.length > 0
    ? content.items
    : [
        { code: 'IC-401', desc: 'Precision CNC Machined Alloy Flanges 150mm', qty: '50', uom: 'PCS', price: '4,200.00', tax: '18%', total: '2,10,000.00' },
        { code: 'IC-408', desc: 'High-Tensile Stainless Fastener Assemblies M16', qty: '200', uom: 'SETS', price: '380.00', tax: '18%', total: '76,000.00' },
        { code: 'IC-512', desc: 'EPDM Pressure Sealing Gaskets 150mm Rating', qty: '100', uom: 'NOS', price: '195.00', tax: '18%', total: '19,500.00' },
        { code: 'IC-601', desc: 'Ultrasonic Non-Destructive Weld Inspection Kit', qty: '1', uom: 'SET', price: '45,000.00', tax: '18%', total: '45,000.00' },
      ];

  const subtotal = content.subtotal || '₹ 3,50,500.00';
  const discount = content.discount || '₹ 0.00';
  const taxableAmount = content.taxable_amount || '₹ 3,50,500.00';
  const taxAmount = content.tax_amount || '₹ 63,090.00 (18% GST)';
  const tcsTds = content.tcs_tds || '₹ 0.00';
  const grandTotal = content.grand_total || '₹ 4,13,590.00';

  const itemsHtml = items.map((it, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
      <td style="text-align: center; font-size: 9px; color: #4B5563;">${escapeHtml(it.code || '—')}</td>
      <td style="font-weight: 500;">${escapeHtml(it.desc || it.description)}</td>
      <td style="text-align: center;">${escapeHtml(String(it.qty || '1'))}</td>
      <td style="text-align: center;">${escapeHtml(it.uom || it.unit || 'NOS')}</td>
      <td style="text-align: right;">${escapeHtml(String(it.price || it.unit_price || '0.00'))}</td>
      <td style="text-align: center;">${escapeHtml(String(it.tax || '18%'))}</td>
      <td style="text-align: right; font-weight: 600;">${escapeHtml(String(it.total || it.line_total || '0.00'))}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${poNumber} - Purchase Order</title>
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
      font-size: 10px;
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
      .po-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
      }
      .box-card, .summary-grid, .sign-grid {
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
      .po-container {
        background: #FFFFFF;
        max-width: 840px;
        width: 100%;
        padding: 24px 28px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 4px;
        box-sizing: border-box;
      }
    }
    .po-container {
      width: 100%;
      margin: 0 auto;
      border: 1px solid #CBD5E1;
      padding: 14px;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    /* Brand Header */
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: ${theme.dividerRule};
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .brand-left {
      width: auto;
      max-width: 250px;
      min-width: 60px;
    }
    .logo-box {
      border: 1.5px solid ${theme.accentColor};
      border-radius: 4px;
      padding: 4px;
      max-width: 240px;
      max-height: 75px;
      min-height: 40px;
      width: auto;
      height: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      box-sizing: border-box;
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
      padding: 0 14px;
    }
    .org-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .org-tagline {
      font-size: 9px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 2px 0 4px 0;
    }
    .org-contacts {
      font-size: 9px;
      color: #4B5563;
      line-height: 1.4;
    }
    .brand-right {
      border-left: 1.5px solid #E5E7EB;
      padding-left: 14px;
      text-align: right;
      min-width: 160px;
    }
    .po-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: bold;
      color: ${theme.isMonochrome ? '#000000' : theme.accentColor};
      letter-spacing: 0.5px;
    }
    .po-sub {
      font-size: 8.5px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 600;
      margin-top: 3px;
    }
    /* Grid sections */
    .grid-3col {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .box-card {
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      overflow: hidden;
    }
    .box-header {
      background: ${theme.isMonochrome ? '#000000' : '#111827'};
      color: #FFFFFF;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 5px 8px;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .box-body {
      padding: 6px 8px;
      font-size: 9.5px;
      line-height: 1.45;
    }
    .kv-t {
      width: 100%;
      border-collapse: collapse;
    }
    .kv-t td {
      padding: 1.5px 0;
      vertical-align: top;
    }
    .kv-k {
      color: #4B5563;
      font-weight: 600;
      width: 44%;
    }
    .kv-v {
      color: #111827;
      font-weight: 500;
    }
    /* Items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #CBD5E1;
    }
    .items-table th {
      background: ${theme.isMonochrome ? '#111827' : theme.tableHeaderBg};
      color: ${theme.isMonochrome ? '#FFFFFF' : '#111827'};
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 6px 4px;
      border: 1px solid #CBD5E1;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .items-table td {
      padding: 5px 4px;
      font-size: 9.5px;
      border: 1px solid #E5E7EB;
    }
    /* Terms and Summary */
    .summary-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .summary-t {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #CBD5E1;
    }
    .summary-t td {
      padding: 3.5px 6px;
      font-size: 9.5px;
      border: 1px solid #E5E7EB;
    }
    .grand-total-row {
      background: ${theme.isMonochrome ? '#000000' : '#111827'} !important;
      color: #FFFFFF !important;
      font-weight: bold;
      font-size: 11.5px;
      border: 1.5px solid ${theme.accentColor} !important;
    }
    .grand-total-row td {
      border: none !important;
      padding: 6px 8px !important;
    }
    /* Sign-offs */
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .sign-card {
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      overflow: hidden;
      font-size: 9px;
    }
    .sign-body {
      padding: 6px 8px;
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .seal-box {
      border: 1px solid #CBD5E1;
      width: 60px;
      height: 30px;
      margin-top: 4px;
      font-size: 8px;
      color: #9CA3AF;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Footer */
    .footer-bar {
      border-top: 1.5px solid ${theme.accentColor};
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="po-container">
    <!-- Brand Header -->
    <div class="brand-header">
      <div class="brand-left">
        <div class="logo-box">${logoHtml}</div>
      </div>
      <div class="brand-center">
        <div class="org-title">[ ${escapeHtml(companyName)} ]</div>
        <div class="org-tagline">${escapeHtml(tagline)}</div>
        <div class="org-contacts">
          <div>&#128205; ${escapeHtml(companyAddress1)}, ${escapeHtml(companyAddress2)}</div>
          <div>&#128222; ${escapeHtml(companyPhone)} &nbsp;&bull;&nbsp; &#9993; ${escapeHtml(companyEmail)}</div>
          <div>&#127760; ${escapeHtml(companyWebsite)} &nbsp;&bull;&nbsp; <strong>${escapeHtml(regNo)}</strong></div>
        </div>
      </div>
      <div class="brand-right">
        <div class="po-title">PURCHASE ORDER</div>
        <div class="po-sub">GOODS &bull; SERVICES &bull; PROJECTS</div>
      </div>
    </div>

    <!-- Top Grid (3 blocks) -->
    <div class="grid-3col">
      <!-- 1. PO Details -->
      <div class="box-card">
        <div class="box-header">&#128196; PURCHASE ORDER DETAILS</div>
        <div class="box-body">
          <table class="kv-t">
            <tr><td class="kv-k">PO Number</td><td class="kv-v">: [ ${escapeHtml(poNumber)} ]</td></tr>
            <tr><td class="kv-k">Issue Date</td><td class="kv-v">: [ ${issueDateFormatted} ]</td></tr>
            <tr><td class="kv-k">Revision</td><td class="kv-v">: [ ${escapeHtml(revision)} ]</td></tr>
            <tr><td class="kv-k">Reference</td><td class="kv-v">: [ ${escapeHtml(reference)} ]</td></tr>
          </table>
        </div>
      </div>

      <!-- 2. Buyer (Billing) -->
      <div class="box-card">
        <div class="box-header">&#128722; BUYER (BILLING) DETAILS</div>
        <div class="box-body">
          <table class="kv-t">
            <tr><td class="kv-k">Name</td><td class="kv-v">: [ ${escapeHtml(buyerName)} ]</td></tr>
            <tr><td class="kv-k">Address</td><td class="kv-v">: [ ${escapeHtml(companyAddress1)} ]</td></tr>
            <tr><td class="kv-k">Contact</td><td class="kv-v">: [ ${escapeHtml(buyerContact)} ]</td></tr>
            <tr><td class="kv-k">Email</td><td class="kv-v">: [ ${escapeHtml(companyEmail)} ]</td></tr>
            <tr><td class="kv-k">GSTIN</td><td class="kv-v">: [ ${escapeHtml(business.tax_id || '27AAAAA0000A1Z5')} ]</td></tr>
          </table>
        </div>
      </div>

      <!-- 3. Procurement Terms -->
      <div class="box-card">
        <div class="box-header">&#9881; PROCUREMENT TERMS</div>
        <div class="box-body">
          <table class="kv-t">
            <tr><td class="kv-k">Currency</td><td class="kv-v">: [ ${escapeHtml(currency)} ]</td></tr>
            <tr><td class="kv-k">Payment Terms</td><td class="kv-v">: [ ${escapeHtml(paymentTerms)} ]</td></tr>
            <tr><td class="kv-k">Delivery Terms</td><td class="kv-v">: [ ${escapeHtml(deliveryTerms)} ]</td></tr>
            <tr><td class="kv-k">Delivery Date</td><td class="kv-v">: [ ${deliveryDate} ]</td></tr>
            <tr><td class="kv-k">Place of Delivery</td><td class="kv-v">: [ ${escapeHtml(placeOfDelivery)} ]</td></tr>
            <tr><td class="kv-k">Project / Dept</td><td class="kv-v">: [ ${escapeHtml(projectDept)} ]</td></tr>
          </table>
        </div>
      </div>
    </div>

    <!-- Second Grid (2 blocks) -->
    <div class="grid-2col">
      <!-- 4. Supplier Details -->
      <div class="box-card">
        <div class="box-header">&#128100; SUPPLIER (VENDOR) DETAILS</div>
        <div class="box-body">
          <table class="kv-t">
            <tr><td class="kv-k">Supplier Name</td><td class="kv-v">: [ ${escapeHtml(supplierName)} ]</td></tr>
            <tr><td class="kv-k">Address</td><td class="kv-v">: [ ${escapeHtml(supplierAddress1)}, ${escapeHtml(supplierAddress2)} ]</td></tr>
            <tr><td class="kv-k">Contact Person</td><td class="kv-v">: [ ${escapeHtml(supplierContact)} ]</td></tr>
            <tr><td class="kv-k">Phone / Email</td><td class="kv-v">: [ ${escapeHtml(supplierPhone)} &bull; ${escapeHtml(supplierEmail)} ]</td></tr>
            <tr><td class="kv-k">GSTIN / Tax ID</td><td class="kv-v">: [ ${escapeHtml(supplierGstin)} ]</td></tr>
            <tr><td class="kv-k">Vendor Code</td><td class="kv-v">: [ ${escapeHtml(vendorCode)} ]</td></tr>
          </table>
        </div>
      </div>

      <!-- 5. Delivery & Invoice To -->
      <div class="box-card">
        <div class="box-header">&#128666; DELIVERY & INVOICE TO</div>
        <div class="box-body">
          <table class="kv-t">
            <tr><td class="kv-k">Delivery To</td><td class="kv-v">: [ ${escapeHtml(deliveryToName)} ]</td></tr>
            <tr><td class="kv-k">Address</td><td class="kv-v">: [ ${escapeHtml(placeOfDelivery)} ]</td></tr>
            <tr><td class="kv-k">Contact Person</td><td class="kv-v">: [ Inward Stores Officer ]</td></tr>
            <tr><td class="kv-k">Phone / Email</td><td class="kv-v">: [ +91 98765 43219 &bull; stores@apexsolutions.com ]</td></tr>
          </table>
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 3px; padding: 4px; margin-top: 4px; font-size: 8.5px; color: #4B5563;">
            <strong>&#128221; Special Delivery Instructions:</strong> [ ${escapeHtml(specialInstructions)} ]
          </div>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 12%;">ITEM CODE</th>
          <th style="width: 38%;">DESCRIPTION OF GOODS / SERVICES</th>
          <th style="width: 7%; text-align: center;">QTY</th>
          <th style="width: 7%; text-align: center;">UOM</th>
          <th style="width: 12%; text-align: right;">UNIT PRICE</th>
          <th style="width: 8%; text-align: center;">TAX %</th>
          <th style="width: 12%; text-align: right;">LINE TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Terms & Totals Split -->
    <div class="summary-grid">
      <!-- Terms -->
      <div class="box-card">
        <div class="box-header">&#128221; TERMS & CONDITIONS</div>
        <div class="box-body" style="font-size: 8.5px; color: #4B5563;">
          <ol style="padding-left: 14px; line-height: 1.5;">
            <li>Goods supplied must strictly adhere to technical specs and warranty standards.</li>
            <li>Invoices must cite this PO Number and be submitted with original delivery challan.</li>
            <li>Defective materials will be rejected at vendor's risk and cost.</li>
            <li>Late delivery liquidated damages @ 0.5% per week may apply up to 5% max.</li>
            <li>Governing law and jurisdiction: Bengaluru, Karnataka, India.</li>
          </ol>
        </div>
      </div>

      <!-- Totals -->
      <div>
        <table class="summary-t">
          <tr>
            <td style="font-weight: 600;">Subtotal</td>
            <td style="text-align: right; width: 45%;">${subtotal}</td>
          </tr>
          <tr>
            <td style="color: #059669;">Discount (If any)</td>
            <td style="text-align: right; color: #059669;">-${discount}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Taxable Amount</td>
            <td style="text-align: right;">${taxableAmount}</td>
          </tr>
          <tr>
            <td>Tax (GST / Other)</td>
            <td style="text-align: right;">${taxAmount}</td>
          </tr>
          <tr>
            <td>TCS / TDS (If applicable)</td>
            <td style="text-align: right;">${tcsTds}</td>
          </tr>
          <tr class="grand-total-row">
            <td>GRAND TOTAL</td>
            <td style="text-align: right; font-size: 12px;">${grandTotal}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Triple Sign-offs -->
    <div class="sign-grid">
      <!-- Supplier Acknowledgement -->
      <div class="sign-card">
        <div class="box-header">&#128666; DELIVERY ACKNOWLEDGEMENT</div>
        <div class="sign-body">
          <div style="font-size: 8px; color: #4B5563;">We confirm acceptance of this Purchase Order as per specified terms.</div>
          <div style="margin-top: 6px;">
            <div>Name: [ ${escapeHtml(supplierName)} ]</div>
            <div>Date: _________ &nbsp; Signature: _________</div>
            <div class="seal-box">SEAL</div>
          </div>
        </div>
      </div>

      <!-- Buyer Approval -->
      <div class="sign-card">
        <div class="box-header">&#9989; APPROVED BY (BUYER)</div>
        <div class="sign-body">
          <div>
            <div style="font-weight: 700;">Name: [ ${escapeHtml(buyerContact)} ]</div>
            <div>Designation: [ Head of Supply Chain ]</div>
            <div>Date: [ ${issueDateFormatted} ]</div>
          </div>
          <div style="border-top: 1px solid #111827; margin-top: 18px; padding-top: 2px;">
            Signature: __________________________
          </div>
        </div>
      </div>

      <!-- For Supplier Use -->
      <div class="sign-card">
        <div class="box-header">&#128221; FOR SUPPLIER USE</div>
        <div class="sign-body">
          <div>
            <div>PO Accepted: &#9744; Yes &nbsp; &#9744; No</div>
            <div>Expected Delivery: [ ${deliveryDate} ]</div>
            <div style="font-size: 8px; color: #6B7280; margin-top: 2px;">Remarks: ___________________________</div>
          </div>
          <div style="border-top: 1px solid #9CA3AF; margin-top: 14px; padding-top: 2px;">
            Signature: __________________________
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <span>[ ${escapeHtml(companyName)} ] &nbsp;&bull;&nbsp; [ ${escapeHtml(tagline)} ]</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;
}
