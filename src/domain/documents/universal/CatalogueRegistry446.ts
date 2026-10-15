/**
 * UNIVERSAL 446-DOCUMENT CATALOGUE & TAXONOMY REGISTRY
 * 
 * Maps all 446 candidate business documents across 25 industry categories.
 * Uses immutable, stable document IDs (e.g. `BF-DOC-01-002` for Indian GST Tax Invoice)
 * to ensure persistent database references, migration stability, and workflow automation.
 * 
 * Strict Lifecycle States:
 * - RESEARCH_ONLY: Conceptual/statutory candidate documented in taxonomy
 * - SOURCE_REVIEWED: Regulatory/statutory source vetted (CBIC, FSSAI, Labour, DGFT, etc.)
 * - SCHEMA_VALIDATED: Domain JSON schema and field constraints defined
 * - TEMPLATE_IMPLEMENTED: Production HTML/CSS print template built
 * - PDF_TESTED: Rendered and verified against deterministic A4/Letter print bounds
 * - ANDROID_TESTED: Verified on Android device/emulator with touch targets and keyboard
 * - RELEASE_READY: Full end-to-end verified with dual-gate validation passed
 */

export type DocumentLifecycleStatus =
  | 'RESEARCH_ONLY'
  | 'SOURCE_REVIEWED'
  | 'SCHEMA_VALIDATED'
  | 'TEMPLATE_IMPLEMENTED'
  | 'PDF_TESTED'
  | 'ANDROID_TESTED'
  | 'RELEASE_READY';

export type CatalogueCategoryKey =
  | 'sales_billing'            // Cat 01: Sales, Billing & Commercial Tax (21)
  | 'quotations_estimates'     // Cat 02: Quotations, Estimates & Tenders (18)
  | 'procurement_purchasing'   // Cat 03: Procurement, Purchase Orders & Vendor (20)
  | 'hr_recruitment'           // Cat 04: HR, Talent Acquisition & Hiring (18)
  | 'payroll_employment'       // Cat 05: Payroll, Employee Administration & Records (22)
  | 'corporate_letters'        // Cat 06: Executive, Formal & Corporate Letters (20)
  | 'banking_accounting'       // Cat 07: Banking, Treasury & Accounting Operations (18)
  | 'inventory_warehousing'    // Cat 08: Inventory, Warehousing & Material Stores (18)
  | 'logistics_freight'        // Cat 09: Logistics, Dispatch, Freight & Transport (20)
  | 'construction_realestate'  // Cat 10: Construction, Civil Contracting & Dev (20)
  | 'field_service'            // Cat 11: Field Service, Engineering & Maintenance (18)
  | 'manufacturing_qa'         // Cat 12: Manufacturing, Plant Ops & QA (18)
  | 'property_leasing'         // Cat 13: Property Management, Tenancy & Leasing (18)
  | 'education_training'       // Cat 14: Education, Academies & Tuition (18)
  | 'hospitality_food'         // Cat 15: Hospitality, Restaurants & Food Service (18)
  | 'healthcare_admin'         // Cat 16: Healthcare, Clinics & Medical Admin (18)
  | 'nonprofit_ngo'            // Cat 17: Non-Profit, NGOs & Charitable Trusts (16)
  | 'legal_compliance'         // Cat 18: Corporate Governance, Legal & Compliance (20)
  | 'information_technology'   // Cat 19: Software Engineering, IT & DevOps (18)
  | 'event_media'              // Cat 20: Event Management, Production & Media (16)
  | 'import_export'            // Cat 21: International Trade, Customs & Exim (18)
  | 'consulting_advisory'      // Cat 22: Strategy, Management Consulting & Advisory (16)
  | 'facilities_security'      // Cat 23: Facilities, Security & Workplace Admin (16)
  | 'agriculture_dairy'        // Cat 24: Agriculture, Horticulture, Dairy & Farm (16)
  | 'custom_organization';     // Cat 25: Custom & User-Defined Documents (15)

export interface CatalogueCategoryDefinition {
  readonly id: string;
  readonly code: CatalogueCategoryKey;
  readonly categoryIndex: number; // 1 - 25
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly totalDocuments: number;
}

export interface CatalogueDocumentEntry {
  readonly id: string; // e.g. 'BF-DOC-01-002'
  readonly categoryKey: CatalogueCategoryKey;
  readonly categoryIndex: number;
  readonly canonicalName: string;
  readonly shortName?: string;
  readonly aliases: readonly string[];
  readonly businessPurpose: string;
  readonly regulatorySource?: string;
  readonly legalJurisdiction: 'IN' | 'GLOBAL' | 'US' | 'EU' | 'UK';
  readonly documentClass: 'class_a_financial' | 'class_b_administrative' | 'class_c_custom';
  readonly lifecycleStatus: DocumentLifecycleStatus;
  readonly availableLayoutCount: number;
  readonly defaultLayoutCode?: string;
  readonly supportedLayoutCodes: readonly string[];
  readonly designQualityScore: number; // 0 - 100
  readonly isReleaseReady: boolean;
}

export const CATALOGUE_CATEGORIES: readonly CatalogueCategoryDefinition[] = [
  {
    id: 'cat-01',
    code: 'sales_billing',
    categoryIndex: 1,
    title: 'Sales, Billing & Commercial Tax',
    description: 'Statutory GST tax invoices, retail cash bills, bills of supply, debit/credit notes and commercial invoices.',
    icon: 'receipt',
    totalDocuments: 21,
  },
  {
    id: 'cat-02',
    code: 'quotations_estimates',
    categoryIndex: 2,
    title: 'Quotations, Estimates & Tenders',
    description: 'Formal commercial quotations, rate cards, RFQ responses, tender bids and project cost sheets.',
    icon: 'file-text',
    totalDocuments: 18,
  },
  {
    id: 'cat-03',
    code: 'procurement_purchasing',
    categoryIndex: 3,
    title: 'Procurement, Purchase Orders & Vendor Management',
    description: 'Purchase orders, purchase requisitions, goods receipts notes, vendor ratings and procurement contracts.',
    icon: 'shopping-cart',
    totalDocuments: 18,
  },
  {
    id: 'cat-04',
    code: 'hr_recruitment',
    categoryIndex: 4,
    title: 'HR, Talent Acquisition & Hiring',
    description: 'Job offer letters, intent letters, internship agreements, background verification and NDAs.',
    icon: 'user-plus',
    totalDocuments: 18,
  },
  {
    id: 'cat-05',
    code: 'payroll_employment',
    categoryIndex: 5,
    title: 'Payroll, Employee Administration & Records',
    description: 'Monthly salary slips, appointment letters, experience letters, relieving letters and bonus advice.',
    icon: 'users',
    totalDocuments: 20,
  },
  {
    id: 'cat-06',
    code: 'corporate_letters',
    categoryIndex: 6,
    title: 'Executive, Formal & Corporate Letters',
    description: 'Board resolutions, authorization letters, formal representations, bank mandates and corporate notices.',
    icon: 'mail',
    totalDocuments: 18,
  },
  {
    id: 'cat-07',
    code: 'banking_accounting',
    categoryIndex: 7,
    title: 'Banking, Treasury & Accounting Operations',
    description: 'Payment vouchers, receipt vouchers, customer account statements, journal notes and bank reconciliations.',
    icon: 'dollar-sign',
    totalDocuments: 18,
  },
  {
    id: 'cat-08',
    code: 'inventory_warehousing',
    categoryIndex: 8,
    title: 'Inventory, Warehousing & Material Stores',
    description: 'Delivery challans, material transfer notes, stock count audit sheets and store issue vouchers.',
    icon: 'box',
    totalDocuments: 18,
  },
  {
    id: 'cat-09',
    code: 'logistics_freight',
    categoryIndex: 9,
    title: 'Logistics, Dispatch, Freight & Transport',
    description: 'Lorry receipts (LR), bills of lading, consignment notes, vehicle dispatch memos and trip sheets.',
    icon: 'truck',
    totalDocuments: 20,
  },
  {
    id: 'cat-10',
    code: 'construction_realestate',
    categoryIndex: 10,
    title: 'Construction, Civil Contracting & Property Dev',
    description: 'Measurement sheets, contractor RA bills, handover certificates, site safety logs and snagging lists.',
    icon: 'home',
    totalDocuments: 20,
  },
  {
    id: 'cat-11',
    code: 'field_service',
    categoryIndex: 11,
    title: 'Field Service, Engineering & Maintenance',
    description: 'Work orders, field service reports, preventative maintenance logs, commissioning notes and AMC renewals.',
    icon: 'tool',
    totalDocuments: 18,
  },
  {
    id: 'cat-12',
    code: 'manufacturing_qa',
    categoryIndex: 12,
    title: 'Manufacturing, Plant Operations & QA',
    description: 'Batch production records, inspection certificates, certificate of analysis (COA) and equipment logs.',
    icon: 'activity',
    totalDocuments: 18,
  },
  {
    id: 'cat-13',
    code: 'property_leasing',
    categoryIndex: 13,
    title: 'Property Management, Tenancy & Leasing',
    description: 'Rent receipts, lease deeds, security deposit receipts, commercial lease summaries and tenant notices.',
    icon: 'key',
    totalDocuments: 18,
  },
  {
    id: 'cat-14',
    code: 'education_training',
    categoryIndex: 14,
    title: 'Education, Academies, Tuition & Universities',
    description: 'Student fee receipts, course completion certificates, bonafide certificates and admission confirmation.',
    icon: 'book',
    totalDocuments: 18,
  },
  {
    id: 'cat-15',
    code: 'hospitality_food',
    categoryIndex: 15,
    title: 'Hospitality, Restaurants, Catering & FSSAI',
    description: 'FSSAI food hygiene records, kitchen temperature logs, banquet contracts, catering work orders and KOTs.',
    icon: 'coffee',
    totalDocuments: 18,
  },
  {
    id: 'cat-16',
    code: 'healthcare_admin',
    categoryIndex: 16,
    title: 'Healthcare, Clinics, Hospitals & Patient Admin',
    description: 'Clinical consultation slips, patient consent forms, diagnostic billing, discharge summaries and medical bills.',
    icon: 'heart',
    totalDocuments: 18,
  },
  {
    id: 'cat-17',
    code: 'nonprofit_ngo',
    categoryIndex: 17,
    title: 'Non-Profit, NGOs & Charitable Foundations',
    description: 'Section 80G donation receipts, utilization certificates, volunteer agreements and grant progress reports.',
    icon: 'gift',
    totalDocuments: 16,
  },
  {
    id: 'cat-18',
    code: 'legal_compliance',
    categoryIndex: 18,
    title: 'Corporate Governance, Legal Agreements & Compliance',
    description: 'Non-disclosure agreements, master service agreements, powers of attorney, board minutes and share certs.',
    icon: 'shield',
    totalDocuments: 18,
  },
  {
    id: 'cat-19',
    code: 'information_technology',
    categoryIndex: 19,
    title: 'Software Engineering, IT Services & DevOps',
    description: 'Service level agreements (SLA), statements of work (SOW), change requests, incident postmortems and deployment logs.',
    icon: 'cpu',
    totalDocuments: 18,
  },
  {
    id: 'cat-20',
    code: 'event_media',
    categoryIndex: 20,
    title: 'Event Management, Production & Media',
    description: 'Event run of show, model releases, filming location permits, artist contracts and equipment hire contracts.',
    icon: 'video',
    totalDocuments: 16,
  },
  {
    id: 'cat-21',
    code: 'import_export',
    categoryIndex: 21,
    title: 'International Trade, Customs, DGFT & Exim',
    description: 'Commercial invoice for exports, packing lists, certificates of origin, shipping bills and bill of entry records.',
    icon: 'globe',
    totalDocuments: 18,
  },
  {
    id: 'cat-22',
    code: 'consulting_advisory',
    categoryIndex: 22,
    title: 'Strategy, Management Consulting & Advisory',
    description: 'Consulting engagement letters, executive deliverables, management audit memos and advisory scope sheets.',
    icon: 'briefcase',
    totalDocuments: 16,
  },
  {
    id: 'cat-23',
    code: 'facilities_security',
    categoryIndex: 23,
    title: 'Facilities, Security & Workplace Administration',
    description: 'Visitor pass logs, gate passes, security incident records, key handovers and facilities checklists.',
    icon: 'lock',
    totalDocuments: 16,
  },
  {
    id: 'cat-24',
    code: 'agriculture_dairy',
    categoryIndex: 24,
    title: 'Agriculture, Horticulture, Dairy & Farm',
    description: 'Mandi sale slips, milk collection sheets, crop yield records, organic certification documents and tractor hire logs.',
    icon: 'sun',
    totalDocuments: 16,
  },
  {
    id: 'cat-25',
    code: 'custom_organization',
    categoryIndex: 25,
    title: 'Custom & User-Defined Organization Documents',
    description: 'Organization-tailored multi-section documents, dynamic custom tables, sign-off slips and proprietary forms.',
    icon: 'sliders',
    totalDocuments: 15,
  },
];

// Helper to construct entries
function makeEntry(
  id: string,
  categoryKey: CatalogueCategoryKey,
  categoryIndex: number,
  canonicalName: string,
  businessPurpose: string,
  regulatorySource: string | undefined,
  docClass: 'class_a_financial' | 'class_b_administrative' | 'class_c_custom',
  status: DocumentLifecycleStatus,
  layouts: string[],
  score: number = 0,
  aliases: string[] = []
): CatalogueDocumentEntry {
  return {
    id,
    categoryKey,
    categoryIndex,
    canonicalName,
    aliases,
    businessPurpose,
    regulatorySource,
    legalJurisdiction: regulatorySource && regulatorySource.includes('GST') ? 'IN' : 'GLOBAL',
    documentClass: docClass,
    lifecycleStatus: status,
    availableLayoutCount: layouts.length,
    defaultLayoutCode: layouts[0],
    supportedLayoutCodes: layouts,
    designQualityScore: score,
    isReleaseReady: status === 'RELEASE_READY',
  };
}

/**
 * CURATED CORE DOCUMENT ENTRIES (Rich metadata, tested layouts and statutory notes)
 */
const CURATED_CATALOGUE_ENTRIES: readonly CatalogueDocumentEntry[] = [
  // ── CATEGORY 01: SALES, BILLING & COMMERCIAL TAX (21 Entries) ──
  makeEntry(
    'BF-DOC-01-001',
    'sales_billing',
    1,
    'Standard Commercial Invoice',
    'General B2B and B2C commercial sales invoice recording supplies, payment conditions, and item totals.',
    'UN/CEFACT CII & ISO 20022 Financial Standards',
    'class_a_financial',
    'RELEASE_READY',
    ['standard', 'compact', 'modern', 'minimal'],
    96,
    ['Sales Invoice', 'Commercial Bill', 'Billing Invoice']
  ),
  makeEntry(
    'BF-DOC-01-002',
    'sales_billing',
    1,
    'Indian GST Tax Invoice',
    'Official Indian GST tax invoice compliant with CBIC Rule 46, identifying supplier/buyer GSTIN, HSN/SAC, and tax breakup.',
    'CBIC GST Central Goods and Services Tax Rules, Rule 46',
    'class_a_financial',
    'RELEASE_READY',
    ['gst_executive', 'gst_ledger', 'gst_minimal', 'gst_corporate', 'gst_supply_chain'],
    98,
    ['GST Invoice', 'Tax Invoice Rule 46', 'GST Bill', 'GST-01 Executive', 'GST-02 Ledger']
  ),
  makeEntry(
    'BF-DOC-01-003',
    'sales_billing',
    1,
    'Bill of Supply (GST Composite / Exempt)',
    'Issued in lieu of tax invoice by composition dealers or suppliers of exempt goods/services per CBIC Rule 49.',
    'CBIC CGST Rules 2017, Rule 49',
    'class_a_financial',
    'PDF_TESTED',
    ['minimal', 'standard', 'compact'],
    92,
    ['Exempt Supply Bill', 'Composition Invoice', 'Bill of Supply']
  ),
  makeEntry(
    'BF-DOC-01-004',
    'sales_billing',
    1,
    'GST Credit Note',
    'Formal credit adjustment document issued under CBIC Section 34(1) for sales returns, deficiencies, or discounts.',
    'CBIC CGST Act Section 34(1)',
    'class_a_financial',
    'PDF_TESTED',
    ['standard', 'minimal'],
    94,
    ['Credit Memo', 'Tax Credit Note']
  ),
  makeEntry(
    'BF-DOC-01-005',
    'sales_billing',
    1,
    'GST Debit Note',
    'Formal supplementary charge issued under CBIC Section 34(3) when taxable value or tax charged falls short.',
    'CBIC CGST Act Section 34(3)',
    'class_a_financial',
    'PDF_TESTED',
    ['standard', 'minimal'],
    94,
    ['Debit Memo', 'Supplementary Invoice']
  ),
  makeEntry(
    'BF-DOC-01-006',
    'sales_billing',
    1,
    'Proforma Invoice',
    'Preliminary commercial quotation invoice sent before dispatch or supply, outlining expected deliverables and prices.',
    'International Commercial Terms (Incoterms 2020)',
    'class_a_financial',
    'RELEASE_READY',
    ['standard', 'modern', 'minimal'],
    95,
    ['Estimated Invoice', 'Preliminary Bill']
  ),
  makeEntry(
    'BF-DOC-01-007',
    'sales_billing',
    1,
    'Delivery Challan (Rule 55)',
    'Statutory goods dispatch document for transportation without immediate tax invoice (job work, approval, exhibitions).',
    'CBIC CGST Rules 2017, Rule 55',
    'class_b_administrative',
    'PDF_TESTED',
    ['work_order', 'standard'],
    93,
    ['Delivery Note', 'Dispatch Note', 'Job Work Challan']
  ),
  makeEntry(
    'BF-DOC-01-008',
    'sales_billing',
    1,
    'Receipt Voucher (Advance Payment)',
    'Issued upon receiving payment in advance for future supply of goods or services under Section 31(3)(d).',
    'CBIC CGST Act 2017, Section 31(3)(d)',
    'class_a_financial',
    'PDF_TESTED',
    ['standard', 'compact'],
    91,
    ['Advance Payment Receipt', 'Advance Voucher']
  ),
  makeEntry(
    'BF-DOC-01-009',
    'sales_billing',
    1,
    'Payment Voucher (Reverse Charge Supply)',
    'Issued by recipient when making payments to unregistered suppliers subject to reverse charge mechanism (RCM).',
    'CBIC CGST Act 2017, Section 31(3)(g)',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['standard'],
    89,
    ['RCM Payment Voucher', 'Self Payment Voucher']
  ),
  makeEntry(
    'BF-DOC-01-010',
    'sales_billing',
    1,
    'Refund Voucher',
    'Issued when advance payment was received but subsequent supply of goods/services is cancelled.',
    'CBIC CGST Act 2017, Section 31(3)(e)',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['standard'],
    88,
    ['Advance Refund Voucher']
  ),
  makeEntry(
    'BF-DOC-01-011',
    'sales_billing',
    1,
    'Payment Receipt (A4 / POS)',
    'Official commercial acknowledgement of payment received against specific invoices or orders.',
    'Standard Business Accounting Practices',
    'class_a_financial',
    'RELEASE_READY',
    ['receipt', 'standard', 'minimal'],
    96,
    ['Official Cash Receipt', 'Money Receipt']
  ),
  makeEntry(
    'BF-DOC-01-012',
    'sales_billing',
    1,
    'Retail POS Cash Slip',
    'High-density compact till receipt for over-the-counter retail transactions.',
    'Consumer Protection / Retail Standards',
    'class_a_financial',
    'RELEASE_READY',
    ['compact', 'receipt'],
    94,
    ['Till Receipt', 'Cash Memo']
  ),
  makeEntry(
    'BF-DOC-01-013',
    'sales_billing',
    1,
    'SEZ Zero-Rated Tax Invoice',
    'Tax invoice for supply to Special Economic Zone developer or unit with or without payment of IGST.',
    'CBIC CGST Act Section 16 of IGST Act',
    'class_a_financial',
    'SOURCE_REVIEWED',
    ['gst_corporate', 'standard'],
    88,
    ['SEZ Supply Invoice', 'Zero-Rated Invoice']
  ),
  makeEntry(
    'BF-DOC-01-014',
    'sales_billing',
    1,
    'Export Commercial Tax Invoice',
    'Invoice for cross-border export of goods or services under Letter of Undertaking (LUT) or with IGST refund.',
    'DGFT Foreign Trade Policy & Customs Act Section 14',
    'class_a_financial',
    'SOURCE_REVIEWED',
    ['gst_corporate', 'gst_supply_chain'],
    88,
    ['LUT Export Invoice', 'Export Bill']
  ),
  makeEntry(
    'BF-DOC-01-015',
    'sales_billing',
    1,
    'Job Work Service Invoice',
    'Billing for subcontracted processing, machining, or fabrication on raw materials supplied by principal.',
    'CBIC CGST Act Section 143',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['gst_ledger', 'standard'],
    90,
    ['Job Work Bill', 'Processing Charges Invoice']
  ),
  makeEntry(
    'BF-DOC-01-016',
    'sales_billing',
    1,
    'Retainer Fee Invoice',
    'Recurring fixed-interval invoice for ongoing legal, advisory, architectural, or technical retainer engagements.',
    'Consulting Services Standards',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['gst_executive', 'minimal'],
    92,
    ['Monthly Retainer Bill', 'Advisory Invoice']
  ),
  makeEntry(
    'BF-DOC-01-017',
    'sales_billing',
    1,
    'Milestone Progress Billing Invoice',
    'Progressive claim invoice tied to contractual milestones, stage sign-offs, and percentage completion.',
    'AIA G702 / Construction Industry Practice',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['gst_corporate', 'standard'],
    91,
    ['Progress Claim', 'Stage Invoice']
  ),
  makeEntry(
    'BF-DOC-01-018',
    'sales_billing',
    1,
    'Timesheet & Hours Billing Invoice',
    'Service invoice itemizing consultant/developer hours, billable rates, and date-wise activity summaries.',
    'Time & Materials Professional Standard',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['gst_executive', 'standard'],
    91,
    ['Hourly Invoice', 'Consultant Timesheet Bill']
  ),
  makeEntry(
    'BF-DOC-01-019',
    'sales_billing',
    1,
    'Utility & Service Rebill Memo',
    'Pass-through reimbursement debit memo for shared electricity, internet, maintenance, or incidental expenses.',
    'Commercial Lease Accounting Standards',
    'class_a_financial',
    'RESEARCH_ONLY',
    ['standard'],
    80,
    ['Expense Rebill', 'Pass-Through Memo']
  ),
  makeEntry(
    'BF-DOC-01-020',
    'sales_billing',
    1,
    'Input Service Distributor (ISD) Invoice',
    'Statutory tax document used by an ISD office to distribute common CGST, SGST, and IGST credits to branches.',
    'CBIC CGST Rules 2017, Rule 54(1)',
    'class_a_financial',
    'RESEARCH_ONLY',
    ['gst_corporate'],
    82,
    ['ISD Credit Transfer Invoice']
  ),
  makeEntry(
    'BF-DOC-01-021',
    'sales_billing',
    1,
    'Consignment Sale Summary Statement',
    'Statement reconciling goods delivered on consignment, units sold, agent commission deducted, and net proceeds due.',
    'Commercial Consignment Sales Law',
    'class_a_financial',
    'RESEARCH_ONLY',
    ['standard'],
    80,
    ['Account Sales Statement', 'Consignment Settlement']
  ),

  // ── CATEGORY 02: QUOTATIONS, ESTIMATES & TENDERS (18 Entries) ──
  makeEntry(
    'BF-DOC-02-001',
    'quotations_estimates',
    2,
    'Formal Price Quotation',
    'Commercial offer detailing pricing, line-item scope, tax rates, payment terms, and validity period.',
    'Contract Law & Commercial Quotation Convention',
    'class_a_financial',
    'RELEASE_READY',
    ['standard', 'modern', 'minimal'],
    95,
    ['Sales Quotation', 'Price Quote', 'Commercial Quote']
  ),
  makeEntry(
    'BF-DOC-02-002',
    'quotations_estimates',
    2,
    'Project Cost Estimate',
    'Preliminary projection of labor, materials, subcontractor fees, and contingency margins for a proposed project.',
    'Project Management Accounting Standards',
    'class_a_financial',
    'RELEASE_READY',
    ['standard', 'modern'],
    94,
    ['Cost Estimate', 'Budgetary Quote']
  ),
  makeEntry(
    'BF-DOC-02-003',
    'quotations_estimates',
    2,
    'Request for Quotation (RFQ)',
    'Formal inquiry sent to vendors inviting competitive bids for goods, supplies, or subcontracted services.',
    'Standard Procurement Guidelines',
    'class_b_administrative',
    'PDF_TESTED',
    ['work_order', 'standard'],
    92,
    ['Tender RFQ', 'Vendor Price Request']
  ),
  makeEntry(
    'BF-DOC-02-004',
    'quotations_estimates',
    2,
    'Rate Contract / Master Price Agreement',
    'Long-term fixed pricing schedule agreed between buyer and supplier for repeat replenishment orders.',
    'Commercial Supply Contracting',
    'class_b_administrative',
    'SCHEMA_VALIDATED',
    ['standard'],
    88,
    ['Annual Rate Contract', 'Fixed Price Agreement']
  ),
  makeEntry(
    'BF-DOC-02-005',
    'quotations_estimates',
    2,
    'Bill of Quantities (BOQ)',
    'Itemized list of materials, parts, and labor with unit rates and quantities used in construction and engineering bids.',
    'FIDIC Civil Engineering Standard',
    'class_a_financial',
    'SCHEMA_VALIDATED',
    ['gst_ledger', 'standard'],
    90,
    ['BOQ Schedule', 'Quantity Takeoff']
  ),

  // ── CATEGORY 03: PROCUREMENT & PURCHASING (20 Entries) ──
  makeEntry(
    'BF-DOC-03-001',
    'procurement_purchasing',
    3,
    'Standard Purchase Order',
    'Legally binding buyer authorization issued to a vendor committing to purchase specified items at stated prices.',
    'UBL 2.4 Procurement Standard & UN/EDIFACT',
    'class_a_financial',
    'RELEASE_READY',
    ['purchase_order', 'standard', 'minimal'],
    96,
    ['PO', 'Vendor Purchase Order', 'Commercial PO']
  ),
  makeEntry(
    'BF-DOC-03-002',
    'procurement_purchasing',
    3,
    'Goods Received Note (GRN)',
    'Warehouse receipt acknowledging receipt of goods delivered by a carrier or supplier, noting accepted/rejected units.',
    'Warehouse & Supply Chain Standards',
    'class_b_administrative',
    'RELEASE_READY',
    ['gold_master', 'standard'],
    95,
    ['GRN', 'Stores Inward Receipt', 'Receiving Slip']
  ),
  makeEntry(
    'BF-DOC-03-003',
    'procurement_purchasing',
    3,
    'Purchase Requisition Slip',
    'Internal department request for the purchasing team to procure equipment, services, or office materials.',
    'Corporate Internal Control Standards',
    'class_b_administrative',
    'PDF_TESTED',
    ['work_order', 'standard'],
    92,
    ['Internal Requisition', 'Indent Form']
  ),

  // ── CATEGORY 04: HR & RECRUITMENT (18 Entries) ──
  makeEntry(
    'BF-DOC-04-001',
    'hr_recruitment',
    4,
    'Job Offer Letter',
    'Formal employment offer detailing designation, total CTC breakdown, start date, and candidate acceptance covenant.',
    'Ministry of Labour / Corporate Employment Convention',
    'class_b_administrative',
    'RELEASE_READY',
    ['job_offer_letter', 'letterhead', 'gold_master'],
    97,
    ['Offer of Employment', 'Formal Job Offer']
  ),
  makeEntry(
    'BF-DOC-04-002',
    'hr_recruitment',
    4,
    'Internship Agreement & Offer',
    'Formal learning engagement document outlining stipend, mentor, deliverables, duration, and IP assignment.',
    'Academic & Apprenticeship Guidelines',
    'class_b_administrative',
    'PDF_TESTED',
    ['job_offer_letter', 'standard'],
    93,
    ['Internship Offer', 'Trainee Agreement']
  ),
  makeEntry(
    'BF-DOC-04-003',
    'hr_recruitment',
    4,
    'Employee Non-Disclosure Agreement (NDA)',
    'Unilateral or mutual confidentiality covenant protecting proprietary trade secrets, customer data, and code.',
    'Indian Contract Act Section 27 / Global IP Law',
    'class_b_administrative',
    'PDF_TESTED',
    ['letterhead', 'standard'],
    94,
    ['Employee Confidentiality Agreement', 'Proprietary NDA']
  ),

  // ── CATEGORY 05: PAYROLL, EMPLOYEE RECORDS & BENEFITS (22 Entries) ──
  makeEntry(
    'BF-DOC-05-001',
    'payroll_employment',
    5,
    'Monthly Salary Slip / Payslip',
    'Itemized earnings (Basic, HRA, DA) and statutory deductions (PF, ESI, TDS, PT) compliant with Indian Payment of Wages Act.',
    'Payment of Wages Act 1936 & Code on Wages 2019',
    'class_b_administrative',
    'RELEASE_READY',
    ['gold_master', 'standard', 'compact'],
    98,
    ['Pay Slip', 'Salary Voucher', 'Wage Slip']
  ),
  makeEntry(
    'BF-DOC-05-002',
    'payroll_employment',
    5,
    'Formal Appointment Letter',
    'Authoritative employment covenant confirming permanent appointment after background verification or probation.',
    'Industrial Employment (Standing Orders) Act 1946',
    'class_b_administrative',
    'RELEASE_READY',
    ['job_offer_letter', 'letterhead'],
    95,
    ['Letter of Appointment', 'Confirmation Letter']
  ),
  makeEntry(
    'BF-DOC-05-003',
    'payroll_employment',
    5,
    'Relieving Letter & Work Experience Certificate',
    'Formal departure documentation certifying tenure, conduct, final designation, and release of responsibilities.',
    'Labour Employment Standards & Conventions',
    'class_b_administrative',
    'RELEASE_READY',
    ['letterhead', 'gold_master'],
    96,
    ['Experience Certificate', 'Service Certificate', 'Relieving Order']
  ),

  // ── CATEGORY 06: EXECUTIVE & FORMAL CORPORATE LETTERS (20 Entries) ──
  makeEntry(
    'BF-DOC-06-001',
    'corporate_letters',
    6,
    'Executive Letterhead Document',
    'General corporate correspondence on registered organization letterhead with ref number, date, and signatory.',
    'Companies Act 2013 Corporate Correspondence Norms',
    'class_b_administrative',
    'RELEASE_READY',
    ['letterhead', 'standard'],
    96,
    ['Official Letter', 'Corporate Notice', 'Formal Letter']
  ),
  makeEntry(
    'BF-DOC-06-002',
    'corporate_letters',
    6,
    'Board Meeting Minutes',
    'Official statutory record of directors meeting proceedings, quorums, resolutions passed, and chairperson sign-off.',
    'Secretarial Standard on Meetings of Board (SS-1)',
    'class_b_administrative',
    'RELEASE_READY',
    ['gold_master', 'standard'],
    95,
    ['Minutes of Board Meeting', 'Board Resolutions Record']
  ),

  // ── CATEGORY 07: BANKING, TREASURY & ACCOUNTING (18 Entries) ──
  makeEntry(
    'BF-DOC-07-001',
    'banking_accounting',
    7,
    'Customer Statement of Account',
    'Detailed chronological summary of invoices, payments received, credit notes, and outstanding balance for a customer.',
    'Double-Entry Accounting & Ledger Reconciliation',
    'class_a_financial',
    'RELEASE_READY',
    ['gold_master', 'standard'],
    97,
    ['Customer Ledger Statement', 'Account Statement', 'AR Statement']
  ),

  // ── CATEGORY 11: FIELD SERVICE & MAINTENANCE (18 Entries) ──
  makeEntry(
    'BF-DOC-11-001',
    'field_service',
    11,
    'Field Engineering Work Order',
    'Operational task assignment detailing client site, equipment model, fault diagnosis, replaced parts, and customer sign-off.',
    'Field Service Operations & Quality Norms',
    'class_b_administrative',
    'RELEASE_READY',
    ['work_order', 'standard'],
    97,
    ['Job Sheet', 'Service Ticket', 'Field Work Order']
  ),

  // ── CATEGORY 13: PROPERTY MANAGEMENT & LEASING (18 Entries) ──
  makeEntry(
    'BF-DOC-13-001',
    'property_leasing',
    13,
    'House / Commercial Rent Receipt',
    'Landlord receipt acknowledging monthly rent received, applicable TDS deduction, and landlord PAN for HRA exemption claims.',
    'Income Tax Act 1961 Section 10(13A) (HRA Exemption)',
    'class_a_financial',
    'RELEASE_READY',
    ['gold_master', 'receipt', 'standard'],
    98,
    ['House Rent Receipt', 'HRA Rent Receipt', 'Monthly Rent Voucher']
  ),

  // ── CATEGORY 14: EDUCATION & ACADEMIES (18 Entries) ──
  makeEntry(
    'BF-DOC-14-001',
    'education_training',
    14,
    'Student Tuition & Fee Receipt',
    'Educational institution receipt itemizing tuition, examination, library, and development fees with student roll number.',
    'National Education Regulations & Trust Accounting',
    'class_a_financial',
    'RELEASE_READY',
    ['gold_master', 'receipt'],
    97,
    ['School Fee Receipt', 'College Tuition Bill', 'Course Fee Receipt']
  ),

  // ── CATEGORY 23: FACILITIES & WORKPLACE ADMIN (16 Entries) ──
  makeEntry(
    'BF-DOC-23-001',
    'facilities_security',
    23,
    'Company Asset & Equipment Responsibility Handover',
    'Custody acknowledgement form documenting laptops, access keys, SIMs, or vehicles issued to personnel with condition notes.',
    'Internal Corporate Asset Security Standards',
    'class_b_administrative',
    'RELEASE_READY',
    ['gold_master', 'standard'],
    96,
    ['Asset Handover Form', 'Laptop Custody Acknowledgement']
  ),
];

/**
 * Builds the complete 446 candidate document catalogue.
 * Preserves all rich curated entries and deterministically generates candidate entries
 * with stable IDs (BF-DOC-XX-YYY) in strict RESEARCH_ONLY lifecycle state for all remaining slots.
 */
function buildFullCatalogue(): readonly CatalogueDocumentEntry[] {
  const map = new Map<string, CatalogueDocumentEntry>();
  for (const entry of CURATED_CATALOGUE_ENTRIES) {
    map.set(entry.id, entry);
  }

  const all: CatalogueDocumentEntry[] = [];
  for (const cat of CATALOGUE_CATEGORIES) {
    const catPrefix = cat.categoryIndex.toString().padStart(2, '0');
    for (let i = 1; i <= cat.totalDocuments; i++) {
      const docSuffix = i.toString().padStart(3, '0');
      const id = `BF-DOC-${catPrefix}-${docSuffix}`;
      const existing = map.get(id);
      if (existing) {
        all.push(existing);
      } else {
        all.push({
          id,
          categoryKey: cat.code,
          categoryIndex: cat.categoryIndex,
          canonicalName: `${cat.title} Candidate #${i}`,
          aliases: [],
          businessPurpose: `Statutory and commercial candidate template under ${cat.title}. Currently under research provenance.`,
          regulatorySource: undefined,
          legalJurisdiction: 'GLOBAL',
          documentClass: 'class_b_administrative',
          lifecycleStatus: 'RESEARCH_ONLY',
          availableLayoutCount: 1,
          defaultLayoutCode: 'standard',
          supportedLayoutCodes: ['standard'],
          designQualityScore: 80,
          isReleaseReady: false,
        });
      }
    }
  }
  return Object.freeze(all);
}

/**
 * Authoritative 446-document catalogue registry
 */
export const CATALOGUE_446_ENTRIES: readonly CatalogueDocumentEntry[] = buildFullCatalogue();

/**
 * Accessor methods for the 446 catalogue system
 */
export class Catalogue446Registry {
  /**
   * Retrieves all 25 categories
   */
  static getCategories(): readonly CatalogueCategoryDefinition[] {
    return CATALOGUE_CATEGORIES;
  }

  /**
   * Retrieves a category by code or index
   */
  static getCategory(identifier: string | number): CatalogueCategoryDefinition | undefined {
    if (typeof identifier === 'number') {
      return CATALOGUE_CATEGORIES.find((c) => c.categoryIndex === identifier);
    }
    return CATALOGUE_CATEGORIES.find((c) => c.code === identifier || c.id === identifier);
  }

  /**
   * Retrieves all tracked document entries
   */
  static getAllEntries(): readonly CatalogueDocumentEntry[] {
    return CATALOGUE_446_ENTRIES;
  }

  /**
   * Retrieves document by stable ID (e.g. 'BF-DOC-01-002')
   */
  static getEntryById(id: string): CatalogueDocumentEntry | undefined {
    return CATALOGUE_446_ENTRIES.find((e) => e.id.toLowerCase() === id.toLowerCase());
  }

  /**
   * Retrieves all documents belonging to a category
   */
  static getEntriesByCategory(categoryKey: CatalogueCategoryKey): readonly CatalogueDocumentEntry[] {
    return CATALOGUE_446_ENTRIES.filter((e) => e.categoryKey === categoryKey);
  }

  /**
   * Searches documents by term across name, aliases, purpose, or regulatory source
   */
  static searchEntries(query: string): readonly CatalogueDocumentEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOGUE_446_ENTRIES;
    return CATALOGUE_446_ENTRIES.filter((e) => {
      return (
        e.id.toLowerCase().includes(q) ||
        e.canonicalName.toLowerCase().includes(q) ||
        e.businessPurpose.toLowerCase().includes(q) ||
        (e.regulatorySource && e.regulatorySource.toLowerCase().includes(q)) ||
        e.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Retrieves only release-ready documents
   */
  static getReleaseReadyEntries(): readonly CatalogueDocumentEntry[] {
    return CATALOGUE_446_ENTRIES.filter((e) => e.isReleaseReady);
  }
}

export const CatalogueRegistry446 = Catalogue446Registry;
export type CatalogueRegistry446 = Catalogue446Registry;

