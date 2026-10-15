/**
 * POLICY GATE
 * Security and safety enforcement layer for agent plans.
 * Inspects every proposed tool invocation before sandbox execution.
 */

import { AgentPlan, PolicyCheckResult } from './types';
import { ToolRegistry } from './ToolRegistry';

export class PolicyGate {
  /**
   * Evaluates an agent plan against sovereignty and financial safety policies.
   */
  public static evaluatePlan(plan: AgentPlan): PolicyCheckResult {
    const sensitiveOperations: string[] = [];

    for (const step of plan.steps) {
      const tool = ToolRegistry.getTool(step.toolName);

      if (!tool) {
        return {
          verdict: 'denied',
          reason: `Tool "${step.toolName}" is not registered in the sovereign tool catalog.`,
          sensitiveOperations: [],
        };
      }

      // Check if tool is classified as financial or explicitly requires approval
      if (tool.category === 'financial' || tool.requiresUserApproval || step.requiresApproval) {
        sensitiveOperations.push(`${step.toolName} (Step #${step.stepNumber})`);
      }
    }

    if (sensitiveOperations.length > 0) {
      return {
        verdict: 'requires_user_approval',
        reason: 'Plan includes operations that alter financial ledgers or issue official documents.',
        sensitiveOperations,
      };
    }

    return {
      verdict: 'allowed',
      reason: 'All proposed steps are read-only or safe draft mutations.',
      sensitiveOperations: [],
    };
  }
}
