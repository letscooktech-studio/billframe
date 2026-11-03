/**
 * AI AGENT & PERSISTENT TASK LEDGER TEST SUITE
 * Validates Migration 13, AgentSessionRepository SQLite durability,
 * Action approval proposal lifecycle, local recommendation engine,
 * and grounded read-only local tool execution.
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { MigrationRunner } from '../../src/data/database/migrations/MigrationRunner';
import { AgentSessionRepository } from '../../src/data/repositories/AgentSessionRepository';
import { RecommendationEngine } from '../../src/services/ai/RecommendationEngine';
import { AiDocumentAgent } from '../../src/services/ai/AiDocumentAgent';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';

describe('AI Agent & Persistent Task Ledger (Migration 13 & Repositories)', () => {
  beforeAll(async () => {
    const db = await DatabaseManager.getDatabaseAsync();
    await MigrationRunner.runMigrationsAsync(db);
  });

  describe('AgentSessionRepository', () => {
    it('creates and returns default AI session', async () => {
      const session = await AgentSessionRepository.getOrCreateDefaultSession();
      expect(session.id).toBe('ai_session_default');
      expect(session.title).toBe('Main Assistant Session');
    });

    it('persists and restores messages with BigInt document drafts across sessions', async () => {
      const testMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant' as const,
        content: 'Drafted Tax Invoice for Acme Corp.',
        timestamp: Date.now(),
        reasoningTrace: 'Reasoning: verified CGST Rule 46.',
        taskSteps: [
          { id: '1', label: 'Grounding with SQLite', status: 'completed' as const },
        ],
        documentDraft: {
          documentId: 'doc_test_123',
          documentNumber: 'INV-2026-999',
          docType: 'invoice',
          documentTitle: 'Tax Invoice',
          provenanceRule: 'CBIC Rule 46',
          partyName: 'Acme Global Corp',
          partyRole: 'Client',
          issueDate: Date.now(),
          dueDate: Date.now() + 86400000,
          currency: 'INR',
          items: [
            {
              description: 'Cloud Infrastructure Setup',
              quantityScaled: 10000n,
              unitName: 'job',
              unitPriceMinor: 5000000n,
            },
          ],
          discountType: 'none' as const,
          discountValue: 0n,
          taxType: 'exclusive' as const,
          taxRateBp: 1800n,
          taxLabel: 'GST',
          subtotalMinor: 5000000n,
          taxMinor: 900000n,
          grandTotalMinor: 5900000n,
        },
      };

      await AgentSessionRepository.saveMessage('ai_session_default', testMsg);

      const messages = await AgentSessionRepository.getMessages('ai_session_default');
      expect(messages.length).toBeGreaterThanOrEqual(1);

      const retrieved = messages.find((m) => m.id === testMsg.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.role).toBe('assistant');
      expect(retrieved?.content).toBe(testMsg.content);
      expect(retrieved?.reasoningTrace).toBe(testMsg.reasoningTrace);
      expect(retrieved?.taskSteps?.length).toBe(1);

      // Verify BigInt arithmetic integrity was preserved
      expect(retrieved?.documentDraft).toBeDefined();
      expect(typeof retrieved?.documentDraft?.grandTotalMinor).toBe('bigint');
      expect(retrieved?.documentDraft?.grandTotalMinor).toBe(5900000n);
      expect(retrieved?.documentDraft?.items[0].unitPriceMinor).toBe(5000000n);
    });

    it('manages human-in-the-loop action proposals (T3/T4)', async () => {
      const proposalId = `prop_${Date.now()}`;
      await AgentSessionRepository.saveProposal({
        id: proposalId,
        sessionId: 'ai_session_default',
        actionType: 'issue_document',
        tier: 3,
        status: 'pending',
        targetId: 'doc_test_123',
        payload: {
          documentNumber: 'INV-2026-999',
          customerName: 'Acme Global Corp',
          grandTotalMinor: 5900000,
        },
        createdAt: Date.now(),
      });

      const pending = await AgentSessionRepository.getPendingProposals('ai_session_default');
      const found = pending.find((p) => p.id === proposalId);
      expect(found).toBeDefined();
      expect(found?.actionType).toBe('issue_document');
      expect(found?.tier).toBe(3);

      // Approve proposal
      await AgentSessionRepository.updateProposalStatus(proposalId, 'approved');
      const pendingAfter = await AgentSessionRepository.getPendingProposals('ai_session_default');
      expect(pendingAfter.some((p) => p.id === proposalId)).toBe(false);
    });

    it('clears session messages and resets active draft', async () => {
      await AgentSessionRepository.clearSession('ai_session_default');
      const cleared = await AgentSessionRepository.getMessages('ai_session_default');
      expect(cleared.length).toBe(0);
    });
  });

  describe('RecommendationEngine', () => {
    it('evaluates explainable recommendations without throwing errors or external LLM calls', async () => {
      const recs = await RecommendationEngine.evaluateRecommendations();
      expect(Array.isArray(recs)).toBe(true);
      // All returned recommendations must have clear explanation, severity, and action prompt
      recs.forEach((r) => {
        expect(r.id).toBeTruthy();
        expect(r.title).toBeTruthy();
        expect(r.description).toBeTruthy();
        expect(['info', 'warning', 'action_needed']).toContain(r.severity);
        expect(r.actionPrompt).toBeTruthy();
      });
    });
  });

  describe('AiDocumentAgent Local Tools & Grounded Routing', () => {
    it('executes get_business_summary local tool directly', async () => {
      const summary = await AiDocumentAgent.executeLocalTool('get_business_summary', {});
      expect(summary.businessName).toBeDefined();
      expect(summary.currency).toBeDefined();
      expect(summary.totalOutstandingMinor).toBeDefined();
      expect(summary.overdueInvoicesCount).toBeGreaterThanOrEqual(0);
    });

    it('executes list_overdue_invoices local tool directly', async () => {
      const overdue = await AiDocumentAgent.executeLocalTool('list_overdue_invoices', {});
      expect(overdue.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(overdue.overdueInvoices)).toBe(true);
    });

    it('returns truthful conversational greeting with draft === null (zero fake bills)', async () => {
      const res = await AiDocumentAgent.processMessage('Hi, what can you do?', [], null);
      expect(res.replyText).toMatch(/Billframe|Document|Finance|Assistant/i);
      expect(res.documentDraft).toBeNull();
    }, 15000);

    it('truthfully handles overdue inquiries without generating fictitious bills', async () => {
      const res = await AiDocumentAgent.processMessage('Do I have any overdue invoices?', [], null);
      expect(res.replyText).toBeTruthy();
      expect(res.documentDraft).toBeNull();
      expect(res.reasoningTrace).toMatch(/aging|overdue|SQLite|tool/i);
    });

    it('truthfully handles business overview requests without generating fictitious bills', async () => {
      const res = await AiDocumentAgent.processMessage('How is my business doing? Give me a summary', [], null);
      expect(res.replyText).toMatch(/Business|Overview|Outstanding|Receivables|Summary/i);
      expect(res.documentDraft).toBeNull();
      expect(res.reasoningTrace).toMatch(/receivables|business|tool|SQLite/i);
    });
  });
});
