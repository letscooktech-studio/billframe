# BILLFRAME AI & AGENTIC WORKSPACE: CURRENT STATE FORENSIC AUDIT
**Date:** 2026-10-24  
**Auditor:** Principal AI Systems Engineer & Mobile Architect  
**Platform:** Expo SDK 57 / React Native 0.86.3 / Hermes Engine on Android (Emulator x86_64 API 34 & arm64-v8a target)  
**Document Purpose:** Baseline forensic investigation prior to Phase 1-8 execution of the 2026-10-24 AI Workspace Rebuild Directive.

---

## 1. Physical Device & Emulator Runtime Observation

### A. Route and Window Description
- **Primary Entry Point:** `src/app/(tabs)/index.tsx` (Dashboard) contains a button labeled `✨ Draft with AI Agent (Chat)` located at bounds `[343, 688][800, 735]`, which calls `router.push('/ai/assistant')`.
- **Target Screen:** `src/app/ai/assistant.tsx` (`Billframe AI Agent`).
- **Initial Visual State:**
  - Header: Left back arrow (`router.back()`), center title `"Billframe AI Agent"`, subtitle `"AI Agent · Ready"`, right action icons: Settings gear (opens BYOK modal), Cloud/Sync icon (`/settings/cloud-sync`), and Document icon.
  - Message Area: Contains a single static initial message in React `useState`:
    `"What would you like to draft today?\n\nTell me what document you need in plain words, or tap a quick starter below."`
  - Horizontal Quick Starter Carousel: `[✦ Job Application]`, `[✦ GST Tax Invoice]`, `[✦ Salary Slip]`, `[✦ Grocery Bill (10 items)]`, `[✦ House Rent Receipt]`.
  - Composer Area: Text input `Ask AI to create or query any document...` with send button (`Send` icon).

### B. Observed Behavior During Live Execution (Emulator Android 14 x86_64)
- **Prompt:** `"Draft a GST Tax Invoice for Acme Corp with 18% GST"` (or tapping quick starter).
- **Execution:**
  1. `isProcessing` flips to `true`.
  2. Live thinking card appears with wave animation: `"Thinking for 5s"`.
  3. Real HTTP request is dispatched to Groq API (`openai/gpt-oss-120b`).
  4. Tool call `create_or_update_document_draft` is returned by Groq LPU in ~1.4s.
  5. Reply text is typed out via a simulated word-by-word `setTimeout(..., 16)` delay loop in `AiDocumentAgent.ts` lines 467-478.
  6. An interactive Draft Card renders with:
     - Header: `GST Tax Invoice` • `✦ GST 01` • `CBIC CGST Rule 46 Commercial Invoice • INV-2026-312`
     - Counterparty: `Client: Acme Corp`
     - Total: `₹7,080.00`
     - Action buttons: `[Preview Document]`, `[Print]`, `[HTML]`, `[Edit]`
     - Contextual action pills: `[+ Add 10% Trade Discount]`, `[+ Add 18% GST]`, `[+ Add ₹1,500 Delivery & Freight]`.
- **Observed Defect / Disconnect:**
  - If the user taps the back arrow or switches tabs to `Documents`, then returns to `/ai/assistant`:
    **The conversation is completely reset back to the initial welcome message!**
    The generated invoice draft, thinking timeline, and message history vanish because they were kept purely in ephemeral React component state (`useState`).

---

## 2. Codebase Inventory of AI / Agent Components & Anti-Patterns

### A. Routes & Screens
| Path | Component / Screen | State Store | Persistence |
|---|---|---|---|
| `src/app/ai/assistant.tsx` | `AiAssistantScreen` | React `useState` | **None (Lost on unmount/reopen)** |
| `src/app/settings/cloud-sync.tsx` | `CloudSyncScreen` | React `useState` + SecureStore | Config only (Supabase URL/Key) |
| `src/app/(tabs)/index.tsx` | `HomeScreen` | SQLite via Repositories | Durable |
| `src/app/(tabs)/documents.tsx` | `DocumentsScreen` | SQLite (`DocumentRepository`) | Durable |

### B. Response Generators & Heuristics
- `src/services/ai/AiDocumentAgent.ts`:
  - **Cloud Path (Lines 401-539):** Uses Groq Chat Completions API with `openai/gpt-oss-120b` and function tools (`create_or_update_document_draft`, `answer_business_question`).
  - **Simulated Pacing Anti-Pattern (Lines 477, 527, 641):**
    ```typescript
    await new Promise((r) => setTimeout(r, 16)); // Artificial typewriter delay
    ```
    This delays semantic task completion even when the Groq LPU responds in sub-second time.
  - **Deterministic Offline Fallback (Lines 870-1470):**
    `runDeterministicHeuristic` spans **600 lines** of hardcoded regex branches:
    - Case A: `prompt.match(/(?:job application|application|apply|role|position)...)` -> Hardcoded Candidate Dossier items.
    - Case B: `prompt.match(/(?:job offer|offer letter|appointment letter)...)` -> Hardcoded Aarav Sharma CTC ₹12,00,000.
    - Case C: `prompt.match(/(?:salary slip|payslip)...)` -> Hardcoded Basic ₹65,000, HRA ₹25,000, PF ₹3,600.
    - Case D: `prompt.match(/(?:rent receipt|house rent)...)` -> Hardcoded Rahul Sharma ₹28,000.
    - Case E: `prompt.match(/(?:grocery|supermarket|kirana)...)` -> Hardcoded 10 FMCG items (Basmati Rice, Atta, Oil).
    - Case F: `prompt.match(/(?:invoice|bill)...)` -> Hardcoded Acme Corp ₹10,000.
  - **Risk:** When offline, if a user asks a complex business question or an unsupported document request, it silently falls into these canned regex templates rather than honestly reporting local capabilities.

### C. Agent Workflow Architecture Disconnect
- `src/services/agent/` contains:
  - `ToolRegistry.ts` (7 registered domain tools: `find_customers`, `create_customer`, `calculate_document`, `save_document_draft`, `issue_document`, `record_payment`, `get_active_profile`).
  - `PolicyGate.ts` (Evaluates `allowed`, `denied`, `requires_user_approval`).
  - `Verifier.ts` (Validates business profile existence, customer links, non-negative amounts, date validity).
  - `AgentWorkflowEngine.ts` (Plan execution and verification).
- **The Disconnect:**
  `src/app/ai/assistant.tsx` and `src/services/ai/AiDocumentAgent.ts` **DO NOT USE** `AgentWorkflowEngine` or `PolicyGate`!
  `AiDocumentAgent` was implemented as a parallel standalone service that calls `DocumentRepository.saveDraft` directly without passing through `PolicyGate` approval checks or recording an execution ledger in SQLite.

---

## 3. End-to-End Request Path Tracing

### Current Request Path (As Implemented):
```
1. User types in TextInput or taps Quick Chip in assistant.tsx
   ↓
2. handleSendMessage(text) -> calls AiDocumentAgent.streamMessage()
   ↓
3. AiLocalSqlContext.buildContextForPrompt():
   - Queries SQLite: BusinessProfileRepository.getActiveProfile()
   - Queries SQLite: CustomerRepository.search(nameMatch)
   - Fetches DocumentTypeRegistry definitions
   ↓
4. AiConfigService.getConfig():
   - Reads SecureStore: provider ('groq'), apiKey, model ('openai/gpt-oss-120b')
   ↓
5. HTTP POST https://api.groq.com/openai/v1/chat/completions
   - Headers: { Authorization: Bearer <key>, Content-Type: application/json }
   - Body: { model: 'openai/gpt-oss-120b', messages: [...], tools: AGENT_DOCUMENT_TOOLS, tool_choice: 'auto' }
   ↓
6. Groq LPU processes in ~1.2s - 2.5s -> Returns tool_call or message content
   ↓
7. AiDocumentAgent.commitAndVerifyDraft():
   - Normalizes line items, quantities (quantityScaled 10000n), and prices
   - Runs pure math via calculateDocument() in src/domain/documents/DocumentCalculator.ts
   - Persists draft to SQLite via DocumentRepository.saveDraft()
   - If counterparty does not exist, creates new customer in SQLite
   ↓
8. Event callbacks dispatch to assistant.tsx:
   - event.type = 'reasoning' -> updates thinking trace in ClaudeThinkingIndicator
   - event.type = 'content' -> typewriter loops in useState
   - event.type = 'done' -> sets activeDraft and appends assistant message in useState
   ↓
9. UI feedback:
   - Interactive draft card renders with preview, print, HTML, and edit actions
   - BUT NO record of this conversation or task lifecycle is written to an SQLite ai_sessions / agent_tasks table!
```

---

## 4. Feature Audit & Reality Matrix (AI Buttons & Actions)

| UI Element / Button | Location in Code | Action Triggered | Real or Placeholder? | Risk / Boundary Issue |
|---|---|---|---|---|
| `[✦ Job Application]` | `assistant.tsx:112` | Populates prompt and triggers stream | **Real (Calls Groq or Heuristic)** | Creates draft directly |
| `[✦ GST Tax Invoice]` | `assistant.tsx:113` | Populates prompt and triggers stream | **Real (Calls Groq or Heuristic)** | Creates draft directly |
| `[✦ Salary Slip]` | `assistant.tsx:114` | Populates prompt and triggers stream | **Real (Calls Groq or Heuristic)** | Creates draft directly |
| `[✦ Grocery Bill]` | `assistant.tsx:115` | Populates prompt and triggers stream | **Real (Calls Groq or Heuristic)** | Creates 10-item draft |
| `[Preview Document]` | `assistant.tsx:1620` | Opens full-screen WebView/HTML modal | **Real** | Pure read-only preview |
| `[Print]` | `assistant.tsx:1632` | Calls `expo-print` `Print.printAsync()` | **Real** | Native Android print service |
| `[HTML]` | `assistant.tsx:1645` | Downloads HTML proof to local cache & shares | **Real** | Uses `expo-file-system` & `expo-sharing` |
| `[Edit]` | `assistant.tsx:1658` | Calls `router.push('/documents/editor?draftId=...')` | **Real** | Navigates to full form editor |
| `[Settings Gear]` | `assistant.tsx:430` | Opens BYOK modal for API key config | **Real** | Persists key in `expo-secure-store` |
| `[Cloud Sync Icon]` | `assistant.tsx:442` | Calls `router.push('/settings/cloud-sync')` | **Real** | Navigates to Supabase sync screen |
| `[Payment / Issue Approval]` | *Missing in UI* | Financial writes currently bypass approval | **Broken / Missing Gate** | Financial actions must require explicit user approval sheet! |

---

## 5. Live Groq Connection & Model Verification Evidence

### A. Active Groq Endpoint Test (Executed via Node.js on Developer Machine)
```json
{
  "endpoint": "https://api.groq.com/openai/v1/chat/completions",
  "model": "openai/gpt-oss-120b",
  "status": 200,
  "http_latency_ms": 1391,
  "tool_call_received": {
    "name": "create_or_update_document_draft",
    "arguments_keys": [
      "docType",
      "documentTitle",
      "provenanceRule",
      "partyName",
      "items",
      "taxRatePercent",
      "replyExplanation",
      "reasoning"
    ]
  },
  "finish_reason": "tool_calls"
}
```

### B. Deprecated / Decommissioned Models Audit (as of October 2026)
- `llama-3.1-8b-instant`: **DEPRECATED** on Aug 16, 2026 for free/developer tiers.
- `llama-3.3-70b-versatile`: **DEPRECATED** on Aug 16, 2026.
- `groq/compound` & `groq/compound-mini`: **DECOMMISSIONED** on Sept 21, 2026.
- `qwen/qwen3.6-27b`: Replaced by `qwen/qwen3.8-27b` on Sept 14, 2026.
- **Current Active Supported Models in Billframe:**
  1. `openai/gpt-oss-120b` (Deep statutory reasoning & native tool calling) — Primary.
  2. `openai/gpt-oss-20b` (Fast conversational turns).
  3. `qwen/qwen3.8-27b` (Multilingual / Indian business terms).

---

## 6. Persistence & Continuity State

### A. Current Status: FAILS CONTINUITY
1. **Chat Messages:** Stored exclusively in `useState<AgentChatMessage[]>`. When the screen unmounts, all messages are lost.
2. **Agent Tasks & Steps:** Emitted via callbacks and stored in React state. No database table records tasks, events, or step histories.
3. **Drafted Documents:** The resulting document itself **is** persisted to SQLite via `DocumentRepository.saveDraft(verifiedDraft)`. However, the conversational context and why the document was created are not tied to an AI session in SQLite.

---

## 7. Subsystem Integration Analysis: Assistant vs Agents vs Insights

| Capability | Current Architecture | Unified or Disconnected? |
|---|---|---|
| **AI Assistant (Chat)** | `src/app/ai/assistant.tsx` + `AiDocumentAgent.ts` | Disconnected from `AgentWorkflowEngine` |
| **Agent Workflows** | `src/services/agent/AgentWorkflowEngine.ts` | Disconnected from conversational chat UI |
| **Recommendations** | `src/domain/documents/onboardingRecommendations.ts` | Independent static rule functions |
| **Document Engine** | `src/domain/documents/DocumentCalculator.ts` + `DocumentTypeRegistry.ts` | **Unified & Shared** (used across all) |
| **SQLite Storage** | `src/data/database/DatabaseManager.ts` | **Unified & Shared** (used across all) |

---

## 8. Database Schema Forensic & Gap Analysis

The database currently runs **12 SQLite migrations** (`src/data/database/migrations/registry.ts`).
Existing tables:
- `business_profiles`
- `customers`
- `catalog_items`
- `documents`
- `document_lines`
- `payments`
- `payment_allocations`
- `workspace_preferences`
- `template_definitions`
- `custom_document_types`
- `document_instances`

### Missing Agent Tables Required for Gate 5 & Gate 0:
1. `ai_sessions` (id, business_id, mode, provider, model_id, created_at, updated_at)
2. `ai_messages` (id, session_id, role, content_json, reasoning_json, status, created_at)
3. `agent_tasks` (id, session_id, business_id, goal, state, active_entity_ref, created_at, updated_at)
4. `agent_events` (id, task_id, seq, event_type, payload_json, created_at)
5. `agent_proposals` (id, task_id, proposal_type, scope_refs, diff_json, state, created_at)
6. `agent_approvals` (id, proposal_id, decision, timestamp, transaction_ref)
7. `recommendation_entries` (id, business_id, rule_id, evidence_refs, status, computed_at)

---

## 9. Baseline Device Performance & Accessibility

- **Keyboard Handling:** `KeyboardAvoidingView` is implemented in `assistant.tsx`, but on compact Android devices (5.5 - 6 inch screens), the horizontal starter pills and draft cards can compress the chat scroll area when the soft keyboard is visible.
- **Text Rendering:** Plain text and clean markdown are sanitized. No dangerous `dangerouslySetInnerHTML` is used in React Native.
- **Motion / Animations:** `ClaudeThinkingIndicator.tsx` uses `react-native-reanimated` with `useAnimatedStyle`. It supports continuous wave motion. However, it does not currently query `AccessibilityInfo.isReduceMotionEnabled()` to clamp animations for users requiring reduced motion.
- **Screen Reader:** Critical status updates are not yet wrapped in accessibility live regions (`accessibilityLiveRegion="polite"`).

---

## 10. Root Cause Summary & Action Plan

1. **Root Cause of "Canned / Fake" Feeling:**
   - Previous implementation defaulted to `'offline_heuristic'`, which routed every prompt through 600 lines of hardcoded regex templates (`Acme Corp`, ₹10,000, 10 grocery items).
   - Artificial typewriter delays (`setTimeout(r, 16)`) created fake latency instead of displaying instant real tool results.
   - The conversational UI did not link to `PolicyGate` or provide real approval sheets for financial mutations.
2. **Root Cause of Memory / Session Loss:**
   - Absence of `ai_sessions` and `ai_messages` tables in SQLite; all messages and draft states were maintained in component `useState`.
3. **Execution Plan:**
   - **Gate 0 & 1:** Validate SQLite persistence, create `AI_FEATURE_REALITY_MATRIX.md`, remove artificial delays.
   - **Gate 2 & 3:** Connect true Groq streaming with current models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`), wire real read-only business tools (`search_customers`, `list_invoices`, `get_customer_balance`, `list_overdue_invoices`).
   - **Gate 4:** Add explicit Human-in-the-Loop Approval Action Sheets (`ActionApprovalSheet.tsx`) for financial writes (issuing documents, recording payments).
   - **Gate 5:** Add SQLite Migration 13 (`v13_ai_agent_and_task_ledger`) to persist sessions, messages, tasks, and proposals across app relaunches.
   - **Gate 6 & 7:** Implement deterministic local recommendations engine and accessible motion tokens.
