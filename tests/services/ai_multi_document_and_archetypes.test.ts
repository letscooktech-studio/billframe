import { AiRagRegistry } from '../../src/services/ai/AiRagRegistry';
import { AiDocumentAgent, ParsedDocumentDraft } from '../../src/services/ai/AiDocumentAgent';
import { AiTemplateBridge } from '../../src/services/ai/AiTemplateBridge';

describe('AiRagRegistry & Multi-Document Archetype Disambiguation', () => {
  it('correctly classifies Quotation/Estimate instead of defaulting to Invoice', () => {
    const results = AiRagRegistry.retrieve('Create a commercial quotation for Acme Corp for 5 enterprise laptops at 60000 INR');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('quotation');
    expect(results[0].name).toContain('Quotation');
  });

  it('correctly classifies Delivery Challan / Dispatch Note instead of Invoice', () => {
    const results = AiRagRegistry.retrieve('Generate a delivery challan for 20 monitors shipped to Warehouse B via MH-02-1234');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('delivery_challan');
    expect(results[0].name).toContain('Delivery Challan');
  });

  it('correctly classifies Purchase Order', () => {
    const results = AiRagRegistry.retrieve('Issue purchase order PO-2026-99 to Intel Corporation for 50 chipsets at 12000 INR');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('purchase_order');
    expect(results[0].name).toContain('Purchase Order');
  });

  it('correctly classifies Credit Note', () => {
    const results = AiRagRegistry.retrieve('Draft a credit note for damaged goods return for Apex Ltd 5000 INR');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('credit_note');
  });

  it('correctly classifies Payment Receipt', () => {
    const results = AiRagRegistry.retrieve('Create a payment receipt for 15,000 INR received from Global Systems via UPI');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('receipt');
  });

  it('correctly classifies Meeting Minutes', () => {
    const results = AiRagRegistry.retrieve('Prepare meeting minutes for quarterly architectural review');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('meeting_minutes');
  });

  it('correctly classifies Equipment Responsibility Letter', () => {
    const results = AiRagRegistry.retrieve('Create an equipment handover responsibility letter for MacBook Pro assigned to David');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('equipment_responsibility');
  });

  it('detects multi-document compound request ("invoice and delivery challan")', () => {
    const detection = AiRagRegistry.detectMultiDocumentRequest('Create an invoice and a delivery challan for Acme Corp for 10 monitors at 15000 INR');
    expect(detection.isMulti).toBe(true);
    expect(detection.archetypes.length).toBeGreaterThanOrEqual(2);
    const ids = detection.archetypes.map((a) => a.id);
    expect(ids).toContain('invoice');
    expect(ids).toContain('delivery_challan');
  });

  it('detects multi-document quantity multiplier ("create 2 invoices")', () => {
    const detection = AiRagRegistry.detectMultiDocumentRequest('Create 2 invoices for Acme Corp and Beta LLC');
    expect(detection.isMulti).toBe(true);
    expect(detection.archetypes.length).toBe(2);
  });

  it('generates multi-document drafts in deterministic heuristic mode', async () => {
    const result = await AiDocumentAgent.runDeterministicHeuristic(
      'Create a quotation and a delivery challan for Apex Corp for 5 laptops at 50000 each'
    );
    expect(result.drafts).toBeDefined();
    expect(result.drafts!.length).toBe(2);
    expect(result.drafts![0].docType).toBe('quotation');
    expect(result.drafts![1].docType).toBe('delivery_challan');
    expect(result.drafts![0].partyName).toContain('Apex Corp');
    expect(result.drafts![1].partyName).toContain('Apex Corp');
  });

  it('correctly classifies dedicated ATS Resume archetype and penalizes invoice', () => {
    const results = AiRagRegistry.retrieve('build me complete highest ats scoring resume for farhan noor for ai engineer');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('resume');
    expect(results[0].name).toContain('Resume');
  });

  it('generates a first-class ATS Resume draft with candidate and role grounding', async () => {
    const result = await AiDocumentAgent.runDeterministicHeuristic(
      'build me complete highest ats scoring resume for farhan noor for ai engineer'
    );
    expect(result.draft).toBeDefined();
    expect(result.draft!.docType).toBe('resume');
    expect(result.draft!.documentTitle).toBe('ATS Professional Curriculum Vitae');
    expect(result.draft!.partyName).toBe('Farhan Noor');
    expect(result.draft!.metadata?.targetRole).toContain('AI Engineer');
    expect(result.draft!.metadata?.atsScore).toBe(98);
    expect(result.draft!.items!.length).toBeGreaterThanOrEqual(2);
    // Verified: No employer offer letter or salary components
    expect(result.draft!.items!.some((i: any) => i.description.includes('Basic Annual Compensation'))).toBe(false);
  });

  it('resolves candidate name and role from multi-turn history on vague follow-up prompts', async () => {
    const history = [
      {
        id: 'msg-1',
        role: 'user' as const,
        content: 'build me compltee highest ats scoring resume for farhan noor for ai enginneer',
        timestamp: Date.now() - 5000,
      },
      {
        id: 'msg-2',
        role: 'assistant' as const,
        content: 'Below is a polished, ATS‑friendly resume for Farhan Noor targeting AI Engineer roles.',
        timestamp: Date.now() - 2000,
      },
    ];

    const mockContext = {
      matchedCustomers: [{ name: 'Walk-in Customer' }],
      businessProfile: { name: 'Acme Corp', currency: 'INR' },
    };

    const result = await AiDocumentAgent.runDeterministicHeuristic(
      'in document build resume broo',
      null,
      mockContext,
      history
    );

    expect(result.draft).toBeDefined();
    expect(result.draft!.docType).toBe('resume');
    // Must NOT fall back to matchedCustomer "Walk-in Customer"
    expect(result.draft!.partyName).toBe('Farhan Noor');
    expect(result.draft!.metadata?.targetRole).toContain('AI Engineer');
  });

  it('AiTemplateBridge selects ats_resume template and renders clean ATS vector HTML without salary boilerplate', async () => {
    const result = await AiDocumentAgent.runDeterministicHeuristic(
      'build me complete highest ats scoring resume for farhan noor for ai engineer'
    );
    const draft = result.draft as ParsedDocumentDraft;
    expect(draft).toBeDefined();

    const templates = AiTemplateBridge.getAvailableTemplates(draft);
    expect(templates.some((t) => t.id === 'ats_resume')).toBe(true);

    const defaultTemplateId = AiTemplateBridge.getDefaultTemplateId(draft);
    expect(defaultTemplateId).toBe('ats_resume');

    const businessProfile = {
      name: 'Farhan Noor Consulting',
      email: 'farhan.noor@email.com',
      phone: '+1 (555) 123-4567',
      address: 'New York, NY',
      currency: 'USD',
    } as any;

    const html = AiTemplateBridge.renderDraftHtml(draft, businessProfile, 'ats_resume');
    expect(html).toContain('Farhan Noor');
    expect(html).toContain('AI Engineer | Machine Learning Specialist');
    expect(html).toContain('Professional Summary');
    expect(html).toContain('Core Competencies & Technical Skills');
    expect(html).toContain('Professional Experience');
    expect(html).toContain('High-Impact Technical Projects');
    expect(html).toContain('Education');
    expect(html).toContain('Patents, Publications & Certifications');

    // Strict negative check: Absolutely NO employer offer letter salary or signature acceptance
    expect(html).not.toContain('Basic Pay');
    expect(html).not.toContain('House Rent Allowance');
    expect(html).not.toContain('Candidate Acceptance & Signature');
    expect(html).not.toContain('Walk-in Customer');
    expect(html).not.toContain('undefined');
  });
});
