/**
 * AGENT WORKFLOW ENGINE
 * Orchestrates deterministic on-device agent execution:
 * 1. Request Interpreter (translates intent to structured plan)
 * 2. Policy Check (validates boundaries and financial approval triggers)
 * 3. Executor (runs registered tools with runtime performance tracking)
 * 4. Verifier (asserts post-execution invariants)
 * 5. User Review checkpoint (if required by policy)
 * 6. Commit / Finalization
 */

import {
  AgentPlan,
  AgentPlanStep,
  AgentWorkflowResult,
  StepExecutionResult,
  ToolExecutionContext,
} from './types';
import { ToolRegistry } from './ToolRegistry';
import { PolicyGate } from './PolicyGate';
import { Verifier } from './Verifier';

export class AgentWorkflowEngine {
  /**
   * Translates a human or programmatic intent into an ordered execution plan.
   * Deterministic template matching with structured fallback.
   */
  public static createPlanFromIntent(
    intent: string,
    parameters: Record<string, any> = {}
  ): AgentPlan {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const steps: AgentPlanStep[] = [];
    const normalizedIntent = intent.trim().toLowerCase();

    // 1. Create Invoice Flow: Create Customer (if needed) -> Calculate Document -> Save Draft -> Issue
    if (normalizedIntent.includes('create invoice') || normalizedIntent.includes('bill customer')) {
      let stepNum = 1;

      if (parameters.customerName && !parameters.customerId) {
        steps.push({
          stepNumber: stepNum++,
          toolName: 'create_customer',
          description: `Create customer profile for "${parameters.customerName}"`,
          input: {
            name: parameters.customerName,
            businessName: parameters.customerBusinessName,
            email: parameters.customerEmail,
            phone: parameters.customerPhone,
          },
          requiresApproval: false,
        });
      }

      steps.push({
        stepNumber: stepNum++,
        toolName: 'calculate_document',
        description: 'Verify financial arithmetic, tax, and totals',
        input: {
          currency: parameters.currency || 'USD',
          items: parameters.items || [],
          discountType: parameters.discountType || 'none',
          discountValue: BigInt(parameters.discountValue || 0),
          taxType: parameters.taxType || 'none',
          taxRateBasisPoints: BigInt(parameters.taxRateBasisPoints || 0),
          taxLabel: parameters.taxLabel || 'Tax',
          totalPaymentsMinor: 0n,
        },
        requiresApproval: false,
      });

      steps.push({
        stepNumber: stepNum++,
        toolName: 'save_document_draft',
        description: 'Save invoice as draft in local database',
        input: {
          docType: 'invoice',
          customerId: parameters.customerId,
          currency: parameters.currency || 'USD',
          items: parameters.items || [],
          notes: parameters.notes,
        },
        requiresApproval: false,
      });

      if (parameters.autoIssue) {
        steps.push({
          stepNumber: stepNum++,
          toolName: 'issue_document',
          description: 'Officially issue invoice with sequential numbering',
          input: {
            documentId: parameters.documentId,
          },
          requiresApproval: true,
        });
      }
    } else if (normalizedIntent.includes('record payment') || normalizedIntent.includes('pay invoice')) {
      // 2. Record Payment Flow
      steps.push({
        stepNumber: 1,
        toolName: 'record_payment',
        description: `Record payment of ${parameters.amountMinor} against invoice ${parameters.invoiceId}`,
        input: {
          invoiceId: parameters.invoiceId,
          amountMinor: parameters.amountMinor,
          paymentMethod: parameters.paymentMethod || 'bank_transfer',
          reference: parameters.reference,
        },
        requiresApproval: true,
      });
    } else {
      // 3. Generic plan from raw step input if provided
      if (parameters.steps && Array.isArray(parameters.steps)) {
        return {
          planId,
          intent,
          steps: parameters.steps,
          createdAt: Date.now(),
        };
      }

      // Default safe read step
      steps.push({
        stepNumber: 1,
        toolName: 'get_active_profile',
        description: 'Read organization profile configuration',
        input: {},
        requiresApproval: false,
      });
    }

    return {
      planId,
      intent,
      steps,
      createdAt: Date.now(),
    };
  }

  /**
   * Executes a plan through the full topology with policy validation,
   * sandbox execution, and invariant verification.
   */
  public static async executePlan(
    plan: AgentPlan,
    options: { userApproved?: boolean; dryRun?: boolean } = {}
  ): Promise<AgentWorkflowResult> {
    // 1. Policy Gate Evaluation
    const policyResult = PolicyGate.evaluatePlan(plan);

    if (policyResult.verdict === 'denied') {
      return {
        planId: plan.planId,
        intent: plan.intent,
        status: 'rejected_by_policy',
        executionResults: [],
        verification: { isValid: false, checks: [{ rule: 'Policy Evaluation', passed: false, details: policyResult.reason }] },
        requiresUserApproval: false,
        summary: `Execution rejected: ${policyResult.reason}`,
      };
    }

    if (policyResult.verdict === 'requires_user_approval' && !options.userApproved) {
      const pendingSteps = plan.steps.filter((s) => {
        const tool = ToolRegistry.getTool(s.toolName);
        return tool?.requiresUserApproval || s.requiresApproval;
      });

      return {
        planId: plan.planId,
        intent: plan.intent,
        status: 'waiting_for_approval',
        executionResults: [],
        verification: { isValid: true, checks: [{ rule: 'Pending User Approval', passed: true }] },
        requiresUserApproval: true,
        pendingApprovalSteps: pendingSteps,
        summary: `Plan paused awaiting explicit user review approval for sensitive operations: ${policyResult.sensitiveOperations.join(', ')}`,
      };
    }

    // 2. Execution Loop
    const context: ToolExecutionContext = {
      sessionId: `session_${Date.now()}`,
      timestamp: Date.now(),
      dryRun: options.dryRun,
    };

    const executionResults: StepExecutionResult[] = [];

    for (const step of plan.steps) {
      const tool = ToolRegistry.getTool(step.toolName);
      if (!tool) {
        executionResults.push({
          stepNumber: step.stepNumber,
          toolName: step.toolName,
          success: false,
          error: `Tool "${step.toolName}" not found`,
          durationMs: 0,
        });
        break;
      }

      const startTime = Date.now();
      try {
        const output = await tool.execute(step.input, context);
        const durationMs = Date.now() - startTime;
        executionResults.push({
          stepNumber: step.stepNumber,
          toolName: step.toolName,
          success: true,
          output,
          durationMs,
        });
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        executionResults.push({
          stepNumber: step.stepNumber,
          toolName: step.toolName,
          success: false,
          error: err?.message || String(err),
          durationMs,
        });
        break; // Stop sequential pipeline on failure
      }
    }

    // 3. Post-Execution Invariant Verification
    const verification = Verifier.verifyExecution(executionResults);
    const allStepsSucceeded = executionResults.length === plan.steps.length && executionResults.every((r) => r.success);
    const overallSuccess = allStepsSucceeded && verification.isValid;

    return {
      planId: plan.planId,
      intent: plan.intent,
      status: overallSuccess ? 'success' : 'failed',
      executionResults,
      verification,
      requiresUserApproval: false,
      summary: overallSuccess
        ? `Successfully executed ${executionResults.length} steps. All financial invariants verified.`
        : `Execution encountered issues. Passed checks: ${verification.checks.filter((c) => c.passed).length}/${verification.checks.length}.`,
    };
  }
}
