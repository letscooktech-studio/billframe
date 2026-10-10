/**
 * SHARED PDF CSS & TEMPLATE UTILITIES
 * Pure offline CSS with zero external web fonts or CDN dependencies.
 */

import { BusinessProfile } from '../../../domain/profile/types';
import { TemplateCustomization } from '../types';

export interface DocumentThemeTokens {
  accentColor: string;
  secondaryColor: string;
  tableHeaderBg: string;
  tableBorder: string;
  dividerRule: string;
  badgeBg: string;
  badgeText: string;
  isMonochrome: boolean;
}

/**
 * Resolves customer-specified brand colors and template style choices.
 * Supports Gold/Black master default, Monochrome minimal, and custom corporate palettes.
 */
export function resolveDocumentTheme(
  business: BusinessProfile,
  customization?: TemplateCustomization
): DocumentThemeTokens {
  const customColor = customization?.brand_color || (business as any).brand_color;
  const templateCode = customization?.template_code || '';

  if (templateCode === 'monochrome_minimal' || (business as any).document_theme === 'monochrome') {
    return {
      accentColor: '#000000',
      secondaryColor: '#475569',
      tableHeaderBg: '#F8FAFC',
      tableBorder: '#E2E8F0',
      dividerRule: '2px solid #000000',
      badgeBg: '#F1F5F9',
      badgeText: '#0F172A',
      isMonochrome: true,
    };
  }

  if (customColor && customColor !== '#000000' && customColor !== '#C59B27') {
    return {
      accentColor: customColor,
      secondaryColor: customization?.secondary_color || customColor,
      tableHeaderBg: '#F8FAFC',
      tableBorder: '#E2E8F0',
      dividerRule: `2px solid ${customColor}`,
      badgeBg: 'rgba(0, 0, 0, 0.05)',
      badgeText: customColor,
      isMonochrome: false,
    };
  }

  // Default: Gold / Black Enterprise Master (#C59B27)
  return {
    accentColor: '#C59B27',
    secondaryColor: '#8A6D1C',
    tableHeaderBg: '#FDFBF7',
    tableBorder: '#E8E1D5',
    dividerRule: '2px solid #C59B27',
    badgeBg: 'rgba(197, 155, 39, 0.12)',
    badgeText: '#8A6D1C',
    isMonochrome: false,
  };
}

/**
 * Renders a responsive brand logo container preserving native aspect ratio.
 * Supports wide wordmarks (up to 240px), square crests, tall seals, and transparent logos.
 */
export function renderResponsiveLogoHtml(
  logoUri?: string | null,
  accentColor: string = '#C59B27',
  orgInitials: string = 'BF'
): string {
  if (logoUri) {
    return `
      <div class="brand-logo-container" style="max-width: 240px; max-height: 75px; min-height: 40px; display: inline-flex; align-items: center; justify-content: flex-start; box-sizing: border-box;">
        <img src="${logoUri}" alt="Logo" class="brand-logo-img" style="max-width: 240px; max-height: 75px; width: auto; height: auto; object-fit: contain; object-position: left center; display: block;" />
      </div>
    `;
  }

  return `
    <div class="brand-monogram-box" style="width: 52px; height: 52px; border: 1.5px solid ${accentColor}; border-radius: 4px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF; color: ${accentColor}; box-sizing: border-box;">
      <div style="font-size: 15px; line-height: 1; font-weight: 900; margin-bottom: 2px;">✦</div>
      <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">${escapeHtml(orgInitials)}</div>
    </div>
  `;
}

export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDate(timestamp?: number | null): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Unified Print CSS providing safe printable margins for A4 and Letter,
 * media print separation, and ZERO overflow clipping.
 */
export function getUnifiedPrintCss(
  paperSize: 'a4' | 'letter' = 'a4',
  theme: DocumentThemeTokens = resolveDocumentTheme({} as any)
): string {
  const isLetter = paperSize === 'letter';
  const pageMargin = isLetter ? '0.5in 0.45in 0.55in 0.45in' : '12mm 12mm 14mm 12mm';
  const pageSize = isLetter ? 'letter portrait' : 'A4 portrait';

  return `
    @page {
      size: ${pageSize};
      margin: ${pageMargin};
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
      line-height: 1.45;
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
      .document-sheet, .letter-container, .wo-container, .po-container, .invoice-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
      }
      .avoid-break {
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
      .document-sheet, .letter-container, .wo-container, .po-container, .invoice-container {
        background: #FFFFFF;
        max-width: 840px;
        width: 100%;
        padding: 32px 36px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        border-radius: 4px;
        box-sizing: border-box;
      }
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }
    th, td {
      word-break: break-word;
    }
  `;
}

export function getBaseCss(paperSize: 'a4' | 'letter' = 'a4'): string {
  const sizeRule = paperSize === 'letter' ? 'letter' : 'A4';

  return `
    @page {
      size: ${sizeRule};
      margin: 14mm 12mm 14mm 12mm;
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
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }

    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      margin-bottom: 20px;
    }

    .table th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }

    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
      vertical-align: top;
    }

    .table tr:last-child td {
      border-bottom: 2px solid #e2e8f0;
    }

    .table-striped tbody tr:nth-child(even) td {
      background-color: #fafbfc;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-paid {
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-unpaid {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .badge-partial {
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-draft {
      background-color: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .totals-grid {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      page-break-inside: avoid;
    }

    .totals-box {
      width: 280px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      color: #475569;
    }

    .totals-row.grand-total {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 8px 0;
      margin: 6px 0;
    }

    .totals-row.balance-due {
      font-size: 14px;
      font-weight: 800;
      color: #1e3a8a;
      background: #eff6ff;
      padding: 8px 10px;
      border-radius: 4px;
      margin-top: 6px;
    }

    .footer-block {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      page-break-inside: avoid;
    }

    .signature-box {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }

    .signature-inner {
      width: 240px;
      text-align: center;
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
    }
  `;
}
