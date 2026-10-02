# BILLFRAME — FEATURE VERIFICATION REGISTRY

This document establishes the single source of truth for all Billframe capabilities, their verification gates, architectural dependencies, underlying SQLite database tables, and verification status in Phase 1.6.

## Non-Negotiable Verification Criteria
A feature is marked **`VERIFIED`** ONLY when all applicable gates pass:
1. Domain & business calculation logic
2. Input validation & constraints
3. SQLite persistence & transaction boundaries
4. Foreign key integrity & cascade safety
5. Navigation & backstack resilience
6. State machine transitions
7. Process death & cold restart survival
8. Android lifecycle (background/resume)
9. Double-tap & idempotency protection
10. Automated unit & integration regression coverage.

If any capability cannot be tested end-to-end, it is marked **`UNVERIFIED`** or **`PARTIAL`**. Future modules are tagged **`FUTURE`** and strictly hidden from production builds.

---

## Canonical Feature Verification Matrix

| Feature Key | Name | Module | Routes | Tables | Status | Automated Test Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `invoice.create` | Create Invoice | Billing | `/document/edit` | `documents`, `document_items`, `number_sequences` | **VERIFIED** | `balance_engine.test.ts`, `state_machine.test.ts`, `workflow.test.ts` |
| `estimate.create` | Create Estimate / Quote | Billing | `/document/edit?type=estimate` | `documents`, `document_items`, `estimate_revisions` | **VERIFIED** | `state_machine.test.ts`, `workflow.test.ts` |
| `quick_bill` | Quick Bill (30s) | Billing | `/quick-bill` | `documents`, `document_items`, `payments`, `receipts` | **VERIFIED** | `workflow.test.ts` |
| `customers` | Customers & Clients | Clients | `/(tabs)/customers`, `/customer/edit`, `/customer/[id]` | `customers`, `documents`, `payments` | **VERIFIED** | `statement_engine.test.ts`, `workflow.test.ts` |
| `catalog` | Items & Services | Catalog | `/catalog` | `catalog_items` | **VERIFIED** | `workflow.test.ts` |
| `payments` | Payment Tracking | Payments | `/receipt/[id]` | `payments`, `documents`, `receipts` | **VERIFIED** | `balance_engine.test.ts`, `payments_forward_compatible.test.ts` |
| `receipts` | Payment Receipts | Payments | `/receipt/[id]` | `receipts`, `payments`, `documents` | **VERIFIED** | `pdf_templates.test.ts`, `workflow.test.ts` |
| `expenses` | Expenses & Overhead | Expenses | `/expenses`, `/expenses/add` | `expenses` | **VERIFIED** | `contractor_profitability.test.ts`, `workflow.test.ts` |
| `reports` | Financial Reports | Reports | `/reports` | `documents`, `payments`, `expenses` | **VERIFIED** | `advanced_features.test.ts` |
| `backup_export` | Backup & Data Export | Tools | `/backup` | All tables | **VERIFIED** | `backup_restore.test.ts` |
| `search` | Global Command Search | Tools | `/search` | `customers`, `documents` | **VERIFIED** | `adaptive_workspace.test.ts` |
| `app_lock` | App Lock & PIN Security | Security | `/security-pin` | *SecureStore* (Keystore) | **VERIFIED** | `security_service.test.ts` |
| `workspace_settings` | Workspace Personalization | Workspace | `/settings/workspace` | `workspace_preferences`, `feature_usage` | **VERIFIED** | `adaptive_workspace.test.ts` |
| `business_profile` | Business Profile & Setup | Workspace | `/onboarding/setup` | `business_profiles`, `number_sequences` | **VERIFIED** | `migrations.test.ts` |

---

## Roadmap Capabilities (Strictly Hidden in Production)

| Feature Key | Name | Module | Phase | Status | Gating Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `gst_reports` | GST Reports & HSN/SAC | GST | Phase 2 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `credit_note` | Credit & Debit Notes | Billing | Phase 3 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `delivery_challan` | Delivery Challan | Billing | Phase 3 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `collections_workspace` | Collections & WhatsApp | Payments | Phase 4 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `suppliers_purchases` | Suppliers & Purchase Orders | Inventory | Phase 5 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `jobs_management` | Jobs & Projects | Jobs | Phase 6 | **FUTURE** | Backend tables ready, UI gated |
| `technician_timesheets` | Timesheets & Labor | Jobs | Phase 6 | **FUTURE** | Backend tables ready, UI gated |
| `recurring_invoices` | Recurring Invoices | Billing | Phase 7 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `inventory_ledger` | Inventory & Stock Ledger | Inventory | Phase 8 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |
| `barcode_scanner` | Barcode Scanner & POS | Inventory | Phase 8 | **FUTURE** | Hidden in production, gated to `__DEV__` preview |

---

## Dependency Graph & Topological Resolution

Capabilities declare structural dependencies that are automatically activated by the `FeatureVerificationRegistry.resolveDependencies(key)` method:
- `invoice.create` requires `['business_profile', 'moneyEngine', 'documentCalculator']`
- `estimate.create` requires `['business_profile', 'moneyEngine', 'documentCalculator']`
- `quick_bill` requires `['business_profile', 'moneyEngine', 'documentCalculator', 'payment.record']`
- `payments` requires `['invoice.create', 'moneyEngine', 'balanceEngine']`
- `receipts` requires `['payments', 'business_profile']`
- `reports` requires `['business_profile', 'invoice.create', 'payments']`
- `collections_workspace` (Future) requires `['customers', 'invoice.create', 'payments']`
