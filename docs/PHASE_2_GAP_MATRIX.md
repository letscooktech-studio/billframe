# BILLFRAME PHASE 2 — GAP MATRIX & STATUS CORRECTIONS

**Audit Date:** 2026-10-03  
**Status Authority:** Antigravity Advanced Agentic Engineering  
**Application:** Billframe (Android API 36, Expo SDK 52, Local SQLite, React Native)  

---

## 1. Classification Definitions

* **`VERIFIED`**: Implemented, integrated, secure, persistent, failure-tested, real-device-tested, and passing automated regression suite.
* **`IMPLEMENTED_UNVERIFIED`**: Code is written and passes unit tests, but lacks external/physical verification.
* **`PARTIAL`**: Core logic exists, but edge cases or auxiliary workflows are incomplete.
* **`SANDBOX_ONLY`**: Works in offline testnet or simulated mode; production credentials/endpoints not yet verified.
* **`FOUNDATION_ONLY`**: Basic architectural scaffolding and type contracts exist; not legally compliance-grade.
* **`USER_CONFIGURED_GENERIC`**: Unverified generic model driven entirely by user-supplied inputs.
* **`BLOCKED_EXTERNAL`**: Blocked on external third-party authorization (e.g. Razorpay Partner account approval, Google Play console access).
* **`HIDDEN`**: Implemented or roadmap feature intentionally hidden from production UI navigation.

---

## 2. Comprehensive Phase 2 Gap Matrix

| Requirement | Claimed Status | Actual Implementation | Automated Proof | Device Proof | External Dependency | Security Status | Final Status | Required Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Official Tax Source Adapters** | None | Scaffolding missing | None | None | CBIC / HMRC / CRA / SST portal access | Safe (public data) | **PARTIAL** | Build `tax-data/` adapters for authoritative source parsing |
| **TaxPackSync** | None | None | None | None | CDN / Static hosting | Integrity verification required | **IMPLEMENTED_UNVERIFIED** | Implement `TaxPackSyncService` with hash checks |
| **Signed Tax Manifests** | None | Hardcoded metadata | Unit test | None | Crypto signing key | High (signature verification) | **PARTIAL** | Implement JSON manifest signature & sha256 validation |
| **Tax Rollback** | None | None | None | None | None | Safe | **PARTIAL** | Preserve previous tax pack on failed sync |
| **Full India HSN/SAC Dataset** | VERIFIED | ~60 hand-selected records | Unit tests | Renders on screen | CBIC official dataset | Safe | **PARTIAL** | Expand catalog to comprehensive normalized dataset |
| **India GST Pack Compliance** | VERIFIED | CGST/SGST/IGST/UTGST/LUT | 14 Jest tests | API 36 UI | None | Safe | **PARTIAL** | Build explicit 19-point GST completeness matrix |
| **US Sales Tax Pack** | VERIFIED | Flat-rate override | Basic unit test | None | SST state boundaries | Risk of non-compliance | **FOUNDATION_ONLY** | Mark foundation; require state/subdivision entry |
| **UK VAT Pack** | VERIFIED | 20% flat rate | Basic unit test | None | HMRC categories | Risk of non-compliance | **FOUNDATION_ONLY** | Mark foundation; structure reduced & zero-rate |
| **Canada Sales Tax Pack** | VERIFIED | Hardcoded province rates | Basic unit test | None | CRA rules | Risk of non-compliance | **FOUNDATION_ONLY** | Mark foundation; clarify digital vs physical rules |
| **Generic Tax Model** | VERIFIED | Dynamic rate calculation | Basic unit test | None | None | Safe | **USER_CONFIGURED_GENERIC** | Clearly label as user-configured in UI |
| **Direct UPI Engine** | VERIFIED | VPA regex + URI builder | 9 Jest tests | Passes in test suite | None | Sanitized input | **VERIFIED** | Maintain baseline |
| **Direct Merchant-QR Scanner** | None | Manual VPA typing only | None | None | Camera hardware & permission | Requires contextual consent | **PARTIAL** | Add contextual camera QR scanner with confirmation preview |
| **UPI Static QR Parsing** | VERIFIED | Only parses URIs with `am=` | Unit test | Fails on amountless QR | None | Safe | **PARTIAL** | Support `am`-optional UPI URI parsing |
| **Offline QR Matrix Generator** | VERIFIED | Pure TS ISO/IEC 18004 | Unit tests | Renders on screen & PDF | None | Safe | **IMPLEMENTED_UNVERIFIED** | Test with independent third-party QR decoder |
| **UPI-App Interoperability** | VERIFIED | `upi://pay` URI generated | String assertions | Needs multi-app test | Installed UPI apps (GPay, PhonePe, Paytm, BHIM) | Untrusted app return | **DEVICE_VERIFICATION_PENDING** | Physical test matrix across UPI apps |
| **Invoice UPI Snapshot** | VERIFIED | Generated dynamically | Unit tests | None | None | Prevents historical rewrite | **PARTIAL** | Snapshot VPA/payee inside document tax/payment snapshot |
| **Outstanding & Aging Engine** | VERIFIED | Integer BigInt buckets & DSO | 4 Jest tests | Runs in collections | None | Safe | **VERIFIED** | Maintain baseline |
| **Collections Hub** | VERIFIED | Full AR cockpit screen | Integration tests | Tested on API 36 | None | Safe | **VERIFIED** | Maintain baseline |
| **Reminder History** | None | Instant deep-link only | None | None | None | Logs unverified delivery | **PARTIAL** | Implement `reminder_events` table & logging |
| **Auto-Stop Reminders** | None | Manual filtering | None | None | None | Safe | **PARTIAL** | Suppress reminders when invoice balance <= 0 |
| **Promise-to-Pay Tracking** | None | None | None | None | None | Safe | **PARTIAL** | Add collection metadata fields on invoice |
| **Customer Statements** | PARTIAL | Basic invoice/payment table | Unit tests | Modal renders | None | Safe | **PARTIAL** | Add credit notes, refunds, advances, running balance |
| **Customer Advances / Credits** | None | Overpayment rejected | None | None | None | Must prevent value loss | **PARTIAL** | Implement `customer_advances` & allocation engine |
| **Credit Notes** | None | Enum only | None | None | None | Document immutability | **PARTIAL** | Build credit note lifecycle & balance adjustments |
| **Refunds** | None | None | None | None | None | Linked to original payment | **PARTIAL** | Implement `payment_refunds` separate from credit notes |
| **Payment Provider Backend** | None | Client makes direct HTTP | Unit tests | None | Cloud server | Client secrets vulnerability | **SANDBOX_ONLY** | Build Billframe Cloud control plane architecture |
| **Razorpay OAuth / Partner** | None | Manual API key input | None | None | Razorpay Partner Approval | Secrets on device | **BLOCKED_EXTERNAL** | Require server-side token custody |
| **Webhook Public Endpoint** | None | Mobile processor only | 10 Jest tests | None | Public server URL | Client cannot listen on HTTP | **SANDBOX_ONLY** | Deploy serverless webhook endpoint |
| **Provider-Token Storage** | None | Plaintext in SQLite | Schema test | SQLite table | None | **HIGH RISK (Critical)** | **VULNERABLE** | Purge secrets from SQLite; store server-side |
| **Provider Settlements** | None | None | None | None | Provider settlement API | Distinct from capture | **PARTIAL** | Add settlement models and reconciliation state |
| **Provider Payment Fees** | None | None | None | None | Provider fee API | Expense tracking | **PARTIAL** | Add fee model and optional auto-expense |
| **BigInt Regression Guard** | None | Unsafe `BigInt(num)` in Reports | None | Crashed on device | None | RangeError crash | **CRITICAL_FIX_REQUIRED** | Safe BigInt parsing utility + regression tests |
| **Release Build Verification** | VERIFIED | Debug APK built | Gradle compile | Debug APK 246MB | None | Must verify R8 & shrinking | **PARTIAL** | Build signed release AAB/APK with R8 verification |

---

## 3. Status Corrections Applied Immediately

1. **Razorpay Provider & Webhooks**: Reclassified from `VERIFIED` to **`SANDBOX_ONLY`**. Normal production merchants will not be presented with API key secret fields.
2. **US Sales Tax Pack**: Reclassified from `VERIFIED` to **`FOUNDATION_ONLY`**.
3. **UK VAT Pack**: Reclassified from `VERIFIED` to **`FOUNDATION_ONLY`**.
4. **Canada Tax Pack**: Reclassified from `VERIFIED` to **`FOUNDATION_ONLY`**.
5. **Generic Tax Pack**: Reclassified from `VERIFIED` to **`USER_CONFIGURED_GENERIC`**.
6. **QR Matrix Generator**: Reclassified from `VERIFIED` to **`IMPLEMENTED_UNVERIFIED`** pending independent decoder test suite.
7. **Production Razorpay Connection**: Tagged **`BLOCKED_EXTERNAL`** pending official Razorpay Partner Platform approval.
