# Security Policy & Architecture Guide

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Security Model & Trust Boundaries

Billframe is built from the ground up on an **Offline-First, Zero-Trust Architecture**.

### 1. Zero Built-In Cloud Credentials & BYOK Model
- **No Embedded Provider Keys**: The Billframe client codebase and bundled binaries contain zero developer-owned API keys, private tokens, or payment secrets.
- **Bring-Your-Own-Key (BYOK)**: Users who choose to enable cloud inference configure their personal API keys (Groq, Google Gemini, OpenAI).
- **Hardware-Backed Storage**: On native mobile platforms (Android and iOS), API credentials and security tokens are stored using OS-backed secure enclaves (`Android Keystore` and `iOS Keychain` via `expo-secure-store`).
- **Web Storage Clarification**: On Web deployments, credentials reside in browser origin storage (`localStorage`), which does not provide hardware enclave isolation. Users on public or shared terminals should use offline heuristic mode or clear credentials upon completing their session.
- **Automated Regression Guard**: Automated secret scanning (`tests/security/credential_exposure.test.ts`) executes in CI to prevent accidental commits of API keys or provider tokens.

### 2. Device Master PIN Protection & Cryptographic Defense
- **CSPRNG Salt Generation**: Salts are generated using cryptographically secure pseudorandom number generators (`Crypto.getRandomValues` / Web Crypto API), producing 32 bytes (64 hex characters) of high-entropy randomness. Math.random() is never used for security artifacts.
- **Salted SHA-256 Digest**: Master PINs are hashed with unique per-device CSPRNG salts. Raw PINs are never persisted or logged.
- **Constant-Time Verification**: Verification employs constant-time string comparison (`constantTimeEqual`) to defend against side-channel timing analysis.
- **Brute-Force Rate Limiting**: The system tracks consecutive failed attempts. After 5 consecutive failed entries, verification is locked out for 30 seconds to prevent automated dictionary attacks.

### 3. Multi-Tenant Cloud Synchronization & Isolation Boundary
- **Authenticated JWT Requirement**: Mobile clients must authenticate with a valid user session JWT. Anonymous keys are strictly prohibited as user bearer tokens, and static fallback user IDs are rejected.
- **Row Level Security (RLS)**: PostgreSQL tables in the cloud control plane (`cloud_business_profiles`, `cloud_customers`, `cloud_documents`, etc.) enforce strict RLS policies:
  `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.
- **Column Allowlist Sanitization**: Remote delta payloads are validated against strict table column allowlists before persistence into local SQLite, preventing SQL injection and schema corruption from untrusted network inputs.
- **Safe LWW Upserts**: Synchronization uses timestamp-based Last-Write-Wins updates rather than destructive `INSERT OR REPLACE`, preserving relational integrity and foreign keys.

### 4. Payment Gateway Webhook Reliability & Atomicity
- **Server-Side HMAC-SHA256 Verification**: Webhooks are verified using server-held secrets that never touch mobile devices. Signatures are verified via constant-time comparison.
- **Database-Level Deduplication**: Concurrency and replay attacks are prevented via database unique constraints (`ON CONFLICT (event_id) DO NOTHING`).
- **Atomic State Transitions**: Webhook event logging and payment request state transitions execute within an atomic transaction boundary (`process_payment_webhook`), ensuring payment requests are never marked paid unless the event is durably committed.

---

## Credential Incident Advisory

Any credential previously exposed in public git commits must be treated as compromised. If you deployed a previous fork containing developer test keys:
1. Immediately revoke and regenerate your keys at [Groq Console](https://console.groq.com/keys) or respective provider portals.
2. Ensure your client application uses personal BYOK keys via the in-app AI Engine settings modal.

---

## Reporting a Vulnerability

If you discover a security vulnerability within Billframe, please report it responsibly:

1. **Do not open a public issue.**
2. Send an email to **security@letscooktech.com** or open a private advisory via [GitHub Security Advisories](https://github.com/letscooktech-studio/billframe/security/advisories/new).
3. Include:
   - Description of the vulnerability and attack vector.
   - Minimal steps or proof of concept to reproduce.
   - Affected platforms (Android, iOS, Web).

We acknowledge receipt within 48 hours and work with you on a coordinated disclosure timeline.
