import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { MigrationRunner } from '../../src/data/database/migrations/MigrationRunner';
import {
  AiConfigService,
  DEFAULT_GROQ_KEY,
  MAX_UNIVERSAL_KEY_DOCS,
} from '../../src/services/ai/AiConfigService';
import { AiDocumentAgent, ParsedDocumentDraft } from '../../src/services/ai/AiDocumentAgent';
import { DocumentQuestionElicitor } from '../../src/services/ai/DocumentQuestionElicitor';

describe('AI Engine Universal Key Rate Limiting & Hardest User Scenarios', () => {
  beforeAll(async () => {
    const db = await DatabaseManager.getDatabaseAsync();
    await MigrationRunner.runMigrationsAsync(db);
  });

  beforeEach(async () => {
    await AiConfigService.resetUniversalUsage();
    await AiConfigService.saveConfig({
      provider: 'groq',
      apiKey: DEFAULT_GROQ_KEY,
      model: 'openai/gpt-oss-120b',
    });
  });

  describe('1. Universal Key Rate Limiter & BYOK Engine', () => {
    it('initializes with universal key at zero usage and isLimited = false', async () => {
      const status = await AiConfigService.checkUniversalLimit();
      expect(status.isUniversalKey).toBe(true);
      expect(status.count).toBe(0);
      expect(status.max).toBe(MAX_UNIVERSAL_KEY_DOCS);
      expect(status.isLimited).toBe(false);
    });

    it('increments universal usage count upon document generation', async () => {
      await AiConfigService.incrementUniversalUsage();
      await AiConfigService.incrementUniversalUsage();
      const status = await AiConfigService.checkUniversalLimit();
      expect(status.count).toBe(2);
      expect(status.isLimited).toBe(false);
    });

    it('enforces rate limit of exactly max 7 docs on universal key', async () => {
      for (let i = 0; i < 7; i++) {
        await AiConfigService.incrementUniversalUsage();
      }
      const status = await AiConfigService.checkUniversalLimit();
      expect(status.count).toBe(7);
      expect(status.isLimited).toBe(true);
    });

    it('BYOK: custom API key bypasses universal rate limit and grants unlimited access', async () => {
      // Simulate universal key exhausted
      for (let i = 0; i < 7; i++) {
        await AiConfigService.incrementUniversalUsage();
      }
      expect((await AiConfigService.checkUniversalLimit()).isLimited).toBe(true);

      // User enters their personal BYOK Groq Key
      await AiConfigService.saveConfig({
        provider: 'groq',
        apiKey: 'gsk_personal_user_custom_key_1234567890',
        model: 'openai/gpt-oss-120b',
      });

      const byokStatus = await AiConfigService.checkUniversalLimit();
      expect(byokStatus.isUniversalKey).toBe(false);
      expect(byokStatus.isLimited).toBe(false);
    });

    it('gracefully falls back to offline deterministic engine when no cloud key is configured', async () => {
      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'Create a GST Tax Invoice for Delta Logistics for 2 fleet servers at 95000 each with 18% GST',
        [],
        null,
        (ev) => {
          if (ev.type === 'done') {
            doneEvent = ev;
          }
        }
      );

      expect(doneEvent).not.toBeNull();
      expect(doneEvent.draft).not.toBeNull();
      expect(doneEvent.draft.documentTitle).toContain('Tax Invoice');
      expect(doneEvent.draft.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Hardest Real-World Document Scenarios & Max Field Coverage', () => {
    it('Scenario A: Cross-State B2B GST Tax Invoice with HSN, Bank Details, and Reverse Charge', async () => {
      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'Draft a B2B GST Tax Invoice for Zenith Infotech Ltd with 3 Cloud Compute Nodes at 45000 each with 18% GST',
        [],
        null,
        (ev) => {
          if (ev.type === 'done') doneEvent = ev;
        }
      );

      expect(doneEvent).not.toBeNull();
      const draft = doneEvent.draft as ParsedDocumentDraft;
      expect(draft).toBeDefined();
      expect(draft.partyName).toBe('Zenith Infotech Ltd');
      expect(draft.taxRateBp).toBe(1800n);
      expect(draft.items.length).toBeGreaterThan(0);
      expect(draft.items[0].hsnSac).toBeDefined();

      // Check maximum statutory fields populated
      expect(draft.partyTaxId).toBeDefined();
      expect(draft.partyAddress).toBeDefined();
      expect(draft.metadata?.placeOfSupply).toBe('29-Karnataka');
      expect(draft.metadata?.reverseCharge).toBe('N');
      expect(draft.metadata?.sellerGstin).toBeDefined();
      expect(draft.metadata?.bankDetails).toBeDefined();
      expect(draft.metadata?.bankDetails.bankName).toBe('HDFC Bank Ltd');
      expect(draft.metadata?.bankDetails.accountNumber).toBeDefined();
      expect(draft.metadata?.bankDetails.ifsc).toBeDefined();
      expect(draft.terms).toContain('Payment Terms');
    });

    it('Scenario B: Statutory Salary Slip under Payment of Wages Act with EPF and HRA', async () => {
      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026',
        [],
        null,
        (ev) => {
          if (ev.type === 'done') doneEvent = ev;
        }
      );

      expect(doneEvent).not.toBeNull();
      const draft = doneEvent.draft as ParsedDocumentDraft;
      expect(draft.docType).toBe('salary_slip');
      expect(draft.partyName).toBe('John Doe');
      expect(draft.metadata?.designation).toBe('Senior Architect');
      expect(draft.metadata?.payPeriod).toBe('October 2026');
      expect(draft.metadata?.employeeId).toBeDefined();
      expect(draft.metadata?.uan).toBeDefined();
      expect(draft.metadata?.pfNumber).toBeDefined();

      // Verify line items and arithmetic
      const basicItem = draft.items.find((i) => i.description.toLowerCase().includes('basic'));
      const hraItem = draft.items.find((i) => i.description.toLowerCase().includes('hra'));
      const pfItem = draft.items.find((i) => i.description.toLowerCase().includes('pf'));

      expect(basicItem).toBeDefined();
      expect(basicItem!.unitPriceMinor).toBe(6500000n);
      expect(hraItem).toBeDefined();
      expect(hraItem!.unitPriceMinor).toBe(2500000n);
      expect(pfItem).toBeDefined();
      expect(pfItem!.unitPriceMinor).toBe(-360000n); // Statutory negative deduction
    });

    it('Scenario C: ATS 98% scoring resume for AI Engineer across multi-turn history', async () => {
      const history = [
        {
          id: 'turn_1_user',
          role: 'user' as const,
          content: 'I want to build my candidate dossier for Farhan Noor applying for AI Engineer',
          timestamp: Date.now() - 5000,
        },
        {
          id: 'turn_1_assistant',
          role: 'assistant' as const,
          content: 'Understood. I will help prepare Farhan Noor dossier.',
          timestamp: Date.now() - 4000,
        },
      ];

      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'in document build resume',
        history,
        null,
        (ev) => {
          if (ev.type === 'done') doneEvent = ev;
        }
      );

      expect(doneEvent).not.toBeNull();
      const draft = doneEvent.draft as ParsedDocumentDraft;
      expect(draft.docType).toBe('resume');
      expect(draft.partyName).toBe('Farhan Noor');
      expect(draft.metadata?.targetRole).toContain('AI Engineer');
      expect(draft.metadata?.atsScore).toBe(98);
      expect(draft.metadata?.skillsCategorized?.length).toBeGreaterThanOrEqual(5);
      expect(draft.metadata?.experience?.length).toBeGreaterThanOrEqual(2);
      expect(draft.metadata?.projects?.length).toBeGreaterThanOrEqual(2);
      expect(draft.metadata?.education?.length).toBeGreaterThanOrEqual(2);
      expect(draft.metadata?.certifications?.length).toBeGreaterThanOrEqual(2);
    });

    it('Scenario D: Section 10(13A) House Rent Receipt with Landlord PAN and Revenue Stamp', async () => {
      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'Generate a House Rent Receipt for tenant Rahul Sharma for 28,000 INR for October 2026',
        [],
        null,
        (ev) => {
          if (ev.type === 'done') doneEvent = ev;
        }
      );

      expect(doneEvent).not.toBeNull();
      const draft = doneEvent.draft as ParsedDocumentDraft;
      expect(draft.docType).toBe('rent_receipt');
      expect(draft.partyName).toBe('Rahul Sharma');
      expect(draft.metadata?.landlordPan).toBeDefined();
      expect(draft.metadata?.propertyAddress).toBeDefined();
      expect(draft.metadata?.revenueStampAffirmed).toBe(true);
      expect(draft.grandTotalMinor).toBe(2800000n);
    });
  });

  describe('3. In-Chatbox MCQ Question Asking & Interactive Refinement', () => {
    it('generates structured MCQ question with reason and [Other] option', async () => {
      const mockDraft: ParsedDocumentDraft = {
        documentId: 'doc_mock_1',
        documentNumber: 'INV-2026-101',
        docType: 'invoice',
        documentTitle: 'GST Tax Invoice',
        provenanceRule: 'CBIC Rule 46',
        partyName: 'Bharat Electronics',
        partyRole: 'Client',
        issueDate: Date.now(),
        dueDate: Date.now() + 86400000,
        currency: 'INR',
        items: [
          {
            id: 'item_1',
            description: 'Embedded IoT Sensors',
            quantityScaled: 100000n,
            unitName: 'pcs',
            unitPriceMinor: 250000n,
            hsnSac: '847130',
          },
        ],
        discountType: 'none',
        discountValue: 0n,
        taxType: 'exclusive',
        taxRateBp: 1800n,
        taxLabel: 'GST',
        subtotalMinor: 2500000n,
        taxMinor: 450000n,
        grandTotalMinor: 2950000n,
      };

      const question = DocumentQuestionElicitor.getNextQuestion(mockDraft, []);
      expect(question).not.toBeNull();
      expect(question!.options.length).toBeGreaterThan(0);

      // Verify that the final option is always "Other"
      const lastOption = question!.options[question!.options.length - 1];
      expect(lastOption.isOther || lastOption.value === 'CUSTOM_INPUT').toBe(true);
      expect(question!.reason).toBeDefined();
    });

    it('detects and applies user selection from chatbox to update document draft', async () => {
      const mockDraft: ParsedDocumentDraft = {
        documentId: 'doc_resume_1',
        documentNumber: 'RESUME-2026-001',
        docType: 'resume',
        documentTitle: 'ATS Professional Curriculum Vitae',
        provenanceRule: 'ISO/IEC ATS Standard',
        partyName: 'Farhan Noor',
        partyRole: 'Candidate',
        issueDate: Date.now(),
        dueDate: null,
        currency: 'INR',
        items: [],
        discountType: 'none',
        discountValue: 0n,
        taxType: 'none',
        taxRateBp: 0n,
        taxLabel: 'None',
        subtotalMinor: 0n,
        taxMinor: 0n,
        grandTotalMinor: 0n,
        metadata: {
          candidateName: 'Farhan Noor',
        },
      };

      const applied = DocumentQuestionElicitor.applyAnswerToDraft(
        mockDraft,
        'targetDomain',
        'Large Language Models & GenAI / RAG Systems'
      );

      expect(applied.updatedDraft.metadata?.targetDomain).toBe(
        'Large Language Models & GenAI / RAG Systems'
      );
      expect(applied.reasoningTrace).toContain('targetDomain');
      expect(applied.feedbackMessage).toContain('targetDomain');
    });
  });
});
