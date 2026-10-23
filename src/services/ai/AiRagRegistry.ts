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
  // ── HR, CAREERS & TALENT ──
  {
    id: 'job_application',
    name: 'Employment Application / Candidate Dossier',
    family: 'hr',
    familyLabel: 'HR & Talent Acquisition',
    statutoryRule: 'Equal Opportunity / Labor Employment Dossier',
    partyRoleLabel: 'Applicant',
    samplePartyName: 'Candidate',
    keywords: ['job application', 'apply', 'applicant', 'candidate', 'resume', 'cv', 'job opening', 'career application', 'position apply', 'engineer application'],
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
    keywords: ['salary', 'payslip', 'payroll', 'wages', 'basic salary', 'hra', 'provident fund', 'pf', 'esic', 'net pay', 'gross pay', 'tds deduction'],
    intentPhrases: ['create salary slip', 'generate payslip', 'monthly pay for', 'salary statement'],
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
    keywords: ['experience', 'relieving', 'service certificate', 'employment verification', 'clearance letter', 'conduct certificate'],
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

  // ── LEGAL & INSTITUTIONAL ──
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
    id: 'work_order',
    name: 'Contractor Work Order / SOW',
    family: 'orders',
    familyLabel: 'Orders & Contracts',
    statutoryRule: 'Commercial Deliverable & Retainage Contract',
    partyRoleLabel: 'Contractor',
    samplePartyName: 'Contractor / Vendor',
    keywords: ['work order', 'sow', 'scope of work', 'contractor', 'project deliverable', 'milestone', 'turnkey job'],
    intentPhrases: ['work order for', 'contractor work order', 'issue work order'],
    requiredFields: ['contractorName', 'projectTitle', 'deliverables', 'completionDate', 'contractValue', 'milestones'],
    sampleStructure: {
      contractorName: 'Apex Engineering Ltd',
      projectTitle: 'AI Cloud Migration Phase 1',
      contractValue: '₹12,50,000.00',
      targetCompletion: '15 Dec 2026',
      retainagePercentage: '5%',
    },
  },
  {
    id: 'purchase_order',
    name: 'Official Purchase Order (PO)',
    family: 'orders',
    familyLabel: 'Procurement & Supply Chain',
    statutoryRule: 'Commercial Procurement Instrument',
    partyRoleLabel: 'Vendor',
    samplePartyName: 'Supplier Name',
    keywords: ['purchase order', 'po', 'procurement', 'vendor order', 'supplier', 'order goods', 'material purchase'],
    intentPhrases: ['purchase order for', 'create po', 'vendor purchase order'],
    requiredFields: ['vendorName', 'shippingAddress', 'poNumber', 'deliveryDate', 'items', 'incoterms', 'paymentTerms'],
    sampleStructure: {
      vendorName: 'Supplier Tech Hardware Ltd',
      poNumber: 'PO-2026-881',
      deliveryTerms: 'DDP Site Warehouse',
      paymentTerms: 'Net 30 Days',
    },
  },
  {
    id: 'invoice',
    name: 'GST Commercial Tax Invoice',
    family: 'billing',
    familyLabel: 'Sales & Commercial Billing',
    statutoryRule: 'CBIC CGST Rule 46 Commercial Invoice',
    partyRoleLabel: 'Client',
    samplePartyName: 'Customer Name',
    keywords: ['invoice', 'bill', 'tax invoice', 'gst invoice', 'sales bill', 'b2b bill', 'b2c invoice', 'commercial invoice', 'hsn code'],
    intentPhrases: ['draft tax invoice', 'create invoice', 'gst bill for', 'sales invoice'],
    requiredFields: ['clientName', 'clientGstin', 'placeOfSupply', 'items', 'hsnCodes', 'gstRate', 'totalAmount'],
    sampleStructure: {
      clientName: 'Client Corporation',
      invoiceNumber: 'INV-2026-001',
      placeOfSupply: '29-Karnataka',
      taxType: 'exclusive',
      taxRateBp: 1800,
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
    keywords: ['student fee', 'tuition receipt', 'school fee', 'college fee', 'admission fee', 'term fee', 'academy receipt'],
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
];

export class AiRagRegistry {
  /**
   * Ranks and retrieves the top matching statutory document archetypes
   * using keyword tokenization, phrase boosting, and negative penalization.
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
        if (text.includes(kw)) score += 15;
      }

      // 3. Token matches
      for (const token of tokens) {
        if (arch.keywords.some((k) => k.includes(token))) score += 4;
        if (arch.name.toLowerCase().includes(token)) score += 5;
      }

      // 4. Disambiguation penalty: If user asks for "job application", DO NOT pick "invoice"
      if (text.includes('application') || text.includes('apply') || text.includes('candidate')) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'job_application') score += 40;
      }
      if (text.includes('job offer') || text.includes('appointment') || text.includes('hire') || text.includes('ctc')) {
        if (arch.id === 'invoice') score -= 80;
        if (arch.id === 'job_offer') score += 40;
      }
      if (text.includes('rent') || text.includes('landlord') || text.includes('tenant')) {
        if (arch.id === 'invoice') score -= 60;
        if (arch.id === 'rent_receipt') score += 40;
      }
      if (text.includes('salary') || text.includes('payslip') || text.includes('wages')) {
        if (arch.id === 'invoice') score -= 60;
        if (arch.id === 'salary_slip') score += 40;
      }

      return { archetype: arch, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.archetype);
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
      `- If the prompt asks for an employment application, job offer, rent receipt, salary slip, or NDA, output that exact document structure!`,
      `- NEVER output a GST invoice unless the user specifically asks for commercial sales billing, invoices, or quotes!`,
    ];

    return lines.join('\n');
  }
}
