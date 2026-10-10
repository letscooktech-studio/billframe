/**
 * DOCUMENT TYPE REGISTRY
 * Source-verified, authoritative definitions of business document types,
 * categories, legal classifications, and statutory provenance.
 * Conforms to CBIC GST Rules 46, 53, 55 and standard commercial practices.
 */

import { BusinessType } from '../features/FeatureRegistry';
import { DocumentType } from './types';

export type DocumentCategory =
  | 'sales_billing'
  | 'quotations_proposals'
  | 'orders_purchasing'
  | 'payments_receipts'
  | 'inventory_logistics'
  | 'service_projects'
  | 'finance_accounting'
  | 'custom_internal';

export type LegalClassification =
  | 'statutory_rule'       // Prescribed by law (e.g. GST Rule 46, 53, 55)
  | 'commercial_standard'  // Industry-standard commercial instrument (e.g. PO, Quote)
  | 'internal_business';   // Organization-internal operational record

export interface DocumentTypeDefinition {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly category: DocumentCategory;
  readonly classification: LegalClassification;
  readonly legalClassification: LegalClassification;
  readonly provenanceRule?: string;
  readonly officialReferenceUrl?: string;
  readonly description: string;
  readonly defaultPrefix: string;
  readonly allowedTransitions?: readonly string[];
  readonly requiresOriginalInvoiceRef?: boolean;
  readonly defaultDocType: DocumentType;
  readonly requiredFields: readonly string[];
  readonly conditionalFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly supportedTemplates: readonly string[];
  readonly businessRelevance: Record<BusinessType, number>; // 0 to 100
  readonly isImplemented: boolean;
}

export const DOCUMENT_CATEGORIES: { id: DocumentCategory; label: string; description: string }[] = [
  { id: 'sales_billing', label: 'Sales & Billing', description: 'Tax invoices, bills of supply, and commercial sales instruments' },
  { id: 'quotations_proposals', label: 'Quotations & Proposals', description: 'Estimates, formal bids, scope proposals, and proformas' },
  { id: 'orders_purchasing', label: 'Orders & Purchasing', description: 'Purchase orders, sales orders, and vendor requisitions' },
  { id: 'payments_receipts', label: 'Payments & Receipts', description: 'Payment vouchers, advance receipts, and official receipts' },
  { id: 'inventory_logistics', label: 'Inventory & Logistics', description: 'Delivery challans, packing lists, and dispatch notes' },
  { id: 'service_projects', label: 'Service & Projects', description: 'Work orders, job cards, service reports, and completion sheets' },
  { id: 'finance_accounting', label: 'Finance & Accounting', description: 'Credit notes, debit notes, customer account statements' },
  { id: 'custom_internal', label: 'Internal Documents', description: 'Organization custom forms, internal memos, and checklists' },
];

export const DOCUMENT_TYPES: readonly DocumentTypeDefinition[] = [
  // ── 1. SALES & BILLING ──
  {
    id: 'tax_invoice',
    type: 'tax_invoice',
    name: 'GST Tax Invoice',
    aliases: ['gst_tax_invoice', 'Tax Invoice', 'GST Bill', 'Commercial Tax Invoice'],
    category: 'sales_billing',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 46',
    officialReferenceUrl: 'https://taxinformation.cbic.gov.in',
    description: 'Statutory tax invoice issued by a GST registered supplier under Rule 46 with HSN/SAC, place of supply, and CGST/SGST/IGST breakdown.',
    defaultPrefix: 'INV-',
    allowedTransitions: ['credit_note', 'debit_note', 'receipt'],
    defaultDocType: 'tax_invoice',
    requiredFields: [
      'seller.name',
      'seller.address',
      'seller.gstin',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'buyer.billing_address',
      'items.description',
      'items.hsn_sac',
      'items.quantity',
      'items.rate',
      'items.taxable_value',
      'tax.breakdown',
      'financials.grand_total',
    ],
    conditionalFields: [
      'buyer.gstin',
      'document.place_of_supply',
      'buyer.delivery_address',
    ],
    optionalFields: [
      'document.po_number',
      'document.due_date',
      'payment.upi_vpa',
      'payment.bank_details',
      'document.notes',
      'document.terms',
      'seller.signature',
    ],
    supportedTemplates: ['standard', 'executive', 'compact', 'modern', 'minimal', 'ledger_navy', 'executive_ink'],
    businessRelevance: {
      freelancer: 90,
      service: 95,
      agency: 95,
      contractor: 95,
      retail: 90,
      wholesale: 100,
      professional: 95,
      other: 90,
    },
    isImplemented: true,
  },
  {
    id: 'bill_of_supply',
    type: 'bill_of_supply',
    name: 'Bill of Supply',
    aliases: ['Composition Bill', 'Exempt Supply Bill'],
    category: 'sales_billing',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 49',
    description: 'Issued by suppliers opting for Composition Levy or making exempt supplies where no tax is charged to the buyer.',
    defaultPrefix: 'BOS-',
    allowedTransitions: ['receipt'],
    defaultDocType: 'bill_of_supply',
    requiredFields: [
      'seller.name',
      'seller.address',
      'seller.gstin',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'financials.grand_total',
    ],
    conditionalFields: [],
    optionalFields: ['document.notes', 'payment.bank_details'],
    supportedTemplates: ['standard', 'compact', 'minimal'],
    businessRelevance: {
      freelancer: 60,
      service: 70,
      agency: 60,
      contractor: 75,
      retail: 85,
      wholesale: 80,
      professional: 65,
      other: 70,
    },
    isImplemented: true,
  },
  {
    id: 'export_invoice',
    type: 'export_invoice',
    name: 'Export Invoice',
    aliases: ['commercial_invoice', 'Export Bill', 'Foreign Invoice', 'International Invoice'],
    category: 'sales_billing',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 46 Export Proviso / FEMA',
    description: 'Export commercial tax invoice for overseas clients stating LUT/Bond reference, country of destination, and foreign currency.',
    defaultPrefix: 'EXP-',
    allowedTransitions: ['receipt'],
    defaultDocType: 'export_invoice',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'items.quantity',
      'items.rate',
      'financials.grand_total',
    ],
    conditionalFields: ['document.lut_bond_number', 'document.port_code'],
    optionalFields: ['payment.bank_details', 'document.notes', 'document.terms'],
    supportedTemplates: ['standard', 'modern', 'minimal', 'compact', 'executive', 'executive_ink'],
    businessRelevance: {
      freelancer: 100,
      service: 95,
      agency: 100,
      contractor: 70,
      retail: 50,
      wholesale: 90,
      professional: 100,
      other: 80,
    },
    isImplemented: true,
  },

  // ── 2. QUOTATIONS & PROPOSALS ──
  {
    id: 'proforma',
    type: 'proforma',
    name: 'Proforma Invoice',
    aliases: ['proforma_invoice', 'Proforma Bill', 'Preliminary Invoice'],
    category: 'quotations_proposals',
    classification: 'commercial_standard',
    legalClassification: 'commercial_standard',
    description: 'Preliminary invoice sent to buyers before goods or services are delivered, used for requesting advance payments.',
    defaultPrefix: 'PI-',
    allowedTransitions: ['tax_invoice'],
    defaultDocType: 'proforma',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'items.rate',
      'financials.grand_total',
    ],
    conditionalFields: [],
    optionalFields: ['payment.bank_details', 'document.terms', 'document.po_number'],
    supportedTemplates: ['standard', 'executive', 'modern', 'compact'],
    businessRelevance: {
      freelancer: 80,
      service: 85,
      agency: 90,
      contractor: 85,
      retail: 40,
      wholesale: 100,
      professional: 85,
      other: 75,
    },
    isImplemented: true,
  },
  {
    id: 'quotation',
    type: 'quotation',
    name: 'Quotation / Estimate',
    aliases: ['estimate', 'formal_quotation', 'Quote', 'Formal Bid', 'Price Quote'],
    category: 'quotations_proposals',
    classification: 'commercial_standard',
    legalClassification: 'commercial_standard',
    description: 'Formal commercial quotation with specified validity period, scope stipulations, and delivery terms.',
    defaultPrefix: 'QT-',
    allowedTransitions: ['proforma', 'tax_invoice'],
    defaultDocType: 'quotation',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'items.rate',
      'financials.grand_total',
    ],
    conditionalFields: [],
    optionalFields: ['document.due_date', 'document.terms', 'seller.signature'],
    supportedTemplates: ['standard', 'executive', 'modern', 'minimal', 'architectural_grid'],
    businessRelevance: {
      freelancer: 95,
      service: 100,
      agency: 100,
      contractor: 100,
      retail: 60,
      wholesale: 95,
      professional: 90,
      other: 85,
    },
    isImplemented: true,
  },

  // ── 3. ORDERS & PURCHASING ──
  {
    id: 'purchase_order',
    type: 'purchase_order',
    name: 'Purchase Order',
    aliases: ['PO', 'Vendor Purchase Order', 'Buyer Requisition'],
    category: 'orders_purchasing',
    classification: 'commercial_standard',
    legalClassification: 'commercial_standard',
    description: 'Commercial document and formal order issued by a buyer to a vendor authorizing supply of products or services.',
    defaultPrefix: 'PO-',
    allowedTransitions: ['delivery_challan', 'tax_invoice'],
    defaultDocType: 'purchase_order',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'items.quantity',
      'items.rate',
      'financials.grand_total',
    ],
    conditionalFields: ['document.delivery_date', 'document.shipping_address'],
    optionalFields: ['document.payment_terms', 'buyer.signature', 'document.notes'],
    supportedTemplates: ['standard', 'compact', 'minimal'],
    businessRelevance: {
      freelancer: 40,
      service: 70,
      agency: 80,
      contractor: 95,
      retail: 90,
      wholesale: 100,
      professional: 60,
      other: 75,
    },
    isImplemented: true,
  },

  // ── 4. INVENTORY & LOGISTICS ──
  {
    id: 'delivery_challan',
    type: 'delivery_challan',
    name: 'Delivery Challan',
    aliases: ['Dispatch Challan', 'Transport Memo', 'Challan'],
    category: 'inventory_logistics',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 55',
    officialReferenceUrl: 'https://taxinformation.cbic.gov.in',
    description: 'Statutory transport document under Rule 55 for movement of goods (job work, approval, transfer) where supply invoice is not yet issued.',
    defaultPrefix: 'DC-',
    allowedTransitions: ['tax_invoice'],
    defaultDocType: 'delivery_challan',
    requiredFields: [
      'seller.name',
      'seller.gstin',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'items.hsn_sac',
      'items.quantity',
      'challan.purpose_of_transport',
    ],
    conditionalFields: ['challan.taxable_value', 'challan.tax_rate'],
    optionalFields: ['transport.vehicle_number', 'transport.transporter_name', 'seller.signature'],
    supportedTemplates: ['standard', 'compact', 'minimal'],
    businessRelevance: {
      freelancer: 20,
      service: 50,
      agency: 20,
      contractor: 85,
      retail: 70,
      wholesale: 100,
      professional: 20,
      other: 60,
    },
    isImplemented: true,
  },

  // ── 5. FINANCE & ACCOUNTING ──
  {
    id: 'credit_note',
    type: 'credit_note',
    name: 'Credit Note',
    aliases: ['gst_credit_note', 'Credit Memo', 'Tax Credit Adjustment'],
    category: 'finance_accounting',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 53',
    officialReferenceUrl: 'https://taxinformation.cbic.gov.in',
    description: 'Legal accounting adjustment issued by supplier under Rule 53 reducing invoice value due to discount, sales return, or excess tax.',
    defaultPrefix: 'CN-',
    requiresOriginalInvoiceRef: true,
    defaultDocType: 'credit_note',
    requiredFields: [
      'seller.name',
      'seller.gstin',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'credit.original_invoice_number',
      'credit.original_invoice_date',
      'credit.amount',
      'credit.reason',
    ],
    conditionalFields: ['credit.tax_amount'],
    optionalFields: ['document.notes', 'seller.signature'],
    supportedTemplates: ['standard', 'executive', 'compact'],
    businessRelevance: {
      freelancer: 70,
      service: 80,
      agency: 85,
      contractor: 85,
      retail: 85,
      wholesale: 100,
      professional: 75,
      other: 80,
    },
    isImplemented: true,
  },
  {
    id: 'debit_note',
    type: 'debit_note',
    name: 'Debit Note',
    aliases: ['Debit Memo', 'Tax Debit Adjustment'],
    category: 'finance_accounting',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 53',
    officialReferenceUrl: 'https://taxinformation.cbic.gov.in',
    description: 'Accounting instrument issued under Rule 53 when taxable value or tax charged in original tax invoice is found to be less than payable.',
    defaultPrefix: 'DN-',
    requiresOriginalInvoiceRef: true,
    defaultDocType: 'debit_note',
    requiredFields: [
      'seller.name',
      'seller.gstin',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'debit.original_invoice_number',
      'debit.amount',
      'debit.reason',
    ],
    conditionalFields: ['debit.tax_amount'],
    optionalFields: ['document.notes', 'seller.signature'],
    supportedTemplates: ['standard', 'executive', 'compact'],
    businessRelevance: {
      freelancer: 60,
      service: 75,
      agency: 75,
      contractor: 80,
      retail: 80,
      wholesale: 95,
      professional: 70,
      other: 75,
    },
    isImplemented: true,
  },

  // ── 6. PAYMENTS & RECEIPTS ──
  {
    id: 'receipt',
    type: 'receipt',
    name: 'Official Payment Receipt',
    aliases: ['payment_receipt', 'Money Receipt', 'Payment Acknowledgement', 'Settlement Receipt'],
    category: 'payments_receipts',
    classification: 'commercial_standard',
    legalClassification: 'commercial_standard',
    description: 'Official payment acknowledgement issued to client upon receiving funds against an invoice or bill.',
    defaultPrefix: 'REC-',
    defaultDocType: 'receipt',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'payment.amount',
      'payment.payment_method',
    ],
    conditionalFields: ['payment.reference', 'document.linked_invoice_number'],
    optionalFields: ['payment.remaining_balance', 'seller.signature', 'document.notes'],
    supportedTemplates: ['receiptTemplate', 'standard', 'minimal'],
    businessRelevance: {
      freelancer: 90,
      service: 95,
      agency: 95,
      contractor: 95,
      retail: 90,
      wholesale: 95,
      professional: 100,
      other: 90,
    },
    isImplemented: true,
  },
  {
    id: 'payment_voucher',
    type: 'payment_voucher',
    name: 'Payment Voucher',
    aliases: ['Disbursement Voucher', 'Payout Slip', 'Cash Voucher'],
    category: 'payments_receipts',
    classification: 'statutory_rule',
    legalClassification: 'statutory_rule',
    provenanceRule: 'CBIC CGST Rule 52',
    description: 'Statutory voucher issued under Rule 52 at the time of making payment to supplier in reverse charge or business disbursement.',
    defaultPrefix: 'PV-',
    defaultDocType: 'payment_voucher',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'payment.amount',
      'payment.purpose',
    ],
    conditionalFields: ['seller.gstin'],
    optionalFields: ['payment.payment_mode', 'seller.signature'],
    supportedTemplates: ['standard', 'compact', 'minimal'],
    businessRelevance: {
      freelancer: 50,
      service: 70,
      agency: 75,
      contractor: 90,
      retail: 80,
      wholesale: 90,
      professional: 65,
      other: 70,
    },
    isImplemented: true,
  },

  // ── 7. SERVICE & PROJECTS ──
  {
    id: 'work_order',
    type: 'work_order',
    name: 'Work Order / Job Specification',
    aliases: ['Job Order', 'Service Order', 'Scope Sheet'],
    category: 'service_projects',
    classification: 'internal_business',
    legalClassification: 'internal_business',
    description: 'Operational work authorization detailing customer, site address, scope of tasks, materials, and authorized personnel.',
    defaultPrefix: 'WO-',
    allowedTransitions: ['tax_invoice'],
    defaultDocType: 'work_order',
    requiredFields: [
      'seller.name',
      'document.document_number',
      'document.issue_date',
      'buyer.name',
      'items.description',
      'items.quantity',
    ],
    conditionalFields: ['project.site_address'],
    optionalFields: ['project.assigned_worker', 'document.terms', 'seller.signature', 'buyer.signature'],
    supportedTemplates: ['standard', 'compact', 'minimal', 'architectural_grid'],
    businessRelevance: {
      freelancer: 70,
      service: 100,
      agency: 85,
      contractor: 100,
      retail: 40,
      wholesale: 60,
      professional: 75,
      other: 80,
    },
    isImplemented: true,
  },
];

/**
 * Authoritative registry interface for querying document specifications
 */
export class DocumentTypeRegistry {
  static getAll(): readonly DocumentTypeDefinition[] {
    return DOCUMENT_TYPES;
  }

  static getById(id: string): DocumentTypeDefinition | undefined {
    return this.get(id);
  }

  static get(key: string): DocumentTypeDefinition | undefined {
    if (!key) return undefined;
    const lower = key.toLowerCase();
    return DOCUMENT_TYPES.find(
      (d) =>
        d.id.toLowerCase() === lower ||
        d.type.toLowerCase() === lower ||
        d.aliases.some((a) => a.toLowerCase() === lower) ||
        d.defaultDocType.toLowerCase() === lower
    );
  }

  static getByCategory(category: DocumentCategory): DocumentTypeDefinition[] {
    return DOCUMENT_TYPES.filter((d) => d.category === category);
  }

  static getRecommendedForBusinessType(businessType: BusinessType): DocumentTypeDefinition[] {
    return [...DOCUMENT_TYPES]
      .filter((d) => (d.businessRelevance[businessType] ?? 0) >= 60)
      .sort((a, b) => (b.businessRelevance[businessType] ?? 0) - (a.businessRelevance[businessType] ?? 0));
  }

  static getCategories(): typeof DOCUMENT_CATEGORIES {
    return DOCUMENT_CATEGORIES;
  }
}
