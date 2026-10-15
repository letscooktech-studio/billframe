/**
 * GST INVOICE SHARED ENGINE & FORMATTING UTILITIES
 * 
 * Provides:
 * - Deterministic Indian Currency / Number to Words converter (Lakhs, Crores)
 * - Safe HTML escaping and field fallbacks
 * - Intra-state vs Inter-state GST calculation engine (CGST + SGST vs IGST)
 * - Strict monochrome print CSS reset conforming to CBIC Rule 46 requirements
 */

import { FullDocument } from '../../../../data/repositories/DocumentRepository';
import { BusinessProfile } from '../../../../domain/profile/types';
import { formatMoney } from '../../../../domain/money/Money';
import { quantityScaledToString } from '../../../../domain/documents/quantity';
import { TemplateCustomization } from '../../types';

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDateIndian(timestamp: number | undefined): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertUnderThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + (num % 10 ? ' ' + ONES[num % 10] : '');
  } else if (num > 0) {
    str += ONES[num];
  }
  return str.trim();
}

/**
 * Converts Indian currency minor units or rupees to Words in the Indian Numbering System (Crores, Lakhs, Thousands)
 */
export function amountToIndianWords(amountRupees: number | bigint): string {
  let n = typeof amountRupees === 'bigint' ? Number(amountRupees) : Math.floor(amountRupees);
  if (n <= 0) return 'Rupees Zero Only';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  let words = '';
  if (crore > 0) words += convertUnderThousand(crore) + ' Crore ';
  if (lakh > 0) words += convertUnderThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += convertUnderThousand(thousand) + ' Thousand ';
  if (remainder > 0) words += convertUnderThousand(remainder) + ' ';

  return 'Rupees ' + words.trim() + ' Only';
}

export interface GstParsedData {
  companyName: string;
  supplierAddress1: string;
  supplierAddress2: string;
  supplierGstin: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierWebsite: string;
  supplierState: string;
  supplierStateCode: string;
  signatoryName: string;
  signatoryTitle: string;
  logoHtml: string;

  invoiceNo: string;
  issueDateStr: string;
  dueDateStr: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  reverseChargeStr: string;
  invoiceTypeStr: string;
  supplyTypeStr: string;
  orderRef: string;
  orderDateStr: string;
  paymentTerms: string;
  irnNumber: string;

  buyerName: string;
  buyerAddress1: string;
  buyerAddress2: string;
  buyerCityStatePin: string;
  buyerGstin: string;
  buyerState: string;
  buyerStateCode: string;

  deliveryName: string;
  deliveryAddress1: string;
  deliveryAddress2: string;
  deliveryCityStatePin: string;
  deliveryState: string;
  deliveryStateCode: string;

  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  upiId: string;

  declarationText: string;
  termsLines: string[];

  isInterState: boolean;
  taxRatePercent: string;
  halfTaxRatePercent: string;

  totalTaxableMinor: bigint;
  totalCgstMinor: bigint;
  totalSgstMinor: bigint;
  totalIgstMinor: bigint;
  totalCessMinor: bigint;
  totalDiscountMinor: bigint;
  otherChargesMinor: bigint;
  roundOffMinor: bigint;
  grandTotalMinor: bigint;

  totalTaxableStr: string;
  totalCgstStr: string;
  totalSgstStr: string;
  totalIgstStr: string;
  totalCessStr: string;
  totalDiscountStr: string;
  otherChargesStr: string;
  roundOffStr: string;
  grandTotalStr: string;
  amountInWords: string;

  processedItems: {
    index: number;
    description: string;
    hsnSac: string;
    quantityStr: string;
    unitStr: string;
    rateStr: string;
    discountStr: string;
    taxableStr: string;
    taxRatePercentStr: string;
    taxAmountStr: string;
    lineTotalStr: string;
  }[];
}

export function parseGstInvoiceData(
  doc: FullDocument,
  business: BusinessProfile,
  customization?: TemplateCustomization
): GstParsedData {
  const currency = doc.currency || 'INR';

  // 1. Supplier data
  const companyName = business.name || business.legal_name || 'REGISTERED ORGANIZATION NAME';
  const supplierAddress1 = [business.address_line1, business.address_line2].filter(Boolean).join(', ') || '101, Executive Tower, Industrial Area';
  const supplierAddress2 = [business.city, business.state, business.postal_code, business.country || 'India'].filter(Boolean).join(', ');
  const supplierGstin = business.tax_id || '27AAAAA0000A1Z5';
  const supplierPhone = business.phone || '+91 98765 43210';
  const supplierEmail = business.email || 'billing@organization.com';
  const supplierWebsite = business.website || 'www.organization.com';
  const supplierState = business.state || 'Maharashtra';
  const supplierStateCode = business.subdivision_code || supplierGstin.slice(0, 2) || '27';
  const signatoryName = business.signatory_name || 'Authorized Signatory';
  const signatoryTitle = business.signatory_title || 'Director';

  const logoHtml = business.logo_uri
    ? `<img src="${business.logo_uri}" alt="Logo" style="max-height: 52px; max-width: 180px; object-fit: contain; display: block;" />`
    : `<div style="font-size: 15px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; color: #111827;">${escapeHtml(companyName)}</div>`;

  // 2. Invoice details
  const invoiceNo = doc.document_number || 'INV-2026-001';
  const issueDateStr = formatDateIndian(doc.issue_date);
  const dueDateStr = doc.due_date ? formatDateIndian(doc.due_date) : formatDateIndian(doc.issue_date + 30 * 86400000);
  const buyerGstin = (doc as any).customer_tax_id || (doc as any).buyer_gstin || '';
  const placeOfSupply = (doc as any).place_of_supply || business.state || 'Maharashtra';
  const posMatch = placeOfSupply.match(/\b([0-9]{2})\b/);
  const detectedPosCode = posMatch
    ? posMatch[1]
    : buyerGstin.length >= 2 && /^[0-9]{2}/.test(buyerGstin)
    ? buyerGstin.slice(0, 2)
    : supplierStateCode;
  const placeOfSupplyCode = (doc as any).place_of_supply_code || detectedPosCode;
  const reverseChargeStr = (doc as any).reverse_charge ? 'YES' : 'NO';
  const invoiceTypeStr = (doc as any).invoice_type || 'REGULAR';
  const supplyTypeStr = (doc as any).supply_type || 'SERVICES';
  const orderRef = (doc as any).order_reference || (doc as any).po_number || 'PO-98214';
  const orderDateStr = (doc as any).order_date ? formatDateIndian((doc as any).order_date) : issueDateStr;
  const paymentTerms = doc.payment_terms_preset || '30 Days Net';
  const irnNumber = (doc as any).irn || '';

  // 3. Buyer details
  const buyerName = doc.customer_business_name || doc.customer_name || 'Acme Enterprises Pvt Ltd';
  const buyerAddress1 = doc.customer_billing_address || 'Plot 45, Tech Park, Whitefield';
  const buyerAddress2 = '';
  const buyerCityStatePin = 'Bengaluru, Karnataka - 560066';
  const buyerState = (doc as any).buyer_state || 'Karnataka';
  const buyerStateCode = (doc as any).buyer_state_code || (buyerGstin.length >= 2 ? buyerGstin.slice(0, 2) : '29');

  // 4. Delivery details
  const deliveryName = (doc as any).delivery_name || buyerName;
  const deliveryAddress1 = (doc as any).customer_shipping_address || buyerAddress1;
  const deliveryAddress2 = '';
  const deliveryCityStatePin = buyerCityStatePin;
  const deliveryState = (doc as any).delivery_state || buyerState;
  const deliveryStateCode = (doc as any).delivery_state_code || buyerStateCode;

  // 5. Bank details
  const bankName = business.bank_name || 'HDFC Bank';
  const accountName = business.name || business.legal_name || 'Apex Technologies Pvt Ltd';
  const accountNumber = business.bank_account_number || '50200012345678';
  const ifscCode = business.bank_ifsc || 'HDFC0001234';
  const bankBranch = business.bank_branch || 'Main Corporate Branch';
  const upiId = business.upi_vpa || `${accountNumber}@hdfcbank`;

  // 6. Terms & Declaration
  const declarationText = customization?.custom_declaration ||
    'We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.';
  const termsLines = [
    `Payment is due within ${paymentTerms} from the invoice date.`,
    'Goods or services once acknowledged are deemed accepted in sound condition.',
    'Interest @ 18% p.a. is chargeable on delayed payments beyond due date.',
    'All disputes are subject to local state jurisdiction only.',
    'This is a computer generated invoice and does not require physical signature if digitally verified.'
  ];

  // 7. Taxes & Items calculation
  const isInterState = supplierStateCode !== placeOfSupplyCode && Boolean(placeOfSupplyCode);
  const taxRateBp = doc.tax_rate_bp || 1800; // 18% default
  const taxRatePercent = (taxRateBp / 100).toFixed(0);
  const halfTaxRatePercent = (taxRateBp / 200).toFixed(1);

  let totalTaxableMinor = 0n;
  let totalCgstMinor = 0n;
  let totalSgstMinor = 0n;
  let totalIgstMinor = 0n;
  let totalCessMinor = 0n;
  let totalDiscountMinor = 0n;

  const items = doc.items || [];
  const processedItems = items.map((item, idx) => {
    const qtyStr = quantityScaledToString(BigInt(item.quantity_scaled));
    const rateStr = formatMoney({ amountMinor: BigInt(item.unit_price_minor), currency });
    const lineTotalMinor = BigInt(item.line_total_minor);
    totalTaxableMinor += lineTotalMinor;

    const lineTaxMinor = (lineTotalMinor * BigInt(taxRateBp)) / 10000n;
    if (isInterState) {
      totalIgstMinor += lineTaxMinor;
    } else {
      const halfTax = lineTaxMinor / 2n;
      totalCgstMinor += halfTax;
      totalSgstMinor += halfTax;
    }

    const discountMinor = BigInt((item as any).discount_minor || 0);
    totalDiscountMinor += discountMinor;

    return {
      index: idx + 1,
      description: item.description,
      hsnSac: (item as any).hsn_sac_code || (item as any).hsn || (item as any).sac || '998314',
      quantityStr: qtyStr,
      unitStr: item.unit_name || 'NOS',
      rateStr,
      discountStr: discountMinor > 0n ? formatMoney({ amountMinor: discountMinor, currency }) : '—',
      taxableStr: formatMoney({ amountMinor: lineTotalMinor, currency }),
      taxRatePercentStr: `${taxRatePercent}%`,
      taxAmountStr: formatMoney({ amountMinor: lineTaxMinor, currency }),
      lineTotalStr: formatMoney({ amountMinor: lineTotalMinor + lineTaxMinor, currency }),
    };
  });

  const otherChargesMinor = BigInt((doc as any).other_charges_minor || 0);
  const roundOffMinor = 0n;
  const grandTotalMinor = totalTaxableMinor + totalCgstMinor + totalSgstMinor + totalIgstMinor + totalCessMinor + otherChargesMinor + roundOffMinor;
  const amountInWords = (doc as any).total_in_words || amountToIndianWords(grandTotalMinor / 100n);

  return {
    companyName,
    supplierAddress1,
    supplierAddress2,
    supplierGstin,
    supplierPhone,
    supplierEmail,
    supplierWebsite,
    supplierState,
    supplierStateCode,
    signatoryName,
    signatoryTitle,
    logoHtml,

    invoiceNo,
    issueDateStr,
    dueDateStr,
    placeOfSupply,
    placeOfSupplyCode,
    reverseChargeStr,
    invoiceTypeStr,
    supplyTypeStr,
    orderRef,
    orderDateStr,
    paymentTerms,
    irnNumber,

    buyerName,
    buyerAddress1,
    buyerAddress2,
    buyerCityStatePin,
    buyerGstin,
    buyerState,
    buyerStateCode,

    deliveryName,
    deliveryAddress1,
    deliveryAddress2,
    deliveryCityStatePin,
    deliveryState,
    deliveryStateCode,

    bankName,
    accountName,
    accountNumber,
    ifscCode,
    bankBranch,
    upiId,

    declarationText,
    termsLines,

    isInterState,
    taxRatePercent,
    halfTaxRatePercent,

    totalTaxableMinor,
    totalCgstMinor,
    totalSgstMinor,
    totalIgstMinor,
    totalCessMinor,
    totalDiscountMinor,
    otherChargesMinor,
    roundOffMinor,
    grandTotalMinor,

    totalTaxableStr: formatMoney({ amountMinor: totalTaxableMinor, currency }),
    totalCgstStr: formatMoney({ amountMinor: totalCgstMinor, currency }),
    totalSgstStr: formatMoney({ amountMinor: totalSgstMinor, currency }),
    totalIgstStr: formatMoney({ amountMinor: totalIgstMinor, currency }),
    totalCessStr: formatMoney({ amountMinor: totalCessMinor, currency }),
    totalDiscountStr: totalDiscountMinor > 0n ? formatMoney({ amountMinor: totalDiscountMinor, currency }) : '₹ 0.00',
    otherChargesStr: '₹ 0.00',
    roundOffStr: '₹ 0.00',
    grandTotalStr: formatMoney({ amountMinor: grandTotalMinor, currency }),
    amountInWords,

    processedItems,
  };
}

/**
 * Standard print CSS boilerplate for A4 portrait monochrome outputs
 */
export const MONOCHROME_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 0;
  }
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    width: 210mm;
    min-height: 297mm;
    background: #FFFFFF;
    color: #000000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 9pt;
    line-height: 1.35;
  }
  .page-container {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm 12mm;
    margin: 0 auto;
    position: relative;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th, td {
    vertical-align: top;
  }
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
`;
