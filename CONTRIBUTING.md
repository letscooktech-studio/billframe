# Contributing to Billframe 🤝

Thank you for your interest in contributing to **Billframe**! We welcome contributions from developers, accountants, tax consultants, and open-source advocates across the globe.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** or **bun**
- **Git**
- Optional: Android Studio (for native Android testing)

### 2. Getting the Code
```bash
# Fork the repository on GitHub, then clone your fork:
git clone https://github.com/<your-username>/billframe.git
cd billframe

# Add the upstream remote:
git remote add upstream https://github.com/letscooktech-studio/billframe.git

# Install dependencies:
npm install
```

### 3. Running Locally
```bash
# Start Metro bundler:
npm start

# Run web version in browser:
npm run web

# Run on Android emulator / connected device:
npm run android
```

---

## 🧪 Testing & Quality Standards

Before submitting a Pull Request, ensure your code compiles cleanly and passes all tests:

```bash
# Run TypeScript compilation check:
npm run typecheck

# Run test suites:
npm test
```

### Key Coding Guidelines
1. **Deterministic Financial Math**: Never use raw floating-point numbers (`number`) for financial amounts. All currency calculations MUST use `BigInt` minor units (e.g. cents, paisa) via `DocumentCalculator` and the `Money` engine.
2. **Local-First SQLite Invariant**: All business data (documents, customers, items, ledgers) must persist cleanly in the local SQLite database via `DatabaseManager`.
3. **Statutory Standards**: When adding or modifying document templates, ensure adherence to the legal rule (e.g. CBIC CGST Rule 46 for Tax Invoices, Rule 55 for Delivery Challans, Section 10(13A) for Rent Receipts).
4. **Arctic Aurora Theme Tokens**: Never hardcode colors or arbitrary border styles. Always consume theme tokens from `useTheme()` and `src/design/tokens.ts`.

---

## 🚀 Pull Request Process

1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with clear, structured commit messages following Conventional Commits (e.g. `feat:`, `fix:`, `docs:`, `perf:`).
3. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request against `letscooktech-studio/billframe:main`.
5. Clearly describe the motivation, changes made, and screenshots/proofs if UI changes were introduced.

---

## 💬 Community & Questions

- **Discussions**: Have an idea, question, or architectural proposal? Start a discussion in [GitHub Discussions](https://github.com/letscooktech-studio/billframe/discussions).
- **Bug Reports**: Found a bug? Open an issue using the [Bug Report Template](https://github.com/letscooktech-studio/billframe/issues/new?template=bug_report.md).

Thank you for helping make private, local-first financial management free and accessible to everyone!
