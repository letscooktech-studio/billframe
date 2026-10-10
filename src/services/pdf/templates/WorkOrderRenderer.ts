/**
 * WORK ORDER & JOB CARD RENDERER
 * 
 * High-fidelity HTML generator matching media_1791553789290_fa0f73e4.png:
 * - Brand header with organization logo, name, tagline, address, contacts and discipline badges
 * - Document title bar: WORK ORDER / JOB CARD with WO Number, Issue Date, Priority, Work Status
 * - Customer & Job Details grid (9 structured fields)
 * - Dual split: Scope of Work & Task Checklist
 * - Materials & Labor table (Items, services and manpower)
 * - Dual split: Safety & Site Instructions & Before / After Photo verification blocks
 * - Completion & Customer Acceptance with dual signatures
 * - Clean footer
 */

import { BusinessProfile } from '../../../domain/profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../../domain/documents/universal/types';
import { TemplateCustomization } from '../types';
import { escapeHtml, resolveDocumentTheme } from './commonStyles';

export function renderWorkOrderHtml(
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
  const tagline = business.tagline || 'Engineering & Field Services';
  const companyAddress = [
    business.address_line1,
    business.address_line2,
    business.city,
    business.state,
    business.postal_code,
  ].filter(Boolean).join(', ');

  const companyPhone = business.phone || '+91 98765 43210';
  const companyEmail = business.email || 'ops@apexsolutions.com';
  const companyWebsite = business.website || 'www.apexsolutions.com';
  const regNo = business.tax_id || 'GSTIN / REG: 27AAAAA0000A1Z5';

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

  const customerName = instance.partyName || content.customer_name || 'Apex Infrastructure Ltd.';
  const siteAddress = content.site_address || partyDetails.address || 'Tower B, Tech Park, Indiranagar, Bengaluru';
  const projectId = content.project_title || content.project_id || 'PRJ-2026-094';
  const requestedBy = content.requested_by || 'Operations Manager';
  const assetEquipment = content.asset_equipment || 'HVAC Chiller Unit #4';
  const assignedTechnician = content.assigned_technician || content.assigned_team_lead || 'Suresh Kumar (Senior Specialist)';
  const startDate = content.start_date || issueDateFormatted;
  const dueDate = content.due_date || content.completion_deadline || issueDateFormatted;
  const workCategory = content.work_category || 'Preventive Maintenance & Overhaul';

  const workDescription = content.work_description || content.scope_summary || 
    'Complete system diagnostics, filter replacement, refrigerant pressure testing, sensor recalibration, and load balancing across all terminal zones.';

  const tasks: string[] = Array.isArray(content.tasks_list) && content.tasks_list.length > 0
    ? content.tasks_list.map((t: any) => typeof t === 'string' ? t : t.task_description || t.title || t.description || t.name || '')
    : [
        'Isolate unit power supply and tag out lock',
        'Inspect compressor oil levels and clean suction strainer',
        'Verify refrigerant suction and discharge pressures',
        'Calibrate temperature sensors and thermostat relays',
        'Perform 30-minute full capacity test run and log parameters'
      ];

  const safetyInstructions = content.safety_instructions || 
    'Mandatory safety helmet, safety shoes, and insulated gloves. Ensure proper lockout/tagout protocol before opening electrical panel. Keep dry chemical fire extinguisher on site.';

  const materials: any[] = Array.isArray(content.materials) && content.materials.length > 0
    ? content.materials
    : [
        { desc: 'R-410A Refrigerant Gas Canister', qty: '2', unit: 'CYL', hours: '—', notes: 'OEM Grade' },
        { desc: 'High-Density Pre-Filter Media', qty: '4', unit: 'SETS', hours: '—', notes: 'Part #HF-904' },
        { desc: 'Contact Cleaner & Electrical Lubricant', qty: '1', unit: 'CAN', hours: '—', notes: 'Non-conductive' },
        { desc: 'Certified HVAC Field Labor', qty: '2', unit: 'TECH', hours: '6.5', notes: 'On-site execution' },
        { desc: 'Calibration & Testing Instrumentation', qty: '1', unit: 'KIT', hours: '2.0', notes: 'Digital manifold' },
      ];

  const materialsRows = materials.map((m, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
      <td style="font-weight: 500;">${escapeHtml(m.desc || m.item || m.description)}</td>
      <td style="text-align: center;">${escapeHtml(String(m.qty || '1'))}</td>
      <td style="text-align: center;">${escapeHtml(m.unit || 'NOS')}</td>
      <td style="text-align: center;">${escapeHtml(String(m.hours || '—'))}</td>
      <td style="font-size: 9px; color: #4B5563;">${escapeHtml(m.notes || '')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${instance.documentNumber} - Work Order / Job Card</title>
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
      .wo-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
      }
      .section-box, .split-grid, .sign-table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
    @media screen {
      body {
        padding: 24px 16px;
        background: #0F172A;
        display: flex;
        justify-content: center;
      }
      .wo-container {
        background: #FFFFFF;
        max-width: 840px;
        width: 100%;
        padding: 24px 28px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 4px;
        box-sizing: border-box;
      }
    }
    .wo-container {
      width: 100%;
      margin: 0 auto;
      border: 1px solid #CBD5E1;
      padding: 14px;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    /* Header */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .logo-cell {
      width: auto;
      max-width: 250px;
      min-width: 60px;
      vertical-align: middle;
      padding-right: 14px;
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
    .org-cell {
      padding: 0 14px;
    }
    .org-name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .org-tagline {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin: 2px 0 4px 0;
    }
    .org-meta {
      font-size: 9px;
      color: #4B5563;
      line-height: 1.4;
    }
    .disciplines-cell {
      width: 160px;
      font-size: 8.5px;
      color: #374151;
      line-height: 1.6;
      border-left: 1px solid #E5E7EB;
      padding-left: 10px;
    }
    /* Title bar */
    .title-banner {
      border: 1.5px solid ${theme.accentColor};
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      margin-bottom: 12px;
      background: #FFFFFF;
    }
    .title-left {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 20px;
      font-weight: bold;
      color: ${theme.isMonochrome ? '#000000' : theme.accentColor};
    }
    .title-sub {
      font-size: 8px;
      color: #475569;
      letter-spacing: 1px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .meta-table {
      font-size: 9.5px;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 1px 4px;
    }
    .meta-label {
      font-weight: 700;
      color: #4B5563;
    }
    /* Section Box */
    .section-box {
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .section-header {
      background: ${theme.isMonochrome ? '#000000' : '#111827'};
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 5px 8px;
      border-bottom: 2px solid ${theme.accentColor};
    }
    .section-body {
      padding: 6px 8px;
    }
    /* 2-col key values */
    .kv-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
      font-size: 9.5px;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #E5E7EB;
      padding: 2px 0;
    }
    .kv-k {
      color: #4B5563;
      font-weight: 600;
      width: 42%;
    }
    .kv-v {
      color: #111827;
      font-weight: 500;
      width: 58%;
    }
    /* Split Dual Column */
    .split-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    /* Checklist */
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5px;
      margin-bottom: 5px;
      color: #374151;
    }
    .check-box {
      width: 12px;
      height: 12px;
      border: 1.5px solid #000000;
      border-radius: 2px;
      display: inline-block;
      flex-shrink: 0;
    }
    /* Materials Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    .data-table th {
      background: ${theme.isMonochrome ? '#111827' : theme.tableHeaderBg};
      color: ${theme.isMonochrome ? '#FFFFFF' : '#111827'};
      font-weight: 700;
      text-transform: uppercase;
      padding: 5px 6px;
      border: 1px solid #CBD5E1;
      border-bottom: 2px solid ${theme.accentColor};
      font-size: 9px;
    }
    .data-table td {
      padding: 4px 6px;
      border: 1px solid #E5E7EB;
    }
    /* Photos */
    .photo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      text-align: center;
    }
    .photo-placeholder {
      border: 1px dashed #D1D5DB;
      border-radius: 4px;
      padding: 10px;
      background: #F9FAFB;
      font-size: 8.5px;
      color: #6B7280;
    }
    /* Signatures */
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .sign-table td {
      width: 50%;
      vertical-align: top;
      padding: 0 8px;
    }
    .sign-rule {
      border-top: 1px solid #111827;
      margin: 24px 0 4px 0;
    }
    .footer-bar {
      border-top: 1.5px solid ${theme.accentColor};
      padding-top: 6px;
      text-align: center;
      font-size: 8.5px;
      color: #64748B;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="wo-container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td class="logo-cell">
          <div class="logo-box">${logoHtml}</div>
        </td>
        <td class="org-cell">
          <div class="org-name">[ ${escapeHtml(companyName)} ]</div>
          <div class="org-tagline">${escapeHtml(tagline)}</div>
          <div class="org-meta">
            <div>${escapeHtml(companyAddress)}</div>
            <div>&#128222; ${escapeHtml(companyPhone)} &nbsp;&bull;&nbsp; &#9993; ${escapeHtml(companyEmail)} &nbsp;&bull;&nbsp; &#127760; ${escapeHtml(companyWebsite)}</div>
            <div><strong>${escapeHtml(regNo)}</strong></div>
          </div>
        </td>
        <td class="disciplines-cell">
          <div>&#127959; CONSTRUCTION</div>
          <div>&#127970; BUILDING SERVICES</div>
          <div>&#9881; PROJECT MANAGEMENT</div>
          <div>&#128295; MAINTENANCE</div>
          <div>&#128666; FIELD OPERATIONS</div>
        </td>
      </tr>
    </table>

    <!-- Title Banner -->
    <div class="title-banner">
      <div>
        <div class="title-left">WORK ORDER / JOB CARD</div>
        <div class="title-sub">SERVICE EXECUTION &bull; SITE WORK &bull; MAINTENANCE &bull; PROJECT OPERATIONS</div>
      </div>
      <div>
        <table class="meta-table">
          <tr><td class="meta-label">WORK ORDER NO.</td><td>: [ ${escapeHtml(instance.documentNumber)} ]</td></tr>
          <tr><td class="meta-label">ISSUE DATE</td><td>: [ ${issueDateFormatted} ]</td></tr>
          <tr><td class="meta-label">PRIORITY</td><td>: <span style="background: #FEF3C7; color: #92400E; padding: 1px 4px; border-radius: 2px; font-weight: 700;">HIGH</span></td></tr>
          <tr><td class="meta-label">WORK STATUS</td><td>: <span style="background: #DBEAFE; color: #1E40AF; padding: 1px 4px; border-radius: 2px; font-weight: 700;">SCHEDULED</span></td></tr>
        </table>
      </div>
    </div>

    <!-- Section 1: Customer & Job Details -->
    <div class="section-box">
      <div class="section-header">&#127970; CUSTOMER & JOB DETAILS</div>
      <div class="section-body">
        <div class="kv-grid">
          <div class="kv-row"><span class="kv-k">CUSTOMER NAME</span><span class="kv-v">: [ ${escapeHtml(customerName)} ]</span></div>
          <div class="kv-row"><span class="kv-k">ASSET / EQUIPMENT</span><span class="kv-v">: [ ${escapeHtml(assetEquipment)} ]</span></div>
          <div class="kv-row"><span class="kv-k">SITE ADDRESS</span><span class="kv-v">: [ ${escapeHtml(siteAddress)} ]</span></div>
          <div class="kv-row"><span class="kv-k">ASSIGNED TECHNICIAN</span><span class="kv-v">: [ ${escapeHtml(assignedTechnician)} ]</span></div>
          <div class="kv-row"><span class="kv-k">PROJECT ID</span><span class="kv-v">: [ ${escapeHtml(projectId)} ]</span></div>
          <div class="kv-row"><span class="kv-k">START DATE</span><span class="kv-v">: [ ${startDate} ]</span></div>
          <div class="kv-row"><span class="kv-k">REQUESTED BY</span><span class="kv-v">: [ ${escapeHtml(requestedBy)} ]</span></div>
          <div class="kv-row"><span class="kv-k">DUE DATE</span><span class="kv-v">: [ ${dueDate} ]</span></div>
          <div class="kv-row" style="grid-column: span 2;"><span class="kv-k" style="width: 21%;">WORK CATEGORY</span><span class="kv-v" style="width: 79%;">: [ ${escapeHtml(workCategory)} ]</span></div>
        </div>
      </div>
    </div>

    <!-- Section 2: Split Scope & Checklist -->
    <div class="split-grid">
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-header">&#128196; SCOPE OF WORK <span style="font-size: 8px; font-weight: normal; text-transform: none; color: #6B7280;">Detailed description</span></div>
        <div class="section-body" style="font-size: 9.5px; color: #374151; min-height: 80px;">
          [ ${escapeHtml(workDescription)} ]
        </div>
      </div>

      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-header">&#9745; TASK CHECKLIST <span style="font-size: 8px; font-weight: normal; text-transform: none; color: #6B7280;">Key activities</span></div>
        <div class="section-body">
          ${tasks.map(t => `
            <div class="checklist-item">
              <span class="check-box"></span>
              <span>[ ${escapeHtml(t)} ]</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Section 3: Materials & Labor Table -->
    <div class="section-box">
      <div class="section-header">&#128230; MATERIALS & LABOR <span style="font-size: 8px; font-weight: normal; text-transform: none; color: #6B7280;">Items, services and manpower</span></div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 45%;">ITEM / SERVICE DESCRIPTION</th>
            <th style="width: 10%; text-align: center;">QTY</th>
            <th style="width: 10%; text-align: center;">UNIT</th>
            <th style="width: 15%; text-align: center;">ALLOCATED HOURS</th>
            <th style="width: 15%;">NOTES</th>
          </tr>
        </thead>
        <tbody>
          ${materialsRows}
        </tbody>
      </table>
    </div>

    <!-- Section 4: Split Safety & Photos -->
    <div class="split-grid">
      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-header">&#128737; SAFETY & SITE INSTRUCTIONS <span style="font-size: 8px; font-weight: normal; text-transform: none; color: #6B7280;">Safety, PPE & Protocol Notice</span></div>
        <div class="section-body" style="font-size: 9px; color: #374151; line-height: 1.4;">
          [ ${escapeHtml(safetyInstructions)} ]
        </div>
      </div>

      <div class="section-box" style="margin-bottom: 0;">
        <div class="section-header">&#128247; BEFORE / AFTER PHOTOS</div>
        <div class="section-body">
          <div class="photo-grid">
            <div class="photo-placeholder">
              <div style="font-size: 16px;">&#128247;</div>
              <strong>BEFORE WORK</strong><br/>[ATTACH_PHOTO]
            </div>
            <div class="photo-placeholder">
              <div style="font-size: 16px;">&#128247;</div>
              <strong>AFTER WORK</strong><br/>[ATTACH_PHOTO]
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5: Completion & Acceptance -->
    <div class="section-box">
      <div class="section-header">&#9989; COMPLETION & CUSTOMER ACCEPTANCE <span style="font-size: 8px; font-weight: normal; text-transform: none; color: #6B7280;">To be completed on site</span></div>
      <div class="section-body">
        <div style="font-size: 9px; color: #4B5563; margin-bottom: 6px;">
          Work completed satisfactorily in accordance with site specifications and engineering standards.
        </div>
        <table class="sign-table">
          <tr>
            <td>
              <div class="sign-rule"></div>
              <div style="font-weight: 700; color: #111827;">Authorized Signature (Supervisor Authorization)</div>
              <div style="font-size: 9px; color: #4B5563;">[ ${escapeHtml(companyName)} ]</div>
            </td>
            <td style="border-left: 1px solid #E5E7EB;">
              <div class="sign-rule"></div>
              <div style="font-weight: 700; color: #111827;">Customer Signature (Client Site Acknowledgment)</div>
              <div style="font-size: 9px; color: #4B5563;">[ ${escapeHtml(customerName)} ] &nbsp;&bull;&nbsp; Date: ________</div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      THANK YOU FOR YOUR BUSINESS<br/>
      [ ${escapeHtml(companyName)} ] &bull; [ ${escapeHtml(companyWebsite)} ] &bull; [ ${escapeHtml(companyEmail)} ] &bull; [ ${escapeHtml(companyPhone)} ]
    </div>
  </div>
</body>
</html>`;
}
