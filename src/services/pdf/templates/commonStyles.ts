/**
 * SHARED PDF CSS & TEMPLATE UTILITIES
 * Pure offline CSS with zero external web fonts or CDN dependencies.
 */

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
