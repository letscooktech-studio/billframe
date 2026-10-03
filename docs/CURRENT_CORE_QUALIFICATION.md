# BILLFRAME — CURRENT CORE QUALIFICATION REPORT

**Stage:** 0 — Core Requalification  
**Date:** 2026-10-04  
**Qualification Agent:** Antigravity  
**Result: CONDITIONAL PASS — Platform import fix required and applied before tag**

---

## 1. AUTOMATED VERIFICATION

### 1.1 TypeScript — `npx tsc --noEmit`

| | |
|---|---|
| **Command** | `npx tsc --noEmit` |
| **Exit Code** | 0 |
| **Errors** | 0 |
| **Result** | ✅ PASS |

**Note:** One TypeScript error was found during Stage 0 forensics and fixed before tagging:
- `src/app/(tabs)/documents.tsx:206` — `Platform` used but not imported → `ReferenceError: Platform is not defined` at runtime (crashed entire Documents tab)
- Fix: Added `Platform` to React Native import list.

---

### 1.2 Jest Tests — `npm test --forceExit`

| | |
|---|---|
| **Command** | `npm test -- --forceExit` |
| **Exit Code** | 0 |
| **Test Suites** | 26 / 26 passed |
| **Tests** | 185 / 185 passed |
| **Time** | 11.542 s |
| **Result** | ✅ PASS |

**Note:** Jest force-exits with a worker process warning (async timer leak). Not a test failure — open handles from async database operations in tests. Tracked as tech debt, not P0.

---

### 1.3 Expo Doctor — `npx expo-doctor`

| | |
|---|---|
| **Command** | `npx expo-doctor` |
| **Exit Code** | 0 |
| **Checks** | 21 / 21 passed |
| **Issues** | None |
| **Result** | ✅ PASS |

---

### 1.4 Android Build — `.\gradlew.bat assembleDebug` (JDK 17)

| | |
|---|---|
| **Command** | `.\gradlew.bat assembleDebug` (with `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot`) |
| **Exit Code** | 0 |
| **Build Time** | 2 minutes |
| **Actionable Tasks** | 59 executed, 431 up-to-date |
| **APK Location** | `android/app/build/outputs/apk/debug/app-debug.apk`<br>`Billframe-Latest.apk` (project root) |
| **Result** | ✅ PASS |

**Note:** System default `JAVA_HOME` points to JRE 1.8 which fails Gradle. JDK 17 (Eclipse Adoptium) must be used. `JAVA_HOME` must be set explicitly per session or globally. Tracked for developer environment doc.

**Gradle warnings:**
- Deprecated Gradle features (Gradle 10 compatibility warning) — non-breaking, tracked for future upgrade.
- CMake build path warning (path length) — non-breaking.

---

## 2. DEFECTS FOUND AND FIXED DURING STAGE 0

### DEFECT-001 — CRITICAL (P0)
**File:** `src/app/(tabs)/documents.tsx`  
**Line:** 206  
**Type:** Missing import → Runtime ReferenceError  
**Symptom:** Documents tab crashed on load with `ReferenceError: Platform is not defined`, making the entire app non-functional — all document rows, all buttons, + create button all dead.  
**Root Cause:** `Platform` was added to JSX (`Platform.OS === 'web' ? undefined : 'button'`) in a previous session fix but the import was not added.  
**Fix Applied:** Added `Platform` to React Native import in `documents.tsx`.  
**Status:** ✅ FIXED before tagging.

---

## 3. PHYSICAL ANDROID SMOKE TEST

**Status: PENDING — Requires manual installation on physical Android device.**

APK available at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Required Physical Smoke Tests (Section 4 of Master Prompt):

| Flow | Status |
|---|---|
| Fresh install | ⏳ PENDING |
| Onboarding | ⏳ PENDING |
| Business profile setup | ⏳ PENDING |
| Create client | ⏳ PENDING |
| Create invoice draft | ⏳ PENDING |
| Save draft | ⏳ PENDING |
| Close and reopen — draft persists | ⏳ PENDING |
| Edit draft | ⏳ PENDING |
| Issue invoice | ⏳ PENDING |
| Close and reopen — still issued | ⏳ PENDING |
| Create second invoice — sequential numbering | ⏳ PENDING |
| Record partial payment | ⏳ PENDING |
| Receipt generated | ⏳ PENDING |
| Remaining balance correct | ⏳ PENDING |
| Second payment → paid state | ⏳ PENDING |
| Quick Bill | ⏳ PENDING |
| Estimate | ⏳ PENDING |
| Credit note | ⏳ PENDING |
| UPI QR generation | ⏳ PENDING |
| Offline open | ⏳ PENDING |
| Offline edit | ⏳ PENDING |
| Network restore | ⏳ PENDING |
| Backup | ⏳ PENDING |

**Physical device test results must be filled in by the user and/or engineering team.**

---

## 4. METRO / WEB RUNTIME EVIDENCE (Reference Only)

From prior session: full flow tested on Metro web runtime:
- Onboarding → create customer inline → add line item inline → issue INV-0001 → record UPI payment → balance ₹0.00 → RCP-0001 generated → receipt viewed → Documents tab.

**This is web/Metro evidence only. It does NOT replace physical Android testing.**

---

## 5. KNOWN TECHNICAL DEBT (Non-Blocking for Baseline)

| # | Issue | Severity |
|---|---|---|
| TD-001 | Jest --forceExit: async timer/handle leak in test teardown | Low |
| TD-002 | System JAVA_HOME defaults to JRE 1.8; must set JDK 17 for Android builds | Medium — developer env |
| TD-003 | Gradle deprecated feature warnings (Gradle 10 future incompatibility) | Low |
| TD-004 | `generateSalt()` in SecurityService uses `Math.random()` — not cryptographically secure | **Medium — Stage 1 item** |
| TD-005 | Web fallback for PIN uses `localStorage` — not secure on web | Medium — web-only, Android uses SecureStore |
| TD-006 | `doc_type` CHECK constraint in `number_sequences` does not include all doc_type values from `documents` table (missing: 'proforma', 'delivery_note', 'work_order', 'proposal', 'sow') — actually present, schema consistent | Low |
| TD-007 | `balance_minor` column absent from `documents` table — balance derived at runtime | Medium — Stage 2 item |

---

## 6. SCHEMA SUMMARY (27 tables verified)

| # | Table | Purpose |
|---|---|---|
| 1 | `business_profiles` | Business identity, currency, locale, UPI |
| 2 | `customers` | Client/customer records |
| 3 | `catalog_items` | Products & services catalog |
| 4 | `number_sequences` | Per-business-per-doc-type sequence allocation |
| 5 | `jobs` | Projects / job tracking |
| 6 | `documents` | All document types (UNIQUE constraint on number) |
| 7 | `document_items` | Line items (ON DELETE CASCADE) |
| 8 | `document_snapshots` | Frozen issued-state snapshot |
| 9 | `payments` | Payment ledger |
| 10 | `receipts` | Per-payment receipts |
| 11 | `expenses` | Business/job expenses |
| 12 | `time_entries` | Timesheet entries |
| 13 | `estimate_revisions` | Estimate change-order audit trail |
| 14 | `settings` | Key-value config |
| 15 | `migration_history` | Applied migration tracking |
| 16 | `audit_events` | Immutable financial audit log |
| 17 | `workspace_preferences` | Business type, feature toggles |
| 18 | `feature_usage` | Local personalization signals |
| 19 | `countries` | ISO 3166-1 offline reference |
| 20 | `subdivisions` | ISO 3166-2 offline reference |
| 21 | `document_tax_snapshots` | Frozen tax audit ledger |
| 22 | `payment_provider_connections` | Non-secret provider config |
| 23 | `credit_notes` | Sales adjustments |
| 24 | `customer_advances` | Customer credit balances |
| 25 | `credit_allocations` | Advance/credit → invoice allocation |
| 26 | `payment_refunds` | Refund records |
| 27 | `reminder_events` | AR collection reminder log |
| + | `invoice_collection_metadata` | Promise-to-pay metadata |

**Financial integrity constraints verified:**
- `UNIQUE(business_profile_id, doc_type, document_number)` on documents ✅
- `UNIQUE(business_profile_id, receipt_number)` on receipts ✅
- `UNIQUE(business_profile_id, doc_type)` on number_sequences ✅
- Foreign keys enabled via `PRAGMA foreign_keys = ON` ✅

---

## 7. BASELINE TAG

```
Tag: mobile-core-v1-baseline
Commit: [applied at time of tag]
Date: 2026-10-04
```

---

## 8. STAGE 0 VERDICT

| Check | Result |
|---|---|
| TypeScript | ✅ 0 errors |
| Jest | ✅ 26/26 suites, 185/185 tests |
| Expo Doctor | ✅ 21/21 checks |
| Android Build | ✅ BUILD SUCCESSFUL |
| P0 Defect (Platform import) | ✅ Fixed before tag |
| Physical Android | ⏳ Pending user execution |

**Stage 0 verdict: PASS (automated) / PENDING (physical device)**

Proceeding to Stage 1 — Security / Validation Foundation.
