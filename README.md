# Billframe ⚡

> **The Local-First, Open-Source Invoice & Financial Document App for Android & Web**  
> *Offline-capable, deterministic financial document generation with Bring-Your-Own-Key (BYOK) AI assistance.*

<p align="center">
  <img src="assets/images/icon.png" width="120" height="120" alt="Billframe Logo" style="border-radius: 24px;" />
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <a href="#local-first-architecture"><img src="https://img.shields.io/badge/Data-Local--First%20SQLite-10B981.svg?style=flat-square" alt="Local First SQLite"></a>
  <a href="#licensing"><img src="https://img.shields.io/badge/Pricing-Free%20%26%20Open%20Source-38BDF8.svg?style=flat-square" alt="Free and Open Source"></a>
  <a href="#statutory-standards"><img src="https://img.shields.io/badge/Statutory-40%2B%20Archetypes-8B5CF6.svg?style=flat-square" alt="40+ Document Archetypes"></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-EA580C.svg?style=flat-square" alt="Android and Web"></a>
</p>

---

## 🌟 Overview

**Billframe** is an open-source, local-first billing and document generation application designed for freelancers, independent contractors, tradespeople, and micro-businesses.

Unlike subscription cloud SaaS tools that require continuous internet connectivity, store financial records on third-party servers, and enforce recurring monthly fees, **Billframe runs directly on your device**. All customer directories, catalog items, and document records are stored locally in an embedded SQLite database, giving you complete data privacy with zero trackers and zero mandatory cloud services.

### Core Engineering Priorities
- **Deterministic Minor-Unit Arithmetic**: All monetary balances, taxes, and item sums are computed in integer minor units (`BigInt` paisa/cents), preventing floating-point rounding errors.
- **Offline Autonomy**: Core invoicing, estimates, challans, receipts, local queries, and printing work without network connectivity.
- **Privacy & Security by Default**: Client records and financial history never leave your hardware unless you configure your own sync backend. User credentials are kept in the hardware-backed keystore (`expo-secure-store`).
- **Opt-in AI with BYOK**: Conversational drafting uses Bring-Your-Own-Key (BYOK) or deterministic local heuristics. No centralized developer API keys are bundled into the app.

---

## ⚖️ Architectural Philosophy & Comparison

| Dimension | Billframe (Local-First Open Source) | Full-Suite Cloud SaaS (Zoho / QuickBooks) |
| :--- | :--- | :--- |
| **Data Storage** | **100% On-Device SQLite** (User controls local database) | Multi-tenant cloud database |
| **Offline Execution** | **Full offline capability** for all core operations | Requires continuous internet access |
| **Pricing Model** | **Free & Open Source (MIT)** | Recurring monthly or annual subscription |
| **Telemetry & Privacy** | **Zero telemetry, zero trackers** | Product analytics and telemetry |
| **Arithmetic Precision** | **Deterministic `BigInt` minor units** | Platform-managed decimal engines |
| **AI Integration** | **Client-side BYOK** (Groq/Gemini/OpenAI) + local heuristic fallback | Cloud-managed AI add-ons |
| **Application Scope** | Focused billing, GST compliance, quotes, salary slips, receipts | Full double-entry bookkeeping, payroll tax filing, bank feeds |

---

## 🚀 Key Features

### 1. 🤖 AI Document Assistant (BYOK & Offline Heuristics)
- **40+ Implemented Statutory & Commercial Archetypes**: Covers core billing and operational instruments including B2B GST Invoices, Delivery Challans, Purchase Orders, Quotations, Salary Slips, and Rent Receipts, supported by an extensible taxonomy schema.
- **Transparent Reasoning Flow**: Displays structured intent extraction, statutory rule grounding, and calculation traces.
- **Interactive In-Chatbox MCQ Elicitation**: When required statutory fields are missing, interactive option chips appear directly in the chat to clarify details without tedious form navigation.
- **Multi-Turn Context**: References previous conversation turns to carry over counterparty data, candidate profiles, and line items.
- **Bring Your Own Key (BYOK) & True Offline Architecture**:
  - **100% Zero-Network Offline Engine**: Billframe functions completely out of the box without requiring any API keys or network connection. Its on-device deterministic policy engine performs statutory calculations, document structuring, and BigInt balance verifications locally.
  - **Secure Bring-Your-Own-Key (BYOK)**: To enable deep neural reasoning on cloud models (Groq, Google Gemini, or OpenAI), users can configure their personal API keys in **AI Settings**. Free personal keys can be generated at [console.groq.com/keys](https://console.groq.com/keys) (zero cost, no credit card required).
  - **Hardware-Backed Credential Isolation**: User-configured credentials are stored directly in the device's secure enclave (`Android Keystore` and `iOS Keychain` via `expo-secure-store`) and never touch Billframe servers. Zero developer-owned API keys are embedded in application code.

### 2. 🧾 CBIC GST & Statutory Invoicing Suite
- **Rule 46 B2B Tax Invoices**: Full GSTIN, PAN, HSN/SAC codes, reverse charge flags, and dual-state tax reconciliations.
- **Intra-State vs Inter-State Tax Engine**: Automatically splits tax into CGST + SGST or Integrated IGST based on the customer's Place of Supply.
- **Rule 55 Delivery Challans**: Formatted for goods transportation, job work, and supply on approval with transit valuations.
- **Rule 53 Credit & Debit Notes**: Seamless ledger adjustments and return reconciliations.
- **Commercial Quotations & Estimates**: Commercial validity periods, payment milestone schedules, and one-tap conversion into tax invoices.
- **5 Gold Standard GST Templates**:
  - `GST-01 Executive Letterhead`: Sleek typography with formal gold/black identity.
  - `GST-02 Structured Ledger`: Tabular double-entry accounting ledger format.
  - `GST-03 Minimal Professional`: Clean, high-density monochrome layout.
  - `GST-04 Corporate B2B`: Enterprise vendor billing with PO tracking.
  - `GST-05 Trade Supply Chain`: Logistics freight distribution with dispatch provenance.

### 3. 💼 HR, Payroll & Operations
- **Statutory Salary Slips**: Compliant with the *Payment of Wages Act 1936*, featuring itemized Gross Earnings and statutory deductions (EPF 12%, ESI, Professional Tax).
- **House Rent Receipts**: Fully formatted under *Section 10(13A) of the Income Tax Act 1961* for HRA tax exemption claims with Landlord PAN tracking.
- **ATS-Friendly Resumes & Dossiers**: Clean, single-column resume and dossier templates designed for clear structural parsing with structured skill matrices and quantified project summaries.
- **Field Engineering Work Orders**: Operational task lists, milestone deliverables, and authorized engineer sign-offs.

### 4. ⚡ Local-First SQLite & BigInt Math Engine
- **Deterministic Minor Units**: All monetary calculations are performed in integer minor units (paisa, cents) using `BigInt`, eliminating IEEE-754 floating-point rounding errors.
- **100% Local SQLite Database**: Powered by `expo-sqlite`, storing customers, catalog items, ledger balances, and documents locally on your device.
- **Optional Supabase Cloud Sync**: Encrypted peer-to-peer cloud sync for cross-device backup when configured by the user.

### 5. 🖨️ Hardware & Thermal POS Printing
- **80mm POS Thermal Receipts**: Instant itemized receipts for grocery stores, retail counters, and quick-service shops.
- **Cross-Platform Printing**: Standard printing via native Android print service (`expo-print`) and browser print dialog.
- **Vector UPI QR Codes**: Dynamic on-invoice QR codes for instant UPI / bank wire settlements.

### 6. 🎨 Arctic Aurora Monochrome Design System
- Neutral-first, distraction-free interface (`#0D0E10` dark canvas, `#18191D` surfaces, `#F5F5F6` crisp typography).
- Responsive on mobile smartphones, tablets, and widescreen desktop monitors with split-pane live document preview.
- Fluid token cadence animations without bulky, congested container nesting.

---

## 🏗️ Architecture & Project Structure

```
billframe/
├── src/
│   ├── app/                      # Expo Router File-Based Routing
│   │   ├── (tabs)/               # Bottom Tab Navigation (Documents, Customers, Money, More)
│   │   ├── ai/assistant.tsx      # Autonomous AI Copilot & Conversational Document Studio
│   │   ├── document/[id].tsx     # Document Inspection, PDF Export & Printing
│   │   ├── document/edit.tsx     # Direct Document Form Editor
│   │   └── templates/studio.tsx  # Visual Statutory Template Studio
│   ├── components/
│   │   ├── ai/                   # AI UI (ChatboxAnimatedMcq, AnimatedArtifactTile, Thinking)
│   │   ├── animations/           # ClaudeThinkingIndicator, AuroraBackground, Shimmer
│   │   └── common/               # Design System Primitives (Buttons, Cards, Inputs, Badges)
│   ├── data/
│   │   ├── database/             # DatabaseManager, SQLite Schemas, MigrationRunner
│   │   └── repositories/         # Document, Customer, Catalog, BusinessProfile Repositories
│   ├── design/                   # Tokens, Arctic Aurora Color Families, Typography
│   ├── domain/
│   │   ├── documents/            # DocumentCalculator, StateMachine, Registry, 446 Catalogue
│   │   ├── money/                # Money Engine (BigInt Minor Units, Currency Registry)
│   │   └── tax/                  # TaxEngine, IndiaGstPack, GlobalCountryPacks
│   └── services/
│       ├── ai/                   # AiDocumentAgent, DocumentQuestionElicitor, RagRegistry
│       ├── pdf/                  # UniversalDocumentRenderer, GST 01-05 Templates
│       └── sync/                 # SupabaseSyncService & Local Backup Manager
├── android/                      # Native Android Project & Gradle Configuration
├── assets/                       # Branding Icons, Fonts & Statutory Logos
└── package.json                  # Dependencies & Project Metadata
```

---

## ⚡ Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or newer)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Expo CLI](https://docs.expo.dev/) (`npx expo`)
- Optional: Android Studio (for native Android APK compilation)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/letscooktech-studio/billframe.git
   cd billframe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   # Launch Metro Bundler
   npx expo start

   # Launch Web Preview directly in browser
   npx expo start --web
   ```

4. **Run on Android Emulator or Physical Device:**
   ```bash
   npx expo run:android
   ```

5. **Build Release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   The production-signed APK will be generated at:  
   `android/app/build/outputs/apk/release/app-release.apk`

---

## 💬 Using the AI Copilot

You can talk to the Billframe Copilot just like a human senior accountant. Tap the ✨ **AI Assistant** tab or prompt it directly:

- *"Draft a GST Tax Invoice for Acme Corp for 5 enterprise laptops at 60000 each with 18% GST"*
- *"Create a quotation and a delivery challan for Acme Corp for 5 enterprise laptops at 60000 each"*
- *"Build me complete highest ATS scoring resume for an AI Engineer"*
- *"Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026"*
- *"Generate a House Rent Receipt for tenant Rahul Sharma for 28,000 INR"*
- *"Draft me a complete grocery store cash memo with 10 random items"*

When statutory details are missing (such as Place of Supply, E-Way Bill numbers, or ATS candidate domain), the AI will interactively ask you with slide-up multiple-choice chips right inside the chatbox.

---

## 🤝 Contributing

We welcome contributions from developers, accountants, tax consultants, and open-source enthusiasts worldwide!

1. Fork the Project (`https://github.com/letscooktech-studio/billframe/fork`)
2. Create your Feature Branch (`git checkout -b feat/statutory-tax-pack`)
3. Commit your Changes (`git commit -m "feat: add Germany VAT statutory pack"`)
4. Push to the Branch (`git push origin feat/statutory-tax-pack`)
5. Open a Pull Request

---

## 🔒 Security, Privacy & Reliability Hardening

Billframe follows rigorous security best practices to protect sensitive financial records:

- **Zero Hardcoded Secrets**: Client bundles contain zero developer-owned inference keys or cloud credentials. Automated CI checks enforce secret scanning across source and cloud functions.
- **Hardware-Backed Device PIN**: Protected by high-entropy CSPRNG salts (32 bytes / 64 hex characters) and salted SHA-256 digests. Features constant-time hash verification and automated 30-second lockout after 5 consecutive failed attempts.
- **Multi-Tenant Cloud Isolation**: Cloud synchronization strictly requires authenticated user session JWTs, disallowing anonymous bearer tokens and enforcing PostgreSQL Row Level Security (`auth.uid() = user_id`).
- **SQL Injection Defense**: Network delta synchronization payloads are filtered against strict per-table column allowlists before local SQLite persistence.
- **Safe LWW Concurrency**: Uses timestamp-based Last-Write-Wins upserts that preserve foreign key constraints and relational integrity rather than destructive replacement.
- **Payment Webhook Atomicity**: Server-side HMAC-SHA256 signature verification and database-level idempotency (`ON CONFLICT (event_id) DO NOTHING`) defend against webhook replay attacks and race conditions.

For full architectural details, see [`SECURITY.md`](SECURITY.md).

---

## 📄 License

Distributed under the **MIT License**. Free for personal, commercial, and enterprise usage without restrictions. See [`LICENSE`](LICENSE) for details.

---

<p align="center">
  <a href="https://github.com/letscooktech-studio/billframe">
    <img src="assets/images/letscooktech-team.jpg" alt="Let's Cook Tech Open Source Team" width="100%" style="border-radius: 16px; max-width: 900px;" />
  </a>
</p>

<p align="center">
  <b>Built with ❤️ by Let's Cook Tech Studio & the Global Open Source Community.</b><br/>
  <i>Your business. Your data. Zero subscriptions. Free forever.</i>
</p>
