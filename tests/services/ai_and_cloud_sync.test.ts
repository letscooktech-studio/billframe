/**
 * AI DOCUMENT AGENT & CLOUD SYNC SUITE
 * Tests natural language document drafting, SQLite context extraction,
 * iterative in-chat revisions, integer money invariants, and local-first cloud sync.
 */

import { AiConfigService } from '../../src/services/ai/AiConfigService';
import { AiDocumentAgent } from '../../src/services/ai/AiDocumentAgent';
import { SupabaseSyncConfigService } from '../../src/services/sync/SupabaseSyncConfig';
import { SupabaseSyncService } from '../../src/services/sync/SupabaseSyncService';

describe('AI Config Service (BYOK)', () => {
  it('defaults to groq provider awaiting BYOK key or offline mode', async () => {
    const config = await AiConfigService.getConfig();
    expect(config.provider).toBe('groq');
    expect(config.apiKey).toBe('');
    expect(config.isReady).toBe(false);
  });

  it('fails connection test gracefully when API key is missing', async () => {
    const res = await AiConfigService.testConnection('', 'gemini');
    expect(res.success).toBe(false);
    expect(res.message).toContain('API Key is missing');
  });

  it('persists and retrieves custom API keys', async () => {
    await AiConfigService.saveConfig({
      provider: 'gemini',
      apiKey: 'test-gemini-key-123',
    });

    const updated = await AiConfigService.getConfig();
    expect(updated.provider).toBe('gemini');
    expect(updated.apiKey).toBe('test-gemini-key-123');

    // Clean up
    await AiConfigService.clearApiKey();
  });
});

describe('AI Document Agent (Conversational Engine)', () => {
  it('parses natural language salary slip prompt with deterministic math', async () => {
    const prompt = 'Create salary slip for John Doe basic 65000, HRA 25000, PF 3600 for October 2026';
    const response = await AiDocumentAgent.processMessage(prompt, [], null);

    expect(response.replyText).toBeTruthy();
    expect(response.documentDraft).toBeDefined();

    const draft = response.documentDraft!;
    expect(draft.docType).toBe('salary_slip');
    expect(draft.partyName).toContain('John Doe');
    expect(draft.items.length).toBeGreaterThanOrEqual(1);

    // Minor units should be strictly non-zero
    expect(draft.subtotalMinor).toBeGreaterThan(0n);
    expect(draft.grandTotalMinor).toBeGreaterThan(0n);
  });

  it('parses GST invoice with quantity and item rate', async () => {
    const prompt = 'Draft GST invoice for Acme Corp with 2 MacBooks at 120000 each and 18% GST';
    const response = await AiDocumentAgent.processMessage(prompt, [], null);

    expect(response.documentDraft).toBeDefined();
    const draft = response.documentDraft!;
    expect(draft.docType).toBe('invoice');
    expect(draft.partyName).toContain('Acme Corp');

    // 2 * 120,000 = 240,000 subtotal in major units => 24,000,000 in minor units (cents/paise)
    // 18% tax => 4,320,000 minor units
    // Grand total => 28,320,000 minor units
    expect(draft.subtotalMinor).toBe(24000000n);
    expect(draft.taxMinor).toBe(4320000n);
    expect(draft.grandTotalMinor).toBe(28320000n);
  });

  it('applies iterative modifications to active draft in conversation', async () => {
    // 1. Initial draft
    const initial = await AiDocumentAgent.processMessage(
      'Create invoice for Stark Ind with 1 ARC Reactor at 50000',
      [],
      null
    );

    const initialDraft = initial.documentDraft!;
    expect(initialDraft.grandTotalMinor).toBe(5900000n); // 50,000 subtotal + 18% GST (9,000)

    // 2. Iterative modification: "add 10% discount"
    const revised = await AiDocumentAgent.processMessage(
      'add 10% discount and change client to Stark Industries Global',
      [
        { id: '1', role: 'user', content: 'Create invoice for Stark Ind with 1 ARC Reactor at 50000', timestamp: 1 },
        { id: '2', role: 'assistant', content: initial.replyText, timestamp: 2, documentDraft: initialDraft },
      ],
      initialDraft
    );

    const updatedDraft = revised.documentDraft!;
    expect(updatedDraft.partyName).toContain('Stark Industries Global');
    expect(updatedDraft.discountType).toBe('percentage');
    expect(updatedDraft.discountValue).toBe(1000n); // 1000 basis points = 10%
    expect(updatedDraft.grandTotalMinor).toBe(5310000n); // 45,000 discounted taxable + 18% GST (8,100) = 53,100
  }, 15000);

  it('correctly routes "draft me a complete job application for applied ai engineer" to candidate dossier (never an invoice)', async () => {
    const prompt = 'draft me a complete job application for applied ai engineer';
    const response = await AiDocumentAgent.processMessage(prompt, [], null);

    expect(response.documentDraft).toBeDefined();
    const draft = response.documentDraft!;

    // Must be job_application, NOT invoice!
    expect(draft.docType).toBe('job_application');
    expect(draft.partyRole).toBe('Applicant');
    expect(draft.documentTitle).toMatch(/application/i);
    if (draft.metadata?.position) {
      expect(draft.metadata.position.toLowerCase()).toContain('applied ai engineer');
    }
    expect(draft.items.length).toBeGreaterThanOrEqual(1);

    // Reasoning trace must be populated
    expect(response.reasoningTrace).toBeTruthy();
  });
});

describe('Supabase Cloud Sync Subsystem', () => {
  it('returns graceful offline status when cloud sync is unconfigured', async () => {
    // Clear any sync credentials
    await SupabaseSyncConfigService.clearConfig();

    const result = await SupabaseSyncService.sync();
    expect(result.success).toBe(true);
    expect(result.status).toBe('idle');
    expect(result.message).toContain('Local-First SQLite mode is operating normally');
  });

  it('validates URL and API key during connection tests', async () => {
    const res = await SupabaseSyncConfigService.testConnection('', '');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Please provide both Supabase Project URL and Anon API Key');
  });

  it('persists and clears cloud sync configuration securely', async () => {
    await SupabaseSyncConfigService.saveConfig({
      supabaseUrl: 'https://test-project.supabase.co/',
      supabaseAnonKey: 'test-anon-key-abc',
      userId: 'test-user-uuid-123',
    });

    const cfg = await SupabaseSyncConfigService.getConfig();
    expect(cfg.supabaseUrl).toBe('https://test-project.supabase.co'); // Stripped trailing slash
    expect(cfg.supabaseAnonKey).toBe('test-anon-key-abc');
    expect(cfg.userId).toBe('test-user-uuid-123');

    await SupabaseSyncConfigService.clearConfig();
    const cleared = await SupabaseSyncConfigService.getConfig();
    expect(cleared.supabaseUrl).toBe('');
    expect(cleared.supabaseAnonKey).toBe('');
  });
});
