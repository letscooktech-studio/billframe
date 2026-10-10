/**
 * ONBOARDING DOCUMENT PACK RECOMMENDATIONS
 * 
 * Deterministic recommendation engine that pairs user intent and business type
 * with curated document packs from Billframe's universal document catalog.
 * 
 * Guarantees:
 * 1. 100% offline, deterministic scoring and selection.
 * 2. Pre-selects top 3-4 high-value documents by default.
 * 3. Exact route resolution for both Universal Documents (/templates/studio)
 *    and Financial Documents (/document/edit).
 */

import { PrimaryIntent } from '../workspace/AdaptiveWorkspaceEngine';
import { BusinessType } from '../features/FeatureRegistry';

export interface RecommendedDocumentItem {
  id: string;
  code: string;
  title: string;
  category: 'HR & Legal' | 'Financial & Tax' | 'Operations' | 'Governance & Academic';
  description: string;
  editorRoute: string;
  isUniversal: boolean;
  badge: string;
}

export const ALL_ONBOARDING_DOCUMENTS: readonly RecommendedDocumentItem[] = [
  // ── HR & Legal Documents ──
  {
    id: 'job_offer_letter',
    code: 'job_offer_letter',
    title: 'Job Offer Letter',
    category: 'HR & Legal',
    description: 'Formal corporate employment offer detailing CTC compensation, designation, and joining terms.',
    editorRoute: '/templates/studio?typeId=job_offer_letter',
    isUniversal: true,
    badge: 'HR Template',
  },
  {
    id: 'appointment_letter',
    code: 'appointment_letter',
    title: 'Appointment Letter',
    category: 'HR & Legal',
    description: 'Executive appointment letter with probation duration, role specifications, and legal acceptance.',
    editorRoute: '/templates/studio?typeId=appointment_letter',
    isUniversal: true,
    badge: 'Standard Format',
  },
  {
    id: 'salary_slip',
    code: 'salary_slip',
    title: 'Salary Slip / Payslip',
    category: 'HR & Legal',
    description: 'Itemized monthly earnings, deductions, PF, tax withholdings, and net take-home voucher.',
    editorRoute: '/templates/studio?typeId=salary_slip',
    isUniversal: true,
    badge: 'Payroll Slip',
  },
  {
    id: 'experience_certificate',
    code: 'experience_certificate',
    title: 'Experience Certificate',
    category: 'HR & Legal',
    description: 'Official corporate verification of employee service tenure, designation, and ethical conduct.',
    editorRoute: '/templates/studio?typeId=experience_certificate',
    isUniversal: true,
    badge: 'Service Record',
  },
  {
    id: 'internship_letter',
    code: 'internship_letter',
    title: 'Internship Offer Letter',
    category: 'HR & Legal',
    description: 'Talent program engagement offer covering duration, project scope, and monthly stipend.',
    editorRoute: '/templates/studio?typeId=internship_letter',
    isUniversal: true,
    badge: 'Internship',
  },

  // ── Financial & Tax Documents ──
  {
    id: 'tax_invoice',
    code: 'tax_invoice',
    title: 'Standard Tax Invoice',
    category: 'Financial & Tax',
    description: 'GST/VAT compliant commercial billing for products, services, and multi-line disbursements.',
    editorRoute: '/document/edit?type=tax_invoice',
    isUniversal: false,
    badge: 'GST/Tax Format',
  },
  {
    id: 'bill_of_supply',
    code: 'bill_of_supply',
    title: 'Bill of Supply / Exempted Invoice',
    category: 'Financial & Tax',
    description: 'Commercial invoice for composition scheme dealers and tax-exempt goods or supplies.',
    editorRoute: '/document/edit?type=bill_of_supply',
    isUniversal: false,
    badge: 'Exempt Supply',
  },
  {
    id: 'receipt',
    code: 'receipt',
    title: 'Payment Receipt / Cash Voucher',
    category: 'Financial & Tax',
    description: 'Official payment acknowledgment with payment method, invoice reference, and remaining balance.',
    editorRoute: '/document/edit?type=receipt',
    isUniversal: false,
    badge: 'Receipt Voucher',
  },
  {
    id: 'estimate',
    code: 'estimate',
    title: 'Quotation / Cost Estimate',
    category: 'Financial & Tax',
    description: 'Pre-sales proposal and price estimate with line items, validity date, and milestone terms.',
    editorRoute: '/document/edit?type=estimate',
    isUniversal: false,
    badge: 'Estimate / Quote',
  },
  {
    id: 'customer_account_statement',
    code: 'customer_account_statement',
    title: 'Customer Account Statement',
    category: 'Financial & Tax',
    description: 'Comprehensive period statement showing debits, credits, opening balance, and aging analysis.',
    editorRoute: '/templates/studio?typeId=customer_account_statement',
    isUniversal: true,
    badge: 'Account Ledger',
  },

  // ── Operations & Field Documents ──
  {
    id: 'work_order',
    code: 'work_order',
    title: 'Work Order / Service Card',
    category: 'Operations',
    description: 'Field service card with task breakdown, labor hours, material costs, and signoff blocks.',
    editorRoute: '/templates/studio?typeId=work_order',
    isUniversal: true,
    badge: 'Job Card',
  },
  {
    id: 'purchase_order',
    code: 'purchase_order',
    title: 'Purchase Order (PO)',
    category: 'Operations',
    description: 'Formal commercial procurement contract sent to suppliers detailing terms and delivery schedule.',
    editorRoute: '/templates/studio?typeId=purchase_order',
    isUniversal: true,
    badge: 'Purchase Order',
  },
  {
    id: 'delivery_challan',
    code: 'delivery_challan',
    title: 'Delivery Challan (Rule 55)',
    category: 'Operations',
    description: 'Official transport documentation for goods movement, vehicle records, and receiver signoff.',
    editorRoute: '/templates/studio?typeId=delivery_challan',
    isUniversal: true,
    badge: 'Dispatch Note',
  },
  {
    id: 'site_inspection_report',
    code: 'site_inspection_report',
    title: 'Site Inspection Report',
    category: 'Operations',
    description: 'Field inspection checklist covering audit findings, severity ratings, photos, and compliance.',
    editorRoute: '/templates/studio?typeId=site_inspection_report',
    isUniversal: true,
    badge: 'Inspection Log',
  },
  {
    id: 'equipment_responsibility',
    code: 'equipment_responsibility',
    title: 'Equipment Custody Undertaking',
    category: 'Operations',
    description: 'Asset custody record, serial number verification, and borrower condition declaration.',
    editorRoute: '/templates/studio?typeId=equipment_responsibility',
    isUniversal: true,
    badge: 'Custody Form',
  },

  // ── Governance, Letters & Academic ──
  {
    id: 'business_letterhead',
    code: 'business_letterhead',
    title: 'Executive Business Letter',
    category: 'Governance & Academic',
    description: 'Executive corporate letterhead for formal business notices, memorandums, and official decrees.',
    editorRoute: '/templates/studio?typeId=business_letterhead',
    isUniversal: true,
    badge: 'Stationery',
  },
  {
    id: 'meeting_minutes',
    code: 'meeting_minutes',
    title: 'Meeting Minutes & Action Register',
    category: 'Governance & Academic',
    description: 'Board and committee meeting record with attendees, resolutions, and accountability log.',
    editorRoute: '/templates/studio?typeId=meeting_minutes',
    isUniversal: true,
    badge: 'Governance',
  },
  {
    id: 'student_fee_receipt',
    code: 'student_fee_receipt',
    title: 'Student Tuition & Fee Receipt',
    category: 'Governance & Academic',
    description: 'Academic fee receipt detailing tuition, term breakdown, payment mode, and institute clearance.',
    editorRoute: '/templates/studio?typeId=student_fee_receipt',
    isUniversal: true,
    badge: 'Fee Receipt',
  },
  {
    id: 'rent_receipt',
    code: 'rent_receipt',
    title: 'House Rent Receipt',
    category: 'Governance & Academic',
    description: 'Property rent payment receipt with landlord PAN, rental duration, and tax clearance record.',
    editorRoute: '/templates/studio?typeId=rent_receipt',
    isUniversal: true,
    badge: 'Rent Receipt',
  },
];

export interface RecommendationResult {
  documents: RecommendedDocumentItem[];
  defaultSelectedIds: string[];
  topHeroDocument: RecommendedDocumentItem;
}

/**
 * Returns prioritized documents tailored for the user's intent and commercial model.
 */
export function getRecommendedDocumentsForOnboarding(
  intent: PrimaryIntent,
  businessType: BusinessType
): RecommendationResult {
  let docOrder: string[] = [];

  // Special industry priority rules
  if (businessType === 'contractor') {
    docOrder = [
      'work_order',
      'site_inspection_report',
      'equipment_responsibility',
      'purchase_order',
      'tax_invoice',
      'estimate',
      'delivery_challan',
      'business_letterhead',
    ];
  } else if (businessType === 'retail') {
    docOrder = [
      'tax_invoice',
      'receipt',
      'bill_of_supply',
      'customer_account_statement',
      'delivery_challan',
      'work_order',
      'business_letterhead',
    ];
  } else if (businessType === 'wholesale') {
    docOrder = [
      'tax_invoice',
      'purchase_order',
      'delivery_challan',
      'customer_account_statement',
      'receipt',
      'bill_of_supply',
      'business_letterhead',
    ];
  } else if (intent === 'business_documents') {
    // Check if professional practice is educational or corporate
    if (businessType === 'professional') {
      docOrder = [
        'job_offer_letter',
        'student_fee_receipt',
        'business_letterhead',
        'appointment_letter',
        'experience_certificate',
        'tax_invoice',
        'meeting_minutes',
      ];
    } else {
      docOrder = [
        'job_offer_letter',
        'appointment_letter',
        'business_letterhead',
        'experience_certificate',
        'internship_letter',
        'salary_slip',
        'meeting_minutes',
        'tax_invoice',
      ];
    }
  } else if (intent === 'invoices_payments') {
    docOrder = [
      'tax_invoice',
      'receipt',
      'estimate',
      'bill_of_supply',
      'customer_account_statement',
      'student_fee_receipt',
      'rent_receipt',
      'business_letterhead',
    ];
  } else if (intent === 'operations') {
    docOrder = [
      'work_order',
      'purchase_order',
      'delivery_challan',
      'site_inspection_report',
      'equipment_responsibility',
      'tax_invoice',
      'meeting_minutes',
    ];
  } else {
    // Complete workspace
    docOrder = [
      'tax_invoice',
      'job_offer_letter',
      'work_order',
      'purchase_order',
      'business_letterhead',
      'receipt',
      'customer_account_statement',
      'student_fee_receipt',
    ];
  }

  // Map to full document items
  const docMap = new Map<string, RecommendedDocumentItem>();
  for (const doc of ALL_ONBOARDING_DOCUMENTS) {
    docMap.set(doc.id, doc);
  }

  const prioritized: RecommendedDocumentItem[] = [];
  for (const id of docOrder) {
    const doc = docMap.get(id);
    if (doc) prioritized.push(doc);
  }

  // Append remaining documents that weren't in the specific list
  for (const doc of ALL_ONBOARDING_DOCUMENTS) {
    if (!prioritized.some((p) => p.id === doc.id)) {
      prioritized.push(doc);
    }
  }

  // Top hero document is the first in the prioritized list
  const topHeroDocument = prioritized[0] || ALL_ONBOARDING_DOCUMENTS[0];

  // Default selection selects the top 3 (or 4 if complete workspace)
  const defaultCount = intent === 'complete_workspace' ? 4 : 3;
  const defaultSelectedIds = prioritized.slice(0, defaultCount).map((d) => d.id);

  return {
    documents: prioritized,
    defaultSelectedIds,
    topHeroDocument,
  };
}
