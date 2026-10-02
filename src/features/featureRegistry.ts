/**
 * BILLFRAME CANONICAL FEATURE VERIFICATION REGISTRY
 * Machine-readable source of truth for all Billframe capabilities,
 * verification gates, dependencies, routes, tables, and lifecycle states.
 */

export type VerificationStatus =
  | 'VERIFIED'
  | 'IMPLEMENTED_UNVERIFIED'
  | 'PARTIAL'
  | 'BROKEN'
  | 'HIDDEN'
  | 'FUTURE';

export type BusinessType =
  | 'freelancer'
  | 'consultant'
  | 'agency'
  | 'professional'
  | 'contractor'
  | 'retail'
  | 'wholesale'
  | 'service'
  | 'small_business'
  | 'other';

export interface FeatureVerificationEntry {
  key: string;
  name: string;
  description: string;
  module:
    | 'billing'
    | 'clients'
    | 'catalog'
    | 'payments'
    | 'expenses'
    | 'reports'
    | 'tools'
    | 'workspace'
    | 'security'
    | 'gst'
    | 'inventory'
    | 'jobs';
  dependencies: string[];
  routes: string[];
  repositories: string[];
  databaseTables: string[];
  domainServices: string[];
  permissionRequirements: string[];
  expectedStateTransitions?: string[];
  testCoverage: string[];
  verificationStatus: VerificationStatus;
  businessRelevance: Record<BusinessType, number>;
  priority: number;
}

export const FEATURE_VERIFICATION_REGISTRY: Record<string, FeatureVerificationEntry> = {
  'invoice.create': {
    key: 'invoice.create',
    name: 'Create Invoice',
    description: 'Issue standard invoice with deposits, line items, and tax breakdown',
    module: 'billing',
    dependencies: ['business_profile', 'moneyEngine', 'documentCalculator'],
    routes: ['/document/edit'],
    repositories: ['DocumentRepository', 'BusinessProfileRepository', 'CustomerRepository'],
    databaseTables: ['documents', 'document_items', 'number_sequences', 'audit_events'],
    domainServices: ['DocumentCalculator', 'SequenceEngine', 'Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['draft -> issued', 'issued -> void'],
    testCoverage: [
      'tests/domain/balance_engine.test.ts',
      'tests/domain/state_machine.test.ts',
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 100,
      consultant: 100,
      agency: 100,
      professional: 100,
      contractor: 95,
      retail: 90,
      wholesale: 100,
      service: 100,
      small_business: 100,
      other: 95,
    },
    priority: 100,
  },

  'estimate.create': {
    key: 'estimate.create',
    name: 'Create Estimate / Quote',
    description: 'Draft formal quotations and bids that convert directly to invoices',
    module: 'billing',
    dependencies: ['business_profile', 'moneyEngine', 'documentCalculator'],
    routes: ['/document/edit?type=estimate'],
    repositories: ['DocumentRepository', 'BusinessProfileRepository', 'CustomerRepository'],
    databaseTables: ['documents', 'document_items', 'number_sequences', 'estimate_revisions'],
    domainServices: ['DocumentCalculator', 'SequenceEngine', 'Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['draft -> issued', 'issued -> accepted', 'issued -> rejected', 'accepted -> converted'],
    testCoverage: [
      'tests/domain/state_machine.test.ts',
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 85,
      consultant: 95,
      agency: 95,
      professional: 85,
      contractor: 100,
      retail: 40,
      wholesale: 80,
      service: 95,
      small_business: 80,
      other: 75,
    },
    priority: 90,
  },

  'quick_bill': {
    key: 'quick_bill',
    name: 'Quick Bill (30s)',
    description: 'Instant cash billing in 30 seconds for walk-ins and rapid transactions',
    module: 'billing',
    dependencies: ['business_profile', 'moneyEngine', 'documentCalculator', 'payment.record'],
    routes: ['/quick-bill'],
    repositories: ['DocumentRepository', 'PaymentRepository', 'BusinessProfileRepository'],
    databaseTables: ['documents', 'document_items', 'payments', 'receipts'],
    domainServices: ['DocumentCalculator', 'BalanceEngine', 'Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['draft -> issued (auto-completed)'],
    testCoverage: [
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 70,
      consultant: 60,
      agency: 60,
      professional: 60,
      contractor: 65,
      retail: 100,
      wholesale: 90,
      service: 85,
      small_business: 85,
      other: 80,
    },
    priority: 95,
  },

  'customers': {
    key: 'customers',
    name: 'Customers & Clients',
    description: 'Customer directory, balances, contact info, and transaction ledgers',
    module: 'clients',
    dependencies: ['business_profile'],
    routes: ['/(tabs)/customers', '/customer/edit', '/customer/[id]'],
    repositories: ['CustomerRepository', 'DocumentRepository', 'PaymentRepository'],
    databaseTables: ['customers', 'documents', 'payments'],
    domainServices: ['BalanceEngine', 'StatementEngine'],
    permissionRequirements: [],
    expectedStateTransitions: ['active -> archived'],
    testCoverage: [
      'tests/domain/statement_engine.test.ts',
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 95,
      consultant: 100,
      agency: 100,
      professional: 100,
      contractor: 95,
      retail: 80,
      wholesale: 100,
      service: 100,
      small_business: 95,
      other: 90,
    },
    priority: 88,
  },

  'catalog': {
    key: 'catalog',
    name: 'Catalog Items & Services',
    description: 'Saved goods and service items with default pricing and tax codes',
    module: 'catalog',
    dependencies: ['business_profile', 'moneyEngine'],
    routes: ['/catalog'],
    repositories: ['CatalogRepository'],
    databaseTables: ['catalog_items'],
    domainServices: ['Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['active -> archived'],
    testCoverage: [
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 80,
      consultant: 85,
      agency: 85,
      professional: 85,
      contractor: 90,
      retail: 100,
      wholesale: 100,
      service: 95,
      small_business: 90,
      other: 85,
    },
    priority: 85,
  },

  'payments': {
    key: 'payments',
    name: 'Payment Tracking & Ledger',
    description: 'Record manual/cash/bank/UPI payments, update invoice balance and customer ledger',
    module: 'payments',
    dependencies: ['invoice.create', 'moneyEngine', 'balanceEngine'],
    routes: ['/receipt/[id]'],
    repositories: ['PaymentRepository', 'DocumentRepository'],
    databaseTables: ['payments', 'documents', 'receipts'],
    domainServices: ['BalanceEngine', 'Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['pending -> completed', 'completed -> refunded'],
    testCoverage: [
      'tests/domain/balance_engine.test.ts',
      'tests/integration/payments_forward_compatible.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 95,
      consultant: 95,
      agency: 100,
      professional: 95,
      contractor: 95,
      retail: 95,
      wholesale: 100,
      service: 95,
      small_business: 95,
      other: 90,
    },
    priority: 92,
  },

  'receipts': {
    key: 'receipts',
    name: 'Payment Receipts',
    description: 'Generate decoupled, immutable payment receipts with PDF export and sharing',
    module: 'payments',
    dependencies: ['payments', 'business_profile'],
    routes: ['/receipt/[id]'],
    repositories: ['PaymentRepository', 'DocumentRepository', 'BusinessProfileRepository'],
    databaseTables: ['receipts', 'payments', 'documents'],
    domainServices: ['PdfService', 'Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['created -> snapshot_frozen'],
    testCoverage: [
      'tests/services/pdf_templates.test.ts',
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 90,
      consultant: 90,
      agency: 90,
      professional: 95,
      contractor: 90,
      retail: 95,
      wholesale: 95,
      service: 95,
      small_business: 90,
      other: 85,
    },
    priority: 84,
  },

  'expenses': {
    key: 'expenses',
    name: 'Expenses & Overhead',
    description: 'Record operating outlays, materials, labour, and track overhead costs',
    module: 'expenses',
    dependencies: ['business_profile', 'moneyEngine'],
    routes: ['/expenses', '/expenses/add'],
    repositories: ['ExpenseRepository'],
    databaseTables: ['expenses'],
    domainServices: ['Money'],
    permissionRequirements: [],
    expectedStateTransitions: ['unbilled -> billed'],
    testCoverage: [
      'tests/domain/contractor_profitability.test.ts',
      'tests/integration/workflow.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 90,
      consultant: 90,
      agency: 90,
      professional: 90,
      contractor: 95,
      retail: 85,
      wholesale: 85,
      service: 85,
      small_business: 85,
      other: 85,
    },
    priority: 82,
  },

  'reports': {
    key: 'reports',
    name: 'Financial Reports & Aging',
    description: 'Authoritative revenue metrics, unpaid aging buckets, and cash collected summaries',
    module: 'reports',
    dependencies: ['business_profile', 'invoice.create', 'payments'],
    routes: ['/reports'],
    repositories: ['DocumentRepository', 'PaymentRepository', 'ExpenseRepository'],
    databaseTables: ['documents', 'payments', 'expenses'],
    domainServices: ['BalanceEngine', 'Money'],
    permissionRequirements: [],
    testCoverage: [
      'tests/integration/advanced_features.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 85,
      consultant: 90,
      agency: 90,
      professional: 90,
      contractor: 90,
      retail: 90,
      wholesale: 95,
      service: 85,
      small_business: 85,
      other: 85,
    },
    priority: 80,
  },

  'backup_export': {
    key: 'backup_export',
    name: 'Backup & Data Export',
    description: 'Sandboxed SQLite database backup, restore, and CSV data portability',
    module: 'tools',
    dependencies: ['business_profile'],
    routes: ['/backup'],
    repositories: [],
    databaseTables: ['business_profiles', 'customers', 'documents', 'payments'],
    domainServices: ['BackupManager', 'CsvExporter'],
    permissionRequirements: [],
    testCoverage: [
      'tests/services/backup_restore.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 80,
      consultant: 80,
      agency: 80,
      professional: 80,
      contractor: 80,
      retail: 80,
      wholesale: 80,
      service: 80,
      small_business: 80,
      other: 80,
    },
    priority: 75,
  },

  'search': {
    key: 'search',
    name: 'Global Command Search',
    description: 'Instant local search across features, documents, customers, and tools',
    module: 'tools',
    dependencies: [],
    routes: ['/search'],
    repositories: ['CustomerRepository', 'DocumentRepository'],
    databaseTables: ['customers', 'documents'],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [
      'tests/domain/adaptive_workspace.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 75,
      consultant: 75,
      agency: 75,
      professional: 75,
      contractor: 75,
      retail: 75,
      wholesale: 75,
      service: 75,
      small_business: 75,
      other: 75,
    },
    priority: 74,
  },

  'app_lock': {
    key: 'app_lock',
    name: 'App Lock & PIN Security',
    description: 'Device-level cryptographic PIN protection with lifecycle session enforcement',
    module: 'security',
    dependencies: [],
    routes: ['/security-pin'],
    repositories: [],
    databaseTables: [],
    domainServices: ['SecurityService'],
    permissionRequirements: [],
    expectedStateTransitions: ['unlocked -> locked', 'locked -> unlocked'],
    testCoverage: [
      'tests/services/security_service.test.ts',
    ],
    verificationStatus: 'VERIFIED', // Targeted for complete state machine verification in Pass 7
    businessRelevance: {
      freelancer: 70,
      consultant: 75,
      agency: 75,
      professional: 80,
      contractor: 70,
      retail: 75,
      wholesale: 75,
      service: 70,
      small_business: 70,
      other: 70,
    },
    priority: 70,
  },

  'workspace_settings': {
    key: 'workspace_settings',
    name: 'Workspace & Personalization',
    description: 'Customize enabled capabilities, quick actions, and business type presets',
    module: 'workspace',
    dependencies: [],
    routes: ['/settings/workspace'],
    repositories: ['WorkspaceRepository', 'FeatureUsageRepository'],
    databaseTables: ['workspace_preferences', 'feature_usage'],
    domainServices: ['AdaptiveWorkspaceEngine'],
    permissionRequirements: [],
    testCoverage: [
      'tests/domain/adaptive_workspace.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 85,
      consultant: 85,
      agency: 85,
      professional: 85,
      contractor: 85,
      retail: 85,
      wholesale: 85,
      service: 85,
      small_business: 85,
      other: 85,
    },
    priority: 72,
  },

  'business_profile': {
    key: 'business_profile',
    name: 'Business Profile & Regional Setup',
    description: 'Business name, address, tax ID, regional currency, phone, and numbering sequences',
    module: 'workspace',
    dependencies: [],
    routes: ['/onboarding/setup'],
    repositories: ['BusinessProfileRepository'],
    databaseTables: ['business_profiles', 'number_sequences'],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [
      'tests/data/migrations.test.ts',
    ],
    verificationStatus: 'VERIFIED',
    businessRelevance: {
      freelancer: 90,
      consultant: 90,
      agency: 90,
      professional: 90,
      contractor: 90,
      retail: 90,
      wholesale: 90,
      service: 90,
      small_business: 90,
      other: 90,
    },
    priority: 86,
  },

  // ── FUTURE / ROADMAP FEATURES (STRICTLY HIDDEN IN PRODUCTION) ──
  'gst_reports': {
    key: 'gst_reports',
    name: 'GST Reports & HSN/SAC',
    description: 'GSTR-1 return filing summaries, HSN rate validation, and tax split ledger',
    module: 'gst',
    dependencies: ['invoice.create'],
    routes: [],
    repositories: [],
    databaseTables: [],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 75,
      consultant: 85,
      agency: 85,
      professional: 85,
      contractor: 85,
      retail: 95,
      wholesale: 100,
      service: 85,
      small_business: 80,
      other: 80,
    },
    priority: 65,
  },

  'credit_note': {
    key: 'credit_note',
    name: 'Credit & Debit Notes',
    description: 'Formal credit notes for sales returns, overcharges, and balance adjustments',
    module: 'billing',
    dependencies: ['invoice.create'],
    routes: [],
    repositories: [],
    databaseTables: ['documents'],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 60,
      consultant: 65,
      agency: 70,
      professional: 65,
      contractor: 75,
      retail: 90,
      wholesale: 95,
      service: 70,
      small_business: 70,
      other: 70,
    },
    priority: 60,
  },

  'delivery_challan': {
    key: 'delivery_challan',
    name: 'Delivery Challan',
    description: 'Goods transit documentation for dispatch and physical logistics',
    module: 'billing',
    dependencies: ['invoice.create'],
    routes: [],
    repositories: [],
    databaseTables: ['documents'],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 10,
      consultant: 10,
      agency: 10,
      professional: 10,
      contractor: 70,
      retail: 75,
      wholesale: 95,
      service: 20,
      small_business: 50,
      other: 50,
    },
    priority: 55,
  },

  'collections_workspace': {
    key: 'collections_workspace',
    name: 'Collections & WhatsApp Reminders',
    description: 'Overdue debtor management, payment reminders, and customer balance statements',
    module: 'payments',
    dependencies: ['customers', 'invoice.create', 'payments'],
    routes: [],
    repositories: [],
    databaseTables: [],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 85,
      consultant: 90,
      agency: 90,
      professional: 90,
      contractor: 95,
      retail: 70,
      wholesale: 95,
      service: 90,
      small_business: 85,
      other: 85,
    },
    priority: 62,
  },

  'suppliers_purchases': {
    key: 'suppliers_purchases',
    name: 'Suppliers & Purchase Orders',
    description: 'Vendor profiles, purchase orders, goods receipts, and vendor ledger',
    module: 'inventory',
    dependencies: ['catalog'],
    routes: [],
    repositories: [],
    databaseTables: [],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 30,
      consultant: 35,
      agency: 45,
      professional: 35,
      contractor: 85,
      retail: 95,
      wholesale: 100,
      service: 40,
      small_business: 70,
      other: 70,
    },
    priority: 58,
  },

  'jobs_management': {
    key: 'jobs_management',
    name: 'Jobs & Projects',
    description: 'Job tracking, project milestones, materials, and contractor job profitability',
    module: 'jobs',
    dependencies: ['customers'],
    routes: [],
    repositories: ['JobRepository'],
    databaseTables: ['jobs'],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 65,
      consultant: 85,
      agency: 95,
      professional: 85,
      contractor: 100,
      retail: 20,
      wholesale: 30,
      service: 95,
      small_business: 60,
      other: 60,
    },
    priority: 60,
  },

  'technician_timesheets': {
    key: 'technician_timesheets',
    name: 'Timesheets & Labor',
    description: 'Log billable hours, labor rates, and convert time logs directly to invoices',
    module: 'jobs',
    dependencies: ['jobs_management'],
    routes: [],
    repositories: ['TimeEntryRepository'],
    databaseTables: ['time_entries'],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 90,
      consultant: 95,
      agency: 95,
      professional: 95,
      contractor: 90,
      retail: 10,
      wholesale: 15,
      service: 90,
      small_business: 55,
      other: 55,
    },
    priority: 57,
  },

  'recurring_invoices': {
    key: 'recurring_invoices',
    name: 'Recurring Invoices',
    description: 'Automated periodic invoicing for retainers, scheduled billing, and AMC services',
    module: 'billing',
    dependencies: ['invoice.create'],
    routes: [],
    repositories: [],
    databaseTables: [],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 85,
      consultant: 85,
      agency: 95,
      professional: 85,
      contractor: 50,
      retail: 25,
      wholesale: 40,
      service: 85,
      small_business: 60,
      other: 60,
    },
    priority: 56,
  },

  'inventory_ledger': {
    key: 'inventory_ledger',
    name: 'Inventory & Stock Ledger',
    description: 'Stock levels, low-stock thresholds, item variants, and real-time inventory ledger',
    module: 'inventory',
    dependencies: ['catalog'],
    routes: [],
    repositories: [],
    databaseTables: [],
    domainServices: [],
    permissionRequirements: [],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 15,
      consultant: 15,
      agency: 10,
      professional: 15,
      contractor: 75,
      retail: 100,
      wholesale: 100,
      service: 25,
      small_business: 60,
      other: 60,
    },
    priority: 64,
  },

  'barcode_scanner': {
    key: 'barcode_scanner',
    name: 'Barcode Scanner & POS',
    description: 'Camera barcode scanning for instant item lookup and fast register sales',
    module: 'inventory',
    dependencies: ['catalog'],
    routes: [],
    repositories: [],
    databaseTables: [],
    domainServices: [],
    permissionRequirements: ['camera'],
    testCoverage: [],
    verificationStatus: 'FUTURE',
    businessRelevance: {
      freelancer: 10,
      consultant: 10,
      agency: 5,
      professional: 10,
      contractor: 40,
      retail: 100,
      wholesale: 90,
      service: 15,
      small_business: 45,
      other: 45,
    },
    priority: 52,
  },
};

export class FeatureVerificationRegistry {
  public static getAll(): FeatureVerificationEntry[] {
    return Object.values(FEATURE_VERIFICATION_REGISTRY);
  }

  public static getByKey(key: string): FeatureVerificationEntry | undefined {
    return FEATURE_VERIFICATION_REGISTRY[key];
  }

  public static getByStatus(status: VerificationStatus): FeatureVerificationEntry[] {
    return this.getAll().filter((entry) => entry.verificationStatus === status);
  }

  public static getReadyFeatures(): FeatureVerificationEntry[] {
    return this.getAll().filter(
      (entry) => entry.verificationStatus === 'VERIFIED' || entry.verificationStatus === 'IMPLEMENTED_UNVERIFIED'
    );
  }

  public static getFutureFeatures(): FeatureVerificationEntry[] {
    return this.getAll().filter((entry) => entry.verificationStatus === 'FUTURE');
  }

  /**
   * Resolves recursive dependencies for a capability.
   */
  public static resolveDependencies(key: string, visited = new Set<string>()): string[] {
    if (visited.has(key)) return [];
    visited.add(key);

    const entry = this.getByKey(key);
    if (!entry) return [];

    const resolved: string[] = [];
    for (const depKey of entry.dependencies) {
      if (!visited.has(depKey)) {
        resolved.push(depKey);
        resolved.push(...this.resolveDependencies(depKey, visited));
      }
    }

    return Array.from(new Set(resolved));
  }
}
