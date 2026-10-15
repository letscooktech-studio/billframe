/**
 * ON-DEVICE AGENT WORKFLOW ENGINE TEST SUITE
 * Tests for Billframe 4.0 Agent Subsystem:
 * 1. ToolRegistry catalog and categories
 * 2. PolicyGate evaluation and financial approval gating
 * 3. Invariant verification via Verifier
 * 4. End-to-end plan execution through AgentWorkflowEngine
 */

import { ToolRegistry } from '../../src/services/agent/ToolRegistry';
import { PolicyGate } from '../../src/services/agent/PolicyGate';
import { Verifier } from '../../src/services/agent/Verifier';
import { AgentWorkflowEngine } from '../../src/services/agent/AgentWorkflowEngine';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { getMockDb } from '../mocks/expo-sqlite';
import { QUANTITY_SCALE } from '../../src/domain/documents/types';

describe('Agent Architecture: ToolRegistry', () => {
  beforeEach(() => {
    ToolRegistry.initDefaultTools();
  });

  it('initializes default core tools with valid categories and handlers', () => {
    const tools = ToolRegistry.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(6);

    const calcTool = ToolRegistry.getTool('calculate_document');
    expect(calcTool).toBeDefined();
    expect(calcTool?.category).toBe('read');
    expect(calcTool?.requiresUserApproval).toBe(false);

    const issueTool = ToolRegistry.getTool('issue_document');
    expect(issueTool).toBeDefined();
    expect(issueTool?.category).toBe('financial');
    expect(issueTool?.requiresUserApproval).toBe(true);

    const paymentTool = ToolRegistry.getTool('record_payment');
    expect(paymentTool).toBeDefined();
    expect(paymentTool?.category).toBe('financial');
    expect(paymentTool?.requiresUserApproval).toBe(true);
  });

  it('rejects duplicate tool registration', () => {
    expect(() => {
      ToolRegistry.registerTool({
        name: 'calculate_document',
        description: 'Duplicate',
        category: 'read',
        requiresUserApproval: false,
        execute: async () => ({}),
      });
    }).toThrow(/already registered/i);
  });

  it('lists tools by category', () => {
    const readTools = ToolRegistry.listToolsByCategory('read');
    expect(readTools.every((t) => t.category === 'read')).toBe(true);

    const financialTools = ToolRegistry.listToolsByCategory('financial');
    expect(financialTools.every((t) => t.category === 'financial')).toBe(true);
  });
});

describe('Agent Architecture: PolicyGate', () => {
  it('allows plans containing only safe read and write tools', () => {
    const safePlan = AgentWorkflowEngine.createPlanFromIntent('Create invoice draft', {
      customerName: 'Acme Corp',
      currency: 'USD',
      items: [
        {
          description: 'Consulting',
          quantityScaled: 1n * QUANTITY_SCALE,
          unitPriceMinor: 10000n,
        },
      ],
      autoIssue: false,
    });

    const verdict = PolicyGate.evaluatePlan(safePlan);
    expect(verdict.verdict).toBe('allowed');
    expect(verdict.sensitiveOperations.length).toBe(0);
  });

  it('requires explicit user approval for plans containing financial mutations', () => {
    const financialPlan = AgentWorkflowEngine.createPlanFromIntent('Create invoice and bill customer', {
      customerName: 'Acme Corp',
      currency: 'USD',
      items: [],
      autoIssue: true, // Triggers issue_document
      documentId: 'doc_123',
    });

    const verdict = PolicyGate.evaluatePlan(financialPlan);
    expect(verdict.verdict).toBe('requires_user_approval');
    expect(verdict.sensitiveOperations.length).toBeGreaterThan(0);
  });

  it('denies execution when a plan references an unregistered tool', () => {
    const roguePlan = {
      planId: 'rogue_1',
      intent: 'Exploit system',
      steps: [
        {
          stepNumber: 1,
          toolName: 'unregistered_cloud_uploader',
          description: 'Upload local data',
          input: {},
          requiresApproval: false,
        },
      ],
      createdAt: Date.now(),
    };

    const verdict = PolicyGate.evaluatePlan(roguePlan);
    expect(verdict.verdict).toBe('denied');
    expect(verdict.reason).toContain('not registered');
  });
});

describe('Agent Architecture: Verifier', () => {
  it('passes verification when calculations satisfy non-negativity and balance reconciliation', () => {
    const results = [
      {
        stepNumber: 1,
        toolName: 'calculate_document',
        success: true,
        durationMs: 4,
        output: {
          currency: 'USD',
          subtotal: { amountMinor: 10000n, currency: 'USD' },
          discount: { amountMinor: 0n, currency: 'USD' },
          taxableBase: { amountMinor: 10000n, currency: 'USD' },
          tax: { amountMinor: 1000n, currency: 'USD' },
          grandTotal: { amountMinor: 11000n, currency: 'USD' },
          paid: { amountMinor: 5000n, currency: 'USD' },
          deposit: { amountMinor: 0n, currency: 'USD' },
          balance: { amountMinor: 6000n, currency: 'USD' }, // 11000 - 5000 = 6000
        },
      },
    ];

    const verification = Verifier.verifyExecution(results);
    expect(verification.isValid).toBe(true);
    expect(verification.checks.every((c) => c.passed)).toBe(true);
  });

  it('fails verification if balance reconciliation invariant is broken', () => {
    const brokenResults = [
      {
        stepNumber: 1,
        toolName: 'calculate_document',
        success: true,
        durationMs: 2,
        output: {
          currency: 'USD',
          subtotal: { amountMinor: 10000n, currency: 'USD' },
          discount: { amountMinor: 0n, currency: 'USD' },
          taxableBase: { amountMinor: 10000n, currency: 'USD' },
          tax: { amountMinor: 0n, currency: 'USD' },
          grandTotal: { amountMinor: 10000n, currency: 'USD' },
          paid: { amountMinor: 0n, currency: 'USD' },
          deposit: { amountMinor: 0n, currency: 'USD' },
          balance: { amountMinor: 8000n, currency: 'USD' }, // Corrupt: should be 10000n
        },
      },
    ];

    const verification = Verifier.verifyExecution(brokenResults);
    expect(verification.isValid).toBe(false);
    const balanceCheck = verification.checks.find((c) => c.rule.includes('Balance matches'));
    expect(balanceCheck?.passed).toBe(false);
  });
});

describe('Agent Architecture: AgentWorkflowEngine Execution', () => {
  beforeEach(async () => {
    getMockDb().reset();
    await DatabaseManager.initDatabaseAsync(getMockDb() as any);
  });

  it('executes a safe calculation and draft creation plan end-to-end', async () => {
    const plan = AgentWorkflowEngine.createPlanFromIntent('Create invoice draft for Acme', {
      customerName: 'Acme Builders',
      currency: 'USD',
      items: [
        {
          description: 'Drywall installation',
          quantityScaled: 5n * QUANTITY_SCALE,
          unitPriceMinor: 8000n,
        },
      ],
      autoIssue: false,
    });

    const result = await AgentWorkflowEngine.executePlan(plan);
    expect(result.status).toBe('success');
    expect(result.executionResults.length).toBe(3); // create_customer, calculate_document, save_document_draft
    expect(result.verification.isValid).toBe(true);
  });

  it('pauses with waiting_for_approval status when plan includes unapproved financial step', async () => {
    const plan = AgentWorkflowEngine.createPlanFromIntent('Create invoice and bill customer', {
      customerName: 'Delta Corp',
      currency: 'USD',
      items: [],
      autoIssue: true,
      documentId: 'doc_placeholder',
    });

    const result = await AgentWorkflowEngine.executePlan(plan, { userApproved: false });
    expect(result.status).toBe('waiting_for_approval');
    expect(result.requiresUserApproval).toBe(true);
    expect(result.pendingApprovalSteps?.length).toBeGreaterThan(0);
  });
});
