/**
 * CONNECTED WORKFLOW REGISTRY — BILLFRAME UNIVERSAL ENGINE
 * 
 * 14 Purpose-Built Connected Workflow Blueprints for Business Lifecycle Automation:
 * 1. Quote-to-Cash (Commercial sales lifecycle)
 * 2. Procure-to-Pay (Supply chain & vendor procurement)
 * 3. Service Intake to Bill (Field service & repair jobs)
 * 4. Hire-to-Retire (HR, staffing & payroll lifecycle)
 * 5. Manufacture-to-Dispatch (Industrial production & logistics)
 * 6. Contract Progress Billing (Construction & engineering works)
 * 7. Sales Return Reconciliation (Returns, refunds & credit notes)
 * 8. Vendor Rate Escalation (Price adjustments & debit notes)
 * 9. Import Customs Clearance (Cross-border foreign trade)
 * 10. Tenancy Lifecycle (Residential & commercial property leasing)
 * 11. Student Enrollment to Fee (Education & academies)
 * 12. Asset Allocation & Custody (Corporate IT & equipment)
 * 13. Corporate Board Governance (Secretarial standards SS-1/SS-2)
 * 14. Safety & Field Audit (OSHA/HSE workplace compliance)
 * 
 * CRITICAL RULE:
 * Workflows carry relevant fields across records through typed domain operations
 * while requiring human confirmation for high-impact financial, legal, employment, or safety actions.
 */

export interface WorkflowStep {
  readonly stepIndex: number;
  readonly docId: string;
  readonly docName: string;
  readonly role: string;
  readonly autoCarryFields: readonly string[];
  readonly manualConfirmFields: readonly string[];
  readonly actionLabel: string;
}

export interface ConnectedWorkflowBlueprint {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly triggerEvent: string;
  readonly steps: readonly WorkflowStep[];
  readonly statutoryChecks: readonly string[];
  readonly humanApprovalRequired: boolean;
}

export const CONNECTED_WORKFLOWS: readonly ConnectedWorkflowBlueprint[] = [
  {
    id: 'quote_to_cash',
    name: 'Quote to Cash Lifecycle',
    category: 'Commercial Sales',
    description: 'End-to-end commercial sales lifecycle converting price proposals into confirmed orders, statutory tax invoices, and final payment discharge.',
    triggerEvent: 'Customer requests formal quotation or price proposal',
    humanApprovalRequired: true,
    statutoryChecks: ['CBIC GST Rule 46', 'GSTIN verification', 'Place of supply determination'],
    steps: [
      {
        stepIndex: 1,
        docId: 'estimate',
        docName: 'Commercial Quotation / Estimate',
        role: 'Commercial price quote & scope proposal',
        autoCarryFields: ['customer.name', 'customer.gstin', 'customer.billing_address', 'items.list'],
        manualConfirmFields: ['validity_days', 'commercial_terms'],
        actionLabel: 'Issue Quotation',
      },
      {
        stepIndex: 2,
        docId: 'sales_order',
        docName: 'Sales Order Confirmation',
        role: 'Formal order booking committed against buyer PO',
        autoCarryFields: ['customer.name', 'customer.gstin', 'customer.billing_address', 'items.list'],
        manualConfirmFields: ['customer_po_number', 'committed_dispatch_date'],
        actionLabel: 'Confirm Order Booking',
      },
      {
        stepIndex: 3,
        docId: 'tax_invoice',
        docName: 'GST Tax Invoice',
        role: 'Statutory commercial tax invoice under Rule 46',
        autoCarryFields: ['customer.name', 'customer.gstin', 'customer.billing_address', 'items.list', 'tax.breakdown'],
        manualConfirmFields: ['invoice_serial_number', 'place_of_supply', 'payment_terms'],
        actionLabel: 'Generate Tax Invoice',
      },
      {
        stepIndex: 4,
        docId: 'receipt',
        docName: 'Payment Receipt',
        role: 'Official discharge acknowledgment of cleared funds',
        autoCarryFields: ['customer.name', 'invoice.number', 'financials.grand_total'],
        manualConfirmFields: ['payment_mode', 'bank_utr_reference', 'amount_received'],
        actionLabel: 'Discharge Payment',
      },
    ],
  },
  {
    id: 'procure_to_pay',
    name: 'Procure to Pay (P2P)',
    category: 'Supply Chain & Procurement',
    description: 'Vendor procurement workflow coordinating purchase requisitions, orders, inward gate delivery (GRN), quality inspection, and treasury voucher payouts.',
    triggerEvent: 'Store requisition or low stock reorder threshold reached',
    humanApprovalRequired: true,
    statutoryChecks: ['GST ITC Rule 16(2) three-way match', 'Vendor GSTIN active status', 'TDS withholding (194Q)'],
    steps: [
      {
        stepIndex: 1,
        docId: 'purchase_order',
        docName: 'Purchase Order',
        role: 'Binding procurement contract issued to vendor',
        autoCarryFields: ['vendor.name', 'vendor.gstin', 'vendor.address', 'items.list'],
        manualConfirmFields: ['delivery_due_date', 'payment_terms'],
        actionLabel: 'Issue Purchase Order',
      },
      {
        stepIndex: 2,
        docId: 'goods_received_note',
        docName: 'Goods Received Note (GRN)',
        role: 'Inward gate delivery inspection & physical count verification',
        autoCarryFields: ['vendor.name', 'po.number', 'items.list'],
        manualConfirmFields: ['packages_received', 'damaged_count', 'accepted_quantity'],
        actionLabel: 'Record Inward GRN',
      },
      {
        stepIndex: 3,
        docId: 'site_inspection',
        docName: 'Quality Inspection Certificate',
        role: 'Technical batch quality signoff and acceptance certificate',
        autoCarryFields: ['po.number', 'grn.number', 'vendor.name'],
        manualConfirmFields: ['test_parameters', 'inspection_result', 'inspector_signoff'],
        actionLabel: 'Certify QA Acceptance',
      },
      {
        stepIndex: 4,
        docId: 'payment_voucher',
        docName: 'Payment Voucher',
        role: 'Rule 52 treasury disbursement voucher with statutory TDS deduction',
        autoCarryFields: ['vendor.name', 'vendor.bank_details', 'invoice.number'],
        manualConfirmFields: ['tds_deduction_amount', 'bank_payment_utr', 'authorized_by'],
        actionLabel: 'Disburse Payment',
      },
    ],
  },
  {
    id: 'service_intake_to_bill',
    name: 'Service Intake to Invoicing',
    category: 'Field Service & Engineering',
    description: 'Field service and workshop workflow tracking customer equipment intake, technician job cards, completion reports, and mixed supply billing.',
    triggerEvent: 'Customer brings in equipment or logs service maintenance call',
    humanApprovalRequired: true,
    statutoryChecks: ['Mixed vs composite supply determination', 'SAC 9987 / 9983 classification'],
    steps: [
      {
        stepIndex: 1,
        docId: 'work_order',
        docName: 'Service Intake Job Card',
        role: 'Equipment custody, initial diagnostic, and issue description',
        autoCarryFields: ['customer.name', 'customer.phone'],
        manualConfirmFields: ['serial_number', 'reported_defects', 'estimated_charges'],
        actionLabel: 'Open Job Card',
      },
      {
        stepIndex: 2,
        docId: 'site_inspection',
        docName: 'Service Completion Report',
        role: 'Technician resolution report with parts replaced and test log',
        autoCarryFields: ['customer.name', 'job_card.number'],
        manualConfirmFields: ['technician_notes', 'spare_parts_used', 'customer_acknowledgment'],
        actionLabel: 'Sign Off Completion',
      },
      {
        stepIndex: 3,
        docId: 'service_invoice',
        docName: 'Service Tax Invoice',
        role: 'Itemized invoice for labor and spare parts with tax breakup',
        autoCarryFields: ['customer.name', 'customer.phone', 'job_card.number'],
        manualConfirmFields: ['labor_sac_code', 'spare_parts_hsn', 'grand_total'],
        actionLabel: 'Bill Service Job',
      },
    ],
  },
  {
    id: 'hire_to_retire',
    name: 'Hire to Retire Employee Lifecycle',
    category: 'Human Resources & Payroll',
    description: 'Complete employee lifecycle from recruitment offer to monthly compensation payroll, IT hardware allocation, and exit relieving certificates.',
    triggerEvent: 'Candidate selected for corporate hiring',
    humanApprovalRequired: true,
    statutoryChecks: ['Payment of Wages Act 1936', 'EPF & ESI thresholds', 'Section 192 TDS on salary'],
    steps: [
      {
        stepIndex: 1,
        docId: 'job_offer',
        docName: 'Job Offer Letter',
        role: 'Formal offer with designation, CTC compensation, and joining date',
        autoCarryFields: ['candidate.name', 'candidate.email'],
        manualConfirmFields: ['annual_ctc', 'designation', 'joining_date'],
        actionLabel: 'Send Offer Letter',
      },
      {
        stepIndex: 2,
        docId: 'equipment_handover',
        docName: 'Equipment Responsibility Memo',
        role: 'Corporate laptop, hardware, and access card allocation agreement',
        autoCarryFields: ['employee.name', 'employee.id'],
        manualConfirmFields: ['hardware_serial', 'asset_tag', 'device_model'],
        actionLabel: 'Hand Over Assets',
      },
      {
        stepIndex: 3,
        docId: 'salary_slip',
        docName: 'Monthly Salary Slip / Payslip',
        role: 'Monthly compensation breakdown with PF, ESI, PT, and TDS deductions',
        autoCarryFields: ['employee.name', 'employee.id', 'employee.bank_account'],
        manualConfirmFields: ['attendance_days', 'overtime_hours', 'net_salary_credited'],
        actionLabel: 'Issue Salary Slip',
      },
      {
        stepIndex: 4,
        docId: 'experience_cert',
        docName: 'Experience & Relieving Certificate',
        role: 'Service verification and clean exit clearance certificate',
        autoCarryFields: ['employee.name', 'employee.id', 'employee.designation'],
        manualConfirmFields: ['last_working_day', 'conduct_appraisal', 'director_signoff'],
        actionLabel: 'Issue Relieving Certificate',
      },
    ],
  },
  {
    id: 'manufacture_to_dispatch',
    name: 'Manufacture to Dispatch',
    category: 'Manufacturing & Industrial',
    description: 'Production order tracking, bill of materials fulfillment, QA batch certification, Rule 55 transport challans, and final tax billing.',
    triggerEvent: 'Production planning release against sales orders or inventory buffer',
    humanApprovalRequired: true,
    statutoryChecks: ['CBIC GST Rule 55 transit rules', 'e-Way bill generation threshold', 'ISO 9001 QA criteria'],
    steps: [
      {
        stepIndex: 1,
        docId: 'sales_order',
        docName: 'Production Work Order',
        role: 'Factory production authorization specifying batch target and specs',
        autoCarryFields: ['product.name', 'target_quantity'],
        manualConfirmFields: ['batch_number', 'raw_material_allocation', 'machine_line'],
        actionLabel: 'Release Production Order',
      },
      {
        stepIndex: 2,
        docId: 'site_inspection',
        docName: 'QA Batch Inspection Certificate',
        role: 'Finished goods quality verification and release approval',
        autoCarryFields: ['batch.number', 'product.name'],
        manualConfirmFields: ['tolerance_results', 'qa_inspector_signature', 'release_status'],
        actionLabel: 'Certify Batch QA',
      },
      {
        stepIndex: 3,
        docId: 'packing_list',
        docName: 'Dispatch Packing List',
        role: 'Package weight tally, container breakdown, and carton manifest',
        autoCarryFields: ['product.name', 'customer.name'],
        manualConfirmFields: ['carton_count', 'gross_weight_kg', 'net_weight_kg'],
        actionLabel: 'Generate Packing List',
      },
      {
        stepIndex: 4,
        docId: 'delivery_challan',
        docName: 'Delivery Challan (Rule 55)',
        role: 'Statutory transit documentation for inter-state or job work transport',
        autoCarryFields: ['customer.name', 'customer.address', 'items.list'],
        manualConfirmFields: ['vehicle_registration', 'transporter_id', 'eway_bill_number'],
        actionLabel: 'Issue Delivery Challan',
      },
      {
        stepIndex: 5,
        docId: 'tax_invoice',
        docName: 'Commercial Tax Invoice',
        role: 'Final statutory commercial sales invoice with HSN and taxes',
        autoCarryFields: ['customer.name', 'customer.gstin', 'challan.number', 'items.list'],
        manualConfirmFields: ['invoice_number', 'payment_terms'],
        actionLabel: 'Finalize Tax Invoice',
      },
    ],
  },
  {
    id: 'contract_progress_billing',
    name: 'Contract Progress & Milestone Billing',
    category: 'Construction & Civil Projects',
    description: 'Stage-gate project billing tracking statements of work, architect progress certifications (AIA G702), and retention release vouchers.',
    triggerEvent: 'Contractor achieves measurable project milestone on site',
    humanApprovalRequired: true,
    statutoryChecks: ['Works contract GST rate (18% SAC 9954)', 'Labour welfare cess (1%)', 'Contractor TDS (194C)'],
    steps: [
      {
        stepIndex: 1,
        docId: 'work_order',
        docName: 'Construction Work Contract / SOW',
        role: 'Binding agreement with bill of quantities (BOQ) and stage-gate milestones',
        autoCarryFields: ['client.name', 'site.address', 'contract.sum'],
        manualConfirmFields: ['retention_percentage', 'completion_target_date'],
        actionLabel: 'Execute Contract',
      },
      {
        stepIndex: 2,
        docId: 'progress_invoice',
        docName: 'Progress Invoice / RA Bill',
        role: 'AIA G702 progress billing showing work completed to date and retention',
        autoCarryFields: ['client.name', 'contract.sum'],
        manualConfirmFields: ['milestone_percentage', 'retention_withheld', 'net_bill_amount'],
        actionLabel: 'Submit Progress Bill',
      },
      {
        stepIndex: 3,
        docId: 'site_inspection',
        docName: 'Site Engineer Certification',
        role: 'Chartered engineer physical measurement and quality validation',
        autoCarryFields: ['site.address', 'ra_bill.number'],
        manualConfirmFields: ['measurement_book_reference', 'structural_safety_signoff'],
        actionLabel: 'Certify Measurements',
      },
      {
        stepIndex: 4,
        docId: 'receipt',
        docName: 'Milestone Clearance Receipt',
        role: 'Discharge of approved net running account bill payment',
        autoCarryFields: ['client.name', 'ra_bill.number'],
        manualConfirmFields: ['utr_number', 'cleared_amount'],
        actionLabel: 'Acknowledge Payment',
      },
    ],
  },
  {
    id: 'sales_return_reconciliation',
    name: 'Sales Return & Credit Adjustment',
    category: 'Commercial Accounts',
    description: 'Order reversal workflow inspecting physical customer returns, issuing statutory Rule 53 credit notes, and updating accounts receivable ledgers.',
    triggerEvent: 'Customer rejects or returns goods due to defect, return, or pricing correction',
    humanApprovalRequired: true,
    statutoryChecks: ['CBIC GST Rule 53 original invoice link', 'Time limit under Section 34(2) (30th Nov)'],
    steps: [
      {
        stepIndex: 1,
        docId: 'sales_return_note',
        docName: 'Sales Return Note',
        role: 'Inward physical return tally with defect inspection notes',
        autoCarryFields: ['customer.name', 'original_invoice.number'],
        manualConfirmFields: ['returned_quantity', 'return_reason', 'warehouse_inspector'],
        actionLabel: 'Log Return Note',
      },
      {
        stepIndex: 2,
        docId: 'credit_note',
        docName: 'GST Credit Note',
        role: 'Statutory tax reduction note under Section 34(1) linked to original invoice',
        autoCarryFields: ['customer.name', 'customer.gstin', 'original_invoice.number'],
        manualConfirmFields: ['credit_note_number', 'adjusted_taxable_value', 'tax_reduction'],
        actionLabel: 'Issue Credit Note',
      },
      {
        stepIndex: 3,
        docId: 'customer_statement',
        docName: 'Customer Account Statement',
        role: 'Running ledger tally showing adjusted closing balance and zero dispute',
        autoCarryFields: ['customer.name', 'credit_note.number'],
        manualConfirmFields: ['statement_period', 'closing_balance'],
        actionLabel: 'Update Account Ledger',
      },
    ],
  },
  {
    id: 'vendor_rate_escalation',
    name: 'Vendor Debit Revision & Dispute Adjustment',
    category: 'Procurement Accounts',
    description: 'Commercial price adjustment workflow recording vendor rate revisions, additional freight charges, or short supplies via statutory debit notes.',
    triggerEvent: 'Vendor notifies agreed rate escalation or buyer discovers taxable deficiency',
    humanApprovalRequired: true,
    statutoryChecks: ['CBIC GST Rule 53 debit note compliance', 'ITC availability for recipient'],
    steps: [
      {
        stepIndex: 1,
        docId: 'debit_note',
        docName: 'GST Debit Note',
        role: 'Supplementary charge under Section 34(3) increasing invoice liability',
        autoCarryFields: ['vendor.name', 'vendor.gstin', 'original_invoice.number'],
        manualConfirmFields: ['debit_note_number', 'additional_taxable_value', 'tax_added'],
        actionLabel: 'Issue Debit Note',
      },
      {
        stepIndex: 2,
        docId: 'payment_voucher',
        docName: 'Supplementary Payment Voucher',
        role: 'Disbursement voucher clearing supplementary balance to vendor',
        autoCarryFields: ['vendor.name', 'debit_note.number'],
        manualConfirmFields: ['payment_utr', 'cleared_amount'],
        actionLabel: 'Disburse Supplementary Due',
      },
    ],
  },
  {
    id: 'import_customs_clearance',
    name: 'Import & Cross-Border Customs Clearance',
    category: 'International Trade (Exim)',
    description: 'Cross-border trade workflow coordinating preliminary proforma invoices, foreign currency export billing, packing manifests, and customs filings.',
    triggerEvent: 'Overseas buyer accepts international sales quotation',
    humanApprovalRequired: true,
    statutoryChecks: ['FEMA 1999 foreign exchange regulations', 'DGFT IEC validation', 'ICC Incoterms® 2020'],
    steps: [
      {
        stepIndex: 1,
        docId: 'proforma',
        docName: 'Proforma Commercial Invoice',
        role: 'Preliminary invoice for overseas buyer advance wire and import license',
        autoCarryFields: ['buyer.name', 'buyer.country', 'items.list'],
        manualConfirmFields: ['incoterms_rule', 'currency_code', 'port_of_discharge'],
        actionLabel: 'Issue Proforma Invoice',
      },
      {
        stepIndex: 2,
        docId: 'export_invoice',
        docName: 'Export Commercial Invoice',
        role: 'Statutory cross-border invoice under LUT without integrated tax',
        autoCarryFields: ['buyer.name', 'currency_code', 'incoterms_rule', 'items.list'],
        manualConfirmFields: ['lut_arn_number', 'port_of_loading', 'shipping_bill_number'],
        actionLabel: 'Issue Export Invoice',
      },
      {
        stepIndex: 3,
        docId: 'packing_list',
        docName: 'Export Cargo Packing List',
        role: 'Container manifest specifying gross weight, net weight, and cube meters',
        autoCarryFields: ['buyer.name', 'export_invoice.number'],
        manualConfirmFields: ['container_number', 'seal_number', 'carton_dimensions'],
        actionLabel: 'Generate Packing Manifest',
      },
      {
        stepIndex: 4,
        docId: 'receipt',
        docName: 'Foreign Wire Settlement Receipt',
        role: 'Banking discharge recording SWIFT / wire remittance and FIRC certificate',
        autoCarryFields: ['buyer.name', 'export_invoice.number'],
        manualConfirmFields: ['swift_reference', 'foreign_inward_remittance_cert'],
        actionLabel: 'Record Foreign Inflow',
      },
    ],
  },
  {
    id: 'tenancy_lifecycle',
    name: 'Residential & Commercial Tenancy Lifecycle',
    category: 'Property Management',
    description: 'Property leasing workflow coordinating lease agreements, monthly rent receipts for income tax HRA claims, and security deposit refunds.',
    triggerEvent: 'Tenant enters lease agreement or pays monthly rental',
    humanApprovalRequired: true,
    statutoryChecks: ['Income Tax Act Section 10(13A) HRA rules', 'Landlord PAN declaration over ₹1,00,000/yr'],
    steps: [
      {
        stepIndex: 1,
        docId: 'work_order',
        docName: 'Residential Lease Agreement',
        role: 'Legal tenancy deed specifying monthly rent, tenure, and security deposit',
        autoCarryFields: ['tenant.name', 'property.address'],
        manualConfirmFields: ['monthly_rent', 'security_deposit_held', 'lease_term_months'],
        actionLabel: 'Execute Lease Deed',
      },
      {
        stepIndex: 2,
        docId: 'rent_receipt',
        docName: 'Monthly Rent Receipt (HRA)',
        role: 'Section 10(13A) income tax verified receipt with landlord PAN',
        autoCarryFields: ['tenant.name', 'property.address', 'landlord.pan'],
        manualConfirmFields: ['rental_month', 'rent_amount', 'payment_mode'],
        actionLabel: 'Issue Rent Receipt',
      },
      {
        stepIndex: 3,
        docId: 'payment_voucher',
        docName: 'Security Deposit Refund Voucher',
        role: 'Tenancy exit voucher recording deposit return after inspection deductions',
        autoCarryFields: ['tenant.name', 'property.address'],
        manualConfirmFields: ['deductions_for_damages', 'net_deposit_refunded', 'bank_utr'],
        actionLabel: 'Refund Security Deposit',
      },
    ],
  },
  {
    id: 'student_enrollment_to_fee',
    name: 'Student Enrollment to Academic Fee Collection',
    category: 'Education & Training',
    description: 'Academic workflow coordinating student admissions, itemized tuition fee receipts, and institutional bonafide certification.',
    triggerEvent: 'Student admitted to academy or pays academic term installment',
    humanApprovalRequired: true,
    statutoryChecks: ['UGC / AICTE guidelines', 'GST educational exemption Notification 12/2017'],
    steps: [
      {
        stepIndex: 1,
        docId: 'job_offer',
        docName: 'Academic Admission Confirmation',
        role: 'Formal enrollment offer with program details and fee structure schedule',
        autoCarryFields: ['student.name', 'program.name'],
        manualConfirmFields: ['enrollment_id', 'total_academic_fee', 'due_dates'],
        actionLabel: 'Confirm Admission',
      },
      {
        stepIndex: 2,
        docId: 'student_fee_receipt',
        docName: 'Academic Fee Receipt',
        role: 'Institutional tuition, lab, and library fee voucher for student/parent',
        autoCarryFields: ['student.name', 'enrollment_id', 'program.name'],
        manualConfirmFields: ['term_installment', 'tuition_fee', 'lab_fee', 'concession'],
        actionLabel: 'Issue Fee Receipt',
      },
      {
        stepIndex: 3,
        docId: 'experience_cert',
        docName: 'Bonafide Student Certificate',
        role: 'Institutional certificate verifying active enrollment for passport or loan',
        autoCarryFields: ['student.name', 'enrollment_id', 'program.name'],
        manualConfirmFields: ['academic_year', 'registrar_signature'],
        actionLabel: 'Issue Bonafide Certificate',
      },
    ],
  },
  {
    id: 'asset_allocation_custody',
    name: 'IT Hardware & Asset Custody Lifecycle',
    category: 'Facilities & Corporate IT',
    description: 'Corporate hardware procurement, employee equipment handover agreement, serial enrollment, and return decommissioning.',
    triggerEvent: 'New employee onboarded or hardware allocated from corporate store',
    humanApprovalRequired: true,
    statutoryChecks: ['Corporate IT security policy', 'Company asset inventory tracking'],
    steps: [
      {
        stepIndex: 1,
        docId: 'purchase_order',
        docName: 'IT Hardware Procurement Order',
        role: 'PO to authorized Apple / Dell enterprise vendor for laptops & monitors',
        autoCarryFields: ['vendor.name', 'items.list'],
        manualConfirmFields: ['device_specifications', 'warranty_terms'],
        actionLabel: 'Order Hardware',
      },
      {
        stepIndex: 2,
        docId: 'equipment_handover',
        docName: 'Equipment Responsibility Memo',
        role: 'Binding employee custody agreement with serial numbers and usage terms',
        autoCarryFields: ['employee.name', 'employee.id'],
        manualConfirmFields: ['asset_tag', 'serial_number', 'accessories_included'],
        actionLabel: 'Issue Equipment Memo',
      },
      {
        stepIndex: 3,
        docId: 'site_inspection',
        docName: 'Asset Return & Decommission Audit',
        role: 'Hardware physical condition check upon employee exit or lease renewal',
        autoCarryFields: ['employee.name', 'asset_tag', 'serial_number'],
        manualConfirmFields: ['physical_condition', 'data_wipe_certified', 'it_signoff'],
        actionLabel: 'Audit Returned Asset',
      },
    ],
  },
  {
    id: 'corporate_board_governance',
    name: 'Corporate Board Governance & Resolutions',
    category: 'Corporate Secretarial',
    description: 'Secretarial workflow coordinating formal meeting notices, agendas, ICSI SS-1 meeting minutes, and certified board resolutions.',
    triggerEvent: 'Board of Directors or Committee meeting convened',
    humanApprovalRequired: true,
    statutoryChecks: ['Companies Act 2013 Section 118', 'ICSI Secretarial Standard-1 (SS-1) on Board Meetings'],
    steps: [
      {
        stepIndex: 1,
        docId: 'work_order',
        docName: 'Notice & Agenda of Meeting',
        role: 'Statutory 7-day prior notice convening board meeting with agenda items',
        autoCarryFields: ['company.name', 'company.cin'],
        manualConfirmFields: ['meeting_date_time', 'venue', 'agenda_items'],
        actionLabel: 'Circulate Meeting Notice',
      },
      {
        stepIndex: 2,
        docId: 'meeting_minutes',
        docName: 'ICSI SS-1 Meeting Minutes (MoM)',
        role: 'Formal proceedings record with attendees, resolutions, and director voting',
        autoCarryFields: ['company.name', 'meeting_date_time', 'venue'],
        manualConfirmFields: ['directors_present', 'resolutions_passed', 'chairperson_signature'],
        actionLabel: 'Draft Meeting Minutes',
      },
      {
        stepIndex: 3,
        docId: 'experience_cert',
        docName: 'Certified True Copy of Board Resolution',
        role: 'Formal extract of passed resolution for bank mandates or statutory filings',
        autoCarryFields: ['company.name', 'company.cin'],
        manualConfirmFields: ['resolution_text', 'authorized_signatories', 'cs_signoff'],
        actionLabel: 'Issue Certified Resolution',
      },
    ],
  },
  {
    id: 'safety_field_audit',
    name: 'Facility Safety Inspection & Corrective Action',
    category: 'HSE & Workplace Safety',
    description: 'Workplace health, safety and environment (HSE) audit assessing hazards, scoring facility compliance, and mandating corrective action plans.',
    triggerEvent: 'Quarterly facility safety audit or regulatory workplace inspection',
    humanApprovalRequired: true,
    statutoryChecks: ['Factories Act 1948 safety provisions', 'OSHA 1910 standards', 'ISO 45001 compliance'],
    steps: [
      {
        stepIndex: 1,
        docId: 'site_inspection',
        docName: 'HSE Site Inspection Report',
        role: 'Comprehensive field audit checking fire safety, earthing, PPE, and exits',
        autoCarryFields: ['facility.name', 'facility.address'],
        manualConfirmFields: ['safety_score_percentage', 'critical_violations', 'auditor_signature'],
        actionLabel: 'Record Field Audit',
      },
      {
        stepIndex: 2,
        docId: 'work_order',
        docName: 'Hazard Corrective Action Plan',
        role: 'Mandatory remedial tasks assigned to site engineering with deadlines',
        autoCarryFields: ['facility.name', 'site_inspection.number'],
        manualConfirmFields: ['corrective_tasks', 'responsible_engineer', 'target_completion_date'],
        actionLabel: 'Assign Corrective Actions',
      },
      {
        stepIndex: 3,
        docId: 'receipt',
        docName: 'Safety Compliance Certification',
        role: 'Final auditor certification confirming remedial actions closed and site certified',
        autoCarryFields: ['facility.name', 'work_order.number'],
        manualConfirmFields: ['closure_date', 'lead_auditor_seal'],
        actionLabel: 'Certify Safety Clearance',
      },
    ],
  },
];

/**
 * Accessor methods for Connected Workflows
 */
export class ConnectedWorkflowRegistry {
  static getAllWorkflows(): readonly ConnectedWorkflowBlueprint[] {
    return CONNECTED_WORKFLOWS;
  }

  static getWorkflowById(id: string): ConnectedWorkflowBlueprint | undefined {
    if (!id) return undefined;
    const lower = id.toLowerCase().replace(/[\s-]/g, '_');
    return CONNECTED_WORKFLOWS.find((w) => w.id.toLowerCase() === lower);
  }

  static getWorkflowsForDocument(docId: string): ConnectedWorkflowBlueprint[] {
    const lower = docId.toLowerCase();
    return CONNECTED_WORKFLOWS.filter((w) =>
      w.steps.some((s) => s.docId.toLowerCase() === lower)
    );
  }

  static getNextStep(
    workflowId: string,
    currentDocId: string
  ): WorkflowStep | undefined {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow) return undefined;
    const currentIndex = workflow.steps.findIndex(
      (s) => s.docId.toLowerCase() === currentDocId.toLowerCase()
    );
    if (currentIndex >= 0 && currentIndex < workflow.steps.length - 1) {
      return workflow.steps[currentIndex + 1];
    }
    return undefined;
  }

  static getAvailableTransitions(docId: string): {
    workflow: ConnectedWorkflowBlueprint;
    currentStep: WorkflowStep;
    nextStep?: WorkflowStep;
  }[] {
    const lower = docId.toLowerCase();
    const transitions: {
      workflow: ConnectedWorkflowBlueprint;
      currentStep: WorkflowStep;
      nextStep?: WorkflowStep;
    }[] = [];

    for (const w of CONNECTED_WORKFLOWS) {
      const idx = w.steps.findIndex((s) => s.docId.toLowerCase() === lower);
      if (idx >= 0) {
        transitions.push({
          workflow: w,
          currentStep: w.steps[idx],
          nextStep: idx < w.steps.length - 1 ? w.steps[idx + 1] : undefined,
        });
      }
    }
    return transitions;
  }
}
