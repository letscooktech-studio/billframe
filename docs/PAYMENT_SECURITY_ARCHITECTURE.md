# Billframe Payment Security Architecture

**Document Version:** 2.1.0  
**Target Platform:** Android (API 36 / Android 16) + Local SQLite + Cloud Control Plane  
**Classification:** Cryptographic & Payment Gateway Security Specification  
**Status:** Certified & Production-Qualified

---

## 1. Executive Summary & Non-Negotiable Invariants

Billframe is a privacy-first, local-first business money operating system. In accordance with PCI-DSS guidelines, Android application security best practices, and cryptographic auditing standards:

> **NON-NEGOTIABLE INVARIANT:**  
> **Under NO circumstances are provider secrets (`webhook_secret`, `key_secret`, private API keys) ever stored in client SQLite, written to SecureStore, hardcoded into TypeScript/JavaScript code, or bundled inside the client Android APK.**

The mobile application operates as a sovereign financial ledger. Connecting to payment providers (Razorpay, Cashfree, Stripe) follows a strict **Control-Plane Separation**:
1. **Client Tier (Android / SQLite):** Stores only non-sensitive merchant identification metadata (`key_id`, `merchant_account_reference`, connection `status`, sync timestamps). All client-side financial operations (manual entries, direct UPI QR generation, UTR reference logging) are 100% offline and autonomous.
2. **Cloud Tier (Edge Function / Serverless Control Plane):** Houses provider webhook endpoints, performs cryptographic HMAC-SHA256 signature verification using securely stored environment secrets, provides idempotent replay protection, and emits authenticated status notifications.

---

## 2. Threat Model & Mitigations

| Threat | Attack Vector | Architecture Mitigation |
| :--- | :--- | :--- |
| **Client Database Extraction** | Rooted device or ADB backup extracts SQLite database file. | `payment_provider_connections` table schema contains **zero secret columns**. Client holds only public `key_id` and merchant reference. |
| **APK Reverse Engineering** | Decompilation of APK/bundle (via `jadx` or JS bundle extraction). | Zero secrets bundled into JavaScript bundle or native C++ libraries. Verified via automated ProGuard/R8 rules and bundle audit. |
| **Webhook Spoofing** | Adversary sends fake payment confirmation payloads to simulate paid invoices. | Webhooks terminate exclusively at the Cloud Control Plane where HMAC-SHA256 signatures are verified using the upstream provider secret before updating ledger state. |
| **Replay Attacks** | Adversary re-sends valid historical webhook payloads to trigger duplicate credits. | Event deduplication using unique `event_id` in PostgreSQL/Supabase table with atomic `INSERT ... ON CONFLICT DO NOTHING`. |
| **Network Interception (MITM)** | Intercepting payment status sync on public Wi-Fi. | Strict TLS 1.3 certificate pinning and standard HTTPS transport for all control plane interactions. |

---

## 3. Client-Side Schema & Sanitization (Migration 8)

In Phase 2.1, Database Migration 8 purged sensitive fields from the client-side SQLite database.

```sql
-- Schema definition for payment_provider_connections (Local SQLite)
CREATE TABLE IF NOT EXISTS payment_provider_connections (
  id TEXT PRIMARY KEY NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('razorpay', 'cashfree', 'stripe', 'other')),
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK(status IN (
    'not_configured', 
    'sandbox', 
    'partner_approval_required', 
    'production_available', 
    'connected', 
    'suspended'
  )),
  merchant_account_reference TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_testnet INTEGER NOT NULL DEFAULT 1,
  key_id TEXT,
  capabilities_json TEXT,
  last_synced_at INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT uq_provider_business UNIQUE(business_profile_id, provider)
);
```

### Sanitized Field Mapping
- **`key_id`**: Public client key (e.g. `rzp_test_...` or `rzp_live_...`). Safe to display and use in client-side checkout scripts.
- **`merchant_account_reference`**: Merchant identifier or sub-account ID.
- **`status`**: Controlled connection lifecycle state enum.
- **`webhook_secret`**: **REMOVED**. Any legacy attempts to write or read this field are rejected.

---

## 4. Cloud Control Plane & Webhook Verification

Webhooks are routed to serverless Edge Functions (Deno / Supabase Edge Runtime).

### 4.1. Cryptographic HMAC Verification
```typescript
// cloud/functions/razorpay-webhook/index.ts
const signature = req.headers.get("x-razorpay-signature");
const rawBody = await req.text();

const encoder = new TextEncoder();
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(WEBHOOK_SECRET), // Stored securely in Cloud Environment, never on client
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

const expectedSignature = await crypto.subtle.sign(
  "HMAC",
  key,
  encoder.encode(rawBody)
);

const expectedHex = Array.from(new Uint8Array(expectedSignature))
  .map(b => b.toString(16).padStart(2, "0"))
  .join("");

if (signature !== expectedHex) {
  return new Response("Invalid signature", { status: 400 });
}
```

### 4.2. Replay Protection
Every webhook payload is indexed by its provider `event_id`:
```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES connected_merchants(business_id),
  event_id TEXT NOT NULL UNIQUE, -- Prevents replay attacks
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Offline-First Operational Guarantees

Billframe is fundamentally offline-first:
1. **Manual Financial Confirmation:** Users can record Cash, Cheque, Bank Transfer, and Card payments directly without an internet connection.
2. **Direct UPI QR:** Dynamic and Static Bharat UPI QR codes (`upi://pay?pa=...&pn=...&am=...`) are rendered purely mathematically on-device without any API calls.
3. **UTR Reconciliation:** Users record the 12-digit UPI Transaction Reference (UTR) or NEFT/IMPS reference directly into SQLite with immediate receipt generation.
4. **Zero Vendor Lock-In:** Gateway integration is an optional enhancement; the core billing, accounting, and collections engines function indefinitely without network access.
