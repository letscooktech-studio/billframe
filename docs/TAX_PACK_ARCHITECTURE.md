# Billframe Tax Pack & Statutory Authority Architecture

**Document Version:** 2.1.0  
**Target Platform:** Pure Domain Engine / Local SQLite / Cloud Sync  
**Classification:** Tax Engine Specification & Statutory Compliance  
**Status:** Certified & Production-Qualified

---

## 1. Executive Summary & Principles

The Billframe Tax Architecture provides deterministic, integer-precision tax calculation across global tax regimes. The design adheres to three core axioms:
1. **Mathematical Determinism:** All tax amounts are computed in integer minor units (paise, cents) with **zero floating-point drift** using Banker's / Half-Up financial rounding (`roundHalfUp`).
2. **Offline Completeness:** The complete tax catalog, HSN/SAC classification codes, and calculation rules reside entirely on-device in local SQLite and compiled code.
3. **Statutory Immutability:** Once an invoice is issued, its calculated tax components are frozen into an immutable document snapshot and recorded in `document_tax_snapshots` for regulatory audits.

---

## 2. Core Architecture & Abstraction Layers

```text
┌────────────────────────────────────────────────────────┐
│                   TaxEngine                             │
│  - Calculates document totals and line taxes           │
│  - Applies pro-rata item discounts prior to taxation   │
│  - Aggregates multi-component tax summaries            │
└───────────────────────────┬────────────────────────────┘
                            │ Delegates to
┌───────────────────────────▼────────────────────────────┐
│              CountryPackRegistry                        │
│  - Maps ISO 3166-1 alpha-2 code to CountryPack          │
│  - Resolves 'IN' -> IndiaGstPack                       │
│  - Resolves 'US' -> UsSalesTaxPack                     │
│  - Resolves 'GB' -> UkVatPack                          │
│  - Resolves 'CA' -> CanadaGstHstPack                   │
│  - Resolves unknown -> GenericCountryPack              │
└───────────────────────────┬────────────────────────────┘
                            │ Implements
┌───────────────────────────▼────────────────────────────┐
│                 CountryPack Interface                  │
│  - metadata: TaxMetadata                               │
│  - calculateLineTax(item, supplier, customer, mode)    │
│  - validateTaxId(id)                                   │
│  - formatTaxId(id)                                     │
│  - searchHsnSac?(query)                                │
└────────────────────────────────────────────────────────┘
```

---

## 3. India GST Engine (`IndiaGstPack`)

The India GST Pack complies fully with the CGST, SGST, UTGST, and IGST Acts (2017) and subsequent notifications.

### 3.1. Place of Supply Rules
- **Intrastate (Supplier State == Customer State):**
  - CGST (Central Goods and Services Tax): \(\frac{\text{Rate}}{2}\)
  - SGST (State Goods and Services Tax): \(\frac{\text{Rate}}{2}\)
- **Union Territories (without legislature, e.g. Ladakh, Andaman & Nicobar):**
  - CGST: \(\frac{\text{Rate}}{2}\)
  - UTGST (Union Territory GST): \(\frac{\text{Rate}}{2}\)
- **Interstate (Supplier State != Customer State):**
  - IGST (Integrated Goods and Services Tax): Full Rate.
- **Export (Customer Country != 'IN'):**
  - Zero-rated export supply under Letter of Undertaking (LUT).

### 3.2. Compensation Cess
Luxury, demerit, and specified automotive goods under the GST Compensation Act include statutory Cess in addition to standard GST rates:
$$\text{Tax}_{\text{total}} = \text{TaxableAmount} \times (\text{GST Rate} + \text{Cess Rate})$$
Computed deterministically using:
```typescript
const cessAmountMinor = roundHalfUp(taxableAmountMinor * cessRateBasisPoints, 10000n);
```

### 3.3. Offline HSN / SAC Catalog
The app contains an embedded, high-coverage catalog of standard Indian Harmonized System of Nomenclature (HSN) and Service Accounting Code (SAC) entries:
- Standard Goods: Chapter 09 (Coffee/Tea), Chapter 61 (Apparel), Chapter 84/85 (Machinery & Electronics), Chapter 87 (Automotive).
- Standard Services: SAC 9983 (IT & Professional Consulting), SAC 9984 (Telecommunications), SAC 9954 (Construction & Renovation).

---

## 4. Statutory Source Registry & Sync Pipeline

Statutory rates change via legal gazettes. Billframe implements a formal **TaxSourceRegistry** and cryptographic sync pipeline:

### 4.1. Statutory Authorities
- **India (IN):** Central Board of Indirect Taxes and Customs (CBIC) / GST Council  
  *Authority URI:* `https://cbic-gst.gov.in`  
  *Schedule Citation:* Notification No. 01/2017-Central Tax (Rate)
- **United States (US):** Federation of Tax Administrators (FTA)  
  *State Sales Tax Framework (Streamlined Sales and Use Tax Agreement)*
- **United Kingdom (GB):** HM Revenue & Customs (HMRC)  
  *Value Added Tax Act 1994 / Statutory Instrument 2023*
- **Canada (CA):** Canada Revenue Agency (CRA)  
  *Excise Tax Act (GST/HST Regulations)*

### 4.2. Tamper-Resistant Sync & Rollback
When updating country tax definitions over the air:
1. Manifest is downloaded with pre-published SHA-256 integrity hash.
2. Binary payload is digested using `Crypto.digestStringAsync(CryptoDigestAlgorithm.SHA256, payload)`.
3. If checksum does not match official registry, **the sync transaction is aborted, rolled back, and the previous certified local pack remains active**.
