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
    if (dt === 'invoice' || dt === 'tax_invoice' || dt === 'bill' || dt === 'receipt') return true;
    if (title.includes('invoice') || title.includes('tax') || title.includes('bill') || title.includes('grocery')) return true;
    if (dt === 'salary_slip' || dt === 'job_offer_letter' || dt === 'job_application' || dt === 'work_order' || dt === 'nda_agreement') {
      return false;
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
    if (!schema && (draft.docType === 'job_offer_letter' || draft.docType === 'job_application')) {
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
      draft.docType === 'job_application' ||
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
}
