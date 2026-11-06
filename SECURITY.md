# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Local-First Privacy Invariant

Billframe is built from the ground up on a **Local-First Architecture**:
- All accounting databases, customer records, line items, and ledger balances are stored strictly on-device in SQLite.
- No telemetry, analytics, or third-party trackers are bundled in the application.
- AI features operate either via local deterministic heuristics (zero network traffic) or via encrypted user-configured endpoints (BYOK) with zero permanent retention.

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
