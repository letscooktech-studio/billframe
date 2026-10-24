/**
 * LOCAL EXPLAINABLE RECOMMENDATION ENGINE
 * Evaluates real SQLite accounting records (overdue invoices, upcoming dues,
 * draft data anomalies) to generate deterministic, trustworthy merchant actions.
 * Zero external LLM calls or cloud API costs.
 */

import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { CustomerRepository } from '../../data/repositories/CustomerRepository';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { formatMoney, createMoney } from '../../domain/money/Money';

export interface RecommendationItem {
  id: string;
  ruleId: 'overdue_aging' | 'upcoming_due' | 'draft_incomplete' | 'high_balance_customer';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'action_needed';
  entityType: 'invoice' | 'customer' | 'draft';
  entityId: string;
  actionLabel: string;
  actionPrompt: string;
}

export class RecommendationEngine {
  /**
   * Generates explainable, high-priority business recommendations from local SQLite data.
   */
  static async evaluateRecommendations(): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // 1. Evaluate Overdue and Upcoming Invoices from Real Aging Records
    try {
      const rawInvoices = await DocumentRepository.getIssuedInvoicesForAgingAsync();

      for (const inv of rawInvoices) {
        if (!inv.due_date) continue;

        const balanceMinor = BigInt(inv.balance_minor || 0);
        if (balanceMinor <= 0n) continue;

        const formattedBal = formatMoney(createMoney(balanceMinor, inv.currency || 'INR'));

        // Overdue Check
        if (now > inv.due_date) {
          const daysOverdue = Math.max(1, Math.floor((now - inv.due_date) / DAY_MS));
          const isCritical = daysOverdue > 14;

          recommendations.push({
            id: `rec_overdue_${inv.id}`,
            ruleId: 'overdue_aging',
            title: `Overdue: #${inv.document_number} (${daysOverdue}d)`,
            description: `${inv.customer_name || 'Client'} has an unpaid balance of ${formattedBal} that is ${daysOverdue} day(s) overdue.`,
            severity: isCritical ? 'action_needed' : 'warning',
            entityType: 'invoice',
            entityId: inv.id,
            actionLabel: 'Send Reminder',
            actionPrompt: `Prepare payment reminder for ${inv.customer_name || 'Client'} on overdue invoice #${inv.document_number} for ${formattedBal}`,
          });
        }
        // Upcoming Due Check (within next 3 days)
        else if (inv.due_date - now <= 3 * DAY_MS) {
          const daysLeft = Math.max(0, Math.ceil((inv.due_date - now) / DAY_MS));
          recommendations.push({
            id: `rec_due_soon_${inv.id}`,
            ruleId: 'upcoming_due',
            title: `Due Soon: #${inv.document_number}`,
            description: `Payment of ${formattedBal} from ${inv.customer_name || 'Client'} is due in ${daysLeft === 0 ? 'today' : `${daysLeft} day(s)`}.`,
            severity: 'info',
            entityType: 'invoice',
            entityId: inv.id,
            actionLabel: 'Review Invoice',
            actionPrompt: `Review status of invoice #${inv.document_number} for ${inv.customer_name}`,
          });
        }
      }
    } catch {
      // Safe fallback
    }

    // 2. Evaluate Incomplete Drafts
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const drafts = await db.getAllAsync<{
        id: string;
        document_number: string;
        doc_type: string;
        customer_id: string | null;
        total_minor: number;
        updated_at: number;
      }>(
        `SELECT id, document_number, doc_type, customer_id, total_minor, updated_at
         FROM documents
         WHERE lifecycle_status = 'draft' AND is_archived = 0
         ORDER BY updated_at DESC
         LIMIT 3;`
      );

      for (const draft of drafts || []) {
        if (!draft.customer_id || draft.total_minor === 0) {
          recommendations.push({
            id: `rec_draft_${draft.id}`,
            ruleId: 'draft_incomplete',
            title: `Unfinished Draft: #${draft.document_number}`,
            description: `Draft ${draft.doc_type} is missing customer or line item details.`,
            severity: 'info',
            entityType: 'draft',
            entityId: draft.id,
            actionLabel: 'Complete Draft',
            actionPrompt: `Continue working on draft ${draft.doc_type} #${draft.document_number}`,
          });
        }
      }
    } catch {
      // Safe fallback
    }

    return recommendations.slice(0, 5);
  }
}
