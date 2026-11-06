/**
 * UNIVERSAL AGENT ENGINE TEST SUITE
 * 
 * Verifies the universal, non-hardcoded cognitive capabilities:
 * 1. Arbitrary multi-item natural language parsing across industries.
 * 2. Complex counterparty extraction with corporate & personal patterns.
 * 3. Deep statutory, tax, GST, HR, and accounting knowledge Q&A.
 * 4. End-to-end integration through AiDocumentAgent without fallback to generic queries.
 */

import { UniversalAgentEngine } from '../../src/services/ai/UniversalAgentEngine';
import { AiDocumentAgent, ParsedDocumentDraft } from '../../src/services/ai/AiDocumentAgent';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { MigrationRunner } from '../../src/data/database/migrations/MigrationRunner';

describe('Universal Agent Engine — Common Sense & Autonomous Cognitive Core', () => {
  beforeAll(async () => {
    const db = await DatabaseManager.getDatabaseAsync();
    await MigrationRunner.runMigrationsAsync(db);
  });

  describe('1. Universal Natural Language Line Item & Price Extraction', () => {
    it('extracts multiple items with explicit quantities and unit rates', () => {
      const prompt = 'I sold 3 mechanical keyboards to Rohan at 8500 each and 2 gaming mice at 3200 each';
      const items = UniversalAgentEngine.parseLineItems(prompt, 'INR');

      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Mechanical Keyboards');
      expect(items[0].quantityScaled).toBe(30000n);
      expect(items[0].unitPriceMinor).toBe(850000n);

      expect(items[1].description).toBe('Gaming Mice');
      expect(items[1].quantityScaled).toBe(20000n);
      expect(items[1].unitPriceMinor).toBe(320000n);
    });

    it('extracts services with hourly billing and foreign currency', () => {
      const prompt = 'Bill Microsoft for 40 hours of cloud consulting at $150/hr';
      const items = UniversalAgentEngine.parseLineItems(prompt, 'USD');

      expect(items.length).toBe(1);
      expect(items[0].description).toContain('Cloud Consulting');
      expect(items[0].quantityScaled).toBe(400000n);
      expect(items[0].unitPriceMinor).toBe(15000n); // $150.00
      expect(items[0].unitName).toBe('Hours');
      expect(items[0].hsnSac).toBe('998314');
    });

    it('extracts multiple services joined by "and" without explicit "at"', () => {
      const prompt = 'Invoice for laptop repair 3500 and screen replacement 4500';
      const items = UniversalAgentEngine.parseLineItems(prompt, 'INR');

      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Laptop Repair');
      expect(items[0].unitPriceMinor).toBe(350000n);
      expect(items[1].description).toBe('Screen Replacement');
      expect(items[1].unitPriceMinor).toBe(450000n);
    });

    it('extracts membership / flat retainage with domain context', () => {
      const prompt = 'Gym membership for Rahul 12000 per year';
      const items = UniversalAgentEngine.parseLineItems(prompt, 'INR');

      expect(items.length).toBe(1);
      expect(items[0].description).toBe('Gym Membership');
      expect(items[0].unitPriceMinor).toBe(1200000n);
      expect(items[0].unitName).toBe('Year');
      expect(items[0].hsnSac).toBe('999312');
    });
  });

  describe('2. Universal Counterparty Name Extraction', () => {
    it('extracts corporate entities with legal designations', () => {
      const prompt = 'Invoice for Zenith Infotech Ltd for enterprise software license 250000';
      const party = UniversalAgentEngine.extractPartyName(prompt);
      expect(party).toBe('Zenith Infotech Ltd');
    });

    it('extracts individual personal names with prepositional phrasing', () => {
      const prompt = 'House rent receipt to Rahul Sharma for 28000';
      const party = UniversalAgentEngine.extractPartyName(prompt);
      expect(party).toBe('Rahul Sharma');
    });

    it('resolves candidate name across multi-turn history', () => {
      const history: any[] = [
        { id: '1', role: 'user', content: 'Candidate dossier for Farhan Noor applying for AI Architect' },
        { id: '2', role: 'assistant', content: 'Prepared resume draft.' },
      ];
      const party = UniversalAgentEngine.extractPartyName('build the resume in document', history);
      expect(party).toBe('Farhan Noor');
    });
  });

  describe('3. Authoritative Statutory & Business Q&A Knowledge Engine', () => {
    it('answers Reverse Charge Mechanism (RCM) question with Section 9(3) and GTA/legal examples', () => {
      const res = UniversalAgentEngine.answerBusinessQuestion('What is reverse charge mechanism in GST?');
      expect(res).not.toBeNull();
      expect(res!.reply).toContain('Section 9(3)');
      expect(res!.reply).toContain('Goods Transport Agency');
      expect(res!.reasoning).toContain('CGST Act 2017');
    });

    it('answers Input Tax Credit (ITC) question with Section 16 conditions and Section 17(5) blocked credits', () => {
      const res = UniversalAgentEngine.answerBusinessQuestion('How does input tax credit work and what is blocked?');
      expect(res).not.toBeNull();
      expect(res!.reply).toContain('Section 16');
      expect(res!.reply).toContain('Section 17(5)');
      expect(res!.reply).toContain('GSTR-2B');
    });

    it('explains differences between Quotation, Proforma, and Tax Invoice in structured comparison', () => {
      const res = UniversalAgentEngine.answerBusinessQuestion('What is the difference between quotation, proforma and tax invoice?');
      expect(res).not.toBeNull();
      expect(res!.reply).toContain('Quotation / Estimate');
      expect(res!.reply).toContain('Proforma Invoice');
      expect(res!.reply).toContain('Tax Invoice');
    });

    it('explains HSN and SAC turnover mandates and common tech codes', () => {
      const res = UniversalAgentEngine.answerBusinessQuestion('What are HSN and SAC codes and when are they required?');
      expect(res).not.toBeNull();
      expect(res!.reply).toContain('998314');
      expect(res!.reply).toContain('5 Crore');
      expect(res!.reply).toContain('CBIC Notification 78/2020');
    });

    it('explains HRA tax exemption under Section 10(13A) and rent receipt revenue stamp mandate', () => {
      const res = UniversalAgentEngine.answerBusinessQuestion('How to claim HRA with rent receipts and when is PAN needed?');
      expect(res).not.toBeNull();
      expect(res!.reply).toContain('Section 10(13A)');
      expect(res!.reply).toContain('1,00,000');
      expect(res!.reply).toContain('Revenue Stamp');
    });

    it('answers general open-ended business inquiries with commercial accounting principles', () => {
      const res = UniversalAgentEngine.answerBusinessQuestion('How long do I need to keep financial records for audit?');
      expect(res).not.toBeNull();
      expect(res!.reply).toContain('72 months');
      expect(res!.reply).toContain('Section 35');
    });
  });

  describe('4. End-to-End Autonomous Agent Execution on Diverse Non-Listed Queries', () => {
    it('synthesizes photography invoice with custom rate and line items without generic fallback', async () => {
      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'I run a photography agency and took 5 corporate headshots for Reliance at 15000 each with 18% GST',
        [],
        null,
        (ev) => {
          if (ev.type === 'done') doneEvent = ev;
        }
      );

      expect(doneEvent).not.toBeNull();
      const draft = doneEvent.draft as ParsedDocumentDraft;
      expect(draft).toBeDefined();
      expect(draft.partyName).toContain('Reliance');
      expect(draft.items.length).toBeGreaterThanOrEqual(1);

      // 5 * 15,000 = 75,000 subtotal (7,500,000 minor units)
      // 18% GST = 13,500 tax (1,350,000 minor units)
      // Grand total = 88,500 (8,850,000 minor units)
      expect(draft.subtotalMinor).toBe(7500000n);
      expect(draft.taxMinor).toBe(1350000n);
      expect(draft.grandTotalMinor).toBe(8850000n);
    });

    it('delivers direct statutory answer to open-ended RCM question without dummy invoice generation', async () => {
      let doneEvent: any = null;
      await AiDocumentAgent.streamMessage(
        'What is reverse charge mechanism in GST?',
        [],
        null,
        (ev) => {
          if (ev.type === 'done') doneEvent = ev;
        }
      );

      expect(doneEvent).not.toBeNull();
      expect(doneEvent.draft).toBeNull();
      expect(doneEvent.replyText).toContain('Section 9(3)');
      expect(doneEvent.fullReasoning).toContain('Statutory compliance engine');
    });
  });
});
