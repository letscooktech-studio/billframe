/**
 * SYSTEM DOCUMENT SCHEMAS
 * Standard enterprise templates for Class B (Administrative) and default Class C documents.
 * These schemas strictly define sections, typed fields, and rendering rules.
 */

import { UniversalDocumentSchema } from './types';

export const SYSTEM_SCHEMAS: readonly UniversalDocumentSchema[] = [
  // ── 1. JOB OFFER LETTER (Class B: HR & Employment) ──
  {
    id: 'schema_job_offer_letter',
    code: 'job_offer_letter',
    name: 'Job Offer Letter',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Formal corporate employment offer detailing candidate designation, CTC compensation, joining terms, and candidate acceptance block.',
    icon: 'mail',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'candidate_info',
        title: 'Candidate Information',
        description: 'Personal and contact details of the candidate',
        fields: [
          { id: 'candidate_name', label: 'Candidate Full Name', type: 'text', placeholder: 'e.g. Aarav Sharma', required: true },
          { id: 'candidate_email', label: 'Email Address', type: 'text', placeholder: 'e.g. aarav.sharma@example.com' },
          { id: 'candidate_address', label: 'Residential Address', type: 'textarea', placeholder: 'Full address of the candidate' },
          { id: 'candidate_phone', label: 'Phone Number', type: 'text', placeholder: '+91 98765 43210' },
        ],
      },
      {
        id: 'offer_details',
        title: 'Employment & Position Details',
        description: 'Role, department, reporting structure, and start date',
        fields: [
          { id: 'job_title', label: 'Job Title / Designation', type: 'text', placeholder: 'e.g. Senior Software Engineer', required: true },
          { id: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Engineering & Product' },
          { id: 'reporting_to', label: 'Reporting Manager', type: 'text', placeholder: 'e.g. VP of Engineering' },
          { id: 'joining_date', label: 'Date of Joining', type: 'date', required: true },
          {
            id: 'employment_type',
            label: 'Employment Type',
            type: 'select',
            defaultValue: 'Full-time Permanent',
            options: [
              { label: 'Full-time Permanent', value: 'Full-time Permanent' },
              { label: 'Fixed-term Contract', value: 'Fixed-term Contract' },
              { label: 'Part-time', value: 'Part-time' },
              { label: 'Internship', value: 'Internship' },
            ],
          },
          { id: 'work_location', label: 'Work Location / Base Office', type: 'text', placeholder: 'e.g. Bengaluru / Hybrid' },
          { id: 'probation_period', label: 'Probation Period', type: 'text', placeholder: 'e.g. 3 Months' },
        ],
      },
      {
        id: 'compensation',
        title: 'Compensation & Benefits (CTC)',
        description: 'Annual Cost-to-Company (CTC) and detailed salary component breakdown',
        fields: [
          { id: 'total_ctc', label: 'Total Annual CTC (INR / Currency)', type: 'currency', placeholder: '1,200,000', required: true },
          {
            id: 'salary_breakdown',
            label: 'Salary Component Breakdown',
            type: 'table',
            columns: [
              { key: 'component', label: 'Salary Component', type: 'text', widthPercentage: 45, align: 'left' },
              { key: 'monthly', label: 'Monthly (₹)', type: 'currency', widthPercentage: 27, align: 'right' },
              { key: 'annual', label: 'Annual (₹)', type: 'currency', widthPercentage: 28, align: 'right' },
            ],
          },
          { id: 'variable_notes', label: 'Variable / Bonus Terms', type: 'textarea', placeholder: 'Performance bonus, stock options or annual incentives' },
        ],
      },
      {
        id: 'terms_acceptance',
        title: 'Terms, Validity & Signatures',
        description: 'Offer expiration date, document policies, and signatory names',
        fields: [
          { id: 'offer_validity_date', label: 'Offer Acceptance Deadline', type: 'date' },
          { id: 'signatory_name', label: 'Authorized Signatory Name', type: 'text', placeholder: 'e.g. Priya Nair', required: true },
          { id: 'signatory_title', label: 'Signatory Designation', type: 'text', placeholder: 'e.g. Head of People & Culture' },
          { id: 'additional_terms', label: 'Special Conditions / Relocation', type: 'textarea', placeholder: 'Background verification clause, relocation allowance, etc.' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: 'For & on behalf of Company',
      recipientAcceptanceLabel: 'Candidate Acceptance & Signature',
    },
  },

  // ── 2. APPOINTMENT LETTER (Class B: HR & Employment) ──
  {
    id: 'schema_appointment_letter',
    code: 'appointment_letter',
    name: 'Appointment Letter',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Formal letter of appointment confirming an employee joining and formalizing employment agreements.',
    icon: 'briefcase',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'employee_info',
        title: 'Employee Information',
        fields: [
          { id: 'employee_name', label: 'Employee Name', type: 'text', required: true },
          { id: 'employee_id', label: 'Employee ID', type: 'text', placeholder: 'e.g. EMP-1042' },
          { id: 'designation', label: 'Designation', type: 'text', required: true },
          { id: 'joining_date', label: 'Effective Joining Date', type: 'date', required: true },
        ],
      },
      {
        id: 'terms_employment',
        title: 'Terms of Appointment',
        fields: [
          { id: 'work_hours', label: 'Working Hours & Shifts', type: 'text', placeholder: '9:30 AM to 6:30 PM (Mon-Fri)' },
          { id: 'notice_period', label: 'Notice Period', type: 'text', placeholder: '30 days during probation, 60 days post confirmation' },
          { id: 'code_of_conduct', label: 'Governing Policies', type: 'textarea', placeholder: 'Employee handbook, confidentiality agreement, IP assignment.' },
        ],
      },
      {
        id: 'signatories',
        title: 'Authorization',
        fields: [
          { id: 'signatory_name', label: 'Authorized Signatory', type: 'text', required: true },
          { id: 'signatory_title', label: 'Signatory Title', type: 'text' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: { showSignatures: true, showTerms: true, showNotes: false },
  },

  // ── 3. WORK ORDER / JOB CARD (Class B: Operations) ──
  {
    id: 'schema_work_order',
    code: 'work_order',
    name: 'Work Order / Service Card',
    docClass: 'class_b_administrative',
    category: 'operations',
    description: 'Operational work order specifying job site, scope, scheduled milestones, task checklists, and site supervisor sign-off.',
    icon: 'clipboard',
    defaultTemplate: 'work_order',
    isSystem: true,
    sections: [
      {
        id: 'project_site',
        title: 'Project & Site Information',
        fields: [
          { id: 'client_name', label: 'Client / Account Name', type: 'text', required: true },
          { id: 'site_address', label: 'Site Address / Installation Location', type: 'textarea', required: true },
          { id: 'site_contact_person', label: 'Site Contact Person & Phone', type: 'text' },
          { id: 'project_title', label: 'Project / Job Title', type: 'text', required: true },
        ],
      },
      {
        id: 'schedule_timeline',
        title: 'Schedule & Execution Timeline',
        fields: [
          { id: 'start_date', label: 'Scheduled Start Date', type: 'date', required: true },
          { id: 'completion_deadline', label: 'Target Completion Date', type: 'date', required: true },
          { id: 'assigned_team_lead', label: 'Assigned Lead / Supervisor', type: 'text' },
        ],
      },
      {
        id: 'scope_tasks',
        title: 'Scope of Work & Task Schedule',
        fields: [
          { id: 'scope_summary', label: 'Scope Summary', type: 'textarea', placeholder: 'Executive description of work to be performed' },
          {
            id: 'tasks_list',
            label: 'Task Execution Checklist',
            type: 'table',
            columns: [
              { key: 'task_description', label: 'Task / Activity', type: 'text', widthPercentage: 50, align: 'left' },
              { key: 'materials_required', label: 'Materials / Tools', type: 'text', widthPercentage: 30, align: 'left' },
              { key: 'est_hours', label: 'Est. Hours', type: 'number', widthPercentage: 20, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'safety_authorization',
        title: 'Safety, Compliance & Sign-off',
        fields: [
          { id: 'safety_instructions', label: 'Safety Guidelines & Protocols', type: 'textarea', placeholder: 'PPE requirements, site clearance, power shutdown protocols' },
          { id: 'supervisor_name', label: 'Site Supervisor Name', type: 'text', required: true },
          { id: 'client_representative', label: 'Client Representative Name', type: 'text' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: 'Supervisor Authorization',
      recipientAcceptanceLabel: 'Client Site Acceptance',
    },
  },

  // ── 4. BUSINESS LETTERHEAD (Class B: Communications) ──
  {
    id: 'schema_business_letterhead',
    code: 'business_letterhead',
    name: 'Executive Business Letter',
    docClass: 'class_b_administrative',
    category: 'business_letters',
    description: 'Corporate executive letterhead for formal business letters, client notices, memos, or official announcements.',
    icon: 'file-text',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'recipient_details',
        title: 'Recipient Information',
        fields: [
          { id: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
          { id: 'recipient_organization', label: 'Organization / Company', type: 'text' },
          { id: 'recipient_address', label: 'Recipient Address', type: 'textarea' },
        ],
      },
      {
        id: 'letter_content',
        title: 'Letter Content',
        fields: [
          { id: 'subject', label: 'Subject Line', type: 'text', required: true, placeholder: 'e.g. Regarding Partnership Agreement Q3' },
          { id: 'reference_number', label: 'Our Ref / Notice Ref', type: 'text', placeholder: 'REF/2026/041' },
          { id: 'salutation', label: 'Salutation', type: 'text', defaultValue: 'Dear Sir/Madam,' },
          { id: 'body_paragraphs', label: 'Letter Body', type: 'textarea', required: true, placeholder: 'Type the letter content here...' },
          { id: 'closing_text', label: 'Complimentary Close', type: 'text', defaultValue: 'Sincerely,' },
        ],
      },
      {
        id: 'signatory_block',
        title: 'Signatory',
        fields: [
          { id: 'signatory_name', label: 'Signatory Name', type: 'text', required: true },
          { id: 'signatory_title', label: 'Signatory Title', type: 'text' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: { showSignatures: true, showTerms: false, showNotes: false, authorizedSignatoryLabel: 'Authorized Signatory' },
  },

  // ── 5. EQUIPMENT RESPONSIBILITY LETTER (Class C: Custom Document Example) ──
  {
    id: 'schema_equipment_responsibility_letter',
    code: 'equipment_responsibility',
    name: 'Equipment Responsibility Undertaking',
    docClass: 'class_c_custom',
    category: 'custom',
    description: 'Asset handover undertaking detailing company hardware issued to employees or contractors with return and liability obligations.',
    icon: 'shield',
    defaultTemplate: 'custom_studio',
    isSystem: true,
    sections: [
      {
        id: 'custodian_info',
        title: 'Equipment Custodian Details',
        fields: [
          { id: 'employee_name', label: 'Custodian / Employee Name', type: 'text', required: true },
          { id: 'employee_id', label: 'Employee ID / National ID', type: 'text' },
          { id: 'department', label: 'Department', type: 'text' },
          { id: 'handover_date', label: 'Asset Issue Date', type: 'date', required: true },
        ],
      },
      {
        id: 'assets_issued',
        title: 'Issued Hardware & Assets',
        fields: [
          {
            id: 'equipment_table',
            label: 'Equipment Inventory',
            type: 'table',
            columns: [
              { key: 'item_name', label: 'Item / Model', type: 'text', widthPercentage: 35, align: 'left' },
              { key: 'serial_number', label: 'Serial / Service Tag', type: 'text', widthPercentage: 35, align: 'left' },
              { key: 'condition', label: 'Condition', type: 'text', widthPercentage: 15, align: 'center' },
              { key: 'replacement_value', label: 'Value (₹)', type: 'currency', widthPercentage: 15, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'undertaking_terms',
        title: 'Undertaking & Custody Terms',
        fields: [
          {
            id: 'terms_text',
            label: 'Obligation Statement',
            type: 'textarea',
            defaultValue: 'I hereby acknowledge receipt of the above-listed equipment in satisfactory working condition. I agree to use it exclusively for authorized business purposes, exercise due care, and surrender all items upon separation or demand.',
          },
          { id: 'custodian_signature_name', label: 'Custodian Signature Name', type: 'text', required: true },
          { id: 'it_approver_name', label: 'IT / Operations Approver Name', type: 'text', required: true },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: 'Issued By (IT / Assets)',
      recipientAcceptanceLabel: 'Received & Acknowledged By',
    },
  },

  {
    id: 'schema_salary_slip',
    code: 'salary_slip',
    name: 'Salary Slip / Payslip',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Monthly payroll statement detailing earnings, statutory deductions, gross salary, and net take-home pay.',
    icon: 'credit-card',
    defaultTemplate: 'payslip',
    isSystem: true,
    sections: [
      {
        id: 'employee_details',
        title: 'Employee & Payroll Details',
        fields: [
          { id: 'employee_name', label: 'Employee Name', type: 'text', required: true, defaultValue: 'Aarav Sharma' },
          { id: 'employee_id', label: 'Employee ID', type: 'text', required: true, defaultValue: 'EMP-0142' },
          { id: 'department', label: 'Department', type: 'text', defaultValue: 'Engineering & Technology' },
          { id: 'designation', label: 'Designation', type: 'text', defaultValue: 'Lead Platform Architect' },
          { id: 'pay_period', label: 'Pay Period', type: 'text', defaultValue: 'October 2026' },
          { id: 'pay_days', label: 'Pay Days / Worked Days', type: 'text', defaultValue: '31 Days' },
          { id: 'bank_reference', label: 'Bank Account Ref', type: 'text', defaultValue: 'HDFC Bank ****5432' },
          { id: 'payroll_currency', label: 'Currency', type: 'text', defaultValue: 'INR (₹)' },
        ],
      },
      {
        id: 'earnings_breakdown',
        title: 'Earnings Breakdown',
        fields: [
          {
            id: 'earnings_table',
            label: 'Earnings Components',
            type: 'table',
            columns: [
              { key: 'earning_head', label: 'Earning Head', type: 'text', widthPercentage: 50, align: 'left' },
              { key: 'current_amount', label: 'Current Amount (₹)', type: 'currency', widthPercentage: 25, align: 'right' },
              { key: 'ytd_amount', label: 'YTD Amount (₹)', type: 'currency', widthPercentage: 25, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'deductions_breakdown',
        title: 'Deductions Breakdown',
        fields: [
          {
            id: 'deductions_table',
            label: 'Deduction Components',
            type: 'table',
            columns: [
              { key: 'deduction_head', label: 'Deduction Head', type: 'text', widthPercentage: 50, align: 'left' },
              { key: 'current_amount', label: 'Current Amount (₹)', type: 'currency', widthPercentage: 25, align: 'right' },
              { key: 'ytd_amount', label: 'YTD Amount (₹)', type: 'currency', widthPercentage: 25, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'net_pay_summary',
        title: 'Net Salary Summary',
        fields: [
          { id: 'gross_earnings', label: 'Gross Earnings', type: 'currency', defaultValue: '₹1,50,000' },
          { id: 'total_deductions', label: 'Total Deductions', type: 'currency', defaultValue: '₹18,500' },
          { id: 'net_pay', label: 'Net Take-Home Pay', type: 'currency', defaultValue: '₹1,31,500', required: true },
          { id: 'payment_date', label: 'Payment Date', type: 'date', defaultValue: '31 Oct 2026' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: 'Authorized Payroll Officer',
      recipientAcceptanceLabel: 'Employee Acknowledgement',
    },
  },

  {
    id: 'schema_experience_certificate',
    code: 'experience_certificate',
    name: 'Experience Certificate',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Formal employment verification certificate certifying tenure, conduct, and final designation.',
    icon: 'award',
    defaultTemplate: 'certificate',
    isSystem: true,
    sections: [
      {
        id: 'certificate_overview',
        title: 'Certificate Particulars',
        fields: [
          { id: 'certificate_number', label: 'Certificate Reference No', type: 'text', required: true, defaultValue: 'EXP-2026-091' },
          { id: 'issue_date', label: 'Issue Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'employee_name', label: 'Employee Full Name', type: 'text', required: true, defaultValue: 'Kavita Sundaram' },
          { id: 'employee_id', label: 'Employee ID', type: 'text', defaultValue: 'EMP-0288' },
        ],
      },
      {
        id: 'service_tenure',
        title: 'Service Tenure & Designation',
        fields: [
          { id: 'employment_from', label: 'Employment Start Date', type: 'date', defaultValue: '15 Jan 2022' },
          { id: 'employment_to', label: 'Employment End Date', type: 'date', defaultValue: '30 Sep 2026' },
          { id: 'last_designation', label: 'Final Role / Designation', type: 'text', required: true, defaultValue: 'Principal Quality Assurance Engineer' },
          { id: 'conduct_summary', label: 'Performance & Conduct Remarks', type: 'textarea', defaultValue: 'During her tenure, her professional conduct was exemplary and her technical contributions to our core products were highly valued.' },
        ],
      },
      {
        id: 'verification_meta',
        title: 'Official Verification Contact',
        fields: [
          { id: 'issuing_officer', label: 'Issuing Officer Name', type: 'text', required: true, defaultValue: 'Priya Nair' },
          { id: 'contact_for_verification', label: 'HR Verification Email / Tel', type: 'text', defaultValue: 'verification@apexinfotech.io' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: 'Authorized HR Signatory',
      recipientAcceptanceLabel: 'Official Seal Stamp',
    },
  },

  {
    id: 'schema_internship_letter',
    code: 'internship_letter',
    name: 'Internship Offer & Appointment',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Internship contract detailing learning objectives, stipend, mentor assignment, and project duration.',
    icon: 'book-open',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'intern_info',
        title: 'Intern Particulars',
        fields: [
          { id: 'intern_name', label: 'Intern Full Name', type: 'text', required: true, defaultValue: 'Rohit Joshi' },
          { id: 'intern_address', label: 'Residential Address', type: 'textarea', defaultValue: '12 Green Park, Jayanagar, Bengaluru' },
          { id: 'mentor_name', label: 'Assigned Mentor', type: 'text', defaultValue: 'Aarav Sharma (Staff Engineer)' },
        ],
      },
      {
        id: 'internship_terms',
        title: 'Internship Terms & Schedule',
        fields: [
          { id: 'internship_role', label: 'Internship Domain / Track', type: 'text', required: true, defaultValue: 'Software Engineering Intern' },
          { id: 'duration', label: 'Duration', type: 'text', defaultValue: '6 Months' },
          { id: 'start_date', label: 'Start Date', type: 'date', defaultValue: '01 Nov 2026' },
          { id: 'stipend_terms', label: 'Monthly Stipend', type: 'currency', defaultValue: '₹40,000 / Month' },
          { id: 'work_mode', label: 'Work Mode', type: 'text', defaultValue: 'Hybrid (3 days in office)' },
          { id: 'acceptance_terms', label: 'Acceptance Terms', type: 'textarea', defaultValue: 'Please sign and return the copy within 7 business days to confirm your participation.' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: false,
      authorizedSignatoryLabel: 'Authorized Organization Signatory',
      recipientAcceptanceLabel: 'Intern Acceptance Signature',
    },
  },

  {
    id: 'schema_relieving_letter',
    code: 'relieving_letter',
    name: 'Relieving Letter & Clearance',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Formal relieving and discharge letter confirming resignation acceptance and clearance of liabilities.',
    icon: 'user-check',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'employee_info',
        title: 'Relieved Employee Details',
        fields: [
          { id: 'employee_name', label: 'Employee Name', type: 'text', required: true, defaultValue: 'Deepa Roy' },
          { id: 'employee_id', label: 'Employee ID', type: 'text', defaultValue: 'EMP-0199' },
          { id: 'designation', label: 'Designation at Separation', type: 'text', defaultValue: 'Senior Data Scientist' },
          { id: 'last_working_day', label: 'Last Working Day', type: 'date', required: true, defaultValue: '30 Sep 2026' },
        ],
      },
      {
        id: 'clearance_details',
        title: 'Clearance & Resignation Formalities',
        fields: [
          { id: 'resignation_reference', label: 'Resignation Submission Date', type: 'text', defaultValue: 'Submitted on 15 Aug 2026' },
          { id: 'clearance_status', label: 'Departmental Clearance Status', type: 'text', defaultValue: 'All IT, Finance & Admin clearances completed' },
          { id: 'handover_status', label: 'Knowledge Transfer & Asset Handover', type: 'text', defaultValue: 'Satisfactorily handed over' },
          { id: 'closing_text', label: 'Official Discharge Note', type: 'textarea', defaultValue: 'You are relieved from your duties and responsibilities with the organization with effect from the close of business hours on your last working day. We wish you success in your future endeavors.' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: false,
      authorizedSignatoryLabel: 'Head of People Operations',
      recipientAcceptanceLabel: 'Employee Acknowledgment',
    },
  },

  {
    id: 'schema_promotion_letter',
    code: 'promotion_letter',
    name: 'Promotion & Title Elevation Letter',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Formal career advancement letter confirming elevation to new role, revised CTC, and reporting manager.',
    icon: 'trending-up',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'employee_info',
        title: 'Employee Particulars',
        fields: [
          { id: 'employee_name', label: 'Employee Name', type: 'text', required: true, defaultValue: 'Siddharth Rao' },
          { id: 'employee_id', label: 'Employee ID', type: 'text', defaultValue: 'EMP-0215' },
          { id: 'effective_date', label: 'Promotion Effective Date', type: 'date', defaultValue: '01 Oct 2026' },
        ],
      },
      {
        id: 'elevation_details',
        title: 'New Role & Remuneration Details',
        fields: [
          { id: 'new_job_title', label: 'New Designation', type: 'text', required: true, defaultValue: 'Director of Platform Engineering' },
          { id: 'new_department', label: 'Department', type: 'text', defaultValue: 'Core Engineering' },
          { id: 'new_reporting_manager', label: 'Reporting Manager', type: 'text', defaultValue: 'Chief Technology Officer (CTO)' },
          { id: 'new_compensation', label: 'Revised Annual CTC', type: 'currency', required: true, defaultValue: '₹3,600,000' },
          { id: 'employee_acknowledgement', label: 'Congratulatory Note & Mandate', type: 'textarea', defaultValue: 'In recognition of your outstanding leadership and delivery excellence over the past year, management is pleased to elevate your role. We look forward to your continued leadership.' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: false,
      authorizedSignatoryLabel: 'Managing Director / CEO',
      recipientAcceptanceLabel: 'Employee Acceptance Signature',
    },
  },

  {
    id: 'schema_leave_approval_letter',
    code: 'leave_approval_letter',
    name: 'Leave Approval & Sanction Letter',
    docClass: 'class_b_administrative',
    category: 'hr_employment',
    description: 'Official sanction letter for sabbatical, maternity, study or extended privilege leave.',
    icon: 'calendar',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'leave_details',
        title: 'Leave Sanction Particulars',
        fields: [
          { id: 'employee_name', label: 'Employee Name', type: 'text', required: true, defaultValue: 'Meera Iyer' },
          { id: 'employee_id', label: 'Employee ID', type: 'text', defaultValue: 'EMP-0310' },
          { id: 'leave_type', label: 'Leave Category / Type', type: 'text', defaultValue: 'Paid Sabbatical & Research Leave' },
          { id: 'approved_period', label: 'Sanctioned Dates', type: 'text', defaultValue: '15 Oct 2026 to 15 Dec 2026 (60 Days)' },
          { id: 'approval_status', label: 'Sanction Status', type: 'text', defaultValue: 'APPROVED WITH PAY' },
          { id: 'return_date', label: 'Expected Return to Work Date', type: 'date', defaultValue: '16 Dec 2026' },
          { id: 'manager_name', label: 'Approving Manager', type: 'text', defaultValue: 'Anand Kulkarni (VP Engineering)' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: false,
      authorizedSignatoryLabel: 'Approving Manager Signature',
      recipientAcceptanceLabel: 'HR Operations Sanction Stamp',
    },
  },

  {
    id: 'schema_authorization_letter',
    code: 'authorization_letter',
    name: 'Official Letter of Authorization',
    docClass: 'class_b_administrative',
    category: 'business_letters',
    description: 'Formal corporate power of representation authorizing a designated agent or employee to execute actions.',
    icon: 'file-check',
    defaultTemplate: 'letterhead',
    isSystem: true,
    sections: [
      {
        id: 'authorized_person',
        title: 'Authorized Representative Particulars',
        fields: [
          { id: 'authorized_person_name', label: 'Authorized Person Name', type: 'text', required: true, defaultValue: 'Harish Nambiar' },
          { id: 'authorized_person_id', label: 'National ID / Passport Ref', type: 'text', defaultValue: 'Aadhaar: **** **** 8821' },
          { id: 'contact_for_verification', label: 'Official Phone / Contact', type: 'text', defaultValue: '+91 98450 11223' },
        ],
      },
      {
        id: 'authorization_scope',
        title: 'Scope of Authorized Powers',
        fields: [
          { id: 'authorization_purpose', label: 'Purpose of Authorization', type: 'text', defaultValue: 'Representation before Bangalore Municipal Corporation for Building Approvals' },
          { id: 'authorization_scope', label: 'Powers Granted', type: 'textarea', defaultValue: 'The authorized representative is empowered to submit drawings, sign inspection undertakings, collect approved plans, and receive official notices on behalf of the company.' },
          { id: 'validity_start', label: 'Valid From', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'validity_end', label: 'Valid Until', type: 'date', defaultValue: '31 Dec 2026' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: false,
      authorizedSignatoryLabel: 'Authorized Corporate Signatory',
      recipientAcceptanceLabel: 'Specimen Signature of Representative',
    },
  },

  {
    id: 'schema_meeting_minutes',
    code: 'meeting_minutes',
    name: 'Meeting Minutes & Action Register',
    docClass: 'class_b_administrative',
    category: 'corporate_admin',
    description: 'Corporate executive meeting minutes record with agenda, action items register, and distribution list.',
    icon: 'calendar',
    defaultTemplate: 'minutes',
    isSystem: true,
    sections: [
      {
        id: 'meeting_overview',
        title: 'Meeting Overview',
        fields: [
          { id: 'meeting_id', label: 'Meeting ID', type: 'text', defaultValue: 'MIN-2026-042' },
          { id: 'meeting_date', label: 'Meeting Date & Time', type: 'date', defaultValue: '09 Oct 2026, 10:00 AM' },
          { id: 'location', label: 'Location / Room', type: 'text', defaultValue: 'Boardroom A / Google Meet' },
          { id: 'chairperson', label: 'Chairperson', type: 'text', defaultValue: 'Vikram Sengupta (CEO)' },
          { id: 'recorder', label: 'Minutes Recorded By', type: 'text', defaultValue: 'Anita Desai (Chief of Staff)' },
          { id: 'attendees', label: 'Attendees List', type: 'text', defaultValue: 'V. Sengupta, A. Desai, P. Nair, S. Kumar, K. Menon' },
        ],
      },
      {
        id: 'agenda_and_discussion',
        title: 'Agenda & Discussion Summary',
        fields: [
          { id: 'agenda_summary', label: 'Agenda Topics Discussed', type: 'textarea', defaultValue: '1. Q4 Enterprise Roadmap Review\n2. ISO 27001 Certification Audit Preparation\n3. Campus Expansion Budget Review' },
        ],
      },
      {
        id: 'action_register',
        title: 'Decisions & Action Register',
        fields: [
          {
            id: 'actions_table',
            label: 'Action Items Table',
            type: 'table',
            columns: [
              { key: 'agenda_item', label: 'Agenda Item', type: 'text', widthPercentage: 30, align: 'left' },
              { key: 'decision', label: 'Decision / Resolution', type: 'text', widthPercentage: 35, align: 'left' },
              { key: 'owner', label: 'Action Owner', type: 'text', widthPercentage: 20, align: 'left' },
              { key: 'due_date', label: 'Due Date', type: 'date', widthPercentage: 15, align: 'center' },
            ],
          },
        ],
      },
      {
        id: 'adjournment_next_meeting',
        title: 'Next Meeting & Distribution',
        fields: [
          { id: 'next_meeting_date', label: 'Next Scheduled Meeting', type: 'text', defaultValue: '23 Oct 2026, 10:00 AM' },
          { id: 'distribution_list', label: 'Distribution List', type: 'text', defaultValue: 'All Executive Committee Members' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: false,
      authorizedSignatoryLabel: 'Chairperson Approval',
      recipientAcceptanceLabel: 'Recorder Signature',
    },
  },

  {
    id: 'schema_site_inspection_report',
    code: 'site_inspection_report',
    name: 'Site Inspection Report',
    docClass: 'class_b_administrative',
    category: 'operations',
    description: 'Field engineering and construction site quality inspection report with checkpoint observation matrix.',
    icon: 'clipboard-list',
    defaultTemplate: 'checklist',
    isSystem: true,
    sections: [
      {
        id: 'inspection_overview',
        title: 'Site & Project Overview',
        fields: [
          { id: 'inspection_id', label: 'Inspection ID', type: 'text', required: true, defaultValue: 'INSP-2026-089' },
          { id: 'inspection_date', label: 'Inspection Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'project_name', label: 'Project Name', type: 'text', required: true, defaultValue: 'Apex CyberTower Expansion' },
          { id: 'site_address', label: 'Site Address', type: 'text', defaultValue: 'Plot 14, Electronic City, Phase 1' },
          { id: 'inspector', label: 'Lead Inspector', type: 'text', defaultValue: 'Rajesh K. Varma' },
          { id: 'drawing_reference', label: 'Drawing / Spec Ref', type: 'text', defaultValue: 'DWG-STR-401 Rev C' },
        ],
      },
      {
        id: 'checklist_observations',
        title: 'Checklist / Observation Matrix',
        fields: [
          {
            id: 'checklist_table',
            label: 'Inspection Observations',
            type: 'table',
            columns: [
              { key: 'checkpoint', label: 'Checkpoint', type: 'text', widthPercentage: 30, align: 'left' },
              { key: 'criterion', label: 'Criterion / Spec', type: 'text', widthPercentage: 35, align: 'left' },
              { key: 'result', label: 'Result', type: 'text', widthPercentage: 15, align: 'center' },
              { key: 'remarks', label: 'Remarks', type: 'text', widthPercentage: 20, align: 'left' },
            ],
          },
        ],
      },
      {
        id: 'findings_corrective_action',
        title: 'Findings & Corrective Action',
        fields: [
          { id: 'findings', label: 'Key Site Findings', type: 'textarea', defaultValue: 'Reinforced concrete curing meets 28-day standard. Formwork alignment verified within +/- 2mm.' },
          { id: 'corrective_action', label: 'Corrective Actions Required', type: 'textarea', defaultValue: 'Clean up secondary rebar ties at Grid 4B before pouring slab 3.' },
          { id: 'follow_up_date', label: 'Follow-Up Verification Date', type: 'date', defaultValue: '14 Oct 2026' },
          { id: 'verified_by', label: 'Verified By', type: 'text', defaultValue: 'Chief Structural Engineer' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: 'Authorized Quality Inspector',
      recipientAcceptanceLabel: 'Site Supervisor Acceptance',
    },
  },

  {
    id: 'schema_customer_account_statement',
    code: 'customer_account_statement',
    name: 'Customer Account Statement',
    docClass: 'class_b_administrative',
    category: 'finance_accounting',
    description: 'Statement of account detailing opening balance, invoice debits, payment credits, and closing balance.',
    icon: 'file-text',
    defaultTemplate: 'statement',
    isSystem: true,
    sections: [
      {
        id: 'account_overview',
        title: 'Account & Statement Period',
        fields: [
          { id: 'customer_name', label: 'Customer Legal Name', type: 'text', required: true, defaultValue: 'Tata Motors Commercial Vehicles Ltd' },
          { id: 'customer_account_no', label: 'Customer Account No', type: 'text', defaultValue: 'ACC-TM-9081' },
          { id: 'statement_date', label: 'Statement Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'period_start', label: 'Period From', type: 'date', defaultValue: '01 Sep 2026' },
          { id: 'period_end', label: 'Period To', type: 'date', defaultValue: '30 Sep 2026' },
          { id: 'currency', label: 'Currency', type: 'text', defaultValue: 'INR (₹)' },
        ],
      },
      {
        id: 'transaction_history',
        title: 'Transaction History & Ledger Entries',
        fields: [
          {
            id: 'ledger_table',
            label: 'Ledger Records',
            type: 'table',
            columns: [
              { key: 'date', label: 'Date', type: 'date', widthPercentage: 15, align: 'left' },
              { key: 'reference', label: 'Doc Ref', type: 'text', widthPercentage: 20, align: 'left' },
              { key: 'description', label: 'Description', type: 'text', widthPercentage: 35, align: 'left' },
              { key: 'debit', label: 'Debit (₹)', type: 'currency', widthPercentage: 15, align: 'right' },
              { key: 'credit', label: 'Credit (₹)', type: 'currency', widthPercentage: 15, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'account_balances',
        title: 'Account Balance Summary',
        fields: [
          { id: 'opening_balance', label: 'Opening Balance', type: 'currency', defaultValue: '₹0.00' },
          { id: 'total_debit', label: 'Total Invoiced (Debits)', type: 'currency', defaultValue: '₹5,90,000' },
          { id: 'total_credit', label: 'Total Paid (Credits)', type: 'currency', defaultValue: '₹3,00,000' },
          { id: 'closing_balance', label: 'Closing Balance Due', type: 'currency', defaultValue: '₹2,90,000', required: true },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: 'Accounts Receivable Dept',
      recipientAcceptanceLabel: 'Client Finance Confirmation',
    },
  },

  {
    id: 'schema_delivery_challan',
    code: 'delivery_challan',
    name: 'Delivery Challan (Rule 55)',
    docClass: 'class_b_administrative',
    category: 'operations',
    description: 'Statutory goods dispatch and transport delivery challan conforming to GST Rule 55 requirements.',
    icon: 'truck',
    defaultTemplate: 'purchase',
    isSystem: true,
    sections: [
      {
        id: 'dispatch_header',
        title: 'Dispatch & Consignee Particulars',
        fields: [
          { id: 'challan_number', label: 'Challan Number', type: 'text', required: true, defaultValue: 'DC-2026-0512' },
          { id: 'issue_date', label: 'Dispatch Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'consignor_name', label: 'Consignor (Supplier)', type: 'text', defaultValue: 'Apex Infotech Solutions Pvt Ltd' },
          { id: 'consignee_name', label: 'Consignee (Recipient)', type: 'text', required: true, defaultValue: 'Bharat Heavy Engineering Corp' },
          { id: 'consignee_address', label: 'Delivery Site Address', type: 'textarea', defaultValue: 'Gate 4, Heavy Equipment Complex, Peenya Phase II' },
          { id: 'transporter_name', label: 'Transporter Name', type: 'text', defaultValue: 'BlueDart Surface Logistics' },
          { id: 'vehicle_reference', label: 'Vehicle Number', type: 'text', defaultValue: 'KA-04-MB-8921' },
        ],
      },
      {
        id: 'goods_dispatched',
        title: 'Dispatched Goods & Materials',
        fields: [
          {
            id: 'items_table',
            label: 'Goods Inventory Table',
            type: 'table',
            columns: [
              { key: 'item_code', label: 'Item Code', type: 'text', widthPercentage: 15, align: 'left' },
              { key: 'description', label: 'Description', type: 'text', widthPercentage: 45, align: 'left' },
              { key: 'qty', label: 'Quantity', type: 'number', widthPercentage: 15, align: 'right' },
              { key: 'unit', label: 'Unit', type: 'text', widthPercentage: 10, align: 'center' },
              { key: 'line_total', label: 'Taxable Val (₹)', type: 'currency', widthPercentage: 15, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'transport_instructions',
        title: 'Delivery Instructions & Reason',
        fields: [
          { id: 'delivery_instructions', label: 'Purpose of Transport', type: 'text', defaultValue: 'Supply of goods on approval / Job work under Rule 55' },
          { id: 'order_reference', label: 'Purchase Order Reference', type: 'text', defaultValue: 'PO-BHEC-2026-880' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: false,
      authorizedSignatoryLabel: 'Authorized Consignor Signatory',
      recipientAcceptanceLabel: 'Received in Good Condition By',
    },
  },

  {
    id: 'schema_move_in_handover_checklist',
    code: 'move_in_handover_checklist',
    name: 'Move-In Handover Checklist',
    docClass: 'class_b_administrative',
    category: 'property_management',
    description: 'Property management handover record with room condition inspection and utility meter readings.',
    icon: 'home',
    defaultTemplate: 'checklist',
    isSystem: true,
    sections: [
      {
        id: 'handover_overview',
        title: 'Tenancy & Property Overview',
        fields: [
          { id: 'handover_no', label: 'Handover Ref No', type: 'text', defaultValue: 'HO-2026-104' },
          { id: 'handover_date', label: 'Handover Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'tenant_name', label: 'Tenant Full Name', type: 'text', required: true, defaultValue: 'Sameer Sen' },
          { id: 'property_address', label: 'Rental Property Address', type: 'textarea', defaultValue: 'Flat 602, Tower B, Prestige Palms, Whitefield' },
          { id: 'landlord_name', label: 'Landlord / Property Manager', type: 'text', defaultValue: 'Sunita Mehra' },
          { id: 'unit_reference', label: 'Unit / Key Tag', type: 'text', defaultValue: 'Unit 602 (Keys: 3 Main, 2 Mailbox)' },
        ],
      },
      {
        id: 'room_inspection',
        title: 'Room & Fixture Checklist',
        fields: [
          {
            id: 'checklist_table',
            label: 'Inspection Items Table',
            type: 'table',
            columns: [
              { key: 'checkpoint', label: 'Area / Fixture', type: 'text', widthPercentage: 30, align: 'left' },
              { key: 'criterion', label: 'Standard / Condition', type: 'text', widthPercentage: 35, align: 'left' },
              { key: 'result', label: 'Status', type: 'text', widthPercentage: 15, align: 'center' },
              { key: 'remarks', label: 'Tenant Remarks', type: 'text', widthPercentage: 20, align: 'left' },
            ],
          },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: 'Landlord / Property Manager Signature',
      recipientAcceptanceLabel: 'Tenant Acceptance Signature',
    },
  },

  {
    id: 'schema_rent_receipt',
    code: 'rent_receipt',
    name: 'House Rent Receipt',
    docClass: 'class_b_administrative',
    category: 'property_management',
    description: 'Standard monthly rent receipt format for HRA tax exemption claims.',
    icon: 'home',
    defaultTemplate: 'receipt',
    isSystem: true,
    sections: [
      {
        id: 'rent_details',
        title: 'Rent Payment Particulars',
        fields: [
          { id: 'receipt_no', label: 'Receipt Number', type: 'text', defaultValue: 'RENT-2026-10' },
          { id: 'receipt_date', label: 'Receipt Date', type: 'date', defaultValue: '05 Oct 2026' },
          { id: 'tenant_name', label: 'Received From (Tenant)', type: 'text', required: true, defaultValue: 'Sameer Sen' },
          { id: 'rent_amount', label: 'Rent Amount Paid (₹)', type: 'currency', required: true, defaultValue: '₹45,000' },
          { id: 'rent_period', label: 'Rent Period', type: 'text', defaultValue: 'For the month of October 2026' },
          { id: 'property_address', label: 'Property Address', type: 'textarea', defaultValue: 'Flat 602, Tower B, Prestige Palms, Whitefield, Bengaluru' },
          { id: 'payment_mode', label: 'Payment Method', type: 'text', defaultValue: 'UPI / Bank Transfer (UTR: 3291882910)' },
          { id: 'landlord_pan', label: 'Landlord PAN (for HRA)', type: 'text', defaultValue: 'ABCDE1234F' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: 'Landlord Signature (Revenue Stamp)',
      recipientAcceptanceLabel: 'Tenant Copy',
    },
  },

  {
    id: 'schema_student_fee_receipt',
    code: 'student_fee_receipt',
    name: 'Student Tuition & Fee Receipt',
    docClass: 'class_b_administrative',
    category: 'education',
    description: 'Academic institution fee receipt with tuition components, term schedule, and payment acknowledgement.',
    icon: 'graduation-cap',
    defaultTemplate: 'receipt',
    isSystem: true,
    sections: [
      {
        id: 'student_overview',
        title: 'Student & Academic Particulars',
        fields: [
          { id: 'receipt_no', label: 'Receipt Number', type: 'text', defaultValue: 'FEE-2026-0812' },
          { id: 'receipt_date', label: 'Payment Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'student_name', label: 'Student Full Name', type: 'text', required: true, defaultValue: 'Ananya Deshmukh' },
          { id: 'student_id', label: 'Enrollment / Roll No', type: 'text', defaultValue: 'ENR-2026-CS-41' },
          { id: 'program_name', label: 'Academic Course / Class', type: 'text', defaultValue: 'B.Tech Computer Science (Semester 5)' },
        ],
      },
      {
        id: 'fee_components',
        title: 'Fee Head Breakdown',
        fields: [
          {
            id: 'fee_table',
            label: 'Fee Breakdown Table',
            type: 'table',
            columns: [
              { key: 'fee_head', label: 'Fee Category', type: 'text', widthPercentage: 55, align: 'left' },
              { key: 'term', label: 'Academic Term', type: 'text', widthPercentage: 20, align: 'center' },
              { key: 'amount', label: 'Amount (₹)', type: 'currency', widthPercentage: 25, align: 'right' },
            ],
          },
        ],
      },
      {
        id: 'fee_summary',
        title: 'Payment Summary',
        fields: [
          { id: 'total_paid', label: 'Total Amount Received', type: 'currency', required: true, defaultValue: '₹85,000' },
          { id: 'balance_due', label: 'Balance Outstanding', type: 'currency', defaultValue: '₹0.00' },
          { id: 'payment_mode', label: 'Payment Mode', type: 'text', defaultValue: 'Online NetBanking (Txn Ref: NB-991823)' },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: 'Accounts / Bursar Office',
      recipientAcceptanceLabel: 'Student Acknowledgement',
    },
  },

  {
    id: 'schema_grant_proposal',
    code: 'grant_proposal',
    name: 'Grant Proposal & Program Summary',
    docClass: 'class_b_administrative',
    category: 'nonprofit',
    description: 'Formal funding grant proposal outlining program objectives, budget request, and expected impact metrics.',
    icon: 'heart',
    defaultTemplate: 'proposal',
    isSystem: true,
    sections: [
      {
        id: 'proposal_meta',
        title: 'Grant Program Overview',
        fields: [
          { id: 'proposal_id', label: 'Proposal ID', type: 'text', defaultValue: 'GRANT-2026-03' },
          { id: 'issue_date', label: 'Submission Date', type: 'date', defaultValue: '09 Oct 2026' },
          { id: 'organization_name', label: 'Applying NGO / Organization', type: 'text', defaultValue: 'Apex Digital Empowerment Foundation' },
          { id: 'funder_name', label: 'Funding Agency / Partner', type: 'text', required: true, defaultValue: 'Global Tech Equity Foundation' },
          { id: 'program_name', label: 'Project Title', type: 'text', defaultValue: 'Rural Youth STEM & Coding Literacy Drive' },
          { id: 'project_location', label: 'Target District / Geography', type: 'text', defaultValue: 'Tumkur District, Karnataka' },
        ],
      },
      {
        id: 'project_description',
        title: 'Problem Statement & Proposed Solution',
        fields: [
          { id: 'problem_statement', label: 'Statement of Need', type: 'textarea', defaultValue: 'Over 10,000 high school students in rural government schools lack access to basic computer laboratories and internet literacy.' },
          { id: 'proposed_solution', label: 'Program Implementation Plan', type: 'textarea', defaultValue: 'Deploy 5 mobile STEM vans with satellite internet, solar power, and certified mentors to conduct 40-hour hands-on coding bootcamps.' },
        ],
      },
      {
        id: 'budget_request',
        title: 'Program Budget & Resource Allocation',
        fields: [
          {
            id: 'budget_table',
            label: 'Budget Line Items Table',
            type: 'table',
            columns: [
              { key: 'activity', label: 'Program Activity / Expense Head', type: 'text', widthPercentage: 45, align: 'left' },
              { key: 'timeline', label: 'Timeline', type: 'text', widthPercentage: 25, align: 'center' },
              { key: 'total_cost', label: 'Budget (₹)', type: 'currency', widthPercentage: 30, align: 'right' },
            ],
          },
        ],
      },
    ],
    headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: 'Authorized Foundation Director',
      recipientAcceptanceLabel: 'Review Committee Acknowledgment',
    },
  },

  {
    id: "schema_goods_received_note",
    code: "goods_received_note",
    name: "Goods Received Note (GRN)",
    docClass: "class_b_administrative",
    category: "procurement",
    description: "Warehouse inbound intake document recording shipment verification, PO matching, and received goods disposition.",
    icon: "package-check",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "grn_overview",
        title: "GRN & Purchase Reference",
        fields: [
          {
            id: "grn_number",
            label: "GRN Number",
            type: "text",
            defaultValue: "GRN-2026-0881"
          },
          {
            id: "receipt_date",
            label: "Inward Receipt Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "po_reference",
            label: "Purchase Order No",
            type: "text",
            defaultValue: "PO-2026-0422"
          },
          {
            id: "vendor_name",
            label: "Supplier / Vendor Name",
            type: "text",
            required: true,
            defaultValue: "Apex Micro Systems Ltd"
          },
          {
            id: "challan_no",
            label: "Vendor DC / Invoice Ref",
            type: "text",
            defaultValue: "DC-88127"
          },
          {
            id: "vehicle_no",
            label: "Carrier Vehicle No",
            type: "text",
            defaultValue: "KA-04-MB-2219"
          }
        ]
      },
      {
        id: "inward_items",
        title: "Inward Goods Verification Table",
        fields: [
          {
            id: "grn_table",
            label: "Goods Inward Table",
            type: "table",
            columns: [
              {
                key: "item_code",
                label: "Item Code",
                type: "text",
                widthPercentage: 15,
                align: "left"
              },
              {
                key: "description",
                label: "Item Description",
                type: "text",
                widthPercentage: 35,
                align: "left"
              },
              {
                key: "ordered_qty",
                label: "PO Qty",
                type: "number",
                widthPercentage: 12,
                align: "center"
              },
              {
                key: "received_qty",
                label: "Recd Qty",
                type: "number",
                widthPercentage: 12,
                align: "center"
              },
              {
                key: "accepted_qty",
                label: "Acc. Qty",
                type: "number",
                widthPercentage: 13,
                align: "center"
              },
              {
                key: "status",
                label: "QC Status",
                type: "text",
                widthPercentage: 13,
                align: "center"
              }
            ]
          }
        ]
      },
      {
        id: "grn_disposition",
        title: "Storage & Condition Notes",
        fields: [
          {
            id: "storage_bay",
            label: "Warehouse Bay / Location",
            type: "text",
            defaultValue: "Bay 4, Rack B, Tier 2"
          },
          {
            id: "remarks",
            label: "Inspector Inspection Remarks",
            type: "textarea",
            defaultValue: "All packaging intact. Seals verified. Zero transit damage observed during physical inward count."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Warehouse Receiving Officer",
      recipientAcceptanceLabel: "Quality Control Inspector"
    }
  },

  {
    id: "schema_supplier_evaluation",
    code: "supplier_evaluation",
    name: "Supplier Performance Evaluation",
    docClass: "class_b_administrative",
    category: "procurement",
    description: "Periodic supplier scorecard evaluating on-time delivery, product compliance, price stability, and vendor SLA score.",
    icon: "star",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "supplier_overview",
        title: "Supplier & Audit Period",
        fields: [
          {
            id: "eval_number",
            label: "Evaluation Audit Ref",
            type: "text",
            defaultValue: "SPE-2026-Q3"
          },
          {
            id: "supplier_name",
            label: "Supplier / Vendor Name",
            type: "text",
            required: true,
            defaultValue: "Precision Fasteners & Tools"
          },
          {
            id: "evaluation_period",
            label: "Audit Review Period",
            type: "text",
            defaultValue: "Q3 FY2026-27 (Jul - Sep 2026)"
          },
          {
            id: "lead_auditor",
            label: "Lead Procurement Auditor",
            type: "text",
            defaultValue: "Sanjay Deshmukh"
          }
        ]
      },
      {
        id: "criteria_scores",
        title: "Evaluation Criteria & Scorecard",
        fields: [
          {
            id: "evaluation_table",
            label: "Scorecard Table",
            type: "table",
            columns: [
              {
                key: "criteria",
                label: "Performance Parameter",
                type: "text",
                widthPercentage: 45,
                align: "left"
              },
              {
                key: "weight",
                label: "Weightage",
                type: "text",
                widthPercentage: 15,
                align: "center"
              },
              {
                key: "score_awarded",
                label: "Score (out of 100)",
                type: "text",
                widthPercentage: 20,
                align: "center"
              },
              {
                key: "status",
                label: "Rating",
                type: "text",
                widthPercentage: 20,
                align: "center"
              }
            ]
          }
        ]
      },
      {
        id: "evaluation_summary",
        title: "Evaluation Rating & Recommendation",
        fields: [
          {
            id: "total_score",
            label: "Overall Composite Score",
            type: "text",
            defaultValue: "94.5 / 100 (Grade A)"
          },
          {
            id: "vendor_status",
            label: "Vendor Preferred Status",
            type: "text",
            defaultValue: "APPROVED TIER-1 SUPPLIER"
          },
          {
            id: "audit_conclusion",
            label: "Audit Notes & Improvement Areas",
            type: "textarea",
            defaultValue: "Supplier maintained 99.2% on-time delivery. Zero major defect PPM reports. Recommended for 2-year contract extension."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Head of Strategic Sourcing",
      recipientAcceptanceLabel: "Supplier Account Representative"
    }
  },

  {
    id: "schema_material_issue_note",
    code: "material_issue_note",
    name: "Material Issue Note (MIN)",
    docClass: "class_b_administrative",
    category: "operations",
    description: "Internal inventory dispatch voucher transferring raw materials and components from central stores to production lines.",
    icon: "box",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "min_meta",
        title: "Requisition & Department Particulars",
        fields: [
          {
            id: "min_number",
            label: "Material Issue Slip No",
            type: "text",
            defaultValue: "MIN-2026-0391"
          },
          {
            id: "issue_date",
            label: "Issue Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "department",
            label: "Requesting Department",
            type: "text",
            defaultValue: "Assembly Line 3"
          },
          {
            id: "job_reference",
            label: "Job / Project Code",
            type: "text",
            defaultValue: "BATCH-2026-X11"
          },
          {
            id: "requested_by",
            label: "Requisitioner Name",
            type: "text",
            defaultValue: "Mohan Kumar"
          }
        ]
      },
      {
        id: "issued_materials",
        title: "Issued Materials Inventory Table",
        fields: [
          {
            id: "materials_table",
            label: "Materials Table",
            type: "table",
            columns: [
              {
                key: "item_code",
                label: "Part / Item Code",
                type: "text",
                widthPercentage: 20,
                align: "left"
              },
              {
                key: "description",
                label: "Material Description",
                type: "text",
                widthPercentage: 40,
                align: "left"
              },
              {
                key: "req_qty",
                label: "Req. Qty",
                type: "number",
                widthPercentage: 12,
                align: "center"
              },
              {
                key: "issued_qty",
                label: "Issued Qty",
                type: "number",
                widthPercentage: 12,
                align: "center"
              },
              {
                key: "unit",
                label: "UOM",
                type: "text",
                widthPercentage: 16,
                align: "center"
              }
            ]
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Stores Incharge",
      recipientAcceptanceLabel: "Department Receiving Representative"
    }
  },

  {
    id: "schema_service_report",
    code: "service_report",
    name: "Field Service & Maintenance Report",
    docClass: "class_b_administrative",
    category: "operations",
    description: "On-site technical service report documenting system diagnostics, component replacement, work hours, and client sign-off.",
    icon: "wrench",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "service_meta",
        title: "Service Call Information",
        fields: [
          {
            id: "service_ticket_no",
            label: "Service Ticket No",
            type: "text",
            defaultValue: "SRV-2026-4412"
          },
          {
            id: "service_date",
            label: "Service Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "client_name",
            label: "Client / Facility Name",
            type: "text",
            required: true,
            defaultValue: "Apex Cloud Datacenter"
          },
          {
            id: "site_location",
            label: "Site Address",
            type: "text",
            defaultValue: "Plot 18, Whitefield Tech Zone, Bengaluru"
          },
          {
            id: "equipment_tag",
            label: "Equipment / Asset Tag",
            type: "text",
            defaultValue: "UPS-TRIP-300KVA-02"
          },
          {
            id: "lead_technician",
            label: "Service Engineer Name",
            type: "text",
            defaultValue: "Ramesh Babu (Cert. Senior Specialist)"
          }
        ]
      },
      {
        id: "tasks_performed",
        title: "Service & Maintenance Log",
        fields: [
          {
            id: "service_table",
            label: "Service Tasks Table",
            type: "table",
            columns: [
              {
                key: "task",
                label: "Task / Diagnostic Step",
                type: "text",
                widthPercentage: 45,
                align: "left"
              },
              {
                key: "parts_used",
                label: "Parts Replaced",
                type: "text",
                widthPercentage: 25,
                align: "left"
              },
              {
                key: "duration",
                label: "Hours",
                type: "text",
                widthPercentage: 15,
                align: "center"
              },
              {
                key: "status",
                label: "Outcome",
                type: "text",
                widthPercentage: 15,
                align: "center"
              }
            ]
          }
        ]
      },
      {
        id: "recommendation_section",
        title: "Technical Observations & Next Preventive Service",
        fields: [
          {
            id: "findings",
            label: "Diagnostic Findings",
            type: "textarea",
            defaultValue: "System load test conducted successfully up to 85% rated capacity. Firmware updated to version 4.2.1. Capacitor bank temperatures nominal."
          },
          {
            id: "next_service_due",
            label: "Next Preventive Service Date",
            type: "date",
            defaultValue: "09 Jan 2027"
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Certified Field Service Engineer",
      recipientAcceptanceLabel: "Client Facility Manager Sign-off"
    }
  },

  {
    id: "schema_packing_list",
    code: "packing_list",
    name: "Export / Shipment Packing List",
    docClass: "class_b_administrative",
    category: "operations",
    description: "Detailed consignment packing specification outlining parcel count, net/gross weights, dimensions, and cargo contents.",
    icon: "archive",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "shipment_meta",
        title: "Consignment & Transport Details",
        fields: [
          {
            id: "packing_list_no",
            label: "Packing List Reference",
            type: "text",
            defaultValue: "PKL-2026-902"
          },
          {
            id: "date",
            label: "Dispatch Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "consignee_name",
            label: "Consignee / Recipient",
            type: "text",
            required: true,
            defaultValue: "Global Logistics Hub Ltd"
          },
          {
            id: "invoice_ref",
            label: "Commercial Invoice Ref",
            type: "text",
            defaultValue: "INV-2026-118"
          },
          {
            id: "carrier_mode",
            label: "Shipping Carrier & Mode",
            type: "text",
            defaultValue: "Blue Dart Air Express / AWB: 88192001"
          }
        ]
      },
      {
        id: "packages_list",
        title: "Cargo Inventory & Weights Table",
        fields: [
          {
            id: "packages_table",
            label: "Packages Specification Table",
            type: "table",
            columns: [
              {
                key: "pkg_no",
                label: "Box No",
                type: "text",
                widthPercentage: 12,
                align: "center"
              },
              {
                key: "contents",
                label: "Description of Goods",
                type: "text",
                widthPercentage: 42,
                align: "left"
              },
              {
                key: "qty",
                label: "Units",
                type: "number",
                widthPercentage: 12,
                align: "center"
              },
              {
                key: "net_weight",
                label: "Net (kg)",
                type: "text",
                widthPercentage: 16,
                align: "right"
              },
              {
                key: "gross_weight",
                label: "Gross (kg)",
                type: "text",
                widthPercentage: 18,
                align: "right"
              }
            ]
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Packing Incharge",
      recipientAcceptanceLabel: "Carrier Receipt & Handover Stamp"
    }
  },

  {
    id: "schema_production_order",
    code: "production_order",
    name: "Manufacturing Production Order",
    docClass: "class_b_administrative",
    category: "operations",
    description: "Factory floor production order establishing bill-of-materials consumption, target output units, and quality checkpoints.",
    icon: "cpu",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "order_meta",
        title: "Production Order Specifications",
        fields: [
          {
            id: "order_no",
            label: "Production Order No",
            type: "text",
            defaultValue: "PRD-2026-1044"
          },
          {
            id: "planned_date",
            label: "Target Completion Date",
            type: "date",
            defaultValue: "18 Oct 2026"
          },
          {
            id: "product_name",
            label: "Product Model / Assembly",
            type: "text",
            required: true,
            defaultValue: "Apex Edge Gateway v2.4"
          },
          {
            id: "batch_no",
            label: "Lot / Batch Code",
            type: "text",
            defaultValue: "LOT-26-41B"
          },
          {
            id: "planned_quantity",
            label: "Planned Output (Units)",
            type: "text",
            defaultValue: "500 Units"
          }
        ]
      },
      {
        id: "bom_section",
        title: "Bill of Materials & Component Breakdown",
        fields: [
          {
            id: "bom_table",
            label: "BOM Component Table",
            type: "table",
            columns: [
              {
                key: "part_no",
                label: "Part Number",
                type: "text",
                widthPercentage: 20,
                align: "left"
              },
              {
                key: "component_name",
                label: "Component Name",
                type: "text",
                widthPercentage: 40,
                align: "left"
              },
              {
                key: "required_qty",
                label: "Required Qty",
                type: "number",
                widthPercentage: 20,
                align: "center"
              },
              {
                key: "status",
                label: "Kitting Status",
                type: "text",
                widthPercentage: 20,
                align: "center"
              }
            ]
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Production Operations Head",
      recipientAcceptanceLabel: "Plant Quality Lead"
    }
  },

  {
    id: "schema_quality_inspection_report",
    code: "quality_inspection_report",
    name: "Quality Inspection & QA Clearance Report",
    docClass: "class_b_administrative",
    category: "operations",
    description: "Rigorous engineering quality assurance audit recording test tolerances, sample measurements, and batch clearance status.",
    icon: "shield-check",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "inspection_meta",
        title: "Inspection Batch Overview",
        fields: [
          {
            id: "report_no",
            label: "QA Report No",
            type: "text",
            defaultValue: "QAR-2026-0518"
          },
          {
            id: "inspection_date",
            label: "Audit Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "batch_lot",
            label: "Batch / Lot Number",
            type: "text",
            defaultValue: "LOT-26-41B"
          },
          {
            id: "sample_size",
            label: "Sample Count Audited",
            type: "text",
            defaultValue: "35 / 500 Units (AQL 0.65)"
          },
          {
            id: "inspector_name",
            label: "Lead QA Engineer",
            type: "text",
            defaultValue: "Siddharth Rao"
          }
        ]
      },
      {
        id: "tests_conducted",
        title: "Inspection Parameter Results",
        fields: [
          {
            id: "qa_table",
            label: "Test Results Table",
            type: "table",
            columns: [
              {
                key: "parameter",
                label: "Inspection Parameter",
                type: "text",
                widthPercentage: 35,
                align: "left"
              },
              {
                key: "spec",
                label: "Standard Specification",
                type: "text",
                widthPercentage: 25,
                align: "left"
              },
              {
                key: "measured",
                label: "Measured Average",
                type: "text",
                widthPercentage: 20,
                align: "center"
              },
              {
                key: "status",
                label: "Verdict",
                type: "text",
                widthPercentage: 20,
                align: "center"
              }
            ]
          }
        ]
      },
      {
        id: "verdict_section",
        title: "Batch Release Disposition",
        fields: [
          {
            id: "verdict",
            label: "Final Release Verdict",
            type: "text",
            defaultValue: "PASSED - APPROVED FOR PACKAGING & DISPATCH"
          },
          {
            id: "notes",
            label: "Corrective Action & Observations",
            type: "textarea",
            defaultValue: "All sample units complied strictly with dimensional tolerances and thermal operating boundaries. Zero critical or major deviations."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Head of Quality Assurance",
      recipientAcceptanceLabel: "Plant Operations Manager"
    }
  },

  {
    id: "schema_equipment_maintenance_log",
    code: "equipment_maintenance_log",
    name: "Equipment Maintenance & Service Log",
    docClass: "class_b_administrative",
    category: "operations",
    description: "Comprehensive maintenance record tracking preventive maintenance cycles, technician notes, and next scheduled service.",
    icon: "activity",
    defaultTemplate: "custom_studio",
    isSystem: true,
    sections: [
      {
        id: "equipment_meta",
        title: "Machine & Asset Specification",
        fields: [
          {
            id: "log_no",
            label: "Maintenance Log Ref",
            type: "text",
            defaultValue: "MNT-2026-119"
          },
          {
            id: "machine_name",
            label: "Equipment / Machine Name",
            type: "text",
            required: true,
            defaultValue: "Haas CNC Milling Station VF-3"
          },
          {
            id: "asset_tag",
            label: "Fixed Asset ID",
            type: "text",
            defaultValue: "FA-CNC-04"
          },
          {
            id: "operating_hours",
            label: "Total Run Hours",
            type: "text",
            defaultValue: "4,280 Hours"
          },
          {
            id: "lead_technician",
            label: "Certified Technician",
            type: "text",
            defaultValue: "Vikram Sengupta"
          }
        ]
      },
      {
        id: "maintenance_history",
        title: "Service Events & Parts Table",
        fields: [
          {
            id: "history_table",
            label: "Service History Table",
            type: "table",
            columns: [
              {
                key: "date",
                label: "Date",
                type: "date",
                widthPercentage: 18,
                align: "center"
              },
              {
                key: "service_type",
                label: "Service Category",
                type: "text",
                widthPercentage: 25,
                align: "left"
              },
              {
                key: "parts",
                label: "Lubricants / Parts Serviced",
                type: "text",
                widthPercentage: 42,
                align: "left"
              },
              {
                key: "status",
                label: "Status",
                type: "text",
                widthPercentage: 15,
                align: "center"
              }
            ]
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Chief Maintenance Engineer",
      recipientAcceptanceLabel: "Shift Supervisor Sign-off"
    }
  },

  {
    id: "schema_enrollment_confirmation_letter",
    code: "enrollment_confirmation_letter",
    name: "Student Enrollment Confirmation Letter",
    docClass: "class_b_administrative",
    category: "education",
    description: "Official academic bona fide certificate certifying student enrollment status, semester, and course program.",
    icon: "graduation-cap",
    defaultTemplate: "letterhead",
    isSystem: true,
    sections: [
      {
        id: "student_info",
        title: "Student Particulars",
        fields: [
          {
            id: "cert_no",
            label: "Certificate Reference No",
            type: "text",
            defaultValue: "ADM-CONF-2026-91"
          },
          {
            id: "date",
            label: "Issue Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "student_name",
            label: "Student Full Name",
            type: "text",
            required: true,
            defaultValue: "Aditya Swaminathan"
          },
          {
            id: "roll_no",
            label: "Roll No / Registration ID",
            type: "text",
            defaultValue: "REG-2024-MECH-09"
          },
          {
            id: "program_name",
            label: "Academic Program",
            type: "text",
            defaultValue: "Bachelor of Technology in Mechanical Engineering"
          },
          {
            id: "academic_year",
            label: "Current Academic Term",
            type: "text",
            defaultValue: "Academic Year 2026-27 (Year III, Semester V)"
          }
        ]
      },
      {
        id: "confirmation_statement",
        title: "Bona Fide Certification Statement",
        fields: [
          {
            id: "statement",
            label: "Official Certification Body",
            type: "textarea",
            defaultValue: "This is to certify that the above-named individual is a regular, full-time bona fide student of this Institution. Their academic record is in good standing and they bear exemplary conduct."
          },
          {
            id: "purpose_clause",
            label: "Applicable Purpose",
            type: "text",
            defaultValue: "Issued for education loan application and passport verification purposes."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Dean of Academic Affairs / Registrar",
      recipientAcceptanceLabel: "Official Seal of Institution"
    }
  },

  {
    id: "schema_donation_acknowledgement",
    code: "donation_acknowledgement",
    name: "Donation & Contribution Acknowledgement",
    docClass: "class_b_administrative",
    category: "nonprofit",
    description: "Charitable foundation tax-exempt donation receipt confirming contribution amount and statutory tax exemption eligibility.",
    icon: "heart-handshake",
    defaultTemplate: "receipt",
    isSystem: true,
    sections: [
      {
        id: "donor_overview",
        title: "Donor & Receipt Particulars",
        fields: [
          {
            id: "receipt_no",
            label: "Donation Receipt No",
            type: "text",
            defaultValue: "DON-2026-4402"
          },
          {
            id: "date",
            label: "Donation Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "donor_name",
            label: "Donor Name / Organization",
            type: "text",
            required: true,
            defaultValue: "Dr. Ramesh Ramanathan"
          },
          {
            id: "donor_pan",
            label: "Donor Tax ID / PAN",
            type: "text",
            defaultValue: "ABCDE1234F"
          },
          {
            id: "donor_address",
            label: "Donor Residential Address",
            type: "text",
            defaultValue: "14 Indiranagar 100ft Road, Bengaluru"
          }
        ]
      },
      {
        id: "contribution_details",
        title: "Contribution Breakdown Table",
        fields: [
          {
            id: "contribution_table",
            label: "Donation Details Table",
            type: "table",
            columns: [
              {
                key: "cause",
                label: "Designated Charitable Cause",
                type: "text",
                widthPercentage: 45,
                align: "left"
              },
              {
                key: "mode",
                label: "Payment Method & Ref",
                type: "text",
                widthPercentage: 30,
                align: "left"
              },
              {
                key: "amount",
                label: "Donated Amount (₹)",
                type: "currency",
                widthPercentage: 25,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "tax_exemption_summary",
        title: "Tax Exemption Declaration",
        fields: [
          {
            id: "total_paid",
            label: "Total Contribution Received",
            type: "currency",
            required: true,
            defaultValue: "₹50,000"
          },
          {
            id: "exemption_clause",
            label: "Statutory Exemption Certificate",
            type: "textarea",
            defaultValue: "Donations to this Trust are exempt under Section 80G of the Income Tax Act 1961. Unique Registration Number: AAAT01928929-80G."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Trustee / Treasurer",
      recipientAcceptanceLabel: "Charitable Trust Official Stamp"
    }
  },

  {
    id: "schema_tax_invoice",
    code: "tax_invoice",
    name: "Rule 46 GST Tax Invoice",
    docClass: "class_a_financial",
    category: "sales_billing",
    description: "Statutory GST tax invoice compliant with Indian GST Rule 46 with itemized HSN codes, IGST/CGST rates, and payment QR.",
    icon: "file-text",
    defaultTemplate: "invoice",
    isSystem: true,
    sections: [
      {
        id: "invoice_meta",
        title: "Invoice & Buyer Particulars",
        fields: [
          {
            id: "invoice_no",
            label: "Invoice Number",
            type: "text",
            required: true,
            defaultValue: "INV-2026-0819"
          },
          {
            id: "invoice_date",
            label: "Invoice Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "due_date",
            label: "Payment Due Date",
            type: "date",
            defaultValue: "24 Oct 2026"
          },
          {
            id: "customer_name",
            label: "Billed To (Customer Name)",
            type: "text",
            required: true,
            defaultValue: "Infosys BPM Limited"
          },
          {
            id: "customer_gstin",
            label: "Customer GSTIN",
            type: "text",
            defaultValue: "29AABCI1234F1Z8"
          },
          {
            id: "place_of_supply",
            label: "Place of Supply (State)",
            type: "text",
            defaultValue: "29-Karnataka"
          }
        ]
      },
      {
        id: "invoice_items",
        title: "Itemized Supply & Services Table",
        fields: [
          {
            id: "items_table",
            label: "Line Items Table",
            type: "table",
            columns: [
              {
                key: "description",
                label: "Item / Service Description",
                type: "text",
                widthPercentage: 40,
                align: "left"
              },
              {
                key: "hsn",
                label: "HSN/SAC",
                type: "text",
                widthPercentage: 15,
                align: "center"
              },
              {
                key: "qty",
                label: "Qty",
                type: "number",
                widthPercentage: 10,
                align: "center"
              },
              {
                key: "rate",
                label: "Rate (₹)",
                type: "currency",
                widthPercentage: 15,
                align: "right"
              },
              {
                key: "amount",
                label: "Amount (₹)",
                type: "currency",
                widthPercentage: 20,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "tax_totals",
        title: "Invoice Financial Totals",
        fields: [
          {
            id: "taxable_total",
            label: "Subtotal (Taxable Value)",
            type: "currency",
            defaultValue: "₹2,50,000"
          },
          {
            id: "cgst_amount",
            label: "CGST @ 9%",
            type: "currency",
            defaultValue: "₹22,500"
          },
          {
            id: "sgst_amount",
            label: "SGST @ 9%",
            type: "currency",
            defaultValue: "₹22,500"
          },
          {
            id: "grand_total",
            label: "Grand Total (INR)",
            type: "currency",
            required: true,
            defaultValue: "₹2,95,000"
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Corporate Signatory",
      recipientAcceptanceLabel: "Buyer Acceptance Signature"
    }
  },

  {
    id: "schema_bill_of_supply",
    code: "bill_of_supply",
    name: "Bill of Supply (Composition Supply)",
    docClass: "class_a_financial",
    category: "sales_billing",
    description: "Composition scheme and exempt supply invoice format with nil tax charge under Section 10 of CGST Act.",
    icon: "file-text",
    defaultTemplate: "invoice",
    isSystem: true,
    sections: [
      {
        id: "bill_meta",
        title: "Bill & Buyer Information",
        fields: [
          {
            id: "bill_no",
            label: "Bill Number",
            type: "text",
            required: true,
            defaultValue: "BOS-2026-031"
          },
          {
            id: "bill_date",
            label: "Bill Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "customer_name",
            label: "Customer / Buyer Name",
            type: "text",
            required: true,
            defaultValue: "Apex Retail Store"
          }
        ]
      },
      {
        id: "bill_items",
        title: "Supplied Goods Table",
        fields: [
          {
            id: "items_table",
            label: "Items Table",
            type: "table",
            columns: [
              {
                key: "description",
                label: "Product Description",
                type: "text",
                widthPercentage: 50,
                align: "left"
              },
              {
                key: "qty",
                label: "Qty",
                type: "number",
                widthPercentage: 15,
                align: "center"
              },
              {
                key: "rate",
                label: "Unit Rate (₹)",
                type: "currency",
                widthPercentage: 15,
                align: "right"
              },
              {
                key: "amount",
                label: "Total (₹)",
                type: "currency",
                widthPercentage: 20,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "total_section",
        title: "Settlement Amount",
        fields: [
          {
            id: "grand_total",
            label: "Total Amount Payable (₹)",
            type: "currency",
            required: true,
            defaultValue: "₹48,200"
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Representative",
      recipientAcceptanceLabel: "Customer Signature"
    }
  },

  {
    id: "schema_quotation",
    code: "quotation",
    name: "Formal Commercial Quotation",
    docClass: "class_a_financial",
    category: "sales_billing",
    description: "Commercial price estimate detailing line items, discount margins, delivery timelines, and offer validity terms.",
    icon: "file-text",
    defaultTemplate: "invoice",
    isSystem: true,
    sections: [
      {
        id: "quote_meta",
        title: "Quotation Overview",
        fields: [
          {
            id: "quote_no",
            label: "Quotation Reference No",
            type: "text",
            required: true,
            defaultValue: "QTN-2026-118"
          },
          {
            id: "quote_date",
            label: "Proposal Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "valid_until",
            label: "Offer Validity Date",
            type: "date",
            defaultValue: "08 Nov 2026"
          },
          {
            id: "client_name",
            label: "Prospective Client",
            type: "text",
            required: true,
            defaultValue: "Titan Industrial Solutions"
          }
        ]
      },
      {
        id: "quote_items",
        title: "Proposed Scope & Pricing Table",
        fields: [
          {
            id: "items_table",
            label: "Quotation Items Table",
            type: "table",
            columns: [
              {
                key: "item",
                label: "Scope / Deliverable",
                type: "text",
                widthPercentage: 45,
                align: "left"
              },
              {
                key: "qty",
                label: "Qty",
                type: "number",
                widthPercentage: 15,
                align: "center"
              },
              {
                key: "unit_price",
                label: "Unit Price (₹)",
                type: "currency",
                widthPercentage: 20,
                align: "right"
              },
              {
                key: "total",
                label: "Total Price (₹)",
                type: "currency",
                widthPercentage: 20,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "quote_summary",
        title: "Commercial Summary",
        fields: [
          {
            id: "grand_total",
            label: "Estimated Total Value (INR)",
            type: "currency",
            required: true,
            defaultValue: "₹4,75,000"
          },
          {
            id: "terms",
            label: "Commercial Terms",
            type: "textarea",
            defaultValue: "Payment: 50% advance on PO, 50% upon final acceptance. Delivery: 3 weeks from receipt of purchase order."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Commercial Director",
      recipientAcceptanceLabel: "Client Acceptance & PO Issue"
    }
  },

  {
    id: "schema_payment_receipt",
    code: "payment_receipt",
    name: "Official Payment Voucher & Receipt",
    docClass: "class_a_financial",
    category: "sales_billing",
    description: "Payment settlement receipt acknowledging invoice payment remittance, transaction reference, and remaining balance.",
    icon: "check-circle-2",
    defaultTemplate: "receipt",
    isSystem: true,
    sections: [
      {
        id: "receipt_meta",
        title: "Receipt Details",
        fields: [
          {
            id: "receipt_no",
            label: "Receipt Voucher No",
            type: "text",
            required: true,
            defaultValue: "REC-2026-0921"
          },
          {
            id: "date",
            label: "Receipt Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "received_from",
            label: "Received With Thanks From",
            type: "text",
            required: true,
            defaultValue: "Wipro Enterprises Ltd"
          },
          {
            id: "payment_mode",
            label: "Remittance Mode / Ref",
            type: "text",
            defaultValue: "NEFT Transfer (Ref: UTR-991823771)"
          }
        ]
      },
      {
        id: "settlement_table_sec",
        title: "Invoices Settled Table",
        fields: [
          {
            id: "settlement_table",
            label: "Invoices Settled Table",
            type: "table",
            columns: [
              {
                key: "invoice_ref",
                label: "Invoice Ref",
                type: "text",
                widthPercentage: 30,
                align: "left"
              },
              {
                key: "inv_date",
                label: "Invoice Date",
                type: "date",
                widthPercentage: 25,
                align: "center"
              },
              {
                key: "inv_amount",
                label: "Invoice Total (₹)",
                type: "currency",
                widthPercentage: 25,
                align: "right"
              },
              {
                key: "settled",
                label: "Settled Amount (₹)",
                type: "currency",
                widthPercentage: 20,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "amount_summary",
        title: "Payment Summary",
        fields: [
          {
            id: "total_paid",
            label: "Total Remittance Settled",
            type: "currency",
            required: true,
            defaultValue: "₹1,50,000"
          },
          {
            id: "balance_due",
            label: "Balance Outstanding",
            type: "currency",
            defaultValue: "₹0.00"
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Accounts Officer",
      recipientAcceptanceLabel: "Remitter Customer Copy"
    }
  },

  {
    id: "schema_credit_note",
    code: "credit_note",
    name: "GST Credit Note (Rule 53)",
    docClass: "class_a_financial",
    category: "sales_billing",
    description: "Statutory GST credit note for billing adjustments, goods return credit, or discount reconciliation.",
    icon: "file-minus",
    defaultTemplate: "invoice",
    isSystem: true,
    sections: [
      {
        id: "credit_meta",
        title: "Credit Note Particulars",
        fields: [
          {
            id: "credit_note_no",
            label: "Credit Note Number",
            type: "text",
            required: true,
            defaultValue: "CRN-2026-014"
          },
          {
            id: "credit_date",
            label: "Credit Note Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "customer_name",
            label: "Recipient Customer",
            type: "text",
            required: true,
            defaultValue: "Cognizant Technology Solutions"
          },
          {
            id: "original_inv_no",
            label: "Original Tax Invoice No",
            type: "text",
            defaultValue: "INV-2026-0612"
          },
          {
            id: "original_inv_date",
            label: "Original Invoice Date",
            type: "date",
            defaultValue: "15 Sep 2026"
          }
        ]
      },
      {
        id: "adjustments_table_sec",
        title: "Credit Adjustment Details Table",
        fields: [
          {
            id: "adjustments_table",
            label: "Adjustment Items Table",
            type: "table",
            columns: [
              {
                key: "reason",
                label: "Reason for Adjustment",
                type: "text",
                widthPercentage: 45,
                align: "left"
              },
              {
                key: "taxable_val",
                label: "Taxable Diff (₹)",
                type: "currency",
                widthPercentage: 25,
                align: "right"
              },
              {
                key: "gst_diff",
                label: "GST Adjustment (₹)",
                type: "currency",
                widthPercentage: 15,
                align: "right"
              },
              {
                key: "total_credit",
                label: "Credit (₹)",
                type: "currency",
                widthPercentage: 15,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "credit_summary",
        title: "Credit Total",
        fields: [
          {
            id: "grand_total",
            label: "Total Credit Note Value (₹)",
            type: "currency",
            required: true,
            defaultValue: "₹28,320"
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: false,
      showNotes: true,
      authorizedSignatoryLabel: "Authorized Finance Controller",
      recipientAcceptanceLabel: "Customer Acknowledgement"
    }
  },

  {
    id: "schema_purchase_order",
    code: "purchase_order",
    name: "Commercial Purchase Order",
    docClass: "class_b_administrative",
    category: "procurement",
    description: "Formal corporate purchase order specifying procurement line items, shipping address, tax rates, and vendor terms.",
    icon: "shopping-cart",
    defaultTemplate: "purchase_order",
    isSystem: true,
    sections: [
      {
        id: "po_meta",
        title: "Purchase Order Overview",
        fields: [
          {
            id: "po_number",
            label: "PO Reference Number",
            type: "text",
            required: true,
            defaultValue: "PO-2026-0812"
          },
          {
            id: "po_date",
            label: "Order Date",
            type: "date",
            defaultValue: "09 Oct 2026"
          },
          {
            id: "delivery_date",
            label: "Required Delivery Date",
            type: "date",
            defaultValue: "25 Oct 2026"
          },
          {
            id: "vendor_name",
            label: "Supplier / Vendor Name",
            type: "text",
            required: true,
            defaultValue: "Dell Technologies India Pvt Ltd"
          },
          {
            id: "delivery_address",
            label: "Delivery Site / Warehouse",
            type: "text",
            defaultValue: "Apex Tech Hub, Tower 3, Whitefield, Bengaluru"
          }
        ]
      },
      {
        id: "order_items",
        title: "Procurement Items Table",
        fields: [
          {
            id: "items_table",
            label: "Order Line Items Table",
            type: "table",
            columns: [
              {
                key: "item_code",
                label: "Part / SKU",
                type: "text",
                widthPercentage: 20,
                align: "left"
              },
              {
                key: "description",
                label: "Item Description",
                type: "text",
                widthPercentage: 40,
                align: "left"
              },
              {
                key: "qty",
                label: "Qty",
                type: "number",
                widthPercentage: 10,
                align: "center"
              },
              {
                key: "unit_price",
                label: "Unit Price (₹)",
                type: "currency",
                widthPercentage: 15,
                align: "right"
              },
              {
                key: "total_amount",
                label: "Total (₹)",
                type: "currency",
                widthPercentage: 15,
                align: "right"
              }
            ]
          }
        ]
      },
      {
        id: "po_totals",
        title: "Order Commercial Summary",
        fields: [
          {
            id: "order_total",
            label: "Total Purchase Order Value",
            type: "currency",
            required: true,
            defaultValue: "₹6,45,000"
          },
          {
            id: "payment_terms",
            label: "Payment Terms & Freight",
            type: "text",
            defaultValue: "Net 30 Days after successful GRN inspection. Freight prepaid."
          }
        ]
      }
    ],
    headerConfig: {
      showLogo: true,
      showOrgDetails: true,
      showDocNumber: true,
      showDate: true
    },
    footerConfig: {
      showSignatures: true,
      showTerms: true,
      showNotes: true,
      authorizedSignatoryLabel: "Chief Procurement Officer",
      recipientAcceptanceLabel: "Vendor Acceptance & Confirmation"
    }
  }
];
