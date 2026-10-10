/**
 * LETTER DOCUMENT RENDERER (JOB OFFER LETTER)
 * 
 * High-fidelity HTML generator matching media_1791553794528_d80038b4.png:
 * - Rounded gold logo box on top-left
 * - Centered [ORGANIZATION NAME] with tagline
 * - Company contact info on top-right
 * - Large serif gold title: JOB OFFER LETTER
 * - Reference Number and Issue Date banner
 * - Recipient salutation and opening offer statement
 * - 4 Gold circular numbered badge sections:
 *   1. OFFER AND POSITION DETAILS (2-column key-value grid)
 *   2. COMPENSATION AND WORK ARRANGEMENTS (2-column key-value grid)
 *   3. TERMS AND CONDITIONS (1..5 points)
 *   4. ACCEPTANCE (closing paragraph)
 * - Dual signatures: Authorized Signatory (left) and Candidate Acceptance (right)
 * - Confidentiality footer
 */

import { BusinessProfile } from '../../../domain/profile/types';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../../domain/documents/universal/types';
import { TemplateCustomization } from '../types';
import { escapeHtml, resolveDocumentTheme } from './commonStyles';

export function renderLetterDocumentHtml(
  instance: UniversalDocumentInstance,
  schema: UniversalDocumentSchema,
  business: BusinessProfile,
  paperSize: 'a4' | 'letter' = 'a4',
  customization?: TemplateCustomization
): string {
  const theme = resolveDocumentTheme(business, customization);
  const content = instance.content || {};
  const partyDetails = instance.partyDetails || {};

  const companyName = business.name || 'Apex Solutions';
  const legalName = business.legal_name || companyName;
  const tagline = business.tagline || 'BUILD &bull; INNOVATE &bull; GROW';
  const companyAddress = [
    business.address_line1,
    business.address_line2,
    business.city,
    business.state,
    business.postal_code,
  ].filter(Boolean).join(', ');

  const companyPhone = business.phone || '+91 98765 43210';
  const companyEmail = business.email || 'hr@apexsolutions.com';
  const companyWebsite = business.website || 'www.apexsolutions.com';

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

  const candidateName = instance.partyName || content.candidate_name || 'Rahul Sharma';
  const candidateFirstName = candidateName.split(' ')[0] || candidateName;
  const candidateAddress1 = partyDetails.address || content.candidate_address_1 || '42 Lakeview Enclave, Koramangala';
  const candidateAddress2 = content.candidate_address_2 || 'Bengaluru, Karnataka - 560034';

  const jobTitle = content.job_title || 'Senior Software Engineer';
  const department = content.department || 'Engineering & Platform';
  const employmentType = content.employment_type || 'Full-Time Permanent';
  const workLocation = content.work_location || 'Bengaluru, India (Hybrid)';
  const joiningDate = content.joining_date ? new Date(content.joining_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : '01 Nov 2026';
  const reportingTo = content.reporting_to || 'Director of Engineering';
  const probationPeriod = content.probation_period || '3 Months';
  const offerValidUntil = content.offer_valid_until || '15 Oct 2026';

  const rawCtc = content.annual_salary_ctc || content.total_ctc || '2,400,000';
  const annualCtc = rawCtc.startsWith('₹') ? rawCtc : `₹${rawCtc}`;
  const paymentFrequency = content.payment_frequency || 'Monthly (Last working day)';
  const workingHours = content.working_hours || '40 Hours / Week (Mon - Fri)';
  const salaryBreakup = content.salary_breakup || 'As per Annexure A';
  const benefits = content.benefits || 'PF / Health Insurance / Gratuity';
  const leavePolicy = content.leave_policy || '24 Days Annual Paid Leave';

  const signatoryName = content.signatory_name || business.signatory_name || 'Priya Nair';
  const signatoryTitle = content.signatory_title || business.signatory_title || 'Head of People & Culture';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${instance.documentNumber} - Job Offer Letter</title>
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
      .letter-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
      }
      .avoid-break, .signatures-table, .section-badge-header {
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
      .letter-container {
        background: #FFFFFF;
        max-width: 840px;
        width: 100%;
        padding: 32px 36px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 4px;
        box-sizing: border-box;
      }
    }
    .letter-container {
      width: 100%;
      margin: 0 auto;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    /* Top Header */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
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
    .org-center {
      text-align: center;
      padding: 0 16px;
    }
    .org-name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: bold;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .tagline-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 4px 0;
    }
    .tagline-line {
      height: 1px;
      width: 30px;
      background: ${theme.accentColor};
    }
    .tagline-text {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
      letter-spacing: 1.5px;
    }
    .org-contacts-right {
      text-align: right;
      font-size: 9px;
      color: #4B5563;
      line-height: 1.4;
      width: 220px;
    }
    .header-divider {
      border: none;
      border-bottom: ${theme.dividerRule};
      margin: 12px 0 16px 0;
    }
    /* Title */
    .doc-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: bold;
      text-align: center;
      color: ${theme.isMonochrome ? '#000000' : theme.accentColor};
      letter-spacing: 1px;
      margin-bottom: 14px;
    }
    /* Reference / Date Bar */
    .meta-bar {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .meta-bar td {
      border: 1px solid #CBD5E1;
      padding: 6px 12px;
      font-size: 10.5px;
    }
    .meta-label {
      font-weight: 700;
      color: #111827;
      letter-spacing: 0.5px;
    }
    /* Salutation */
    .salutation-block {
      margin-bottom: 14px;
      font-size: 11px;
      line-height: 1.5;
    }
    .candidate-name {
      font-weight: 700;
      font-size: 12px;
      color: #111827;
    }
    .subject-line {
      font-weight: 700;
      color: #111827;
      margin: 10px 0 6px 0;
    }
    /* Section Badge Header */
    .section-badge-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 14px 0 8px 0;
    }
    .badge-number {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${theme.accentColor};
      color: #FFFFFF;
      font-weight: bold;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .badge-title {
      font-weight: 700;
      color: ${theme.isMonochrome ? '#000000' : '#111827'};
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-rule {
      flex: 1;
      height: 1px;
      background: #CBD5E1;
    }
    /* Key-Value Tables */
    .kv-grid-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #CBD5E1;
      margin-bottom: 10px;
    }
    .kv-grid-table td {
      border: 1px solid #E2E8F0;
      padding: 6px 8px;
      font-size: 10px;
    }
    .kv-k {
      font-weight: 700;
      color: #111827;
      background: #F8FAFC;
      width: 25%;
    }
    .kv-v {
      color: #374151;
      width: 25%;
    }
    /* Terms list */
    .terms-list {
      padding-left: 18px;
      font-size: 10px;
      line-height: 1.55;
      color: #374151;
      margin-bottom: 10px;
    }
    .terms-list li {
      margin-bottom: 3px;
    }
    /* Acceptance Paragraph */
    .acceptance-p {
      font-size: 10px;
      line-height: 1.5;
      color: #374151;
      margin-bottom: 18px;
    }
    /* Dual Signatures */
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      margin-bottom: 16px;
    }
    .signatures-table td {
      vertical-align: top;
      width: 48%;
    }
    .sig-line {
      border-top: 1px solid #111827;
      margin-bottom: 6px;
      width: 90%;
    }
    .sig-title {
      font-weight: 700;
      color: #111827;
      font-size: 10.5px;
    }
    .sig-sub {
      color: #4B5563;
      font-size: 9.5px;
    }
    /* Confidential Footer */
    .confidential-footer {
      border-top: 1.5px solid ${theme.accentColor};
      padding-top: 8px;
      text-align: center;
      font-size: 8.5px;
      color: #64748B;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="letter-container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: auto; max-width: 250px; min-width: 60px; vertical-align: middle;">
          <div class="logo-box">
            ${logoHtml}
          </div>
        </td>
        <td class="org-center" style="vertical-align: middle;">
          <div class="org-name">[ ${escapeHtml(companyName)} ]</div>
          ${business.legal_name && business.legal_name !== companyName ? `<div style="font-size: 8.5px; color: #4B5563; margin-top: 2px;">(${escapeHtml(business.legal_name)})</div>` : ''}
          <div class="tagline-row">
            <div class="tagline-line"></div>
            <div class="tagline-text">${tagline}</div>
            <div class="tagline-line"></div>
          </div>
        </td>
        <td class="org-contacts-right" style="vertical-align: middle;">
          <div>&#128205; ${escapeHtml(companyAddress)}</div>
          <div>&#9993; ${escapeHtml(companyEmail)}</div>
          <div>&#128222; ${escapeHtml(companyPhone)}</div>
          <div>&#127760; ${escapeHtml(companyWebsite)}</div>
        </td>
      </tr>
    </table>

    <div class="header-divider"></div>

    <!-- Title -->
    <div class="doc-title">JOB OFFER LETTER</div>

    <!-- Reference & Date Bar -->
    <table class="meta-bar">
      <tr>
        <td style="width: 20%; background: #FFFCF7;" class="meta-label">REFERENCE NO.</td>
        <td style="width: 35%;">${escapeHtml(instance.documentNumber)}</td>
        <td style="width: 15%; background: #FFFCF7;" class="meta-label">DATE</td>
        <td style="width: 30%;">${issueDateFormatted}</td>
      </tr>
    </table>

    <!-- Salutation -->
    <div class="salutation-block">
      <div>To,</div>
      <div class="candidate-name">[ ${escapeHtml(candidateName)} ]</div>
      <div>${escapeHtml(candidateAddress1)}</div>
      <div>${escapeHtml(candidateAddress2)}</div>
      <div class="subject-line">Subject: Offer of Employment &ndash; [ ${escapeHtml(jobTitle)} ]</div>
      <div style="margin-top: 6px;">Dear <strong>[ ${escapeHtml(candidateFirstName)} ]</strong>,</div>
      <p style="margin-top: 4px;">
        We are pleased to offer you the position of <strong>[ ${escapeHtml(jobTitle)} ]</strong> at <strong>[ ${escapeHtml(companyName)} ]</strong>. We were impressed by your skills, experience, and potential, and we believe you will be a great addition to our team.
      </p>
      <p style="margin-top: 4px;">
        Your employment with us will commence on <strong>[ ${joiningDate} ]</strong>, and will be subject to the terms and conditions outlined in this letter.
      </p>
    </div>

    <!-- Section 1 -->
    <div class="section-badge-header">
      <div class="badge-number">1</div>
      <div class="badge-title">OFFER AND POSITION DETAILS</div>
      <div class="badge-rule"></div>
    </div>

    <table class="kv-grid-table">
      <tr>
        <td class="kv-k">JOB TITLE</td>
        <td class="kv-v">[ ${escapeHtml(jobTitle)} ]</td>
        <td class="kv-k">DEPARTMENT</td>
        <td class="kv-v">[ ${escapeHtml(department)} ]</td>
      </tr>
      <tr>
        <td class="kv-k">EMPLOYMENT TYPE</td>
        <td class="kv-v">[ ${escapeHtml(employmentType)} ]</td>
        <td class="kv-k">WORK LOCATION</td>
        <td class="kv-v">[ ${escapeHtml(workLocation)} ]</td>
      </tr>
      <tr>
        <td class="kv-k">JOINING DATE</td>
        <td class="kv-v">[ ${joiningDate} ]</td>
        <td class="kv-k">REPORTING TO</td>
        <td class="kv-v">[ ${escapeHtml(reportingTo)} ]</td>
      </tr>
      <tr>
        <td class="kv-k">PROBATION PERIOD</td>
        <td class="kv-v">[ ${escapeHtml(probationPeriod)} ]</td>
        <td class="kv-k">OFFER VALID UNTIL</td>
        <td class="kv-v">[ ${offerValidUntil} ]</td>
      </tr>
    </table>

    <!-- Section 2 -->
    <div class="section-badge-header">
      <div class="badge-number">2</div>
      <div class="badge-title">COMPENSATION AND WORK ARRANGEMENTS</div>
      <div class="badge-rule"></div>
    </div>

    <table class="kv-grid-table">
      <tr>
        <td class="kv-k">ANNUAL SALARY (CTC)</td>
        <td class="kv-v">[ ${escapeHtml(annualCtc)} ]</td>
        <td class="kv-k">SALARY BREAKUP</td>
        <td class="kv-v">[ ${escapeHtml(salaryBreakup)} ]</td>
      </tr>
      <tr>
        <td class="kv-k">PAYMENT FREQUENCY</td>
        <td class="kv-v">[ ${escapeHtml(paymentFrequency)} ]</td>
        <td class="kv-k">BENEFITS</td>
        <td class="kv-v">[ ${escapeHtml(benefits)} ]</td>
      </tr>
      <tr>
        <td class="kv-k">WORKING HOURS</td>
        <td class="kv-v">[ ${escapeHtml(workingHours)} ]</td>
        <td class="kv-k">LEAVE POLICY</td>
        <td class="kv-v">[ ${escapeHtml(leavePolicy)} ]</td>
      </tr>
    </table>

    ${Array.isArray(content.salary_breakdown) && content.salary_breakdown.length > 0 ? `
    <table class="kv-grid-table" style="margin-top: 6px;">
      <thead>
        <tr style="background: #FAF5EA;">
          <th style="padding: 4px; font-size: 8.5px; color: #8C6212; text-align: left;">SALARY COMPONENT</th>
          <th style="padding: 4px; font-size: 8.5px; color: #8C6212; text-align: right;">MONTHLY</th>
          <th style="padding: 4px; font-size: 8.5px; color: #8C6212; text-align: right;">ANNUAL</th>
        </tr>
      </thead>
      <tbody>
        ${content.salary_breakdown.map((row: any) => `
          <tr>
            <td style="padding: 4px; font-size: 8.5px;">${escapeHtml(row.component || row.name || '')}</td>
            <td style="padding: 4px; font-size: 8.5px; text-align: right;">${escapeHtml(row.monthly || '')}</td>
            <td style="padding: 4px; font-size: 8.5px; text-align: right;">${escapeHtml(row.annual || '')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <!-- Section 3 -->
    <div class="section-badge-header">
      <div class="badge-number">3</div>
      <div class="badge-title">TERMS AND CONDITIONS</div>
      <div class="badge-rule"></div>
    </div>

    <ol class="terms-list">
      <li>Your employment is subject to successful completion of background verification (if applicable).</li>
      <li>During the probation period, either party may terminate the employment as per company policy.</li>
      <li>You are expected to adhere to all company policies, code of conduct, and confidentiality agreements.</li>
      <li>Your role, responsibilities, and reporting structure may be modified based on business requirements.</li>
      <li>This offer is subject to submission of all required documents as per the joining checklist.</li>
    </ol>

    <!-- Section 4 -->
    <div class="section-badge-header">
      <div class="badge-number">4</div>
      <div class="badge-title">ACCEPTANCE</div>
      <div class="badge-rule"></div>
    </div>

    <p class="acceptance-p">
      Please confirm your acceptance of this offer by signing and returning a copy of this letter on or before <strong>[ ${offerValidUntil} ]</strong>. We look forward to welcoming you to <strong>[ ${escapeHtml(companyName)} ]</strong> and are excited about the contributions you will make to our team.
    </p>

    <!-- Dual Signatures -->
    <table class="signatures-table">
      <tr>
        <td>
          <div class="sig-line"></div>
          <div style="font-size: 8.5px; color: #6B7280; margin-bottom: 2px;">For & On Behalf of ${escapeHtml(companyName)}</div>
          <div class="sig-title">[ ${escapeHtml(signatoryName)} ]</div>
          <div class="sig-sub">[ ${signatoryTitle} ]</div>
          <div class="sig-sub">[ ${escapeHtml(companyName)} ]</div>
        </td>
        <td style="border-left: 1px solid #E5D5B5; padding-left: 20px;">
          <div class="sig-line"></div>
          <div style="font-size: 8.5px; color: #6B7280; margin-bottom: 2px;">Candidate Acceptance</div>
          <div class="sig-title">[ ${escapeHtml(candidateName)} ]</div>
          <div class="sig-sub">Signature & Date: ___________________________</div>
          <div class="sig-sub">Date: _________________________________</div>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <div class="confidential-footer">
      CONFIDENTIAL &bull; FOR THE INTENDED RECIPIENT ONLY<br/>
      [ ${escapeHtml(companyName)} ]
    </div>
  </div>
</body>
</html>`;
}
