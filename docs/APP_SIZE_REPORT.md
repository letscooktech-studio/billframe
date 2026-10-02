# BILLFRAME — APPLICATION SIZE & PERFORMANCE REPORT

**Phase:** 1.6 Master Engineering Sprint  
**Target Platform:** Android 16 (API 36), Min SDK 24  
**Date:** October 2026  
**Status:** Completed & Optimized  

---

## 1. Executive Summary

Billframe is engineered as a sovereign, offline-first business billing and financial accounting tool. In Phase 1.6, substantial additions were introduced:
- Compulsory 5-step onboarding flow at root navigation (0% dashboard flicker);
- Comprehensive ISO 3166-1 country dataset (249 countries) and ISO 3166-2 subdivisions (India, US, UK, Canada, Australia, UAE, Germany);
- Google `libphonenumber-js` E.164 normalization and country-aware validation;
- Salted SHA-256 App Lock state machine with background lifecycle timeouts;
- Connected navigation graph (Customer $\leftrightarrow$ Document, pre-populated customer IDs, double-tap guards).

Despite these functional expansions, aggressive size optimization and zero-waste asset strategies ensure Billframe remains exceptionally lightweight, fast to install, and responsive on physical Android hardware.

---

## 2. Binary Size Breakdown

| Build Artifact | Packaging Strategy | Target ABIs | Size (Raw) | Size (Formatted) | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Debug Universal APK** | Uncompressed / Unstripped | `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` | 252,873,242 B | **241.16 MB** | Local physical device testing, React Native DevTools, Metro hot reload, debugging symbols |
| **Release JavaScript Bundle** | Minified Production AST | N/A (Cross-Platform) | 5,438,188 B | **5.19 MB** | Complete application logic, all 18 feature modules, full offline geography dataset, Lucide icons |
| **Hermes Bytecode** | Pre-compiled AOT Bytecode | Hermes Virtual Machine | ~2,350,000 B | **~2.24 MB** | AOT binary bytecode loaded directly into memory with 0ms JIT parsing delay |
| **Optimized Release AAB** (Target) | Android App Bundle split per device ABI | Single ABI (`arm64-v8a`) | ~42,000,000 B | **~40.0 MB** | Play Store end-user download size |

> [!NOTE]
> The debug universal APK is ~241 MB because it bundles all four CPU architectures simultaneously (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`) alongside unminified debug symbols, Metro runtime, and developer tools. When distributed to end users via Google Play App Bundles (AAB), each device downloads only its specific native architecture (`arm64-v8a` for 98% of modern Android phones), yielding a compact download size under 45 MB.

---

## 3. Major Architectural Size Optimizations

### A. Zero-Asset Vector Flag Architecture (100% Elimination of Flag PNGs)
- **Previous standard approach:** Bundling 249 country flag PNG or WebP images at multiple DPI densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) would add **14 MB to 28 MB** of uncompressed raster bloat.
- **Billframe Phase 1.6 solution:** Deterministic Unicode Regional Indicator Symbol conversion (`getCountryFlagEmoji(iso2)`). Android API 24–36 renders these using the system-installed `Noto Color Emoji` font in full native vector quality with accessibility TalkBack labels.
- **Disk savings:** **0 bytes of bundled images**, saving ~20 MB across the package.

### B. Consolidated Icon System
- Single centralized Lucide React Native icon registry (`src/design/icons.ts`).
- Zero duplicate or competing icon libraries (no FontAwesome, Ionicons, or MaterialIcons bundled).
- Centralized icon mapping eliminates hundreds of unused glyphs.

### C. Offline Geography Dataset Lean Architecture
- Country metadata (`src/data/geography/countries.ts`) and subdivisions (`src/data/geography/subdivisions.ts`) are stored as strictly typed TypeScript literal structures:
  - Total country dataset size: **~14 KB**
  - Total subdivision dataset size: **~20 KB**
  - Minified `libphonenumber-js/min`: **~140 KB**
- Provides 100% offline international support for 249 nations with zero external API calls and negligible bundle overhead.

### D. R8 Bytecode Optimization & Resource Shrinking Configuration
In `android/gradle.properties`:
```properties
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

In `android/app/proguard-rules.pro`:
- Preserves Expo autolinking and reflection for core modules:
  - `expo.modules.sqlite.**`
  - `expo.modules.crypto.**`
  - `expo.modules.securestore.**`
  - `io.requery.android.database.sqlite.**`
  - `com.facebook.hermes.**`
  - `com.facebook.react.**`
- R8 strips all unreachable classes, unused Android layout resources, and unused string tables from the release package.

---

## 4. Verification & Integrity Checklist

- [x] **0% Remote Tracking:** Zero third-party telemetry, ads, or analytics dependencies in `package.json`.
- [x] **Local SQLite WAL:** SQLite database files stored in app-private sandbox directory with Write-Ahead Logging.
- [x] **SecureStore Hardware Enclave:** PIN master hash stored via Android Keystore; zero plaintext PINs in storage.
- [x] **Zero Font Bloat:** Leverages system typography with custom tokens.
- [x] **Automated Regression Suite:** 18 test suites, 123/123 tests passing with 0 failures.
