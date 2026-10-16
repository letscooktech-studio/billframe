/**
 * ORGANIZATION PACK REGISTRY — BILLFRAME UNIVERSAL ENGINE
 * 
 * 26 Purpose-Built Organization Packs across 6 Major Industry Sectors:
 * - Commerce (5 packs): Retail, E-Commerce, Wholesale, Exim, Microbusinesses
 * - Operations (6 packs): Manufacturing, Construction, Warehousing, Repair, Fleet, Agri-Trade
 * - Professional Services (5 packs): Consultancies, Digital Agencies, Freelancers, Studios, Events
 * - Administration (3 packs): Corporate Enterprises, HR/Staffing, Procurement
 * - Institutions & Community (5 packs): Schools, Academies, Healthcare, Non-Profits, Real Estate
 * - Food & Hospitality (2 packs): Restaurants/Catering, Hotels/Travel
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Organization packs DO NOT duplicate document definitions or financial calculators.
 * A GST Tax Invoice remains ONE controlled statutory definition whether recommended to
 * a retailer, manufacturer, distributor, clinic, or consulting agency.
 */

export type OrganizationSector =
  | 'commerce'
  | 'operations'
  | 'professional_services'
  | 'administration'
  | 'institutions'
  | 'food_hospitality';

export interface OrganizationPackDefinition {
  readonly id: string;
  readonly name: string;
  readonly sector: OrganizationSector;
  readonly sectorLabel: string;
  readonly description: string;
  readonly icon: string;
  readonly primaryDocId: string;
  readonly primaryFamily: string;
  readonly recommendedDocIds: readonly string[];
  readonly workflowIds: readonly string[];
  readonly statutoryNotes: string;
  readonly samplePartyType: string;
}

export const SECTOR_DEFINITIONS: { id: OrganizationSector; label: string; description: string }[] = [
  { id: 'commerce', label: 'Commerce & Trade', description: 'Retail shops, e-commerce sellers, wholesale distributors, and exim traders' },
  { id: 'operations', label: 'Operations & Industry', description: 'Manufacturing, construction, logistics, maintenance, fleet, and agriculture' },
  { id: 'professional_services', label: 'Professional Services', description: 'Consultancies, digital agencies, solo creators, studios, and event production' },
  { id: 'administration', label: 'Corporate Administration', description: 'Headquarters, enterprise HR, staffing, and corporate procurement' },
  { id: 'institutions', label: 'Institutions & Community', description: 'Schools, coaching academies, healthcare clinics, NGOs, and property firms' },
  { id: 'food_hospitality', label: 'Food & Hospitality', description: 'Restaurants, cafes, cloud kitchens, catering, hotels, and travel tour operators' },
];

export const ORGANIZATION_PACKS: readonly OrganizationPackDefinition[] = [
  // ── 1. COMMERCE & TRADE (5 Packs) ──
  {
    id: 'retail_shops',
    name: 'Retail Shops & General Stores',
    sector: 'commerce',
    sectorLabel: 'Commerce & Trade',
    description: 'Over-the-counter retail billing, point-of-sale checkout, customer sales returns, and cash receipts.',
    icon: 'store',
    primaryDocId: 'pos_receipt',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'pos_receipt',
      'cash_bill',
      'tax_invoice',
      'bill_of_supply',
      'sales_return_note',
      'credit_note',
      'purchase_order',
      'receipt',
    ],
    workflowIds: ['quote_to_cash', 'sales_return_reconciliation'],
    statutoryNotes: 'Supports CBIC GST Rule 46 retail invoices and Rule 49 composition bills with HSN barcode scanning.',
    samplePartyType: 'Walk-in Retail Shopper',
  },
  {
    id: 'ecommerce_sellers',
    name: 'E-Commerce & Marketplace Sellers',
    sector: 'commerce',
    sectorLabel: 'Commerce & Trade',
    description: 'Online direct-to-consumer orders, marketplace settlement tallies, automated tax invoices, and shipping packing lists.',
    icon: 'shopping-bag',
    primaryDocId: 'tax_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'tax_invoice',
      'packing_list',
      'delivery_challan',
      'credit_note',
      'sales_return_note',
      'customer_statement',
      'receipt',
    ],
    workflowIds: ['quote_to_cash', 'sales_return_reconciliation'],
    statutoryNotes: 'Integrated GST TCS / TDS compliance with interstate IGST determination and marketplace order IDs.',
    samplePartyType: 'Online Marketplace Buyer',
  },
  {
    id: 'wholesale_distributors',
    name: 'Wholesale Distributors & Stockists',
    sector: 'commerce',
    sectorLabel: 'Commerce & Trade',
    description: 'High-volume B2B distribution invoices, dealer price lists, delivery challans, and trade credit adjustments.',
    icon: 'truck',
    primaryDocId: 'tax_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'tax_invoice',
      'sales_order',
      'delivery_challan',
      'packing_list',
      'credit_note',
      'debit_note',
      'customer_statement',
      'invoice_aging_report',
      'purchase_order',
    ],
    workflowIds: ['quote_to_cash', 'procure_to_pay', 'sales_return_reconciliation'],
    statutoryNotes: 'Strict Rule 46 compliance with e-Way Bill thresholds, HSN 4/6-digit mandates, and buyer GSTIN ledger reconciliation.',
    samplePartyType: 'Authorized Regional Dealer',
  },
  {
    id: 'exporters_importers',
    name: 'Exporters & Importers (Exim)',
    sector: 'commerce',
    sectorLabel: 'Commerce & Trade',
    description: 'Cross-border trade invoices under LUT, multi-currency pricing, Incoterms® 2020, and ocean freight packing lists.',
    icon: 'globe',
    primaryDocId: 'export_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'export_invoice',
      'proforma',
      'packing_list',
      'commercial_invoice',
      'purchase_order',
      'receipt',
      'nda_agreement',
    ],
    workflowIds: ['import_customs_clearance', 'quote_to_cash'],
    statutoryNotes: 'DGFT / FEMA 1999 compliant zero-rated export billing under Letter of Undertaking (LUT) with foreign bank wire.',
    samplePartyType: 'Overseas Importer / Consignee',
  },
  {
    id: 'microbusinesses',
    name: 'Microbusinesses & Solo Traders',
    sector: 'commerce',
    sectorLabel: 'Commerce & Trade',
    description: 'Ultra-lightweight estimates, cash bills, simple payment receipts, and instant QR-enabled counter checkout.',
    icon: 'zap',
    primaryDocId: 'cash_bill',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'cash_bill',
      'estimate',
      'receipt',
      'bill_of_supply',
      'tax_invoice',
      'payment_voucher',
    ],
    workflowIds: ['quote_to_cash'],
    statutoryNotes: 'Tailored for small unorganized enterprises exempt under threshold limits or registered under Composition Levy.',
    samplePartyType: 'Local Client / Counter Buyer',
  },

  // ── 2. OPERATIONS & INDUSTRY (6 Packs) ──
  {
    id: 'manufacturing_plants',
    name: 'Manufacturing & Industrial Units',
    sector: 'operations',
    sectorLabel: 'Operations & Industry',
    description: 'Production orders, bills of materials (BOM), raw material purchase orders, QA certificates, and dispatch challans.',
    icon: 'factory',
    primaryDocId: 'delivery_challan',
    primaryFamily: 'inventory_logistics',
    recommendedDocIds: [
      'tax_invoice',
      'delivery_challan',
      'purchase_order',
      'goods_received_note',
      'sales_order',
      'packing_list',
      'site_inspection',
      'salary_slip',
    ],
    workflowIds: ['manufacture_to_dispatch', 'procure_to_pay', 'quote_to_cash'],
    statutoryNotes: 'ISO 9001 quality audit integration, Job Work Rule 55 movement, and central excise/GST tax point verification.',
    samplePartyType: 'Industrial Supply Chain Partner',
  },
  {
    id: 'construction_contractors',
    name: 'Construction Contractors & Builders',
    sector: 'operations',
    sectorLabel: 'Operations & Industry',
    description: 'Running account (RA) bills, milestone progress certificates, contractor work orders, site inspection sheets, and material transfers.',
    icon: 'hammer',
    primaryDocId: 'progress_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'progress_invoice',
      'milestone_invoice',
      'work_order',
      'tax_invoice',
      'purchase_order',
      'goods_received_note',
      'site_inspection',
      'delivery_challan',
    ],
    workflowIds: ['contract_progress_billing', 'procure_to_pay', 'safety_field_audit'],
    statutoryNotes: 'AIA G702 / G703 format alignment, works contract GST rules (SAC 9954), TDS withholding, and labour cess compliance.',
    samplePartyType: 'Project Developer / Site Owner',
  },
  {
    id: 'warehousing_logistics',
    name: 'Warehousing & 3PL Logistics',
    sector: 'operations',
    sectorLabel: 'Operations & Industry',
    description: 'Inward gate inspection notes (GRN), pallet manifest lists, inter-depot transfer challans, and storage service bills.',
    icon: 'package',
    primaryDocId: 'goods_received_note',
    primaryFamily: 'inventory_logistics',
    recommendedDocIds: [
      'goods_received_note',
      'packing_list',
      'delivery_challan',
      'tax_invoice',
      'purchase_order',
      'equipment_handover',
      'site_inspection',
    ],
    workflowIds: ['procure_to_pay', 'manufacture_to_dispatch'],
    statutoryNotes: 'Warehouse receipt custody standards, carrier LR cross-referencing, and transit damage claim logs.',
    samplePartyType: 'Consignor / Cargo Consignee',
  },
  {
    id: 'repair_maintenance',
    name: 'Repair & Engineering Workshops',
    sector: 'operations',
    sectorLabel: 'Operations & Industry',
    description: 'Customer service intake job cards, spare parts billing, labor charge invoices, and maintenance sign-off slips.',
    icon: 'wrench',
    primaryDocId: 'work_order',
    primaryFamily: 'service_projects',
    recommendedDocIds: [
      'work_order',
      'service_invoice',
      'tax_invoice',
      'estimate',
      'receipt',
      'goods_received_note',
      'equipment_handover',
    ],
    workflowIds: ['service_intake_to_bill', 'quote_to_cash'],
    statutoryNotes: 'Mixed supply rules distinguishing goods (spare parts) from services (labor) with differential GST tax rates.',
    samplePartyType: 'Service Client / Equipment Owner',
  },
  {
    id: 'fleet_transport',
    name: 'Fleet, Freight & Transport Operators',
    sector: 'operations',
    sectorLabel: 'Operations & Industry',
    description: 'Consignment notes (LR), vehicle trip sheets, toll vouchers, freight billing under GTA reverse charge, and driver expense records.',
    icon: 'navigation',
    primaryDocId: 'delivery_challan',
    primaryFamily: 'logistics_transport',
    recommendedDocIds: [
      'delivery_challan',
      'tax_invoice',
      'service_invoice',
      'payment_voucher',
      'site_inspection',
      'salary_slip',
    ],
    workflowIds: ['quote_to_cash', 'safety_field_audit'],
    statutoryNotes: 'Goods Transport Agency (GTA) reverse charge (RCM) notifications under Section 9(3) and e-Way Bill consignment rules.',
    samplePartyType: 'Corporate Shipper / Freight Client',
  },
  {
    id: 'agri_trade',
    name: 'Agricultural Produce & Mandi Traders',
    sector: 'operations',
    sectorLabel: 'Operations & Industry',
    description: 'Mandi auction sale slips, farmer procurement receipts, grain packing manifests, commission agent notes, and transport permits.',
    icon: 'wheat',
    primaryDocId: 'bill_of_supply',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'bill_of_supply',
      'cash_bill',
      'delivery_challan',
      'payment_voucher',
      'goods_received_note',
      'receipt',
    ],
    workflowIds: ['procure_to_pay', 'quote_to_cash'],
    statutoryNotes: 'Exempt agricultural commodities documentation, APMC mandi cess tracking, and reverse charge farmer payments.',
    samplePartyType: 'Farmer Producer / Mandi Merchant',
  },

  // ── 3. PROFESSIONAL SERVICES (5 Packs) ──
  {
    id: 'management_consultancies',
    name: 'Management & Tax Consultancies',
    sector: 'professional_services',
    sectorLabel: 'Professional Services',
    description: 'Professional engagement letters, fixed-retainer fee invoices, NDAs, project milestone reports, and audit certificates.',
    icon: 'briefcase',
    primaryDocId: 'service_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'service_invoice',
      'recurring_invoice',
      'estimate',
      'nda_agreement',
      'meeting_minutes',
      'work_order',
      'receipt',
    ],
    workflowIds: ['quote_to_cash', 'corporate_board_governance'],
    statutoryNotes: 'Service Accounting Code (SAC 9983) consulting rules, statutory 10% TDS (Section 194J) deduction records, and client NDAs.',
    samplePartyType: 'Corporate Advisory Client',
  },
  {
    id: 'digital_software_agencies',
    name: 'Digital, Software & IT Agencies',
    sector: 'professional_services',
    sectorLabel: 'Professional Services',
    description: 'Sprint statements of work (SOW), SaaS subscription bills, developer time & materials invoices, intellectual property agreements, and SLAs.',
    icon: 'code',
    primaryDocId: 'service_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'service_invoice',
      'work_order',
      'milestone_invoice',
      'proforma',
      'export_invoice',
      'nda_agreement',
      'equipment_handover',
      'salary_slip',
    ],
    workflowIds: ['quote_to_cash', 'asset_allocation_custody', 'hire_to_retire'],
    statutoryNotes: 'Export of services compliance under Section 2(6) of IGST Act with foreign remittance (FIRC) tracking.',
    samplePartyType: 'Tech Client / Enterprise Product Team',
  },
  {
    id: 'freelancers_creators',
    name: 'Freelancers & Solo Creators',
    sector: 'professional_services',
    sectorLabel: 'Professional Services',
    description: 'Quick project cost estimates, milestone contracts, simple professional invoices, payment acknowledgments, and client NDAs.',
    icon: 'user',
    primaryDocId: 'service_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'service_invoice',
      'estimate',
      'receipt',
      'nda_agreement',
      'proforma',
      'rent_receipt',
    ],
    workflowIds: ['quote_to_cash'],
    statutoryNotes: 'Streamlined invoicing under 44ADA presumptive taxation with PAN declaration and direct UPI payment links.',
    samplePartyType: 'Independent Client / Project Owner',
  },
  {
    id: 'creative_studios',
    name: 'Creative Studios & Media Houses',
    sector: 'professional_services',
    sectorLabel: 'Professional Services',
    description: 'Commercial shoot estimates, equipment rental custody memos, copyright licensing invoices, call sheets, and model release forms.',
    icon: 'camera',
    primaryDocId: 'estimate',
    primaryFamily: 'proposals_quotations',
    recommendedDocIds: [
      'estimate',
      'service_invoice',
      'work_order',
      'equipment_handover',
      'nda_agreement',
      'receipt',
      'payment_voucher',
    ],
    workflowIds: ['quote_to_cash', 'asset_allocation_custody'],
    statutoryNotes: 'Commercial copyright transfer covenants, equipment sub-hire custody agreements, and day-rate milestone billing.',
    samplePartyType: 'Brand Producer / Agency Creative Director',
  },
  {
    id: 'event_production',
    name: 'Event Management & Production',
    sector: 'professional_services',
    sectorLabel: 'Professional Services',
    description: 'Event production contracts, vendor purchase orders, venue logistics challans, client milestone invoices, and artist payment vouchers.',
    icon: 'calendar',
    primaryDocId: 'milestone_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'milestone_invoice',
      'estimate',
      'work_order',
      'purchase_order',
      'delivery_challan',
      'payment_voucher',
      'receipt',
    ],
    workflowIds: ['quote_to_cash', 'procure_to_pay'],
    statutoryNotes: 'Comprehensive event stage billing with venue permission attachments, artist TDS (194J/194C), and equipment insurance.',
    samplePartyType: 'Event Sponsor / Corporate Client',
  },

  // ── 4. CORPORATE ADMINISTRATION (3 Packs) ──
  {
    id: 'corporate_enterprises',
    name: 'Corporate Enterprises & Multi-Branch',
    sector: 'administration',
    sectorLabel: 'Corporate Administration',
    description: 'Multi-branch GST invoices, ICSI SS-1 meeting minutes, formal board resolutions, customer account aging ledgers, and audit signoffs.',
    icon: 'building-2',
    primaryDocId: 'tax_invoice',
    primaryFamily: 'sales_billing',
    recommendedDocIds: [
      'tax_invoice',
      'credit_note',
      'debit_note',
      'customer_statement',
      'invoice_aging_report',
      'meeting_minutes',
      'nda_agreement',
      'job_offer',
      'salary_slip',
    ],
    workflowIds: ['quote_to_cash', 'corporate_board_governance', 'hire_to_retire'],
    statutoryNotes: 'Companies Act 2013 secretarial standards (SS-1/SS-2), GST Rule 46 cross-charge between distinct persons, and statutory audit readiness.',
    samplePartyType: 'Corporate Business Customer',
  },
  {
    id: 'hr_staffing_agencies',
    name: 'HR & Staffing Agencies',
    sector: 'administration',
    sectorLabel: 'Corporate Administration',
    description: 'Candidate job offer letters, employment contracts, monthly payslips with PF/ESI/TDS, service relieving certificates, and client recruitment billing.',
    icon: 'users',
    primaryDocId: 'job_offer',
    primaryFamily: 'hr_recruitment',
    recommendedDocIds: [
      'job_offer',
      'salary_slip',
      'experience_cert',
      'service_invoice',
      'equipment_handover',
      'nda_agreement',
      'receipt',
    ],
    workflowIds: ['hire_to_retire', 'quote_to_cash'],
    statutoryNotes: 'Payment of Wages Act 1936, Employees Provident Fund (EPF), ESI Act, and Indian Contract Act employment standards.',
    samplePartyType: 'Selected Candidate / Corporate Client',
  },
  {
    id: 'procurement_departments',
    name: 'Corporate Procurement & Sourcing',
    sector: 'administration',
    sectorLabel: 'Corporate Administration',
    description: 'Vendor purchase orders, quotation comparative sheets, inward goods notes (GRN), vendor evaluation reports, and debit adjustments.',
    icon: 'clipboard-list',
    primaryDocId: 'purchase_order',
    primaryFamily: 'procurement_suppliers',
    recommendedDocIds: [
      'purchase_order',
      'goods_received_note',
      'debit_note',
      'payment_voucher',
      'site_inspection',
      'work_order',
    ],
    workflowIds: ['procure_to_pay', 'vendor_rate_escalation'],
    statutoryNotes: 'Three-way matching (PO vs GRN vs Tax Invoice) with Section 16(2) GST input tax credit (ITC) eligibility verification.',
    samplePartyType: 'Approved Vendor / Contracted Supplier',
  },

  // ── 5. INSTITUTIONS & COMMUNITY (5 Packs) ──
  {
    id: 'schools_institutes',
    name: 'Schools & Educational Institutes',
    sector: 'institutions',
    sectorLabel: 'Institutions & Community',
    description: 'Student academic fee receipts, admission letters, bonafide certificates, faculty payroll slips, and annual campus facility contracts.',
    icon: 'graduation-cap',
    primaryDocId: 'student_fee_receipt',
    primaryFamily: 'education_training',
    recommendedDocIds: [
      'student_fee_receipt',
      'salary_slip',
      'job_offer',
      'purchase_order',
      'payment_voucher',
      'site_inspection',
    ],
    workflowIds: ['student_enrollment_to_fee', 'hire_to_retire', 'safety_field_audit'],
    statutoryNotes: 'GST exemption on educational services under Notification No. 12/2017-Central Tax (Rate) with strict fee component classification.',
    samplePartyType: 'Enrolled Student / Parent',
  },
  {
    id: 'training_academies',
    name: 'Training & Skill Academies',
    sector: 'institutions',
    sectorLabel: 'Institutions & Community',
    description: 'Professional course tuition receipts, corporate training invoices, course completion certificates, and trainer engagement contracts.',
    icon: 'award',
    primaryDocId: 'student_fee_receipt',
    primaryFamily: 'education_training',
    recommendedDocIds: [
      'student_fee_receipt',
      'service_invoice',
      'work_order',
      'receipt',
      'nda_agreement',
    ],
    workflowIds: ['student_enrollment_to_fee', 'quote_to_cash'],
    statutoryNotes: 'Commercial coaching services GST applicability (18% SAC 9992) vs exempt vocational training institute verification.',
    samplePartyType: 'Trainee / Corporate Trainee Sponsor',
  },
  {
    id: 'healthcare_clinics',
    name: 'Healthcare Clinics & Diagnostics',
    sector: 'institutions',
    sectorLabel: 'Institutions & Community',
    description: 'Clinical consultation slips, diagnostic lab receipts, pharmacy cash bills, medical consent agreements, and bio-waste audit logs.',
    icon: 'heart-pulse',
    primaryDocId: 'cash_bill',
    primaryFamily: 'healthcare_admin',
    recommendedDocIds: [
      'cash_bill',
      'tax_invoice',
      'receipt',
      'site_inspection',
      'purchase_order',
      'salary_slip',
    ],
    workflowIds: ['safety_field_audit', 'procure_to_pay'],
    statutoryNotes: 'Clinical health services GST exemption status with taxable medicines / composite medical package differentiation.',
    samplePartyType: 'Patient / Healthcare Beneficiary',
  },
  {
    id: 'nonprofits_ngos',
    name: 'Non-Profits, NGOs & Trusts',
    sector: 'institutions',
    sectorLabel: 'Institutions & Community',
    description: 'Section 80G tax-exempt donation receipts, grant utilization certificates, volunteer agreements, and trustee meeting minutes.',
    icon: 'heart',
    primaryDocId: 'receipt',
    primaryFamily: 'finance_accounting',
    recommendedDocIds: [
      'receipt',
      'payment_voucher',
      'meeting_minutes',
      'work_order',
      'purchase_order',
    ],
    workflowIds: ['corporate_board_governance', 'procure_to_pay'],
    statutoryNotes: 'Income Tax Act Section 80G / 12A registered donation receipt formatting with unique registration number (URN) and PAN declaration.',
    samplePartyType: 'Donor / Philanthropic Contributor',
  },
  {
    id: 'property_real_estate',
    name: 'Property & Real Estate Agencies',
    sector: 'institutions',
    sectorLabel: 'Institutions & Community',
    description: 'Residential rent receipts for HRA claims, commercial lease deeds, security deposit receipts, and property maintenance logs.',
    icon: 'building',
    primaryDocId: 'rent_receipt',
    primaryFamily: 'property_realestate',
    recommendedDocIds: [
      'rent_receipt',
      'service_invoice',
      'receipt',
      'customer_statement',
      'nda_agreement',
      'site_inspection',
    ],
    workflowIds: ['tenancy_lifecycle', 'quote_to_cash'],
    statutoryNotes: 'Section 10(13A) IT Act landlord PAN requirement for HRA, state-specific RERA lease guidelines, and security deposit return protocol.',
    samplePartyType: 'Tenant / Lessee / Property Buyer',
  },

  // ── 6. FOOD & HOSPITALITY (2 Packs) ──
  {
    id: 'restaurants_cafes',
    name: 'Restaurants, Cafes & Cloud Kitchens',
    sector: 'food_hospitality',
    sectorLabel: 'Food & Hospitality',
    description: 'Restaurant dining food bills, point-of-sale counter receipts, FSSAI hygiene checklists, vendor raw grocery POs, and banquet catering orders.',
    icon: 'utensils',
    primaryDocId: 'pos_receipt',
    primaryFamily: 'food_businesses',
    recommendedDocIds: [
      'pos_receipt',
      'cash_bill',
      'tax_invoice',
      'purchase_order',
      'goods_received_note',
      'site_inspection',
      'salary_slip',
    ],
    workflowIds: ['safety_field_audit', 'procure_to_pay'],
    statutoryNotes: 'FSSAI License registration display, standalone restaurant 5% GST rate without ITC, and mandatory food temperature audit checks.',
    samplePartyType: 'Dine-In Customer / Catering Host',
  },
  {
    id: 'hotels_travel',
    name: 'Hotels, Homestays & Travel Operators',
    sector: 'food_hospitality',
    sectorLabel: 'Food & Hospitality',
    description: 'Hotel room folio checkout bills, tour package proforma invoices, guest registration records, vehicle booking slips, and advance deposit receipts.',
    icon: 'bed',
    primaryDocId: 'tax_invoice',
    primaryFamily: 'hospitality_travel',
    recommendedDocIds: [
      'tax_invoice',
      'proforma',
      'receipt',
      'advance_invoice',
      'customer_statement',
      'site_inspection',
    ],
    workflowIds: ['quote_to_cash', 'safety_field_audit'],
    statutoryNotes: 'Hotel room tariff slab-based GST rates (0%, 12%, 18%), tour operator margin scheme billing, and guest identity verification.',
    samplePartyType: 'Hotel Guest / Tour Traveler',
  },
];

/**
 * Registry access class for Organization Packs
 */
export class OrganizationPackRegistry {
  static getAllPacks(): readonly OrganizationPackDefinition[] {
    return ORGANIZATION_PACKS;
  }

  static getSectors(): typeof SECTOR_DEFINITIONS {
    return SECTOR_DEFINITIONS;
  }

  static getPackById(id: string): OrganizationPackDefinition | undefined {
    if (!id) return undefined;
    const lower = id.toLowerCase().replace(/[\s-]/g, '_');
    return ORGANIZATION_PACKS.find(
      (p) => p.id.toLowerCase() === lower || p.name.toLowerCase().includes(lower)
    );
  }

  static getPacksBySector(sector: OrganizationSector): OrganizationPackDefinition[] {
    return ORGANIZATION_PACKS.filter((p) => p.sector === sector);
  }

  static getRecommendedDocumentIds(packId: string): readonly string[] {
    const pack = this.getPackById(packId);
    return pack ? pack.recommendedDocIds : [];
  }

  static getPacksRecommendingDocument(docId: string): OrganizationPackDefinition[] {
    const lower = docId.toLowerCase();
    return ORGANIZATION_PACKS.filter((p) =>
      p.recommendedDocIds.some((id) => id.toLowerCase() === lower) ||
      p.primaryDocId.toLowerCase() === lower
    );
  }

  static searchPacks(query: string): OrganizationPackDefinition[] {
    const q = query.trim().toLowerCase();
    if (!q) return [...ORGANIZATION_PACKS];
    return ORGANIZATION_PACKS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sectorLabel.toLowerCase().includes(q) ||
        p.statutoryNotes.toLowerCase().includes(q)
    );
  }
}
