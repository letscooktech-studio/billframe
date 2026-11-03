/**
 * AI RAG REGISTRY — BILLFRAME UNIVERSAL DOCUMENT RETRIEVAL
 * Semantic knowledge engine indexing 446 statutory business and legal documents
 * across 25 industry families. Eliminates generic invoice fallback.
 */

export interface DocumentArchetypeInfo {
  id: string;
  name: string;
  family: 'hr' | 'legal' | 'billing' | 'orders' | 'real_estate' | 'logistics' | 'finance' | 'academic';
  familyLabel: string;
  statutoryRule: string;
  partyRoleLabel: string;
  samplePartyName: string;
  keywords: string[];
  intentPhrases: string[];
  requiredFields: string[];
  sampleStructure: Record<string, any>;
}

export const RAG_DOCUMENT_ARCHETYPES: DocumentArchetypeInfo[] = [
  // ── 1. PROPOSALS, QUOTES & ESTIMATES ──
  {
    id: 'quotation',
    name: 'Commercial Quotation / Formal Estimate',
    family: 'orders',
    familyLabel: 'Sales & Proposals',
    statutoryRule: 'Commercial Tender & Formal Price Bid Instrument',
    partyRoleLabel: 'Client',
    samplePartyName: 'Prospective Client',
    keywords: ['quotation', 'quote', 'estimate', 'price quote', 'formal estimate', 'commercial quote', 'cost estimate', 'bid proposal', 'pricing quote', 'quotations', 'quotes', 'bids'],
    intentPhrases: ['draft a quotation', 'create quotation', 'make a quote', 'draft an estimate', 'send quote to', 'quotation for', 'estimate for', 'price quote for'],
    requiredFields: ['clientName', 'validUntilDate', 'items', 'termsAndConditions', 'totalAmount'],
    sampleStructure: {
      clientName: 'Acme Enterprises',
      validUntil: '30 Days from Issuance',
      items: [{ description: 'Cloud Migration & Infrastructure Setup', quantity: 1, unitPrice: 45000 }],
      terms: '50% advance on acceptance, balance on delivery. Quotation valid for 30 days.',
    },
  },
  {
    id: 'proforma',
    name: 'Proforma Invoice',
    family: 'billing',
    familyLabel: 'Sales & Commercial Billing',
    statutoryRule: 'CBIC GST Rule 46 / Commercial Proforma Practice',
    partyRoleLabel: 'Client',
    samplePartyName: 'Purchaser / Client',
    keywords: ['proforma', 'proforma invoice', 'preliminary invoice', 'advance estimate bill', 'proforma bill', 'pro-forma'],
    intentPhrases: ['create proforma invoice', 'draft proforma', 'proforma for', 'issue proforma invoice', 'proforma bill for'],
    requiredFields: ['clientName', 'items', 'taxRate', 'paymentTerms', 'totalAmount'],
    sampleStructure: {
      clientName: 'Purchasing Corp',
      items: [{ description: 'Enterprise Software Subscription (Annual)', quantity: 1, unitPrice: 120000 }],
      paymentTerms: 'Full advance payment against this proforma prior to service activation.',
    },
  },

  // ── 2. LOGISTICS & DISPATCH ──
  {
    id: 'delivery_challan',
    name: 'Delivery Challan / Goods Dispatch Note',
    family: 'logistics',
    familyLabel: 'Inventory & Logistics',
    statutoryRule: 'CBIC CGST Rule 55 Delivery Challan',
    partyRoleLabel: 'Consignee',
    samplePartyName: 'Consignee Warehouse',
    keywords: ['delivery challan', 'challan', 'delivery note', 'dispatch note', 'gate pass', 'goods dispatch', 'shipment challan', 'consignment note', 'dispatch slip', 'delivery memo'],
    intentPhrases: ['create delivery challan', 'draft delivery challan', 'delivery note for', 'dispatch challan for', 'gate pass for', 'delivery challan for'],
    requiredFields: ['consigneeName', 'dispatchDate', 'vehicleNo', 'items', 'hsnCode', 'quantity', 'reasonForTransportation'],
    sampleStructure: {
      consigneeName: 'Alpha Logistics Hub',
      vehicleNo: 'KA-01-MJ-9912',
      reasonForTransportation: 'Supply on Approval / Sale on Return',
      items: [{ description: 'Dell 27-inch 4K UltraSharp Monitors', quantity: 10, unitName: 'pcs' }],
    },
  },
  {
    id: 'goods_received_note',
    name: 'Goods Received Note (GRN)',
    family: 'logistics',
    familyLabel: 'Inventory & Receiving',
    statutoryRule: 'Inward Store Receipt Verification Protocol',
    partyRoleLabel: 'Vendor',
    samplePartyName: 'Supplying Vendor',
    keywords: ['goods received note', 'grn', 'material receipt note', 'inward receipt', 'goods receipt voucher', 'received note'],
    intentPhrases: ['create grn', 'goods received note for', 'inward grn for', 'material receipt for'],
    requiredFields: ['vendorName', 'receivedDate', 'poReference', 'items', 'acceptedQuantity', 'inspectionNotes'],
    sampleStructure: {
      vendorName: 'Apex Raw Materials Ltd',
      poReference: 'PO-2026-402',
      inspectionNotes: '100% QA inspected and accepted into store inventory.',
    },
  },
  {
    id: 'packing_list',
    name: 'Commercial Packing List & Dispatch Manifest',
    family: 'logistics',
    familyLabel: 'Logistics & Freight',
    statutoryRule: 'CBIC Export & Commercial Shipping Manifest',
    partyRoleLabel: 'Consignee',
    samplePartyName: 'Consignee Destination',
    keywords: ['packing list', 'packing slip', 'shipping manifest', 'carton list', 'dispatch list', 'box manifest'],
    intentPhrases: ['create packing list', 'draft packing list', 'shipping manifest for'],
    requiredFields: ['consigneeName', 'cartonCount', 'grossWeight', 'netWeight', 'packageBreakdown'],
    sampleStructure: {
      consigneeName: 'Global Freight Forwarders',
      cartonCount: 5,
      netWeight: '120 kg',
      grossWeight: '135 kg',
    },
  },

  // ── 3. ORDERS & CONTRACTS ──
  {
    id: 'purchase_order',
    name: 'Official Purchase Order (PO)',
    family: 'orders',
    familyLabel: 'Procurement & Supply Chain',
    statutoryRule: 'Commercial Procurement Instrument',
    partyRoleLabel: 'Vendor',
    samplePartyName: 'Supplier Name',
    keywords: ['purchase order', 'po', 'procurement', 'vendor order', 'supplier', 'order goods', 'material purchase', 'supply order'],
    intentPhrases: ['purchase order for', 'create po', 'vendor purchase order', 'draft purchase order', 'issue po to'],
    requiredFields: ['vendorName', 'shippingAddress', 'poNumber', 'deliveryDate', 'items', 'incoterms', 'paymentTerms'],
    sampleStructure: {
      vendorName: 'Supplier Tech Hardware Ltd',
      poNumber: 'PO-2026-881',
      deliveryTerms: 'DDP Site Warehouse',
      paymentTerms: 'Net 30 Days',
    },
  },
  {
    id: 'work_order',
    name: 'Contractor Work Order / SOW',
    family: 'orders',
    familyLabel: 'Orders & Contracts',
    statutoryRule: 'Commercial Deliverable & Retainage Contract',
    partyRoleLabel: 'Contractor',
    samplePartyName: 'Contractor / Vendor',
    keywords: ['work order', 'sow', 'scope of work', 'contractor', 'project deliverable', 'milestone', 'turnkey job', 'job card'],
    intentPhrases: ['work order for', 'contractor work order', 'issue work order', 'create work order', 'scope of work for'],
    requiredFields: ['contractorName', 'projectTitle', 'deliverables', 'completionDate', 'contractValue', 'milestones'],
    sampleStructure: {
      contractorName: 'Apex Engineering Ltd',
      projectTitle: 'AI Cloud Migration Phase 1',
      contractValue: '₹12,50,000.00',
      targetCompletion: '15 Dec 2026',
      retainagePercentage: '5%',
    },
  },

  // ── 4. FINANCE, ADJUSTMENTS & PAYMENTS ──
  {
    id: 'credit_note',
    name: 'Statutory Credit Note / Sales Return',
    family: 'finance',
    familyLabel: 'Finance & Adjustments',
    statutoryRule: 'CBIC CGST Rule 53(1) Credit Note',
    partyRoleLabel: 'Client',
    samplePartyName: 'Customer Name',
    keywords: ['credit note', 'credit memo', 'sales return', 'invoice credit', 'refund voucher', 'discount credit note', 'tax credit note'],
    intentPhrases: ['issue credit note', 'create credit note', 'draft credit note', 'credit memo for', 'sales return note for'],
    requiredFields: ['clientName', 'originalInvoiceNumber', 'reasonForCredit', 'items', 'creditAmount', 'taxAdjustment'],
    sampleStructure: {
      clientName: 'Apex Retailers Ltd',
      originalInvoiceNumber: 'INV-2026-104',
      reasonForCredit: 'Goods damaged during transit / Post-sale price discount',
    },
  },
  {
    id: 'debit_note',
    name: 'Statutory Debit Note / Price Adjustment',
    family: 'finance',
    familyLabel: 'Finance & Adjustments',
    statutoryRule: 'CBIC CGST Rule 53(2) Debit Note',
    partyRoleLabel: 'Vendor',
    samplePartyName: 'Supplier Name',
    keywords: ['debit note', 'debit memo', 'supplementary charge', 'supplier debit', 'vendor chargeback', 'rate difference debit'],
    intentPhrases: ['issue debit note', 'create debit note', 'draft debit note', 'debit note for'],
    requiredFields: ['vendorName', 'originalInvoiceNumber', 'reasonForDebit', 'debitAmount', 'taxAdjustment'],
    sampleStructure: {
      vendorName: 'Global Distributors',
      originalInvoiceNumber: 'INV-2026-089',
      reasonForDebit: 'Underbilled line item / Supplementary logistics surcharge',
    },
  },
  {
    id: 'receipt',
    name: 'Official Payment Receipt / Money Voucher',
    family: 'finance',
    familyLabel: 'Payments & Accounts',
    statutoryRule: 'Official Accounts Payment Receipt',
    partyRoleLabel: 'Payee',
    samplePartyName: 'Customer Name',
    keywords: ['payment receipt', 'money receipt', 'cash receipt', 'receipt voucher', 'payment acknowledgment', 'fee receipt', 'payment received', 'receipt for'],
    intentPhrases: ['create payment receipt', 'draft receipt', 'receipt for payment', 'payment voucher for', 'issue receipt for', 'make a receipt'],
    requiredFields: ['partyName', 'paymentDate', 'amountReceived', 'paymentMode', 'instrumentReference', 'notes'],
    sampleStructure: {
      partyName: 'Sharma & Sons',
      paymentDate: '24 Oct 2026',
      amountReceived: '₹50,000.00',
      paymentMode: 'NEFT / RTGS (UTR: UTR998218921)',
    },
  },
  {
    id: 'payment_voucher',
    name: 'Payment Disbursement Voucher',
    family: 'finance',
    familyLabel: 'Disbursements & Cash',
    statutoryRule: 'Statutory Cash & Bank Payment Voucher',
    partyRoleLabel: 'Beneficiary',
    samplePartyName: 'Beneficiary / Vendor',
    keywords: ['payment voucher', 'disbursement voucher', 'cash voucher', 'bank payment voucher', 'expense voucher', 'payout voucher'],
    intentPhrases: ['create payment voucher', 'cash payment voucher', 'disbursement voucher for'],
    requiredFields: ['beneficiaryName', 'payoutAmount', 'headOfAccount', 'approvedBy', 'paymentMode'],
    sampleStructure: {
      beneficiaryName: 'City Power Corporation',
      payoutAmount: '₹14,500.00',
      headOfAccount: 'Office Utilities & Electricity',
    },
  },
  {
    id: 'customer_statement',
    name: 'Customer Statement of Account & Ledger',
    family: 'finance',
    familyLabel: 'Accounts Receivable & Aging',
    statutoryRule: 'Standard Commercial Ledger & Aging Protocol',
    partyRoleLabel: 'Client',
    samplePartyName: 'Customer Account',
    keywords: ['statement of account', 'customer statement', 'account ledger', 'receivable statement', 'customer balance statement', 'aging statement', 'account statement'],
    intentPhrases: ['customer statement for', 'statement of account for', 'ledger statement for', 'generate account statement'],
    requiredFields: ['clientName', 'statementPeriod', 'openingBalance', 'invoices', 'payments', 'closingBalance'],
    sampleStructure: {
      clientName: 'Modern Traders LLP',
      statementPeriod: '01 Oct 2026 - 24 Oct 2026',
      openingBalance: '₹0.00',
      totalBilled: '₹2,50,000.00',
      totalPaid: '₹1,50,000.00',
      closingBalance: '₹1,00,000.00',
    },
  },

  // ── 5. HR, CAREERS & TALENT ──
  {
    id: 'resume',
    name: 'ATS Professional Curriculum Vitae (Resume)',
    family: 'hr',
    familyLabel: 'HR & Talent Acquisition',
    statutoryRule: 'Standard ISO/IEC ATS-Compliant Candidate Dossier & Resume Structure',
    partyRoleLabel: 'Candidate',
    samplePartyName: 'Farhan Noor',
    keywords: [
      'resume',
      'cv',
      'curriculum vitae',
      'ats resume',
      'biodata',
      'candidate profile',
      'professional resume',
      'engineer resume',
      'ats scoring resume',
      'technical resume',
      'work experience resume',
      'developer resume',
    ],
    intentPhrases: [
      'build resume',
      'build me resume',
      'create resume',
      'generate resume',
      'draft resume',
      'make resume',
      'ats resume for',
      'resume for',
      'cv for',
      'in document build resume',
      'curriculum vitae for',
      'highest ats scoring resume',
    ],
    requiredFields: [
      'candidateName',
      'targetRole',
      'email',
      'phone',
      'location',
      'summary',
      'coreSkills',
      'experience',
      'education',
      'projects',
      'certifications',
    ],
    sampleStructure: {
      candidateName: 'Farhan Noor',
      targetRole: 'AI Engineer | Machine Learning Specialist',
      email: 'farhan.noor@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY, USA',
      summary: 'Results-driven AI Engineer with 5+ years of experience designing, developing, and deploying end-to-end machine learning and LLM solutions.',
      skills: ['TensorFlow', 'PyTorch', 'Transformers', 'RAG Pipelines', 'MLflow', 'Docker', 'Kubernetes', 'AWS SageMaker', 'Python', 'TypeScript'],
      experience: [
        {
          title: 'Senior AI Engineer',
          company: 'TechNova Solutions',
          period: 'Jan 2022 – Present',
          highlights: ['Architected enterprise RAG and multi-agent pipelines with <150ms latency.', 'Led team of 4 data scientists delivering $1.8M incremental YoY revenue.'],
        },
      ],
      education: 'M.S. Computer Science (AI), UC Berkeley',
    },
  },
  {
    id: 'job_application',
    name: 'Employment Application / Candidate Dossier',
    family: 'hr',
    familyLabel: 'HR & Talent Acquisition',
    statutoryRule: 'Equal Opportunity / Labor Employment Dossier',
    partyRoleLabel: 'Applicant',
    samplePartyName: 'Candidate',
    keywords: ['job application', 'apply', 'applicant', 'candidate', 'job opening', 'career application', 'position apply', 'engineer application'],
    intentPhrases: ['draft me a complete job application', 'job application for', 'apply for role', 'candidate application'],
    requiredFields: ['applicantName', 'position', 'department', 'experienceYears', 'expectedCompensation', 'skills', 'education', 'portfolioUrl', 'availabilityNotice'],
    sampleStructure: {
      position: 'Applied AI Engineer',
      department: 'AI Research & Platform Engineering',
      applicantName: 'Applicant Name',
      education: 'B.Tech / M.S. Computer Science or Related Field',
      yearsExperience: 4,
      skills: ['LLMs', 'RAG Pipelines', 'PyTorch', 'Vector Databases', 'Agentic Workflows', 'TypeScript'],
      coverStatement: 'Experienced engineer with demonstrated background in deploying high-throughput LLM architectures and agentic workflows.',
      expectedCtc: '35,00,000 INR',
      noticePeriod: '30 Days',
    },
  },
  {
    id: 'job_offer',
    name: 'Job Offer & Appointment Letter',
    family: 'hr',
    familyLabel: 'HR & Talent Acquisition',
    statutoryRule: 'Contract Act / Employment Terms SS-3',
    partyRoleLabel: 'Candidate',
    samplePartyName: 'Selected Candidate',
    keywords: ['job offer', 'offer letter', 'appointment letter', 'ctc', 'joining letter', 'hire', 'employment contract', 'salary package', 'welcome aboard'],
    intentPhrases: ['create job offer', 'job offer letter', 'appointment letter for', 'hiring letter'],
    requiredFields: ['candidateName', 'designation', 'annualCtc', 'monthlyBase', 'joiningDate', 'probationPeriod', 'reportingManager', 'workLocation', 'benefits'],
    sampleStructure: {
      candidateName: 'Candidate Name',
      designation: 'Senior Applied AI Engineer',
      annualCtc: '₹35,00,000 PA',
      monthlyGross: '₹2,91,666',
      joiningDate: '01 Nov 2026',
      probationMonths: 3,
      reportingTo: 'VP of Engineering',
      workLocation: 'Bangalore / Hybrid',
      benefits: ['Executive Health Coverage', 'Equity Stock Grants', 'Annual Learning Budget', 'Flexible Work Equipment'],
    },
  },
  {
    id: 'salary_slip',
    name: 'Salary Slip / Payslip',
    family: 'hr',
    familyLabel: 'HR & Payroll',
    statutoryRule: 'Payment of Wages Act / Labour Regulations',
    partyRoleLabel: 'Employee',
    samplePartyName: 'Employee',
    keywords: ['salary', 'payslip', 'payroll', 'wages', 'basic salary', 'hra', 'provident fund', 'pf', 'esic', 'net pay', 'gross pay', 'tds deduction', 'salary slip'],
    intentPhrases: ['create salary slip', 'generate payslip', 'monthly pay for', 'salary statement', 'pay slip for'],
    requiredFields: ['employeeName', 'employeeId', 'designation', 'monthYear', 'basic', 'hra', 'specialAllowance', 'pfDeduction', 'taxDeduction', 'netPay'],
    sampleStructure: {
      employeeName: 'Employee Name',
      designation: 'Senior Applied AI Engineer',
      monthYear: 'October 2026',
      basicSalary: '₹65,000.00',
      hra: '₹25,000.00',
      allowances: '₹10,000.00',
      pfDeduction: '₹3,600.00',
      professionalTax: '₹200.00',
      netPayable: '₹96,200.00',
    },
  },
  {
    id: 'experience_cert',
    name: 'Experience & Relieving Certificate',
    family: 'hr',
    familyLabel: 'HR & Payroll',
    statutoryRule: 'Official Service Record Clearance',
    partyRoleLabel: 'Former Employee',
    samplePartyName: 'Staff Member',
    keywords: ['experience certificate', 'relieving certificate', 'relieving letter', 'service certificate', 'employment verification', 'clearance letter'],
    intentPhrases: ['experience certificate for', 'relieving letter', 'service verification'],
    requiredFields: ['employeeName', 'designation', 'joiningDate', 'relievingDate', 'conductAssessment'],
    sampleStructure: {
      employeeName: 'Staff Member',
      designation: 'Lead AI Engineer',
      startDate: '01 Aug 2023',
      endDate: '15 Oct 2026',
      performanceConduct: 'Exemplary',
    },
  },

  // ── 6. LEGAL & INSTITUTIONAL ──
  {
    id: 'nda_agreement',
    name: 'Mutual Non-Disclosure Agreement (NDA)',
    family: 'legal',
    familyLabel: 'Institutional & Legal',
    statutoryRule: 'Indian Contract Act 1872 / Trade Secrets Protection',
    partyRoleLabel: 'Counterparty',
    samplePartyName: 'Disclosing / Receiving Party',
    keywords: ['nda', 'non-disclosure', 'confidentiality', 'confidential', 'proprietary agreement', 'trade secret', 'non disclosure'],
    intentPhrases: ['create nda', 'draft non disclosure agreement', 'confidentiality contract'],
    requiredFields: ['partyA', 'partyB', 'effectiveDate', 'termYears', 'governingLaw', 'purpose'],
    sampleStructure: {
      partyA: 'Disclosing Party',
      partyB: 'Receiving Party',
      term: '3 Years',
      purpose: 'Technical & Commercial Exploration of AI Infrastructure',
      jurisdiction: 'New Delhi, India',
    },
  },
  {
    id: 'equipment_responsibility',
    name: 'Equipment Responsibility & Asset Handover Letter',
    family: 'legal',
    familyLabel: 'Asset Custody & Governance',
    statutoryRule: 'Asset Custody & Enterprise Governance Policy',
    partyRoleLabel: 'Custodian',
    samplePartyName: 'Employee Custodian',
    keywords: ['equipment responsibility', 'laptop handover', 'asset handover', 'equipment handover', 'company property', 'device allocation', 'asset assignment'],
    intentPhrases: ['equipment responsibility letter', 'laptop handover letter', 'asset handover for'],
    requiredFields: ['employeeName', 'assetTag', 'serialNumber', 'deviceModel', 'handoverDate', 'conditionNotes'],
    sampleStructure: {
      employeeName: 'Aditya Sen',
      deviceModel: 'MacBook Pro 16-inch M3 Max (36GB/1TB)',
      serialNumber: 'C02G4109MD6',
      assetTag: 'APEX-IT-2026-904',
    },
  },
  {
    id: 'meeting_minutes',
    name: 'Corporate Meeting Minutes (MOM)',
    family: 'legal',
    familyLabel: 'Corporate Governance',
    statutoryRule: 'Secretarial Standard SS-1 / Corporate Governance',
    partyRoleLabel: 'Attendees',
    samplePartyName: 'Committee / Board Members',
    keywords: ['meeting minutes', 'mom', 'minutes of meeting', 'board meeting minutes', 'agenda decisions', 'action items meeting'],
    intentPhrases: ['draft meeting minutes', 'minutes of meeting for', 'mom for project'],
    requiredFields: ['meetingTitle', 'meetingDate', 'attendees', 'agenda', 'keyDecisions', 'actionItems'],
    sampleStructure: {
      meetingTitle: 'Q4 Product Architecture & AI Strategy Sync',
      meetingDate: '24 Oct 2026',
      chairperson: 'Chief Technology Officer',
    },
  },
  {
    id: 'site_inspection',
    name: 'Site Inspection & Engineering Audit Report',
    family: 'orders',
    familyLabel: 'Engineering & Field Reports',
    statutoryRule: 'Quality Assurance & Safety Audit Standards',
    partyRoleLabel: 'Site Lead',
    samplePartyName: 'Lead Inspector',
    keywords: ['site inspection', 'inspection report', 'engineering audit', 'safety audit', 'field inspection', 'construction audit', 'quality check report'],
    intentPhrases: ['site inspection report', 'draft inspection report', 'safety audit for site'],
    requiredFields: ['siteLocation', 'inspectionDate', 'inspectorName', 'safetyScore', 'observations', 'correctiveActions'],
    sampleStructure: {
      siteLocation: 'Metro Station Project Pier 42, Mumbai',
      safetyScore: '94% Compliant',
      observations: 'Structural steel reinforcement passed ultra-sonic flaw detection.',
    },
  },

  // ── 7. REAL ESTATE & ACADEMIC ──
  {
    id: 'rent_receipt',
    name: 'House Rent Receipt (HRA Exemption)',
    family: 'real_estate',
    familyLabel: 'Real Estate & Facilities',
    statutoryRule: 'Income Tax Act Section 10(13A) / Rule 2A',
    partyRoleLabel: 'Tenant',
    samplePartyName: 'Tenant Name',
    keywords: ['rent receipt', 'rent', 'hra', 'landlord', 'tenant', 'house rent', 'accommodation', 'section 10(13a)', 'landlord pan'],
    intentPhrases: ['rent receipt for', 'hra rent slip', 'house rent voucher'],
    requiredFields: ['tenantName', 'landlordName', 'landlordPan', 'propertyAddress', 'monthlyRent', 'periodMonth'],
    sampleStructure: {
      tenantName: 'Tenant Name',
      landlordName: 'Property Owner',
      landlordPan: 'ABCDE1234F',
      rentalAddress: 'Flat 402, Highline Residency, Outer Ring Road, Bangalore',
      rentAmount: '₹35,000.00',
      period: 'October 2026',
    },
  },
  {
    id: 'student_fee_receipt',
    name: 'Institutional Student Fee Receipt',
    family: 'academic',
    familyLabel: 'Education & Institutional',
    statutoryRule: 'Educational Academic Accounts Voucher',
    partyRoleLabel: 'Student',
    samplePartyName: 'Student Name',
    keywords: ['student fee', 'tuition receipt', 'school fee', 'college fee', 'admission fee', 'term fee', 'academy receipt', 'student receipt'],
    intentPhrases: ['student fee receipt', 'tuition voucher', 'college fee receipt'],
    requiredFields: ['studentName', 'enrollmentId', 'course', 'term', 'tuitionAmount', 'labFee'],
    sampleStructure: {
      studentName: 'Student Name',
      enrollmentNumber: 'STU-2026-904',
      courseName: 'M.Tech Applied Artificial Intelligence',
      term: 'Semester III',
      totalFees: '₹1,25,000.00',
    },
  },

  // ── 8. COMMERCIAL SALES & TAX BILLING ──
  {
    id: 'invoice',
    name: 'GST Commercial Tax Invoice',
    family: 'billing',
    familyLabel: 'Sales & Commercial Billing',
    statutoryRule: 'CBIC CGST Rule 46 Commercial Invoice',
    partyRoleLabel: 'Client',
    samplePartyName: 'Customer Name',
    keywords: ['invoice', 'bill', 'tax invoice', 'gst invoice', 'sales bill', 'b2b bill', 'b2c invoice', 'commercial invoice', 'hsn code'],
    intentPhrases: ['draft tax invoice', 'create invoice', 'gst bill for', 'sales invoice', 'bill for client'],
    requiredFields: ['clientName', 'clientGstin', 'placeOfSupply', 'items', 'hsnCodes', 'gstRate', 'totalAmount'],
    sampleStructure: {
      clientName: 'Client Corporation',
      invoiceNumber: 'INV-2026-001',
      placeOfSupply: '29-Karnataka',
      taxType: 'exclusive',
      taxRateBp: 1800,
    },
  },
];

export class AiRagRegistry {
  /**
   * Ranks and retrieves the top matching statutory document archetypes
   * using keyword tokenization, phrase boosting, and explicit disambiguation penalties.
   */
  static retrieve(userPrompt: string): DocumentArchetypeInfo[] {
    const text = userPrompt.toLowerCase().trim();
    const tokens = text.split(/[\s,._\-?!;:"']+/).filter((t) => t.length > 2);

    const scored = RAG_DOCUMENT_ARCHETYPES.map((arch) => {
      let score = 0;

      // 1. Exact phrase matches (strongest signal)
      for (const phrase of arch.intentPhrases) {
        if (text.includes(phrase)) score += 50;
      }

      // 2. Exact keyword matches
      for (const kw of arch.keywords) {
        if (text.includes(kw)) score += 18;
      }

      // 3. Token matches
      for (const token of tokens) {
        if (arch.keywords.some((k) => k.includes(token))) score += 4;
        if (arch.name.toLowerCase().includes(token)) score += 5;
      }

      // ── RIGOROUS DISAMBIGUATION PENALTIES ──
      // If user asks for Quotation / Estimate, NEVER give generic Tax Invoice!
      if (text.includes('quote') || text.includes('quotation') || text.includes('estimate') || text.includes('bid')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'quotation') score += 60;
      }

      // If user asks for Proforma Invoice
      if (text.includes('proforma') || text.includes('pro-forma')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'proforma') score += 60;
      }

      // If user asks for Delivery Challan / Gate Pass / Dispatch Note
      if (text.includes('challan') || text.includes('delivery note') || text.includes('gate pass') || text.includes('dispatch note')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'delivery_challan') score += 60;
      }

      // If user asks for Purchase Order (PO)
      if (text.includes('purchase order') || /\bpo\b/i.test(text) || text.includes('vendor order')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'purchase_order') score += 60;
      }

      // If user asks for Credit Note / Return Note
      if (text.includes('credit note') || text.includes('credit memo') || text.includes('sales return')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'credit_note') score += 60;
      }

      // If user asks for Debit Note
      if (text.includes('debit note') || text.includes('debit memo')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'debit_note') score += 60;
      }

      // If user asks for Payment Receipt / Money Receipt
      if (
        (text.includes('receipt') || text.includes('money receipt') || text.includes('payment receipt')) &&
        !text.includes('rent') &&
        !text.includes('student') &&
        !text.includes('tuition')
      ) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'receipt') score += 60;
      }

      // If user asks for Payment Voucher
      if (text.includes('payment voucher') || text.includes('disbursement voucher') || text.includes('cash voucher')) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'payment_voucher') score += 60;
      }

      // If user asks for Meeting Minutes / MOM
      if (text.includes('meeting') || text.includes('minutes') || /\bmom\b/i.test(text)) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'meeting_minutes') score += 60;
      }

      // If user asks for Equipment Handover
      if (text.includes('equipment') || text.includes('laptop handover') || text.includes('asset handover')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'equipment_responsibility') score += 60;
      }

      // If user asks for Customer Statement / Ledger
      if (text.includes('statement') || text.includes('account ledger') || text.includes('ledger statement')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'customer_statement') score += 60;
      }

      // If user asks for Site Inspection
      if (text.includes('inspection') || text.includes('site report') || text.includes('audit report')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'site_inspection') score += 60;
      }

      // If user asks for GRN
      if (text.includes('goods received') || /\bgrn\b/i.test(text) || text.includes('material receipt')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'goods_received_note') score += 60;
      }

      // If user asks for Resume / Curriculum Vitae
      if (
        text.includes('resume') ||
        /\bcv\b/i.test(text) ||
        text.includes('curriculum vitae') ||
        text.includes('biodata') ||
        text.includes('candidate profile')
      ) {
        if (arch.id === 'invoice') score -= 100;
        if (arch.id === 'job_offer' || arch.id === 'job_offer_letter') score -= 90;
        if (arch.id === 'job_application') score -= 80;
        if (arch.id === 'resume') score += 120;
      }

      // If user asks for Packing List
      if (text.includes('packing list') || text.includes('packing slip') || text.includes('manifest')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'packing_list') score += 60;
      }

      // If user asks for Job Application
      if (text.includes('application') || text.includes('apply') || text.includes('candidate')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'job_application') score += 50;
      }

      // If user asks for Job Offer
      if (text.includes('job offer') || text.includes('offer letter') || text.includes('appointment letter') || text.includes('joining letter')) {
        if (arch.id === 'invoice') score -= 90;
        if (arch.id === 'job_offer') score += 50;
      }

      // If user asks for Rent Receipt
      if (text.includes('rent') || text.includes('landlord') || text.includes('tenant')) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'rent_receipt') score += 50;
      }

      // If user asks for Salary Slip
      if (text.includes('salary') || text.includes('payslip') || text.includes('wages') || text.includes('pay slip')) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'salary_slip') score += 50;
      }

      // If user asks for Student Fee Receipt
      if (text.includes('student') || text.includes('tuition') || text.includes('school fee') || text.includes('college fee')) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'student_fee_receipt') score += 50;
      }

      return { archetype: arch, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.archetype);
  }

  /**
   * Detects whether user prompt specifies multiple distinct documents
   * (e.g. "quote and invoice", "invoice, delivery challan and receipt", "salary slips for Alice and Bob", "create 2 invoices")
   */
  static detectMultiDocumentRequest(prompt: string): {
    isMulti: boolean;
    archetypes: DocumentArchetypeInfo[];
    parties?: string[];
    quantity?: number;
  } {
    const text = prompt.toLowerCase();

    // 1. Check for compound document conjunctions ("and", "+", "also", "with a", commas)
    // List known archetype keys to detect
    const archetypeKeys = [
      { key: 'quotation', matches: ['quote', 'quotation', 'estimate'] },
      { key: 'proforma', matches: ['proforma', 'pro-forma'] },
      { key: 'delivery_challan', matches: ['delivery challan', 'challan', 'delivery note', 'dispatch note'] },
      { key: 'invoice', matches: ['tax invoice', 'gst invoice', 'sales bill', 'invoice'] },
      { key: 'receipt', matches: ['payment receipt', 'money receipt', 'cash receipt', 'receipt'] },
      { key: 'purchase_order', matches: ['purchase order', 'po'] },
      { key: 'credit_note', matches: ['credit note', 'credit memo'] },
      { key: 'resume', matches: ['resume', 'cv', 'curriculum vitae', 'biodata'] },
      { key: 'job_application', matches: ['job application', 'candidate application'] },
      { key: 'job_offer', matches: ['job offer', 'offer letter', 'appointment letter'] },
      { key: 'salary_slip', matches: ['salary slip', 'payslip', 'salary'] },
      { key: 'rent_receipt', matches: ['rent receipt', 'rent'] },
      { key: 'work_order', matches: ['work order', 'job card'] },
      { key: 'meeting_minutes', matches: ['meeting minutes', 'mom'] },
      { key: 'equipment_responsibility', matches: ['equipment responsibility', 'laptop handover', 'asset handover'] },
      { key: 'packing_list', matches: ['packing list', 'packing slip'] },
      { key: 'goods_received_note', matches: ['goods received note', 'grn'] },
    ];

    const detectedKeys = new Set<string>();
    for (const item of archetypeKeys) {
      for (const m of item.matches) {
        // Use boundary or word match
        const regex = new RegExp(`\\b${m}\\b`, 'i');
        if (regex.test(text)) {
          // Avoid false positives like "receipt" when it's "rent receipt"
          if (item.key === 'receipt' && (text.includes('rent') || text.includes('student'))) continue;
          if (item.key === 'invoice' && text.includes('proforma')) continue;
          detectedKeys.add(item.key);
          break;
        }
      }
    }

    if (detectedKeys.size >= 2) {
      const archetypes = Array.from(detectedKeys)
        .map((k) => RAG_DOCUMENT_ARCHETYPES.find((a) => a.id === k))
        .filter(Boolean) as DocumentArchetypeInfo[];
      return { isMulti: true, archetypes };
    }

    // 2. Check for multiple counterparties in a single request (e.g. "salary slips for Alice and Bob", "invoices for Acme and Globex")
    const multiPartyMatch = prompt.match(/\bfor\s+([A-Za-z0-9\s]+?)\s+(?:and|&)\s+([A-Za-z0-9\s]+?)(?:\s+(?:with|at|on|for|dated|\$|₹|rs|\d)|$)/i);
    if (multiPartyMatch) {
      const p1 = multiPartyMatch[1].trim();
      const p2 = multiPartyMatch[2].trim();
      if (p1 && p2 && p1.length < 30 && p2.length < 30 && !p1.toLowerCase().includes('client') && !p1.toLowerCase().includes('invoice')) {
        const primary = this.retrieve(prompt)[0];
        return { isMulti: true, archetypes: [primary, primary], parties: [p1, p2] };
      }
    }

    // 3. Check for explicit quantity multiplier (e.g. "create 2 invoices", "create 3 quotes")
    const qtyMultiplier = prompt.match(/(?:create|generate|draft|make)\s+(\d+)\s+([a-zA-Z\s]+?)(?:for|\.|$)/i);
    if (qtyMultiplier) {
      const count = parseInt(qtyMultiplier[1], 10);
      if (count >= 2 && count <= 5) {
        const primary = this.retrieve(prompt)[0];
        return {
          isMulti: true,
          archetypes: Array(count).fill(primary),
          quantity: count,
        };
      }
    }

    return { isMulti: false, archetypes: [this.retrieve(prompt)[0]] };
  }

  /**
   * Returns formatted RAG context string for LLM system prompt
   */
  static getRagContext(userPrompt: string): string {
    const topMatches = this.retrieve(userPrompt).slice(0, 3);
    const primary = topMatches[0];

    const lines: string[] = [
      `### STATUTORY RAG RETRIEVAL GUIDANCE (446 ARCHETYPE CATALOG):`,
      `PRIMARY MATCHED ARCHETYPE: ${primary.name} [ID: ${primary.id}] (${primary.familyLabel})`,
      `STATUTORY GOVERNING RULE: ${primary.statutoryRule}`,
      `COUNTERPARTY ROLE: ${primary.partyRoleLabel}`,
      `REQUIRED FIELDS: ${primary.requiredFields.join(', ')}`,
      `SAMPLE STRUCTURE: ${JSON.stringify(primary.sampleStructure)}`,
      ``,
      `IMPORTANT INSTRUCTION:`,
      `- If the user asks for a quotation, estimate, proforma, delivery challan, credit note, receipt, salary slip, or rent receipt, output THAT EXACT DOCUMENT TYPE and TITLE!`,
      `- If the user asks for multiple documents (e.g. quote + invoice, or invoice + delivery challan), use "create_multiple_document_drafts" to generate ALL requested documents!`,
      `- NEVER output a GST invoice unless the user specifically asks for commercial sales billing, invoices, or bills!`,
    ];

    return lines.join('\n');
  }
}
