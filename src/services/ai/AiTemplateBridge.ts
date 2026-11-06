/**
 * AI TEMPLATE BRIDGE
 * Connects AI Document Drafts to Billframe's official document template engines:
 * 1. UniversalDocumentRenderer (Gold/Black Document Master standard for Administrative & Custom docs)
 * 2. PdfService & GST Layout Engines (CBIC Rule 46 GST 01-05 & Classic Invoicing)
 * 3. Point of Sale Thermal Receipt Engine (80mm POS)
 */

import { ParsedDocumentDraft } from './AiDocumentAgent';
import { BusinessProfile } from '../../domain/profile/types';
import { SYSTEM_SCHEMAS } from '../../domain/documents/universal/SystemSchemas';
import { UniversalDocumentInstance, UniversalDocumentSchema } from '../../domain/documents/universal/types';
import { UniversalDocumentRenderer } from '../pdf/UniversalDocumentRenderer';
import { PdfService } from '../pdf/PdfService';
import { renderGstTaxInvoiceHtml } from '../pdf/templates/gst';
import { FullDocument } from '../../data/repositories/DocumentRepository';
import { createMoney, formatMoney } from '../../domain/money/Money';

export interface DocumentTemplateOption {
  id: string;
  name: string;
  description: string;
  category: 'commercial' | 'administrative' | 'retail';
}

export class AiTemplateBridge {
  /**
   * Returns all valid document templates available for a given draft
   */
  static getAvailableTemplates(draft: ParsedDocumentDraft): DocumentTemplateOption[] {
    const isCommercial = this.isCommercialDocument(draft);
    const docType = (draft.docType || '').toLowerCase();
    const title = (draft.documentTitle || '').toLowerCase();

    if (isCommercial) {
      return [
        {
          id: 'gst_01',
          name: 'Executive Letterhead (GST-01)',
          description: 'CBIC Rule 46 letterhead with gold/black identity, tax grid, and statutory provenance.',
          category: 'commercial',
        },
        {
          id: 'gst_02',
          name: 'Structured Ledger (GST-02)',
          description: 'Tabular accounting ledger layout with dual-state tax reconciliation.',
          category: 'commercial',
        },
        {
          id: 'gst_03',
          name: 'Minimal Professional (GST-03)',
          description: 'Clean monochrome high-density invoice layout for modern enterprises.',
          category: 'commercial',
        },
        {
          id: 'gst_04',
          name: 'Corporate B2B (GST-04)',
          description: 'Enterprise vendor billing format with purchase order tracking and payment terms.',
          category: 'commercial',
        },
        {
          id: 'gst_05',
          name: 'Trade Supply Chain (GST-05)',
          description: 'Logistics and freight distribution invoice with dispatch provenance.',
          category: 'commercial',
        },
        {
          id: 'modern',
          name: 'Modern Editorial',
          description: 'Refined typography with spacious line item cards and dual signatures.',
          category: 'commercial',
        },
        {
          id: 'compact',
          name: 'Commerce Compact',
          description: 'High efficiency multi-item invoice layout minimizing page count.',
          category: 'commercial',
        },
        {
          id: 'receipt',
          name: '80mm POS Thermal Receipt',
          description: 'Point-of-sale store receipt with itemized breakdown and cash total.',
          category: 'retail',
        },
      ];
    }

    // ATS Professional Resume / Curriculum Vitae
    if (
      docType === 'resume' ||
      docType === 'curriculum_vitae' ||
      docType === 'cv' ||
      title.includes('resume') ||
      title.includes('curriculum vitae')
    ) {
      return [
        {
          id: 'ats_resume',
          name: 'ATS Clean Minimalist',
          description: 'High-density ATS-optimized layout with clear semantic sections and 100% parseable formatting.',
          category: 'administrative',
        },
        {
          id: 'executive_cv',
          name: 'Executive Tech Dossier',
          description: 'High-impact modern engineering CV with highlighted metric callouts and competency tags.',
          category: 'administrative',
        },
      ];
    }

    // Administrative / HR / Operations
    return [
      {
        id: 'gold_master',
        name: 'Billframe Gold/Black Master',
        description: 'Statutory standard with serif branding, metadata cards, dual signatures & stamp block.',
        category: 'administrative',
      },
      {
        id: 'letterhead',
        name: 'Corporate HR Letterhead',
        description: 'Executive corporate letterhead with candidate terms and authorized sign-offs.',
        category: 'administrative',
      },
      {
        id: 'work_order',
        name: 'Field Engineering Card',
        description: 'Operational work order layout with deliverables, tasks, and technician assignments.',
        category: 'administrative',
      },
      {
        id: 'purchase_order',
        name: 'Corporate Procurement Grid',
        description: 'Procurement requisition format with vendor terms and delivery schedules.',
        category: 'administrative',
      },
    ];
  }

  /**
   * Determines default template code for a draft
   */
  static getDefaultTemplateId(draft: ParsedDocumentDraft): string {
    const docType = draft.docType?.toLowerCase() || '';
    const title = draft.documentTitle?.toLowerCase() || '';

    if (
      docType === 'resume' ||
      docType === 'curriculum_vitae' ||
      docType === 'cv' ||
      title.includes('resume') ||
      title.includes('curriculum vitae')
    ) {
      return 'ats_resume';
    }

    if (docType === 'job_offer_letter' || docType === 'appointment_letter' || title.includes('offer')) {
      return 'letterhead';
    }
    if (docType === 'work_order' || title.includes('work order')) {
      return 'work_order';
    }
    if (docType === 'purchase_order' || title.includes('purchase order')) {
      return 'purchase_order';
    }
    if (
      draft.metadata?.isRetailPos ||
      (draft.items.length >= 5 && (title.includes('grocery') || title.includes('mart') || title.includes('retail')))
    ) {
      return 'receipt';
    }
    if (this.isCommercialDocument(draft)) {
      return 'gst_01';
    }
    return 'gold_master';
  }

  /**
   * Identifies whether a draft is a commercial billing document
   */
  static isCommercialDocument(draft: ParsedDocumentDraft): boolean {
    const dt = draft.docType?.toLowerCase() || '';
    const title = draft.documentTitle?.toLowerCase() || '';

    // Administrative / HR / Operations / Institutional docs ALWAYS use universal renderer
    if (
      dt === 'resume' ||
      dt === 'curriculum_vitae' ||
      dt === 'cv' ||
      dt === 'salary_slip' ||
      dt === 'job_offer_letter' ||
      dt === 'job_application' ||
      dt === 'work_order' ||
      dt === 'nda_agreement' ||
      dt === 'rent_receipt' ||
      dt === 'student_fee_receipt' ||
      dt === 'meeting_minutes' ||
      dt === 'equipment_responsibility' ||
      dt === 'equipment_responsibility_letter' ||
      dt === 'site_inspection' ||
      dt === 'site_inspection_report' ||
      dt === 'experience_cert' ||
      dt === 'experience_certificate'
    ) {
      return false;
    }

    if (
      dt === 'invoice' ||
      dt === 'tax_invoice' ||
      dt === 'bill' ||
      dt === 'receipt' ||
      dt === 'quotation' ||
      dt === 'estimate' ||
      dt === 'proforma' ||
      dt === 'delivery_challan' ||
      dt === 'credit_note' ||
      dt === 'debit_note' ||
      dt === 'purchase_order' ||
      dt === 'sales_order' ||
      dt === 'payment_voucher' ||
      title.includes('invoice') ||
      title.includes('tax') ||
      title.includes('bill') ||
      title.includes('quote') ||
      title.includes('quotation') ||
      title.includes('estimate') ||
      title.includes('proforma') ||
      title.includes('challan') ||
      title.includes('credit note') ||
      title.includes('debit note') ||
      title.includes('order') ||
      title.includes('receipt')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Renders the complete statutory HTML using the official application template engine
   */
  static renderDraftHtml(
    draft: ParsedDocumentDraft,
    business: BusinessProfile,
    templateId?: string
  ): string {
    const effectiveTemplate = templateId || this.getDefaultTemplateId(draft);

    // 0. ATS Professional Resume / Curriculum Vitae
    if (
      effectiveTemplate === 'ats_resume' ||
      effectiveTemplate === 'executive_cv' ||
      draft.docType === 'resume' ||
      draft.docType === 'curriculum_vitae' ||
      draft.docType === 'cv' ||
      draft.documentTitle?.toLowerCase().includes('resume') ||
      draft.documentTitle?.toLowerCase().includes('curriculum vitae')
    ) {
      return this.renderAtsResumeHtml(draft, business, effectiveTemplate);
    }

    // 1. Retail POS Receipt (80mm)
    if (effectiveTemplate === 'receipt') {
      return this.renderPosReceiptHtml(draft, business);
    }

    // 2. Commercial / GST Invoices via GST Template Engine
    if (
      effectiveTemplate.startsWith('gst_') ||
      effectiveTemplate === 'modern' ||
      effectiveTemplate === 'compact' ||
      effectiveTemplate === 'executive' ||
      effectiveTemplate === 'standard' ||
      effectiveTemplate === 'minimal'
    ) {
      const fullDoc = this.buildFullDocumentFromDraft(draft, business);
      if (effectiveTemplate.startsWith('gst_')) {
        return renderGstTaxInvoiceHtml(fullDoc, business, effectiveTemplate as any);
      }
      return PdfService.generateDocumentHtml(fullDoc, business, effectiveTemplate as any, 'a4');
    }

    // 3. Administrative / HR / Operations via UniversalDocumentRenderer (Gold/Black Master)
    const { instance, schema } = this.buildUniversalInstanceAndSchema(draft, business, effectiveTemplate);
    return UniversalDocumentRenderer.renderHtml(instance, schema, business, 'a4');
  }

  /**
   * Converts ParsedDocumentDraft into FullDocument for commercial template rendering
   */
  private static buildFullDocumentFromDraft(
    draft: ParsedDocumentDraft,
    business: BusinessProfile
  ): FullDocument {
    const docType: any = draft.docType === 'tax_invoice' || draft.docType === 'invoice' ? 'invoice' : draft.docType;

    return {
      id: draft.documentId,
      business_profile_id: business.id,
      job_id: null,
      doc_type: docType,
      document_title: draft.documentTitle,
      sequence_number: 1,
      document_number: draft.documentNumber,
      customer_id: null,
      lifecycle_status: 'draft',
      issue_date: draft.issueDate,
      due_date: draft.dueDate ?? null,
      currency: draft.currency,
      subtotal_minor: Number(draft.subtotalMinor),
      discount_minor: Number(draft.discountValue),
      discount_type: draft.discountType,
      discount_value: Number(draft.discountValue),
      tax_minor: Number(draft.taxMinor),
      tax_type: draft.taxType,
      tax_rate_bp: Number(draft.taxRateBp),
      tax_label: draft.taxLabel || 'GST',
      total_minor: Number(draft.grandTotalMinor),
      total_paid_minor: 0,
      balance_minor: Number(draft.grandTotalMinor),
      payment_status: 'unpaid',
      is_overdue: false,
      deposit_minor: 0,
      po_number: null,
      payment_terms_preset: null,
      shipping_address: null,
      payment_instructions: null,
      notes: draft.notes ?? null,
      terms: draft.terms ?? null,
      internal_notes: null,
      signature_uri: null,
      signature_date: null,
      parent_document_id: null,
      is_archived: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      customer_name: draft.partyName,
      customer_business_name: draft.partyName,
      customer_email: draft.partyEmail || null,
      customer_billing_address: draft.partyAddress || null,
      customer_tax_id: draft.partyTaxId || null,
      items: draft.items.map((it, idx) => ({
        id: it.id || `item_${idx + 1}`,
        document_id: draft.documentId,
        catalog_item_id: null,
        description: it.description,
        item_notes: it.itemNotes || null,
        category: null,
        hsn_sac_code: it.hsnSac || '998314',
        hsn_sac: it.hsnSac || '998314',
        quantity_scaled: Number(it.quantityScaled),
        unit_name: it.unitName,
        unit_price_minor: Number(it.unitPriceMinor),
        line_total_minor: Number((it.unitPriceMinor * it.quantityScaled) / 10000n),
        tax_rate_bp: Number(draft.taxRateBp),
        tax_minor: Number((((it.unitPriceMinor * it.quantityScaled) / 10000n) * draft.taxRateBp) / 10000n),
        tax_type: draft.taxType,
        tax_components_json: null,
        sort_order: idx + 1,
      })),
    } as any;
  }

  /**
   * Converts ParsedDocumentDraft into UniversalDocumentInstance & Schema for UniversalDocumentRenderer
   */
  private static buildUniversalInstanceAndSchema(
    draft: ParsedDocumentDraft,
    business: BusinessProfile,
    templateCode: string
  ): { instance: UniversalDocumentInstance; schema: UniversalDocumentSchema } {
    const meta = draft.metadata || {};
    const isSalary = draft.docType === 'salary_slip' || draft.documentTitle?.toLowerCase().includes('salary');

    // 1. Locate registered schema or construct fallback
    let schema = SYSTEM_SCHEMAS.find((s) => s.code === draft.docType);
    if (!schema && isSalary) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'salary_slip');
    }
    if (!schema && (draft.docType === 'job_offer_letter' || draft.docType === 'job_offer')) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'job_offer_letter');
    }
    if (!schema && draft.docType === 'work_order') {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'work_order');
    }
    if (!schema && draft.docType === 'purchase_order') {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'purchase_order');
    }
    if (!schema && draft.docType === 'rent_receipt') {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'rent_receipt');
    }
    if (!schema && (draft.docType === 'equipment_responsibility' || draft.docType === 'equipment_responsibility_letter')) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'equipment_responsibility');
    }
    if (!schema && (draft.docType === 'meeting_minutes' || draft.documentTitle?.toLowerCase().includes('minutes'))) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'meeting_minutes');
    }
    if (!schema && (draft.docType === 'site_inspection' || draft.docType === 'site_inspection_report')) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'site_inspection_report');
    }
    if (!schema && (draft.docType === 'customer_statement' || draft.docType === 'customer_account_statement')) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'customer_account_statement');
    }
    if (!schema && (draft.docType === 'student_fee_receipt' || draft.documentTitle?.toLowerCase().includes('student'))) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'student_fee_receipt');
    }
    if (!schema && (draft.docType === 'experience_cert' || draft.docType === 'experience_certificate')) {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'experience_certificate');
    }
    if (!schema && draft.docType === 'delivery_challan') {
      schema = SYSTEM_SCHEMAS.find((s) => s.code === 'delivery_challan');
    }

    if (!schema) {
      schema = {
        id: `schema_${draft.docType}`,
        code: draft.docType,
        name: draft.documentTitle,
        docClass: 'class_b_administrative',
        category: 'custom',
        description: draft.provenanceRule,
        icon: 'file-text',
        defaultTemplate: templateCode,
        isSystem: false,
        sections: [],
        headerConfig: { showLogo: true, showOrgDetails: true, showDocNumber: true, showDate: true },
        footerConfig: {
          showSignatures: true,
          showTerms: true,
          showNotes: true,
          authorizedSignatoryLabel: 'Authorized Representative',
          recipientAcceptanceLabel: 'Acknowledged By',
        },
      };
    }

    // 2. Prepare structured content
    let content: Record<string, any> = { ...meta };

    if (isSalary) {
      const earnings = draft.items.filter((it) => it.unitPriceMinor >= 0n);
      const deductions = draft.items.filter((it) => it.unitPriceMinor < 0n);

      const grossMinor = earnings.reduce((sum, it) => sum + (it.unitPriceMinor * it.quantityScaled) / 10000n, 0n);
      const deductionsMinor = deductions.reduce((sum, it) => sum + (-it.unitPriceMinor * it.quantityScaled) / 10000n, 0n);
      const netMinor = grossMinor - deductionsMinor;

      content = {
        employee_name: draft.partyName,
        employee_id: meta.employeeId || 'EMP-2026-084',
        designation: meta.designation || 'Senior Architect',
        department: meta.department || 'Engineering & Technology',
        pay_period: meta.payPeriod || 'October 2026',
        pay_days: meta.payDays || '31 Days',
        bank_reference: meta.bankReference || 'HDFC Bank ****5432',
        payroll_currency: draft.currency || 'INR (₹)',
        gross_earnings: formatMoney(createMoney(grossMinor, draft.currency)),
        total_deductions: formatMoney(createMoney(deductionsMinor, draft.currency)),
        net_pay: formatMoney(createMoney(netMinor, draft.currency)),
        payment_date: new Date(draft.issueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        earnings_table: earnings.map((it) => ({
          earning_head: it.description,
          current_amount: formatMoney(createMoney(it.unitPriceMinor, draft.currency)),
          ytd_amount: formatMoney(createMoney(it.unitPriceMinor * 7n, draft.currency)),
        })),
        deductions_table: deductions.map((it) => ({
          deduction_head: it.description,
          current_amount: formatMoney(createMoney(-it.unitPriceMinor, draft.currency)),
          ytd_amount: formatMoney(createMoney(-it.unitPriceMinor * 7n, draft.currency)),
        })),
      };
    } else if (
      draft.docType === 'job_offer_letter' ||
      draft.docType === 'job_offer' ||
      draft.documentTitle?.toLowerCase().includes('offer')
    ) {
      content = {
        candidate_name: draft.partyName,
        candidate_email: draft.partyEmail || `${draft.partyName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        candidate_phone: meta.phone || '+91 98765 43210',
        job_title: meta.position || meta.designation || 'Applied AI Engineer',
        department: meta.department || 'Engineering & AI Research',
        reporting_to: meta.reportingTo || 'VP of Engineering',
        joining_date: new Date(draft.issueDate + 14 * 86400000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        employment_type: meta.employmentType || 'Full-time Permanent',
        work_location: meta.location || 'Bengaluru / Hybrid',
        probation_period: meta.probation || '3 Months',
        annual_ctc: meta.expectedCtc || meta.ctc || '₹35,00,000 PA',
        basic_salary: meta.basicSalary || '₹1,50,000 / month',
        hra_allowance: meta.hra || '₹60,000 / month',
        special_allowance: meta.special || '₹50,000 / month',
        performance_bonus: meta.bonus || '10% Annual',
        scope_of_work:
          meta.coverStatement || draft.notes || 'Full architectural responsibility for production agent systems and statutory compliance.',
      };
    } else if (draft.docType === 'job_application') {
      content = {
        applicant_name: draft.partyName,
        applicant_email: draft.partyEmail || `${draft.partyName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        applicant_phone: meta.phone || '+91 98765 43210',
        target_role: meta.position || meta.designation || 'Applied AI Engineer',
        department: meta.department || 'AI Research & Platform Engineering',
        years_of_experience: meta.experienceYears || '5+ Years',
        expected_compensation: meta.expectedCtc || '₹35,00,000 PA',
        notice_period: meta.noticePeriod || '30 Days',
        portfolio_url: meta.portfolioUrl || `github.com/${draft.partyName.toLowerCase().replace(/\s+/g, '-')}`,
        core_competencies: draft.items.map((it) => it.description).join(' • '),
        summary: meta.coverStatement || draft.notes || 'Experienced engineer with demonstrated background in deploying high-throughput LLM architectures and agentic workflows.',
      };
    } else if (draft.docType === 'work_order') {
      content = {
        order_number: draft.documentNumber,
        order_title: draft.documentTitle,
        client_name: draft.partyName,
        location: meta.location || 'Site Alpha, Mumbai',
        priority: meta.priority || 'High',
        start_date: new Date(draft.issueDate).toLocaleDateString('en-IN'),
        completion_deadline: draft.dueDate
          ? new Date(draft.dueDate).toLocaleDateString('en-IN')
          : 'Within 7 Business Days',
        lead_technician: meta.technician || 'Senior Systems Engineer',
        scope_description: draft.notes || 'Execution of scheduled statutory inspection and maintenance.',
        tasks_table: draft.items.map((it, idx) => ({
          task_id: `WO-${idx + 1}`,
          description: it.description,
          status: 'In Progress',
          assigned_to: meta.technician || 'Engineering Lead',
        })),
        materials_table: draft.items.map((it) => ({
          material_name: it.description,
          quantity: (Number(it.quantityScaled) / 10000).toString(),
          unit_cost: formatMoney(createMoney(it.unitPriceMinor, draft.currency)),
          total_cost: formatMoney(createMoney((it.unitPriceMinor * it.quantityScaled) / 10000n, draft.currency)),
        })),
        total_estimated_cost: formatMoney(createMoney(draft.grandTotalMinor, draft.currency)),
      };
    } else if (draft.docType === 'rent_receipt' || draft.documentTitle?.toLowerCase().includes('rent')) {
      content = {
        receipt_no: draft.documentNumber,
        receipt_date: new Date(draft.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        tenant_name: draft.partyName,
        rent_amount: formatMoney(createMoney(draft.grandTotalMinor, draft.currency)),
        rent_period: meta.rentPeriod || meta.period || 'For the month of October 2026',
        property_address: meta.propertyAddress || meta.address || draft.partyAddress || 'Flat 602, Tower B, Prestige Palms, Whitefield, Bengaluru',
        payment_mode: meta.paymentMode || 'UPI / Direct Bank Transfer',
        landlord_pan: meta.landlordPan || 'ABCDE1234F',
        notes: draft.notes,
        terms: draft.terms,
        ...meta,
      };
    } else if (draft.docType === 'purchase_order' || draft.documentTitle?.toLowerCase().includes('purchase')) {
      content = {
        po_number: draft.documentNumber,
        po_date: new Date(draft.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        delivery_date: draft.dueDate
          ? new Date(draft.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Within 7 Business Days',
        vendor_name: draft.partyName,
        delivery_address: meta.deliveryAddress || 'Apex Tech Hub, Tower 3, Whitefield, Bengaluru',
        items_table: draft.items.map((it) => ({
          item_name: it.description,
          hsn_sac: it.hsnSac || '8471',
          qty: (Number(it.quantityScaled) / 10000).toString(),
          unit_price: formatMoney(createMoney(it.unitPriceMinor, draft.currency)),
          gst_rate: `${Number(draft.taxRateBp) / 100}%`,
          total_price: formatMoney(createMoney((it.unitPriceMinor * it.quantityScaled) / 10000n, draft.currency)),
        })),
        total_po_value: formatMoney(createMoney(draft.grandTotalMinor, draft.currency)),
        notes: draft.notes,
        terms: draft.terms,
        ...meta,
      };
    } else {
      content = {
        ...meta,
        party_name: draft.partyName,
        document_title: draft.documentTitle,
        notes: draft.notes,
        terms: draft.terms,
        provenance_rule: draft.provenanceRule,
        total_amount: formatMoney(createMoney(draft.grandTotalMinor, draft.currency)),
        items_table: draft.items.map((it) => ({
          description: it.description,
          quantity: (Number(it.quantityScaled) / 10000).toString(),
          rate: formatMoney(createMoney(it.unitPriceMinor, draft.currency)),
          amount: formatMoney(createMoney((it.unitPriceMinor * it.quantityScaled) / 10000n, draft.currency)),
        })),
      };
    }

    const instance: UniversalDocumentInstance = {
      id: draft.documentId,
      businessProfileId: business.id,
      typeId: schema.id,
      docClass: schema.docClass,
      documentNumber: draft.documentNumber,
      title: draft.documentTitle,
      status: 'draft',
      issueDate: draft.issueDate,
      partyName: draft.partyName,
      partyDetails: {
        role: draft.partyRole,
        taxId: draft.partyTaxId,
        email: draft.partyEmail,
        address: draft.partyAddress,
      },
      content,
      templateCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return { instance, schema };
  }

  /**
   * Dedicated 80mm Point-of-Sale thermal receipt generator
   */
  private static renderPosReceiptHtml(draft: ParsedDocumentDraft, business: BusinessProfile): string {
    const storeName = draft.metadata?.storeName || business.name || 'Billframe Fresh Mart & Grocery Store';
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${draft.documentTitle} - ${draft.documentNumber}</title>
<style>
  @page { size: 80mm 200mm; margin: 4mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Courier, monospace; color: #000; background: #FFF; font-size: 11px; line-height: 1.4; margin: 0; padding: 6px; }
  .center { text-align: center; }
  .store-title { font-size: 15px; font-weight: 900; }
  .store-sub { font-size: 9px; color: #333; margin-top: 2px; }
  .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
  .meta-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
  th { border-bottom: 1px solid #000; padding: 4px 0; text-align: left; }
  td { padding: 4px 0; vertical-align: top; }
  .totals-row { display: flex; justify-content: space-between; font-size: 10px; margin-top: 3px; }
  .grand-row { font-size: 13px; font-weight: 900; margin-top: 6px; padding-top: 4px; border-top: 1px solid #000; }
  .footer { text-align: center; font-size: 9px; margin-top: 16px; }
</style>
</head>
<body>
  <div class="center">
    <div class="store-title">${storeName}</div>
    <div class="store-sub">${draft.provenanceRule}</div>
    <div class="store-sub">GSTIN: ${business.tax_id || '27AAAAA0000A1Z5'} • FSSAI: 11521000000001</div>
  </div>

  <div class="divider"></div>

  <div class="meta-row"><span>Bill No: ${draft.documentNumber}</span><span>Date: ${new Date(draft.issueDate).toLocaleDateString()}</span></div>
  <div class="meta-row"><span>Customer: ${draft.partyName}</span><span>Counter: POS-01</span></div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Item</th>
        <th style="width: 15%; text-align: center;">Qty</th>
        <th style="width: 15%; text-align: right;">Rate</th>
        <th style="width: 20%; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${draft.items.map((it) => {
        const qtyNum = Number(it.quantityScaled) / 10000;
        const lineMinor = (it.unitPriceMinor * it.quantityScaled) / 10000n;
        return `
          <tr>
            <td>${it.description}<br/><span style="font-size: 8px; color: #666;">HSN: ${it.hsnSac || '1006'}</span></td>
            <td style="text-align: center;">${qtyNum}</td>
            <td style="text-align: right;">${formatMoney(createMoney(it.unitPriceMinor, draft.currency))}</td>
            <td style="text-align: right; font-weight: 700;">${formatMoney(createMoney(lineMinor, draft.currency))}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="totals-row"><span>Subtotal (${draft.items.length} items):</span><span>${formatMoney(createMoney(draft.subtotalMinor, draft.currency))}</span></div>
  ${draft.taxMinor > 0n ? `
    <div class="totals-row"><span>CGST (2.5%):</span><span>${formatMoney(createMoney(draft.taxMinor / 2n, draft.currency))}</span></div>
    <div class="totals-row"><span>SGST (2.5%):</span><span>${formatMoney(createMoney(draft.taxMinor / 2n, draft.currency))}</span></div>
  ` : ''}

  <div class="totals-row grand-row">
    <span>NET AMOUNT PAYABLE:</span>
    <span>${formatMoney(createMoney(draft.grandTotalMinor, draft.currency))}</span>
  </div>

  <div class="divider"></div>

  <div class="footer">
    <div>*** THANK YOU FOR SHOPPING WITH US ***</div>
    <div>Goods once sold can be returned within 3 days with this bill.</div>
    <div>Powered by Billframe Universal Document Engine</div>
  </div>
</body>
</html>`;
  }

  /**
   * Dedicated ATS-Optimized Professional Resume / Curriculum Vitae HTML Generator
   */
  private static renderAtsResumeHtml(
    draft: ParsedDocumentDraft,
    business: BusinessProfile,
    variant: string = 'ats_resume'
  ): string {
    const meta = draft.metadata || {};
    const candidateName =
      draft.partyName &&
      draft.partyName !== 'Party Name' &&
      draft.partyName !== 'Walk-in Customer' &&
      draft.partyName !== 'Walk-in Retail Customer' &&
      draft.partyName !== 'Candidate Dossier'
        ? draft.partyName
        : meta.candidateName || business?.contact_person || business?.signatory_name || business?.name || 'Candidate Name';

    const targetRole = meta.targetRole || meta.position || meta.designation || 'AI Engineer | Machine Learning Specialist';
    const phone = meta.phone || '+1 (555) 123-4567';
    const email = draft.partyEmail || meta.email || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@email.com`;
    const location = draft.partyAddress || meta.location || 'New York, NY, USA';
    const linkedin = meta.linkedin || `linkedin.com/in/${candidateName.toLowerCase().replace(/\s+/g, '-')}`;
    const github = meta.github || `github.com/${candidateName.toLowerCase().replace(/\s+/g, '-')}`;

    const summary =
      meta.summary ||
      draft.notes ||
      'Results-driven AI Engineer with 5+ years of experience designing, developing, and deploying end-to-end machine-learning solutions for large-scale enterprise products. Proven expertise in deep learning (CNNs, RNNs, Transformers), natural-language processing, computer vision, and production MLOps pipelines. Adept at translating business problems into data-driven models, optimizing inference performance, and delivering production-grade AI services on cloud platforms (AWS, GCP, Azure).';

    const skillsList: Array<{ category: string; items: string }> = Array.isArray(meta.skillsCategorized)
      ? meta.skillsCategorized.map((s: any) => ({
          category: s.category || s.name || 'Technical Domain',
          items: Array.isArray(s.items) ? s.items.join(', ') : String(s.items || ''),
        }))
      : [
          {
            category: 'Machine Learning & Deep Learning',
            items: 'TensorFlow, PyTorch, Keras, Scikit-learn, XGBoost, Transformers, Diffusion Models, Reinforcement Learning',
          },
          {
            category: 'NLP & Large Language Models',
            items: 'BERT, GPT-3/4, RoBERTa, Hugging Face Transformers, RAG Pipelines, Vector DBs (Chroma/Pinecone), LangChain, spaCy',
          },
          {
            category: 'Computer Vision',
            items: 'OpenCV, YOLOv5/v8, Faster-RCNN, EfficientNet, GANs, TensorRT, Triton Inference Server',
          },
          {
            category: 'MLOps & Deployment',
            items: 'Docker, Kubernetes, MLflow, AWS SageMaker, GCP Vertex AI, GitHub Actions, CI/CD, ONNX Runtime',
          },
          {
            category: 'Data Engineering & Cloud',
            items: 'Apache Spark, Pandas, SQL, MongoDB, DynamoDB, AWS (Lambda, S3), GCP, Azure ML',
          },
          {
            category: 'Programming Languages',
            items: 'Python (Expert), Java, C++, TypeScript, SQL, Bash',
          },
        ];

    const experienceList: Array<{ title: string; company: string; location: string; period: string; bullets: string[] }> = Array.isArray(meta.experience)
      ? meta.experience.map((r: any) => {
          let bullets: string[] = [];
          if (Array.isArray(r.bullets)) {
            bullets = r.bullets.map(String);
          } else if (Array.isArray(r.responsibilities)) {
            bullets = r.responsibilities.map(String);
          } else if (Array.isArray(r.points)) {
            bullets = r.points.map(String);
          } else if (Array.isArray(r.achievements)) {
            bullets = r.achievements.map(String);
          } else if (typeof r.bullets === 'string') {
            bullets = [r.bullets];
          } else if (typeof r.description === 'string') {
            bullets = [r.description];
          }
          return {
            title: r.title || r.position || r.role || 'Senior AI Engineer',
            company: r.company || r.organization || 'TechNova Solutions',
            location: r.location || 'New York, NY',
            period: r.period || r.dates || r.duration || '2022 – Present',
            bullets: bullets.length > 0 ? bullets : ['Led enterprise systems architecture and distributed model deployment.'],
          };
        })
      : [
          {
            title: 'Senior AI Engineer',
            company: 'TechNova Solutions',
            location: 'New York, NY',
            period: 'Jan 2022 – Present',
            bullets: [
              'Led a team of 4 data scientists to develop a real-time recommendation engine that increased click-through rate by 23% and generated $1.8M incremental revenue YoY.',
              'Designed and deployed a Transformer-based document summarization service on AWS SageMaker, handling >2M daily requests with <150ms latency.',
              'Implemented MLOps pipelines using Docker, Kubernetes, and MLflow, reducing model-to-production deployment time from weeks to under 24 hours.',
              'Conducted A/B testing and statistical analysis for model performance, achieving a +12% lift in prediction accuracy over baseline.',
              'Authored 3 patents on efficient model quantization (INT8) and edge-device neural inference.',
            ],
          },
          {
            title: 'AI Engineer',
            company: 'InnovateAI Labs',
            location: 'Boston, MA',
            period: 'Jun 2019 – Dec 2021',
            bullets: [
              'Built an enterprise NLP chatbot powered by GPT fine-tuning, serving 500k+ active users and reducing support ticket volume by 35%.',
              'Developed a computer-vision defect detection system for manufacturing, improving recall to 96% and cutting inspection costs by $250k annually.',
              'Created end-to-end data pipelines with Apache Spark and Airflow, processing 10TB of raw telemetry data per month.',
              'Presented research on knowledge-distillation for LLMs at the NeurIPS 2021 conference.',
            ],
          },
          {
            title: 'Machine Learning Engineer (Intern)',
            company: 'DataPulse Analytics',
            location: 'San Francisco, CA',
            period: 'May 2018 – Aug 2018',
            bullets: [
              'Implemented a time-series forecasting model (Prophet + LSTM) for demand planning, achieving MAE reduction of 18%.',
              'Automated feature-engineering workflows with Python and Pandas, decreasing data-prep time by 40%.',
            ],
          },
        ];

    const educationList: Array<{ degree: string; institution: string; year: string; gpa?: string; details?: string }> = Array.isArray(meta.education)
      ? meta.education.map((e: any) => ({
          degree: e.degree || 'Degree in Computer Science & Engineering',
          institution: e.institution || e.school || 'University',
          year: e.year || e.graduationYear || '2020',
          gpa: e.gpa || '',
          details: e.details || '',
        }))
      : [
          {
            degree: 'Master of Science – Computer Science (Artificial Intelligence)',
            institution: 'University of California, Berkeley',
            year: '2019',
            gpa: '3.9 / 4.0',
            details: 'Coursework: Deep Learning, Probabilistic Graphical Models, Reinforcement Learning, Scalable Data Systems',
          },
          {
            degree: 'Bachelor of Technology – Computer Engineering',
            institution: 'Indian Institute of Technology, Delhi',
            year: '2017',
            gpa: '9.2 / 10',
            details: 'Dean’s Honor Roll • Focus on Machine Learning Systems, Operating Systems, Algorithms',
          },
        ];

    const projectsList: Array<{ name: string; description: string; tech: string; impact?: string }> = Array.isArray(meta.projects)
      ? meta.projects.map((p: any) => ({
          name: p.name || p.title || 'Distributed AI Architecture & Inference',
          description: p.description || (Array.isArray(p.bullets) ? p.bullets[0] : ''),
          tech: p.tech || p.technologies || '',
          impact: p.impact || (Array.isArray(p.bullets) && p.bullets.length > 1 ? p.bullets[1] : ''),
        }))
      : [
          {
            name: 'AI-Powered Resume Screener & Semantic Ranking System',
            description: 'End-to-end pipeline parsing resumes, extracting skill vectors, and ranking candidates using BERT embeddings.',
            tech: 'Python, spaCy, BERT, FastAPI, Docker, AWS ECS',
            impact: 'Reduced recruiter screening time by 70% across 50,000+ candidate applications.',
          },
          {
            name: 'Edge-Device Real-Time Object Detection',
            description: 'Quantized INT8 YOLOv5 model optimized for low-power edge accelerators achieving 30 FPS inference.',
            tech: 'PyTorch, TensorRT, Embedded Linux, C++',
            impact: 'Enabled autonomous retail inventory scanning with 99.4% tracking accuracy.',
          },
        ];

    const certifications: string[] = Array.isArray(meta.certifications)
      ? meta.certifications
      : [
          'AWS Certified Machine Learning – Specialty (2022)',
          'Google Cloud Professional Data Engineer (2021)',
          'Deep Learning Specialization – Coursera / DeepLearning.AI (Andrew Ng)',
        ];

    const publications: string[] = Array.isArray(meta.publications)
      ? meta.publications
      : [
          '“Efficient Quantization for Large-Scale Transformers”, US Patent 11,234,567 (2023)',
          '“Distilling Knowledge from LLMs for Low-Resource Domains”, NeurIPS 2021 (Poster)',
          '“Real-Time Video Analytics using YOLOv5 on Edge Devices”, IEEE Transactions on Industrial Informatics (2022)',
        ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${candidateName} - ATS Curriculum Vitae</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 16mm 14mm 16mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111827;
    background: #FFFFFF;
    line-height: 1.42;
    font-size: 10pt;
    -webkit-print-color-adjust: exact;
  }
  .resume-sheet {
    max-width: 820px;
    margin: 0 auto;
    padding: 24px 20px;
  }
  /* Header */
  .header {
    text-align: center;
    border-bottom: 2px solid #1E293B;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .name {
    font-size: 23pt;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.3px;
    text-transform: uppercase;
  }
  .title {
    font-size: 11.5pt;
    font-weight: 700;
    color: #2563EB;
    margin-top: 3px;
  }
  .contact-strip {
    margin-top: 6px;
    font-size: 9pt;
    color: #475569;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .contact-item {
    display: inline-block;
  }
  .contact-sep {
    color: #94A3B8;
  }
  /* Sections */
  .section {
    margin-bottom: 13px;
  }
  .section-heading {
    font-size: 10.5pt;
    font-weight: 800;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid #CBD5E1;
    padding-bottom: 3px;
    margin-bottom: 7px;
  }
  .summary-text {
    font-size: 9.5pt;
    color: #334155;
    line-height: 1.48;
    text-align: justify;
  }
  /* Skills */
  .skill-row {
    font-size: 9pt;
    line-height: 1.38;
    margin-bottom: 3px;
  }
  .skill-label {
    font-weight: 700;
    color: #0F172A;
  }
  .skill-items {
    color: #334155;
  }
  /* Experience */
  .role-entry {
    margin-bottom: 10px;
  }
  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 10pt;
  }
  .role-title {
    font-weight: 700;
    color: #0F172A;
  }
  .role-company {
    font-weight: 600;
    color: #334155;
  }
  .role-dates {
    font-size: 9pt;
    font-weight: 600;
    color: #64748B;
  }
  .bullet-list {
    margin-left: 16px;
    margin-top: 3px;
  }
  .bullet-item {
    font-size: 9pt;
    color: #334155;
    line-height: 1.35;
    margin-bottom: 2px;
  }
  /* Education */
  .edu-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 9.5pt;
    margin-bottom: 3px;
  }
  .edu-degree {
    font-weight: 700;
    color: #0F172A;
  }
  .edu-school {
    color: #334155;
    font-style: italic;
  }
  .edu-year {
    font-size: 9pt;
    font-weight: 600;
    color: #64748B;
  }
  .edu-details {
    font-size: 8.5pt;
    color: #64748B;
    margin-left: 8px;
    margin-bottom: 5px;
  }
  /* Projects */
  .project-entry {
    margin-bottom: 6px;
  }
  .project-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #0F172A;
  }
  .project-tech {
    font-size: 8.5pt;
    color: #2563EB;
    font-weight: 600;
  }
  .project-desc {
    font-size: 9pt;
    color: #334155;
    margin-top: 1px;
  }
  /* Footer */
  .ats-compliance {
    margin-top: 14px;
    padding-top: 6px;
    border-top: 1px dashed #E2E8F0;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #94A3B8;
  }
</style>
</head>
<body>
  <div class="resume-sheet">
    <!-- Header -->
    <header class="header">
      <div class="name">${candidateName}</div>
      <div class="title">${targetRole}</div>
      <div class="contact-strip">
        <span class="contact-item">📍 ${location}</span>
        <span class="contact-sep">•</span>
        <span class="contact-item">📞 ${phone}</span>
        <span class="contact-sep">•</span>
        <span class="contact-item">✉️ ${email}</span>
        <span class="contact-sep">•</span>
        <span class="contact-item">🌐 ${linkedin}</span>
        <span class="contact-sep">•</span>
        <span class="contact-item">🐙 ${github}</span>
      </div>
    </header>

    <!-- Professional Summary -->
    <section class="section">
      <h2 class="section-heading">Professional Summary</h2>
      <p class="summary-text">${summary}</p>
    </section>

    <!-- Core Competencies -->
    <section class="section">
      <h2 class="section-heading">Core Competencies & Technical Skills</h2>
      <div class="skills-box">
        ${skillsList
          .map(
            (s) => `
          <div class="skill-row">
            <span class="skill-label">${s.category}:</span>
            <span class="skill-items"> ${s.items}</span>
          </div>`
          )
          .join('')}
      </div>
    </section>

    <!-- Professional Experience -->
    <section class="section">
      <h2 class="section-heading">Professional Experience</h2>
      ${experienceList
        .map(
          (role) => `
        <div class="role-entry">
          <div class="role-header">
            <div>
              <span class="role-title">${role.title}</span> – <span class="role-company">${role.company}</span>, ${role.location}
            </div>
            <span class="role-dates">${role.period}</span>
          </div>
          <ul class="bullet-list">
            ${(role.bullets || []).map((b) => `<li class="bullet-item">${b}</li>`).join('')}
          </ul>
        </div>`
        )
        .join('')}
    </section>

    <!-- Selected Technical Projects -->
    <section class="section">
      <h2 class="section-heading">High-Impact Technical Projects</h2>
      ${projectsList
        .map(
          (p) => `
        <div class="project-entry">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span class="project-title">${p.name}</span>
            ${p.tech ? `<span class="project-tech">${p.tech}</span>` : ''}
          </div>
          <div class="project-desc">${p.description}${p.impact ? ` <strong>Impact:</strong> ${p.impact}` : ''}</div>
        </div>`
        )
        .join('')}
    </section>

    <!-- Education -->
    <section class="section">
      <h2 class="section-heading">Education</h2>
      ${educationList
        .map(
          (edu) => `
        <div class="edu-row">
          <div>
            <span class="edu-degree">${edu.degree}</span> – <span class="edu-school">${edu.institution}</span>
          </div>
          <span class="edu-year">${edu.year}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}</span>
        </div>
        ${edu.details ? `<div class="edu-details">${edu.details}</div>` : ''}`
        )
        .join('')}
    </section>

    <!-- Publications, Patents & Certifications -->
    <section class="section">
      <h2 class="section-heading">Patents, Publications & Certifications</h2>
      <div class="skill-row">
        <span class="skill-label">Patents & Research:</span>
        <span class="skill-items"> ${publications.join(' • ')}</span>
      </div>
      <div class="skill-row" style="margin-top: 3px;">
        <span class="skill-label">Industry Certifications:</span>
        <span class="skill-items"> ${certifications.join(' • ')}</span>
      </div>
    </section>

    <!-- ATS Verification Footer -->
    <div class="ats-compliance">
      <span>ATS Standard Compliance: ISO/IEC 100% Machine-Readable Vector Text</span>
      <span>Document No: ${draft.documentNumber || 'CV-2026-001'} • Generated by Billframe Document Engine</span>
    </div>
  </div>
</body>
</html>`;
  }
}
