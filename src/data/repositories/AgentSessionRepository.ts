/**
 * AGENT SESSION REPOSITORY
 * SQLite durability for AI chat sessions, agent task events, and proposal ledgers.
 * Ensures conversations, drafts, and execution logs survive process termination and reboot.
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseManager } from '../database/DatabaseManager';
import { AgentChatMessage, ParsedDocumentDraft } from '../../services/ai/AiDocumentAgent';

function toBigIntSafe(val: any, fallback = 0n): bigint {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') {
    if (isNaN(val)) return fallback;
    return BigInt(Math.round(val));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    const num = Number(trimmed);
    if (!isNaN(num)) return BigInt(Math.round(num));
  }
  return fallback;
}

function serializeDraft(draft: ParsedDocumentDraft | null | undefined): string | null {
  if (!draft) return null;
  return JSON.stringify(draft, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
}

function deserializeDraft(json: string | null | undefined): ParsedDocumentDraft | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return {
      ...parsed,
      discountValue: toBigIntSafe(parsed.discountValue, 0n),
      taxRateBp: toBigIntSafe(parsed.taxRateBp, 0n),
      subtotalMinor: toBigIntSafe(parsed.subtotalMinor, 0n),
      taxMinor: toBigIntSafe(parsed.taxMinor, 0n),
      grandTotalMinor: toBigIntSafe(parsed.grandTotalMinor, 0n),
      items: (parsed.items || []).map((i: any) => ({
        ...i,
        quantityScaled: toBigIntSafe(i.quantityScaled, 10000n),
        unitPriceMinor: toBigIntSafe(i.unitPriceMinor, 0n),
      })),
    };
  } catch {
    return null;
  }
}

export interface AgentProposalRecord {
  id: string;
  sessionId?: string | null;
  actionType: 'issue_document' | 'record_payment' | 'void_document';
  tier: number; // 0..4
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  targetId?: string | null;
  payload: Record<string, any>;
  createdAt: number;
  executedAt?: number | null;
}

export class AgentSessionRepository {
  private static readonly DEFAULT_SESSION_ID = 'ai_session_default';

  private static async getDb(): Promise<SQLite.SQLiteDatabase> {
    return DatabaseManager.getDatabaseAsync();
  }

  /**
   * Retrieves or creates the default persistent conversation session.
   */
  static async getOrCreateDefaultSession(): Promise<{ id: string; title: string; activeDraft: ParsedDocumentDraft | null }> {
    const db = await this.getDb();
    const existing = await db.getFirstAsync<{ id: string; title: string; active_draft_json: string | null }>(
      'SELECT id, title, active_draft_json FROM ai_sessions WHERE id = ?;',
      [this.DEFAULT_SESSION_ID]
    );

    if (existing) {
      return {
        id: existing.id,
        title: existing.title,
        activeDraft: deserializeDraft(existing.active_draft_json),
      };
    }

    const now = Date.now();
    await db.runAsync(
      `INSERT INTO ai_sessions (id, title, active_draft_json, is_archived, created_at, updated_at)
       VALUES (?, ?, NULL, 0, ?, ?);`,
      [this.DEFAULT_SESSION_ID, 'Main Assistant Session', now, now]
    );

    return {
      id: this.DEFAULT_SESSION_ID,
      title: 'Main Assistant Session',
      activeDraft: null,
    };
  }

  /**
   * Retrieves all chat messages for a session ordered chronologically.
   */
  static async getMessages(sessionId: string = this.DEFAULT_SESSION_ID): Promise<AgentChatMessage[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<{
      id: string;
      role: string;
      content: string;
      reasoning_trace: string | null;
      document_draft_json: string | null;
      task_steps_json: string | null;
      quick_actions_json: string | null;
      timestamp: number;
    }>(
      `SELECT id, role, content, reasoning_trace, document_draft_json, task_steps_json, quick_actions_json, timestamp
       FROM ai_messages
       WHERE session_id = ?
       ORDER BY timestamp ASC;`,
      [sessionId]
    );

    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
      id: r.id,
      role: (r.role as any) || 'assistant',
      content: r.content,
      timestamp: r.timestamp,
      reasoningTrace: r.reasoning_trace || undefined,
      documentDraft: deserializeDraft(r.document_draft_json),
      taskSteps: r.task_steps_json ? JSON.parse(r.task_steps_json) : undefined,
      quickActions: r.quick_actions_json ? JSON.parse(r.quick_actions_json) : undefined,
    }));
  }

  /**
   * Persists a single chat message into the SQLite ledger.
   */
  static async saveMessage(
    sessionId: string = this.DEFAULT_SESSION_ID,
    message: AgentChatMessage
  ): Promise<void> {
    const db = await this.getDb();
    const draftJson = serializeDraft(message.documentDraft);
    const stepsJson = message.taskSteps ? JSON.stringify(message.taskSteps) : null;
    const actionsJson = message.quickActions ? JSON.stringify(message.quickActions) : null;

    await db.runAsync(
      `INSERT OR REPLACE INTO ai_messages (
        id, session_id, role, content, reasoning_trace, document_draft_json, task_steps_json, quick_actions_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        message.id,
        sessionId,
        message.role,
        message.content || '',
        message.reasoningTrace || null,
        draftJson,
        stepsJson,
        actionsJson,
        message.timestamp || Date.now(),
      ]
    );

    await db.runAsync('UPDATE ai_sessions SET updated_at = ? WHERE id = ?;', [Date.now(), sessionId]);
  }

  /**
   * Updates the active draft in context on the session record.
   */
  static async updateActiveDraft(
    sessionId: string = this.DEFAULT_SESSION_ID,
    draft: ParsedDocumentDraft | null
  ): Promise<void> {
    const db = await this.getDb();
    const draftJson = serializeDraft(draft);
    await db.runAsync(
      'UPDATE ai_sessions SET active_draft_json = ?, updated_at = ? WHERE id = ?;',
      [draftJson, Date.now(), sessionId]
    );
  }

  /**
   * Clears all messages and active draft for a session.
   */
  static async clearSession(sessionId: string = this.DEFAULT_SESSION_ID): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM ai_messages WHERE session_id = ?;', [sessionId]);
    await db.runAsync('UPDATE ai_sessions SET active_draft_json = NULL, updated_at = ? WHERE id = ?;', [
      Date.now(),
      sessionId,
    ]);
  }

  /**
   * Records an agent proposed financial action for user verification (T3/T4).
   */
  static async saveProposal(proposal: AgentProposalRecord): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT INTO agent_proposals (id, session_id, action_type, tier, status, target_id, payload_json, created_at, executed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        proposal.id,
        proposal.sessionId || this.DEFAULT_SESSION_ID,
        proposal.actionType,
        proposal.tier,
        proposal.status,
        proposal.targetId || null,
        JSON.stringify(proposal.payload),
        proposal.createdAt,
        proposal.executedAt || null,
      ]
    );
  }

  /**
   * Retrieves pending proposals requiring human-in-the-loop sign-off.
   */
  static async getPendingProposals(sessionId: string = this.DEFAULT_SESSION_ID): Promise<AgentProposalRecord[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<{
      id: string;
      session_id: string | null;
      action_type: string;
      tier: number;
      status: string;
      target_id: string | null;
      payload_json: string;
      created_at: number;
      executed_at: number | null;
    }>(
      `SELECT id, session_id, action_type, tier, status, target_id, payload_json, created_at, executed_at
       FROM agent_proposals
       WHERE session_id = ? AND status = 'pending'
       ORDER BY created_at ASC;`,
      [sessionId]
    );

    return (rows || []).map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      actionType: r.action_type as any,
      tier: r.tier,
      status: r.status as any,
      targetId: r.target_id,
      payload: JSON.parse(r.payload_json),
      createdAt: r.created_at,
      executedAt: r.executed_at,
    }));
  }

  /**
   * Updates proposal state (approved, rejected, executed).
   */
  static async updateProposalStatus(
    id: string,
    status: 'approved' | 'rejected' | 'executed'
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      'UPDATE agent_proposals SET status = ?, executed_at = ? WHERE id = ?;',
      [status, Date.now(), id]
    );
  }
}
