/**
 * CSV EXPORT & IMPORT ENGINE
 * RFC 4180 compliant CSV serialization and ingestion for accounting data portability.
 */

import { DatabaseManager } from '../../data/database/DatabaseManager';
import { CustomerRepository } from '../../data/repositories/CustomerRepository';
import { CatalogRepository } from '../../data/repositories/CatalogRepository';
import { getCurrencyMetadata } from '../../domain/money/Currencies';
import { parseDecimalStringToMoney } from '../../domain/money/Money';

/**
 * Converts a minor-unit integer to its decimal string using the correct
 * number of decimal places for the given currency (e.g. JPY has 0, USD has 2).
 */
function minorUnitsToDecimalString(amountMinor: number, currency: string): string {
  const meta = getCurrencyMetadata(currency);
  const scale = Math.pow(10, meta.minorUnits);
  if (scale === 1) return String(amountMinor); // e.g. JPY
  return (amountMinor / scale).toFixed(meta.minorUnits);
}


export function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export class CsvExporter {
  /**
   * Generates CSV for all invoices with customer details, amounts, and statuses.
   */
  static async exportInvoicesToCsvAsync(): Promise<string> {
    const db = await DatabaseManager.getDatabaseAsync();
    const docs = await db.getAllAsync<any>(
      `SELECT d.*, c.name as customer_name
       FROM documents d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.is_archived = 0
       ORDER BY d.issue_date DESC;`
    );

    const headers = [
      'Document Type',
      'Document Number',
      'Customer',
      'Issue Date',
      'Due Date',
      'Currency',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'Paid',
      'Balance',
      'Lifecycle Status',
      'PO Number',
    ];

    const lines = [headers.join(',')];

    for (const d of docs) {
      const issueDate = new Date(d.issue_date).toISOString().split('T')[0];
      const dueDate = d.due_date ? new Date(d.due_date).toISOString().split('T')[0] : '';
      const totalCredits = (d.deposit_minor || 0) + (d.total_paid_minor || 0);
      const balance = Math.max(0, d.total_minor - totalCredits);

      const row = [
        escapeCsvField(d.doc_type),
        escapeCsvField(d.document_number),
        escapeCsvField(d.customer_name || 'No Customer'),
        escapeCsvField(issueDate),
        escapeCsvField(dueDate),
        escapeCsvField(d.currency),
        escapeCsvField(minorUnitsToDecimalString(d.subtotal_minor, d.currency)),
        escapeCsvField(minorUnitsToDecimalString(d.discount_minor, d.currency)),
        escapeCsvField(minorUnitsToDecimalString(d.tax_minor, d.currency)),
        escapeCsvField(minorUnitsToDecimalString(d.total_minor, d.currency)),
        escapeCsvField(minorUnitsToDecimalString(totalCredits, d.currency)),
        escapeCsvField(minorUnitsToDecimalString(balance, d.currency)),
        escapeCsvField(d.lifecycle_status),
        escapeCsvField(d.po_number || ''),
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Generates CSV for all customers.
   */
  static async exportCustomersToCsvAsync(): Promise<string> {
    const customers = await CustomerRepository.listAllCustomers();
    const headers = ['Name', 'Business Name', 'Email', 'Phone', 'Billing Address', 'Shipping Address', 'Tax ID', 'Notes'];
    const lines = [headers.join(',')];

    for (const c of customers) {
      const row = [
        escapeCsvField(c.name),
        escapeCsvField(c.business_name || ''),
        escapeCsvField(c.email || ''),
        escapeCsvField(c.phone || ''),
        escapeCsvField(c.billing_address || ''),
        escapeCsvField(c.shipping_address || ''),
        escapeCsvField(c.tax_id || ''),
        escapeCsvField(c.notes || ''),
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Imports customers from raw CSV text.
   */
  static async importCustomersFromCsvAsync(csvText: string): Promise<{ importedCount: number; errors: string[] }> {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      return { importedCount: 0, errors: ['CSV contains no data rows.'] };
    }

    const header = rows[0].map((h) => h.toLowerCase());
    const nameIdx = header.findIndex((h) => h.includes('name') && !h.includes('business'));
    const bizIdx = header.findIndex((h) => h.includes('business') || h.includes('company'));
    const emailIdx = header.findIndex((h) => h.includes('email'));
    const phoneIdx = header.findIndex((h) => h.includes('phone') || h.includes('mobile'));
    const addrIdx = header.findIndex((h) => h.includes('address') || h.includes('billing'));
    const taxIdx = header.findIndex((h) => h.includes('tax') || h.includes('gst') || h.includes('vat'));

    let importedCount = 0;
    const errors: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = nameIdx >= 0 ? row[nameIdx] : row[0];
      if (!name) {
        errors.push(`Row ${r + 1}: Skipped (empty customer name).`);
        continue;
      }

      try {
        await CustomerRepository.createCustomer({
          name: name.trim(),
          businessName: bizIdx >= 0 && row[bizIdx] ? row[bizIdx].trim() : undefined,
          email: emailIdx >= 0 && row[emailIdx] ? row[emailIdx].trim() : undefined,
          phone: phoneIdx >= 0 && row[phoneIdx] ? row[phoneIdx].trim() : undefined,
          billingAddress: addrIdx >= 0 && row[addrIdx] ? row[addrIdx].trim() : undefined,
          taxId: taxIdx >= 0 && row[taxIdx] ? row[taxIdx].trim() : undefined,
        });
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${r + 1}: ${err.message}`);
      }
    }

    return { importedCount, errors };
  }

  /**
   * Imports catalog items from CSV text.
   */
  static async importCatalogFromCsvAsync(csvText: string): Promise<{ importedCount: number; errors: string[] }> {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      return { importedCount: 0, errors: ['CSV contains no data rows.'] };
    }

    const header = rows[0].map((h) => h.toLowerCase());
    const nameIdx = header.findIndex((h) => h.includes('name') || h.includes('title') || h.includes('item'));
    const descIdx = header.findIndex((h) => h.includes('desc'));
    const priceIdx = header.findIndex((h) => h.includes('price') || h.includes('rate') || h.includes('cost'));
    const unitIdx = header.findIndex((h) => h.includes('unit'));

    let importedCount = 0;
    const errors: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = nameIdx >= 0 ? row[nameIdx] : row[0];
      if (!name) continue;

      const priceRaw = priceIdx >= 0 ? row[priceIdx].replace(/[^0-9.,]/g, '') : '0';
      let unitPriceMinor = 0n;
      try {
        const parsed = parseDecimalStringToMoney(priceRaw || '0', 'USD');
        unitPriceMinor = parsed.amountMinor;
      } catch {
        unitPriceMinor = 0n;
      }

      try {
        await CatalogRepository.createItem({
          name: name.trim(),
          description: descIdx >= 0 && row[descIdx] ? row[descIdx].trim() : undefined,
          unitPriceMinor,
          currency: 'USD', // CSV rows don't carry currency; user can edit after import
          unitName: unitIdx >= 0 && row[unitIdx] ? row[unitIdx].trim() : 'item',
        });
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${r + 1}: ${err.message}`);
      }
    }

    return { importedCount, errors };
  }
}
