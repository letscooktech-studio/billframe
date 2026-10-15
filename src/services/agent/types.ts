/**
 * AGENT SUBSYSTEM CONTRACTS & TOPOLOGY
 * 
 * Modular, deterministic foundation for on-device AI and assistant workflows:
 * RequestInterpreter -> Planner -> PolicyCheck -> Executor -> Verifier -> UserReview -> Commit
 * 
 * Strict invariants:
 * 1. Zero cloud dependencies or external network calls during execution.
 * 2. All tools strictly typed with runtime schema assertions.
 * 3. Invariant verification enforces financial correctness and data immutability.
 * 4. Mutations affecting financial records require explicit user review approval.
 */

export type ToolCategory = 'read' | 'write' | 'financial' | 'export';

export interface ToolDefinition<TInput = any, TOutput = any> {
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly requiresUserApproval: boolean;
  readonly execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}

export interface ToolExecutionContext {
  readonly sessionId: string;
  readonly timestamp: number;
  readonly dryRun?: boolean;
}

export type PolicyVerdict = 'allowed' | 'denied' | 'requires_user_approval';

export interface PolicyCheckResult {
  readonly verdict: PolicyVerdict;
  readonly reason: string;
  readonly sensitiveOperations: string[];
}

export interface AgentPlanStep {
  readonly stepNumber: number;
  readonly toolName: string;
  readonly description: string;
  readonly input: Record<string, any>;
  readonly requiresApproval: boolean;
}

export interface AgentPlan {
  readonly planId: string;
  readonly intent: string;
  readonly steps: AgentPlanStep[];
  readonly createdAt: number;
}

export interface StepExecutionResult {
  readonly stepNumber: number;
  readonly toolName: string;
  readonly success: boolean;
  readonly output?: any;
  readonly error?: string;
  readonly durationMs: number;
}

export interface VerificationResult {
  readonly isValid: boolean;
  readonly checks: {
    readonly rule: string;
    readonly passed: boolean;
    readonly details?: string;
  }[];
}

export interface AgentWorkflowResult {
  readonly planId: string;
  readonly intent: string;
  readonly status: 'success' | 'failed' | 'rejected_by_policy' | 'waiting_for_approval';
  readonly executionResults: StepExecutionResult[];
  readonly verification: VerificationResult;
  readonly requiresUserApproval: boolean;
  readonly pendingApprovalSteps?: AgentPlanStep[];
  readonly summary: string;
}
