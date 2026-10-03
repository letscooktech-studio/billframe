# Billframe Country Pack Qualification Matrix

**Document Version:** 2.1.0  
**Status Date:** October 2026  
**Auditing Standard:** Strict Production Verification Standard (Zero-Fabrication)

---

## 1. Classification Definitions

| Classification | Meaning | Criteria Required |
| :--- | :--- | :--- |
| **`VERIFIED`** | Production-Ready & Formally Tested | Statutory calculation rules implemented, component splitting operational, offline classification catalog included, tax ID validation enforced, dedicated automated test suite passing with 100% assertions. |
| **`FOUNDATION_ONLY`** | Pre-Configured Architectural Baseline | Country metadata, currency, default rates, and tax ID formats are defined and functional. Multi-jurisdiction local/city taxes require user configuration. |
| **`USER_CONFIGURED_GENERIC`**| Universal Fallback Engine | Applies to any ISO 3166-1 country. The merchant sets the tax label and rate basis points; the engine calculates integer-exact totals deterministically. |

---

## 2. Country Pack Qualification Matrix

| Country | Code | Currency | Tax Framework | Classification | Test Suite Status | Capabilities & Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **India** | `IN` | `INR` (₹) | GST (Dual + Integrated + Cess) | **`VERIFIED`** | **PASS** (`india_gst.test.ts`, 11/11 tests) | • Intrastate CGST + SGST (50/50)<br>• Union Territory UTGST<br>• Interstate IGST<br>• Export zero-rating<br>• Compensation Cess<br>• 15-char GSTIN regex + state prefix validation<br>• Embedded HSN/SAC search |
| **United States** | `US` | `USD` ($) | State & Local Sales Tax | **`FOUNDATION_ONLY`** | **PASS** (`geography.test.ts`) | • 50 States + DC subdivision reference<br>• Default rates by state<br>• EIN format validation (`XX-XXXXXXX`)<br>• Configurable local override |
| **United Kingdom** | `GB` | `GBP` (£) | Value Added Tax (VAT) | **`FOUNDATION_ONLY`** | **PASS** (`geography.test.ts`) | • Standard (20%), Reduced (5%), Zero (0%)<br>• HMRC 9-digit / 12-digit VAT validation (`GB999999999`) |
| **Canada** | `CA` | `CAD` ($) | GST / HST / PST | **`FOUNDATION_ONLY`** | **PASS** (`geography.test.ts`) | • Provinces & territories mapped<br>• Combined HST vs GST+PST framework<br>• 9-digit BN format validation |
| **Rest of World** | `*` | Any ISO | Configurable Tax / VAT | **`USER_CONFIGURED_GENERIC`**| **PASS** (`balance_engine.test.ts`) | • Custom tax label (VAT, TVA, IVA, Sales Tax)<br>• Basis points integer arithmetic<br>• Exclusive or Inclusive pricing modes |

---

## 3. Statutory Verification Details

### India (`IN`) — `VERIFIED`
- **Validation Engine:** `IndiaGstPack.validateTaxId(gstin)` verifies 15-character statutory format: 2-digit state code + 10-char PAN + 1-char entity number + 'Z' + 1-char checksum.
- **HSN/SAC Engine:** `IndiaGstPack.searchHsnSac(query)` provides instant offline lookups with zero network calls.
- **Component Integrity:** Verified against statutory vectors in `tests/domain/india_gst.test.ts`.

### United States (`US`) — `FOUNDATION_ONLY`
- Complete state ISO-3166-2 database built into SQLite (`US-CA`, `US-NY`, `US-TX`, etc.).
- Origin vs destination sourcing handled via configurable business profile address.

### Global Fallback — `USER_CONFIGURED_GENERIC`
- Fully tested across zero-rate, standard rate, and high-rate tax scenarios with zero fractional drift.
