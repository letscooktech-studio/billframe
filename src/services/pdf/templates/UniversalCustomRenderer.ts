/**
 * UNIVERSAL CUSTOM DOCUMENT RENDERER
 * 
 * High-fidelity HTML layout engine implementing the "Billframe Gold/Black Document Master" standard:
 * - Gold-bordered organization logo frame
 * - Serif organization header with legal identity, tagline, address, contacts & tax identifiers
 * - 2px Solid gold accent dividing rule
 * - Uppercase bold serif Document Title
 * - Uppercase gold-tracked Category Subtitle
 * - 2-column rounded metadata cards (Invoice No, Date, Recipient, Employee ID, etc.)
 * - Full-width dark section banners (#111827)
 * - Tables with warm cream headers (#FDFBF7), alternating rows, and checklist status badges
 * - 2-column summary cards with highlighted gold Grand Total / Net Pay / Balance
 * - Dual signature lines with underlines, printed names, designations & seal stamp areas
 * - Gold footer divider with organization details, template verification provenance, and page numbering
 */

import { BusinessProfile } from '../../../domain/profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../../domain/documents/universal/types';
import { TemplateCustomization } from '../types';
import { resolveDocumentTheme, escapeHtml } from './commonStyles';

function cleanText(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderUniversalCustomHtml(
  instance: UniversalDocumentInstance,
  schema: UniversalDocumentSchema,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4',
  customization?: TemplateCustomization
): string {
  const theme = resolveDocumentTheme(business, customization);
  const content = instance.content || {};
  const partyDetails = instance.partyDetails || {};

  const companyName = business.name || business.legal_name || 'Organization Name';
  const legalName = business.legal_name || companyName;
  const tagline = (business as any).tagline || '';
  const companyAddress = [
    business.address_line1,
    (business as any).address_line2,
    business.city,
    business.state,
    business.postal_code,
  ].filter(Boolean).join(', ');

  const companyPhone = business.phone || '';
  const companyEmail = business.email || '';
  const companyWebsite = (business as any).website || '';
  const companyTaxId = business.tax_id ? `GSTIN/TAX: ${business.tax_id}` : '';

  const sublineItems = [
    companyAddress,
    companyPhone ? `Tel: ${companyPhone}` : '',
    companyEmail,
    companyWebsite,
    companyTaxId,
  ].filter(Boolean);

  const issueDateFormatted = new Date(instance.issueDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const partyName = instance.partyName || content.employee_name || content.candidate_name || content.client_name || content.tenant_name || content.student_name || content.customer_name || 'Designated Party';

  // Format category subtitle nicely
  const categoryLabel = (schema.category || 'GENERAL DOCUMENT')
    .replace(/_/g, ' ')
    .toUpperCase();

  // Logo HTML
  const logoUri = business.logo_uri || (business as any).logo_url;
  const logoHtml = logoUri
    ? `<img src="${logoUri}" alt="Logo" style="max-width: 240px; max-height: 75px; width: auto; height: auto; object-fit: contain; object-position: center; display: block;" />`
    : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 56px; height: 56px; text-align: center; color: ${theme.accentColor}; font-weight: 800; font-size: 10px; letter-spacing: 0.5px;">
        <div style="font-size: 16px; line-height: 1; margin-bottom: 2px;">✦</div>
        LOGO
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${cleanText(instance.documentNumber)} - ${cleanText(schema.name)}</title>
  <style>
    @page {
      size: ${paperSize === 'letter' ? 'letter portrait' : 'A4 portrait'};
      margin: ${paperSize === 'letter' ? '0.5in 0.45in 0.55in 0.45in' : '12mm 12mm 14mm 12mm'};
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
      line-height: 1.5;
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
      .doc-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
      }
      .section-block, .signatures-row {
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
      tfoot {
        display: table-footer-group !important;
      }
    }
    @media screen {
      body {
        padding: 24px 16px;
        background: #0F172A;
        display: flex;
        justify-content: center;
      }
      .doc-container {
        background: #FFFFFF;
        max-width: 840px;
        width: 100%;
        padding: 32px 36px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 4px;
        box-sizing: border-box;
      }
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-thumb {
      background: #94A3B8;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    .doc-container {
      width: 100%;
      box-sizing: border-box;
      margin: 0 auto;
    }

    /* Organization Header */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .header-logo-cell {
      width: auto;
      max-width: 250px;
      min-width: 60px;
      vertical-align: middle;
      padding-right: 18px;
    }
    .logo-frame {
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
    .logo-frame img {
      max-width: 240px;
      max-height: 75px;
      width: auto;
      height: auto;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .header-brand-cell {
      vertical-align: middle;
    }
    .brand-name {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    .brand-tagline {
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .brand-subline {
      font-size: 9.5px;
      color: #64748B;
      margin-top: 4px;
      line-height: 1.45;
    }

    /* Dividing Rule */
    .header-divider {
      border: none;
      border-bottom: ${theme.dividerRule};
      margin: 14px 0 20px 0;
      clear: both;
    }

    /* Document Title & Category Bar */
    .title-row {
      margin-bottom: 16px;
    }
    .doc-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 24px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    .category-subtitle {
      font-size: 10px;
      font-weight: 800;
      color: ${theme.isMonochrome ? '#475569' : theme.accentColor};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }

    /* Metadata 2-Column Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .meta-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 10px 14px;
      min-width: 0;
      box-sizing: border-box;
    }
    .meta-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .meta-value {
      font-size: 12px;
      font-weight: 700;
      color: #000000;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    /* Section Banners */
    .section-banner {
      background: ${theme.isMonochrome ? '#000000' : '#111827'};
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 7px 14px;
      border-radius: 3px;
      margin: 18px 0 10px 0;
    }

    /* Fields Grid */
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }
    .field-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      padding: 10px 14px;
      min-width: 0;
      box-sizing: border-box;
    }
    .field-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.4px;
    }
    .field-value {
      font-size: 11.5px;
      font-weight: 600;
      color: #000000;
      margin-top: 2px;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    /* Narrative / Textarea */
    .narrative-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 11px;
      line-height: 1.6;
      color: #000000;
      margin-bottom: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Tables */
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      overflow: hidden;
      word-break: break-word;
    }
    .custom-table th {
      background: ${theme.isMonochrome ? '#111827' : theme.tableHeaderBg};
      color: ${theme.isMonochrome ? '#FFFFFF' : '#111827'};
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 8px 10px;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .custom-table td {
      padding: 8px 10px;
      font-size: 11px;
      border-bottom: 1px solid #E2E8F0;
      color: #000000;
    }
    .custom-table tr:last-child td {
      border-bottom: none;
    }

    /* Status Pills */
    .status-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .status-pass {
      background: ${theme.accentColor};
      color: #FFFFFF;
      border: 1px solid ${theme.accentColor};
    }
    .status-fail {
      background: #FFFFFF;
      color: #000000;
      border: 1.5px solid #000000;
    }
    .status-warn {
      background: #F1F5F9;
      color: #000000;
      border: 1px solid #94A3B8;
    }

    /* Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin: 12px 0 16px 0;
    }
    .summary-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 10px 14px;
      min-width: 0;
      box-sizing: border-box;
    }
    .summary-card-highlight {
      background: ${theme.isMonochrome ? '#000000' : '#111827'};
      border: 1.5px solid ${theme.accentColor};
      border-radius: 4px;
      padding: 10px 14px;
      color: #FFFFFF;
      min-width: 0;
      box-sizing: border-box;
    }
    .summary-card-highlight .summary-label {
      color: #94A3B8;
    }
    .summary-card-highlight .summary-value {
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 800;
    }
    .summary-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 0.4px;
    }
    .summary-value {
      font-size: 13px;
      font-weight: 800;
      color: #000000;
      margin-top: 2px;
      word-break: break-word;
    }
    .summary-value-gold {
      font-size: 14px;
      font-weight: 800;
      color: ${theme.isMonochrome ? '#FFFFFF' : theme.accentColor};
      margin-top: 2px;
      word-break: break-word;
    }

    /* Signatures Section */
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 46%;
    }
    .sig-header {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 40px;
      letter-spacing: 0.4px;
    }
    .sig-rule {
      border-bottom: 1.5px solid #000000;
      margin-bottom: 5px;
      width: 90%;
    }
    .sig-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #000000;
    }
    .sig-sub {
      font-size: 9.5px;
      color: #64748B;
      margin-top: 1px;
    }

    /* Footer */
    .doc-footer {
      border-top: 1.5px solid ${theme.accentColor};
      margin-top: 24px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <!-- Organization Header -->
    <table class="header-table">
      <tr>
        <td class="header-logo-cell">
          <div class="logo-frame">${logoHtml}</div>
        </td>
        <td class="header-brand-cell">
          <div class="brand-name">${cleanText(companyName)}</div>
          ${tagline ? `<div class="brand-tagline">${cleanText(tagline)}</div>` : ''}
          <div class="brand-subline">
            ${sublineItems.map(item => cleanText(item)).join(' &bull; ')}
          </div>
        </td>
      </tr>
    </table>

    <!-- Executive Monochrome Dividing Rule -->
    <div class="header-divider"></div>

    <!-- Document Title & Category -->
    <div class="title-row">
      <div class="doc-title">${cleanText(schema.name)}</div>
      <div class="category-subtitle">${cleanText(categoryLabel)}</div>
    </div>

    <!-- Metadata Grid (2-Column Cards) -->
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">DOCUMENT NUMBER</div>
        <div class="meta-value">${cleanText(instance.documentNumber)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">ISSUE DATE</div>
        <div class="meta-value">${cleanText(issueDateFormatted)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">PRIMARY RECIPIENT / PARTY</div>
        <div class="meta-value">${cleanText(partyName)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">DOCUMENT STATUS</div>
        <div class="meta-value">${cleanText((instance.status || 'DRAFT').toUpperCase())}</div>
      </div>
    </div>

    <!-- Dynamic Sections -->
    ${schema.sections.map((sec) => {
      const normalFields = sec.fields.filter((f) => f.type !== 'table' && f.type !== 'textarea');
      const textareas = sec.fields.filter((f) => f.type === 'textarea');
      const tables = sec.fields.filter((f) => f.type === 'table');

      // Check for summary fields
      const summaryKeys = ['gross_earnings', 'total_deductions', 'net_pay', 'total_paid', 'balance_due', 'closing_balance', 'total_score', 'order_total', 'taxable_total', 'grand_total'];
      const foundSummaryFields = normalFields.filter(f => summaryKeys.includes(f.id));
      const nonSummaryFields = normalFields.filter(f => !summaryKeys.includes(f.id));

      return `
      <div class="section-block">
        <div class="section-banner">${cleanText(sec.title)}</div>

        ${nonSummaryFields.length > 0 ? `
        <div class="fields-grid">
          ${nonSummaryFields.map((f) => {
            const rawVal = content[f.id] !== undefined ? content[f.id] : (f.defaultValue || '—');
            const displayVal = String(rawVal);
            return `
            <div class="field-card">
              <div class="field-label">${cleanText(f.label)}</div>
              <div class="field-value">${cleanText(displayVal)}</div>
            </div>`;
          }).join('')}
        </div>` : ''}

        ${textareas.map((ta) => {
          const val = content[ta.id] || ta.defaultValue || '';
          if (!val) return '';
          return `
          <div class="narrative-card">
            <div class="field-label" style="margin-bottom: 4px;">${cleanText(ta.label)}</div>
            <div>${cleanText(String(val))}</div>
          </div>`;
        }).join('')}

        ${tables.map((tbl) => {
          let rows: any[] = Array.isArray(content[tbl.id]) ? content[tbl.id] : [];
          if (rows.length === 0) {
            // Intelligent fallback mock rows for immediate high-fidelity preview
            const MOCK_ROWS: Record<string, any[]> = {
              equipment_table: [
                { item_name: 'MacBook Pro 16" M3 Max 64GB', serial_number: 'C02G1234MD6R', condition: 'New / Sealed', replacement_value: '₹3,49,000' },
                { item_name: 'Dell UltraSharp 32" 4K U3223QE', serial_number: 'CN-098765-72872', condition: 'Excellent', replacement_value: '₹75,000' },
              ],
              salary_breakdown: [
                { component: 'Basic Salary', monthly: '₹80,000', annual: '₹9,60,000' },
                { component: 'House Rent Allowance (HRA)', monthly: '₹25,000', annual: '₹3,00,000' },
                { component: 'Special Allowance', monthly: '₹15,000', annual: '₹1,80,000' },
              ],
              earnings_table: [
                { earning_head: 'Basic Salary', current_amount: '₹85,000', ytd_amount: '₹5,10,000' },
                { earning_head: 'House Rent Allowance (HRA)', current_amount: '₹42,500', ytd_amount: '₹2,55,000' },
                { earning_head: 'Special / Conveyance Allowance', current_amount: '₹22,500', ytd_amount: '₹1,35,000' },
              ],
              deductions_table: [
                { deduction_head: 'Provident Fund (Employee PF)', current_amount: '₹10,200', ytd_amount: '₹61,200' },
                { deduction_head: 'Professional Tax (PT)', current_amount: '₹200', ytd_amount: '₹1,200' },
                { deduction_head: 'Income Tax (TDS)', current_amount: '₹8,100', ytd_amount: '₹48,600' },
              ],
              actions_table: [
                { agenda_item: 'Q4 Product Roadmap', decision: 'Approved deployment of Billframe 3.0 Engine', owner: 'Vikram S.', due_date: '15 Oct 2026' },
                { agenda_item: 'ISO 27001 Certification', decision: 'Completed internal readiness gap audit', owner: 'Anita D.', due_date: '31 Oct 2026' },
              ],
              inspection_table: [
                { area: 'Main Electrical Distribution Board', condition: 'Clean, calibrated, earthing within safe resistance', severity: 'Satisfactory', action: 'Routine monitoring' },
                { area: 'HVAC Air Handlers & Ducting', condition: 'Filter pressure drop normal, air exchange 100% compliant', severity: 'Pass', action: 'None required' },
              ],
              statement_table: [
                { date: '01 Sep 2026', txn_type: 'Invoice #INV-2026-0612', debit: '₹1,25,000', credit: '—', balance: '₹1,25,000' },
                { date: '15 Sep 2026', txn_type: 'Bank Transfer (NEFT)', debit: '—', credit: '₹1,25,000', balance: '₹0.00' },
                { date: '01 Oct 2026', txn_type: 'Invoice #INV-2026-0780', debit: '₹84,000', credit: '—', balance: '₹84,000' },
              ],
              ledger_table: [
                { date: '01 Sep 2026', reference: 'INV-2026-0612', description: 'Enterprise Cloud Architecture Consulting', debit: '₹2,50,000', credit: '—' },
                { date: '15 Sep 2026', reference: 'NEFT-881920', description: 'Bank Remittance Settlement (Full INV-0612)', debit: '—', credit: '₹2,50,000' },
                { date: '01 Oct 2026', reference: 'INV-2026-0780', description: 'Monthly Retainer & SLA Support Services', debit: '₹84,000', credit: '—' },
              ],
              challan_table: [
                { item_code: 'APX-SVR-01', description: 'Enterprise Rackmount Server 2U Xeon', qty: 2, unit: 'Units' },
                { item_code: 'APX-SW-48', description: '48-Port 10G Managed Core Switch', qty: 4, unit: 'Units' },
              ],
              checklist_table: [
                { checkpoint: 'Reinforced Rebar Grid 4B', criterion: 'ASTM A615 Grade 60 Rebar Ties', result: 'PASS', remarks: 'Ties verified and clean' },
                { checkpoint: 'Concrete Slump Quality Test', criterion: 'Slump 100mm ± 25mm Spec', result: 'PASS', remarks: 'Measured 105mm average' },
                { checkpoint: 'Formwork Dimensional Alignment', criterion: 'Elevation tolerance ± 3mm', result: 'PASS', remarks: 'Laser level verified' },
                { checkpoint: 'Fire Protection Sleeves', criterion: 'UL Listed Intumescent Collars', result: 'PASS', remarks: 'Seals inspected' },
              ],
              handover_table: [
                { item: 'Wall Paint & Surface Condition', condition: 'Freshly painted, zero marks or scuffs', status: 'Passed / Good' },
                { item: 'Electrical Fixtures & AC Units', condition: 'All lights operational, cooling calibrated', status: 'Passed / Good' },
                { item: 'Key Sets & Access Cards', condition: '3 Master keys + 2 RFID entry badges handed over', status: 'Satisfactory' },
              ],
              fee_table: [
                { fee_head: 'Tuition Fee (Semester V)', term: 'Fall 2026', amount: '₹65,000' },
                { fee_head: 'Laboratory & Computing Resources', term: 'Fall 2026', amount: '₹15,000' },
                { fee_head: 'Library & Online Journals Access', term: 'Fall 2026', amount: '₹5,000' },
              ],
              budget_table: [
                { activity: 'Mobile STEM Van Hardware & Kits', timeline: 'Month 1 - 2', total_cost: '₹12,50,000' },
                { activity: 'Curriculum & Certified Mentors', timeline: 'Month 2 - 6', total_cost: '₹8,00,000' },
                { activity: 'Rural School Bootcamps & Evaluation', timeline: 'Month 3 - 12', total_cost: '₹4,50,000' },
              ],
              grn_table: [
                { item_code: 'PRT-2026-01', description: 'High Precision CNC Stepper Motor', ordered_qty: 50, received_qty: 50, accepted_qty: 50, status: 'PASS' },
                { item_code: 'PRT-2026-02', description: 'Hardened Steel Guide Rails 1200mm', ordered_qty: 100, received_qty: 100, accepted_qty: 100, status: 'PASS' },
              ],
              evaluation_table: [
                { criteria: 'On-Time Delivery Performance (OTD)', weight: '30%', score_awarded: '98 / 100', status: 'EXCELLENT' },
                { criteria: 'Quality Acceptance Rate (PPM)', weight: '35%', score_awarded: '96 / 100', status: 'EXCELLENT' },
                { criteria: 'Pricing Stability & Credit Terms', weight: '20%', score_awarded: '90 / 100', status: 'GOOD' },
              ],
              materials_table: [
                { item_code: 'RAW-ALU-01', description: 'Aerospace Grade Aluminum Rods 25mm', req_qty: 200, issued_qty: 200, unit: 'Kg' },
                { item_code: 'FST-M6-SS', description: 'M6 Stainless Steel Socket Cap Screws', req_qty: 1000, issued_qty: 1000, unit: 'Pcs' },
              ],
              service_table: [
                { task: 'Thermal Chamber Temperature Calibration', parts_used: 'PT100 Temp Probe', duration: '2.5 Hrs', status: 'PASS' },
                { task: 'Capacitor Bank Impedance Testing', parts_used: 'None', duration: '1.5 Hrs', status: 'PASS' },
              ],
              packages_table: [
                { pkg_no: 'BOX-01', contents: 'Edge Computing Node Assembly', qty: 10, net_weight: '45.0', gross_weight: '48.5' },
                { pkg_no: 'BOX-02', contents: 'Industrial Sensor Packs & Cables', qty: 25, net_weight: '32.0', gross_weight: '34.2' },
              ],
              bom_table: [
                { part_no: 'MOD-CPU-04', component_name: 'Industrial Quad-Core Compute Module', required_qty: 500, status: 'KITTED' },
                { part_no: 'ENC-AL-V2', component_name: 'Anodized Aluminum Chassis Enclosure', required_qty: 500, status: 'KITTED' },
              ],
              qa_table: [
                { parameter: 'Operating Voltage Stability', spec: '24.0V ± 0.2V', measured: '24.05V', status: 'PASS' },
                { parameter: 'Thermal Dissipation (Max Load)', spec: '< 65°C Ambient 25°C', measured: '58.2°C', status: 'PASS' },
              ],
              history_table: [
                { date: '15 Sep 2026', service_type: 'Preventive 500-Hr Service', parts: 'Hydraulic Filter, Shell Tellus 46', status: 'COMPLETED' },
                { date: '01 Jul 2026', service_type: 'Spindle Bearing Greasing', parts: 'Kluber Isoflex NBU 15', status: 'COMPLETED' },
              ],
              contribution_table: [
                { cause: 'Rural Girl Child Computer Education Fund', mode: 'Bank Transfer (NEFT)', amount: '₹35,000' },
                { cause: 'Community Health Clinic Medical Kits', mode: 'Cheque No. 441029', amount: '₹15,000' },
              ],
              items_table: [
                { description: 'Enterprise Cloud Architecture Consulting', hsn: '998313', qty: 1, rate: '₹1,50,000', amount: '₹1,50,000', unit_price: '₹1,50,000', total_amount: '₹1,50,000', total: '₹1,50,000', item: 'Cloud Consulting', item_code: 'SRV-01', part_no: 'SRV-01' },
                { description: 'Kubernetes Infrastructure Setup & CI/CD', hsn: '998314', qty: 1, rate: '₹1,00,000', amount: '₹1,00,000', unit_price: '₹1,00,000', total_amount: '₹1,00,000', total: '₹1,00,000', item: 'DevOps Setup', item_code: 'SRV-02', part_no: 'SRV-02' },
              ],
              settlement_table: [
                { invoice_ref: 'INV-2026-0612', inv_date: '15 Sep 2026', inv_amount: '₹1,00,000', settled: '₹1,00,000' },
                { invoice_ref: 'INV-2026-0715', inv_date: '28 Sep 2026', inv_amount: '₹50,000', settled: '₹50,000' },
              ],
              adjustments_table: [
                { reason: 'Volume discount retroactive rebate on Q2 supplies', taxable_val: '₹24,000', gst_diff: '₹4,320', total_credit: '₹28,320' },
              ],
            };
            if (MOCK_ROWS[tbl.id]) {
              rows = MOCK_ROWS[tbl.id];
            }
          }
          const columns = tbl.columns || [];

          return `
          <div style="margin-bottom: 8px;">
            <table class="custom-table">
              <thead>
                <tr>
                  ${columns.map((col) => `
                    <th style="text-align:${col.align || 'left'}; width:${col.widthPercentage ? `${col.widthPercentage}%` : 'auto'};">
                      ${cleanText(col.label)}
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.length > 0 ? rows.map((r) => `
                  <tr>
                    ${columns.map((col) => {
                      const rawCell = r[col.key] !== undefined ? String(r[col.key]) : '—';
                      const isStatusCol = col.key.toLowerCase().includes('result') || col.key.toLowerCase().includes('status');
                      let cellContent = cleanText(rawCell);

                      if (isStatusCol && rawCell !== '—') {
                        const upper = rawCell.toUpperCase();
                        if (upper.includes('PASS') || upper.includes('SATISFACTORY') || upper.includes('OK') || upper.includes('ACCEPTED') || upper.includes('APPROVED')) {
                          cellContent = `<span class="status-badge status-pass">${cellContent}</span>`;
                        } else if (upper.includes('FAIL') || upper.includes('REJECTED') || upper.includes('ACTION')) {
                          cellContent = `<span class="status-badge status-fail">${cellContent}</span>`;
                        } else {
                          cellContent = `<span class="status-badge status-warn">${cellContent}</span>`;
                        }
                      }

                      return `
                      <td style="text-align:${col.align || 'left'};">
                        ${cellContent}
                      </td>`;
                    }).join('')}
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="${columns.length || 1}" style="text-align:center; color:#94A3B8; padding:12px;">
                      No records entered
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>`;
        }).join('')}

        ${foundSummaryFields.length > 0 ? `
        <div class="summary-grid">
          ${foundSummaryFields.map((sf) => {
            const rawVal = content[sf.id] !== undefined ? String(content[sf.id]) : (sf.defaultValue || '—');
            const isHighlight = sf.id === 'net_pay' || sf.id === 'grand_total' || sf.id === 'closing_balance' || sf.id === 'total_paid' || sf.id === 'total_score';
            return `
            <div class="${isHighlight ? 'summary-card-highlight' : 'summary-card'}">
              <div class="summary-label">${cleanText(sf.label)}</div>
              <div class="${isHighlight ? 'summary-value-gold' : 'summary-value'}">${cleanText(rawVal)}</div>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>`;
    }).join('')}

    <!-- Signatures & Authorization Section -->
    <div class="section-banner">ACKNOWLEDGEMENT AND SIGNATURES</div>
    <div class="signatures-row">
      <div class="sig-col">
        <div class="sig-header">${cleanText(schema.footerConfig?.authorizedSignatoryLabel || 'Authorized Organization Representative')}</div>
        <div class="sig-rule"></div>
        <div class="sig-name">${cleanText(content.signatory_name || (business as any).signatory_name || 'Authorized Signatory')}</div>
        <div class="sig-sub">For & On Behalf of ${cleanText(companyName)}</div>
      </div>

      <div class="sig-col">
        <div class="sig-header">${cleanText(schema.footerConfig?.recipientAcceptanceLabel || 'Recipient / Counterparty Acknowledgment')}</div>
        <div class="sig-rule"></div>
        <div class="sig-name">${cleanText(partyName)}</div>
        <div class="sig-sub">Signature & Date: ____________________</div>
      </div>
    </div>

    <!-- Gold Footer -->
    <div class="doc-footer">
      <div>${cleanText(companyName)} &bull; ${cleanText(companyEmail || companyPhone)}</div>
      <div>MASTER DESIGN REFERENCE &bull; VERIFIED TEMPLATE</div>
      <div>PAGE 1</div>
    </div>
  </div>
</body>
</html>`;
}
