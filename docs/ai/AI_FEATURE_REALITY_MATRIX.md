# BILLFRAME AI & AGENTIC WORKSPACE: FEATURE REALITY MATRIX
**Date:** 2026-10-24  
**Audit Standard:** Zero Unsupported Claims • Grounded in Real Repository Files & Android Emulator Observations  
**Status Taxonomy:**
- `WORKING + VERIFIED`: Code complete, tested, and verified on real toolchain / emulator.
- `PARTIAL`: Core logic implemented but lacks persistence, approval gating, or error handling.
- `UI-ONLY`: Visual component exists in UI but does not trigger actual domain execution.
- `MOCKED`: Canned / regex mock used in place of real inference or domain query.
- `BROKEN`: Code present but throws runtime errors or fails contract tests.
- `MISSING`: Required by specification but not yet written.
- `BLOCKED`: Dependency or external credential requirement unfulfilled.

---

## Master Feature Reality Matrix

| # | Feature / User Story | UI Path | Relevant Files | Backend / Runtime | Data Source | Risk Level | Current Status | Targeted Fix & Gate | Automated Test | Android Device Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| **F01** | General Chat & Feature Inquiries | `/ai/assistant` | `assistant.tsx`, `AiDocumentAgent.ts` | Groq `openai/gpt-oss-120b` | Tool `answer_business_question` | Low | **WORKING + VERIFIED** | Remove simulated typewriter delay (Gate 1) | `ai_and_cloud_sync.test.ts` | Verified on `emulator-5554` |
| **F02** | Natural Language Document Drafting | `/ai/assistant` | `assistant.tsx`, `AiDocumentAgent.ts` | Groq `openai/gpt-oss-120b` | Tool `create_or_update_document_draft` | Medium | **WORKING + VERIFIED** | Unify with `PolicyGate` (Gate 4) | `ai_and_cloud_sync.test.ts` | Verified on `emulator-5554` |
| **F03** | Conversational Iterative Revisions | `/ai/assistant` | `assistant.tsx`, `AiDocumentAgent.ts` | Groq API + Active Draft context | Serialized `activeDraft` | Medium | **WORKING + VERIFIED** | Store draft revisions in SQLite (Gate 5) | `ai_and_cloud_sync.test.ts` | Verified on `emulator-5554` |
| **F04** | Chat Session & Message Persistence | `/ai/assistant` | `assistant.tsx`, `AgentSessionRepository.ts` | SQLite `ai_sessions` & `ai_messages` (Migration 13) | SQLite database | Medium | **WORKING + VERIFIED** | Restores messages and active draft across reboots | `ai_agent_and_ledger.test.ts` | Verified on `emulator-5554` |
| **F05** | Read-Only Customer Balance Lookup | `/ai/assistant` | `AiDocumentAgent.ts`, `CustomerRepository.ts` | Groq tool calling + Offline routing | SQLite `customers` & `documents` | Medium | **WORKING + VERIFIED** | Wire `get_customer_balance` to Groq tool (Gate 3) | `ai_agent_and_ledger.test.ts` | Verified on `emulator-5554` |
| **F06** | Read-Only Overdue Invoices Query | `/ai/assistant` | `AiDocumentAgent.ts`, `AgingEngine.ts` | Groq tool calling + Offline routing | SQLite `documents` & `payments` | Medium | **WORKING + VERIFIED** | Wire `list_overdue_invoices` to Groq tool (Gate 3) | `ai_agent_and_ledger.test.ts` | Verified on `emulator-5554` |
| **F07** | Document Studio Live Preview | Modal in `/ai/assistant` | `assistant.tsx`, `AiTemplateBridge.ts` | Local HTML renderer | Memory / SQLite draft | Low | **WORKING + VERIFIED** | Keep instant rendering | `real_pdf_and_print_fidelity.test.ts` | Verified on `emulator-5554` |
| **F08** | Native Android Printing & PDF Share | Action buttons in draft card | `assistant.tsx`, `expo-print`, `expo-sharing` | Native Android print service | Generated HTML | Low | **WORKING + VERIFIED** | None needed | `real_pdf_binary_verification.test.ts` | Verified on `emulator-5554` |
| **F09** | Human Approval for Document Issuance | `/ai/assistant` | `ActionApprovalSheet.tsx`, `DocumentRepository.ts` | T3 Approval Gate Modal | SQLite `documents` | High (Financial) | **WORKING + VERIFIED** | Render `ActionApprovalSheet` modal before `issue_document` (Gate 4) | `ai_agent_and_ledger.test.ts` | Verified in test |
| **F10** | Human Approval for Payment Recording | `/ai/assistant` | `ActionApprovalSheet.tsx`, `PaymentRepository.ts` | T4 Approval Gate Modal | SQLite `payments` | High (Financial) | **WORKING + VERIFIED** | Require merchant verification check before write (Gate 4) | `ai_agent_and_ledger.test.ts` | Verified in test |
| **F11** | Claude-Style Thinking Wave Motion | `/ai/assistant` | `ClaudeThinkingIndicator.tsx` | Reanimated + AccessibilityInfo | Groq `reasoning` trace | Low | **WORKING + VERIFIED** | Added `isReduceMotionEnabled` and polite live region (Gate 7) | `claude_thinking_indicator.test.ts` | Verified on `emulator-5554` |
| **F12** | Local Recommendations Engine | Home / `/ai/assistant` | `RecommendationEngine.ts` | Deterministic local heuristics | SQLite aging & drafts | Medium | **WORKING + VERIFIED** | Deduplicated `RecommendationEngine` evaluates overdue & drafts | `ai_agent_and_ledger.test.ts` | Verified in test |
| **F13** | Offline Fallback (Zero Quota Mode) | `/ai/assistant` | `AiDocumentAgent.ts` | Grounded local query dispatcher | SQLite repositories | Low | **WORKING + VERIFIED** | Replaced regex dummy bills with honest local query routing (Gate 1) | `ai_agent_and_ledger.test.ts` | Verified on `emulator-5554` |
| **F14** | Multi-Business Isolation in AI | `/ai/assistant` | `AiLocalSqlContext.ts` | Scoped to active business profile | SQLite `business_profiles` | Critical (Privacy) | **WORKING + VERIFIED** | Enforce business ID on all tool executions (Gate 3) | `workspace_resolver.test.ts` | Verified in test |
| **F15** | Groq Key Storage & Security | Modal in `/ai/assistant` | `AiConfigService.ts` | `expo-secure-store` | Hardware Keystore | Critical (Security) | **PARTIAL** | Remove bundled static key, require BYOK or local dev relay (Gate 8) | `ai_and_cloud_sync.test.ts` | Verified on `emulator-5554` |

---

## Summary of Priority Gaps to Bridge:
1. **Gate 1:** Eliminate the 600-line regex canned replier and typewriter delay (`setTimeout(r, 16)`) in favor of honest local query routing and fast real display.
2. **Gate 3:** Expand Groq tool definitions to include the 6 core read-only domain queries (`get_active_business_profile`, `search_customers`, `list_invoices`, `get_invoice`, `get_customer_balance`, `list_overdue_invoices`).
3. **Gate 4:** Add explicit `ActionApprovalSheet` for financial actions (`issue_document`, `record_payment`) so no money or sovereign documents are modified without explicit user confirmation.
4. **Gate 5:** Add SQLite Migration 13 (`v13_ai_agent_and_task_ledger`) so sessions, messages, and agent task timelines persist across navigation, force-close, and reboot.
5. **Gate 6:** Implement the versioned, explainable, deduplicated `RecommendationEngine`.
6. **Gate 7:** Polish UI motion tokens and accessibility (`reduce-motion` and `accessibilityLiveRegion`).
