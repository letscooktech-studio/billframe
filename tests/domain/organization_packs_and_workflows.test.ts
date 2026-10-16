import {
  OrganizationPackRegistry,
  ORGANIZATION_PACKS,
  SECTOR_DEFINITIONS,
  OrganizationSector,
} from '../../src/domain/organization/OrganizationPackRegistry';
import {
  ConnectedWorkflowRegistry,
  CONNECTED_WORKFLOWS,
} from '../../src/domain/workflows/ConnectedWorkflowRegistry';
import { DocumentTypeRegistry } from '../../src/domain/documents/DocumentTypeRegistry';

describe('BILLFRAME — Universal Organization Document Engine: Packs & Workflows', () => {
  describe('OrganizationPackRegistry (26 Packs Across 6 Sectors)', () => {
    it('registers exactly 26 canonical organization packs', () => {
      const packs = OrganizationPackRegistry.getAllPacks();
      expect(packs.length).toBe(26);
      expect(ORGANIZATION_PACKS.length).toBe(26);
    });

    it('covers all 6 target sectors with valid definitions', () => {
      expect(SECTOR_DEFINITIONS.length).toBe(6);
      const sectorIds: OrganizationSector[] = [
        'commerce',
        'operations',
        'professional_services',
        'administration',
        'institutions',
        'food_hospitality',
      ];

      for (const sector of sectorIds) {
        const packs = OrganizationPackRegistry.getPacksBySector(sector);
        expect(packs.length).toBeGreaterThan(0);
        for (const pack of packs) {
          expect(pack.sector).toBe(sector);
          expect(pack.id).toBeTruthy();
          expect(pack.name).toBeTruthy();
          expect(pack.description).toBeTruthy();
          expect(pack.primaryDocId).toBeTruthy();
          expect(pack.samplePartyType).toBeTruthy();
          expect(pack.recommendedDocIds.length).toBeGreaterThan(0);
          expect(pack.workflowIds.length).toBeGreaterThan(0);
          expect(pack.statutoryNotes).toBeTruthy();
        }
      }
    });

    it('retrieves specific packs by ID', () => {
      const digitalAgencies = OrganizationPackRegistry.getPackById('digital_software_agencies');
      expect(digitalAgencies).toBeDefined();
      expect(digitalAgencies?.name).toBe('Digital, Software & IT Agencies');
      expect(digitalAgencies?.sector).toBe('professional_services');
      expect(digitalAgencies?.recommendedDocIds).toContain('service_invoice');
      expect(digitalAgencies?.recommendedDocIds).toContain('milestone_invoice');

      const retail = OrganizationPackRegistry.getPackById('retail_shops');
      expect(retail).toBeDefined();
      expect(retail?.recommendedDocIds).toContain('pos_receipt');
      expect(retail?.recommendedDocIds).toContain('cash_bill');

      const logistics = OrganizationPackRegistry.getPackById('warehousing_logistics');
      expect(logistics).toBeDefined();
      expect(logistics?.recommendedDocIds).toContain('goods_received_note');

      const invalid = OrganizationPackRegistry.getPackById('non_existent_pack');
      expect(invalid).toBeUndefined();
    });

    it('returns recommended document IDs for a pack', () => {
      const docIds = OrganizationPackRegistry.getRecommendedDocumentIds('construction_contractors');
      expect(docIds).toContain('progress_invoice');
      expect(docIds).toContain('work_order');
      expect(docIds).toContain('site_inspection');

      const emptyDocIds = OrganizationPackRegistry.getRecommendedDocumentIds('invalid_id');
      expect(emptyDocIds).toEqual([]);
    });

    it('finds packs recommending a given document', () => {
      const taxInvoicePacks = OrganizationPackRegistry.getPacksRecommendingDocument('tax_invoice');
      expect(taxInvoicePacks.length).toBeGreaterThan(10);

      const posPacks = OrganizationPackRegistry.getPacksRecommendingDocument('pos_receipt');
      expect(posPacks.map((p) => p.id)).toContain('retail_shops');
      expect(posPacks.map((p) => p.id)).toContain('restaurants_cafes');
    });

    it('searches packs by name, sector label, or keyword', () => {
      const pharmaMatches = OrganizationPackRegistry.searchPacks('pharmacy');
      expect(pharmaMatches.length).toBeGreaterThan(0);
      expect(pharmaMatches.some((p) => p.id === 'healthcare_clinics')).toBe(true);

      const hospitalityMatches = OrganizationPackRegistry.searchPacks('hospitality');
      expect(hospitalityMatches.length).toBe(2); // restaurants_cafes and hotels_resorts
    });
  });

  describe('ConnectedWorkflowRegistry (14 Connected Workflows)', () => {
    it('registers exactly 14 connected business workflow blueprints', () => {
      const workflows = ConnectedWorkflowRegistry.getAllWorkflows();
      expect(workflows.length).toBe(14);
      expect(CONNECTED_WORKFLOWS.length).toBe(14);
    });

    it('ensures each workflow has valid steps, statutory checks, and human approval settings', () => {
      const workflows = ConnectedWorkflowRegistry.getAllWorkflows();
      for (const wf of workflows) {
        expect(wf.id).toBeTruthy();
        expect(wf.name).toBeTruthy();
        expect(wf.description).toBeTruthy();
        expect(wf.triggerEvent).toBeTruthy();
        expect(wf.steps.length).toBeGreaterThanOrEqual(2);
        expect(wf.statutoryChecks.length).toBeGreaterThan(0);
        expect(typeof wf.humanApprovalRequired).toBe('boolean');

        for (const step of wf.steps) {
          expect(step.stepIndex).toBeGreaterThan(0);
          expect(step.docId).toBeTruthy();
          expect(step.docName).toBeTruthy();
          expect(step.role).toBeTruthy();
          expect(step.autoCarryFields.length).toBeGreaterThan(0);
          expect(step.actionLabel).toBeTruthy();
        }
      }
    });

    it('validates the canonical Quote-to-Cash workflow', () => {
      const q2c = ConnectedWorkflowRegistry.getWorkflowById('quote_to_cash');
      expect(q2c).toBeDefined();
      expect(q2c?.steps.map((s) => s.docId)).toEqual([
        'estimate',
        'sales_order',
        'tax_invoice',
        'receipt',
      ]);

      const steps = q2c?.steps ?? [];
      const invoiceStep = steps.find((s) => s.docId === 'tax_invoice');
      expect(invoiceStep).toBeDefined();
      expect(invoiceStep?.autoCarryFields).toContain('customer.name');
      expect(invoiceStep?.autoCarryFields).toContain('items.list');
      expect(q2c?.statutoryChecks).toContain('CBIC GST Rule 46');
    });

    it('validates the Procure-to-Pay workflow', () => {
      const p2p = ConnectedWorkflowRegistry.getWorkflowById('procure_to_pay');
      expect(p2p).toBeDefined();
      expect(p2p?.steps.map((s) => s.docId)).toEqual([
        'purchase_order',
        'goods_received_note',
        'site_inspection',
        'payment_voucher',
      ]);
    });

    it('retrieves workflows by document ID', () => {
      const quotationWorkflows = ConnectedWorkflowRegistry.getWorkflowsForDocument('estimate');
      expect(quotationWorkflows.length).toBeGreaterThan(0);
      expect(quotationWorkflows.map((w) => w.id)).toContain('quote_to_cash');

      const grnWorkflows = ConnectedWorkflowRegistry.getWorkflowsForDocument('goods_received_note');
      expect(grnWorkflows.length).toBeGreaterThan(0);
      expect(grnWorkflows.map((w) => w.id)).toContain('procure_to_pay');
    });

    it('finds next steps and available transitions for a document', () => {
      const nextStep = ConnectedWorkflowRegistry.getNextStep('quote_to_cash', 'estimate');
      expect(nextStep).toBeDefined();
      expect(nextStep?.docId).toBe('sales_order');

      const transitions = ConnectedWorkflowRegistry.getAvailableTransitions('estimate');
      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions[0].currentStep.docId).toBe('estimate');
      expect(transitions[0].nextStep?.docId).toBe('sales_order');
    });
  });

  describe('DocumentTypeRegistry: Full 21-Billing Instrument Suite', () => {
    it('returns all 21 billing instruments from getBillingSuite()', () => {
      const billingSuite = DocumentTypeRegistry.getBillingSuite();
      expect(billingSuite.length).toBe(21);

      const expectedTypes = [
        'tax_invoice',
        'commercial_invoice',
        'bill_of_supply',
        'invoice_cum_bill_of_supply',
        'cash_bill',
        'pos_receipt',
        'service_invoice',
        'milestone_invoice',
        'progress_invoice',
        'recurring_invoice',
        'advance_invoice',
        'revised_tax_invoice',
        'credit_note',
        'debit_note',
        'sales_return_note',
        'customer_account_statement',
        'invoice_aging_report',
        'payment_reminder',
        'sales_order',
        'order_confirmation',
        'export_invoice',
      ];

      for (const expected of expectedTypes) {
        const found = billingSuite.find((b) => b.type === expected);
        expect(found).toBeDefined();
        expect({ type: expected, hasProvenance: !!found?.provenanceRule }).toEqual({
          type: expected,
          hasProvenance: true,
        });
        expect(found?.defaultPrefix).toBeTruthy();
        expect(found?.requiredFields.length).toBeGreaterThan(0);
      }
    });

    it('validates document types correctly via isValidDocumentType()', () => {
      expect(DocumentTypeRegistry.isValidDocumentType('tax_invoice')).toBe(true);
      expect(DocumentTypeRegistry.isValidDocumentType('pos_receipt')).toBe(true);
      expect(DocumentTypeRegistry.isValidDocumentType('service_invoice')).toBe(true);
      expect(DocumentTypeRegistry.isValidDocumentType('commercial_invoice')).toBe(true);
      expect(DocumentTypeRegistry.isValidDocumentType('progress_invoice')).toBe(true);
      expect(DocumentTypeRegistry.isValidDocumentType('salary_slip')).toBe(true);
      expect(DocumentTypeRegistry.isValidDocumentType('bogus_document_type')).toBe(false);
    });

    it('provides legally verified statutory provenance for all billing instruments', () => {
      const commercialInvoice = DocumentTypeRegistry.get('commercial_invoice');
      expect(commercialInvoice?.provenanceRule).toContain('Sale of Goods Act');

      const invoiceCumBill = DocumentTypeRegistry.get('invoice_cum_bill_of_supply');
      expect(invoiceCumBill?.provenanceRule).toContain('Rule 46A');

      const posReceipt = DocumentTypeRegistry.get('pos_receipt');
      expect(posReceipt?.provenanceRule).toContain('Rule 46');

      const advanceInvoice = DocumentTypeRegistry.get('advance_invoice');
      expect(advanceInvoice?.provenanceRule).toContain('Rule 50');

      const revisedTax = DocumentTypeRegistry.get('revised_tax_invoice');
      expect(revisedTax?.provenanceRule).toContain('Rule 53');

      const progressInvoice = DocumentTypeRegistry.get('progress_invoice');
      expect(progressInvoice?.provenanceRule).toContain('G702');
    });
  });
});
