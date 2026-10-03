/**
 * BILLFRAME CANONICAL FEATURE REGISTRY
 * Single source of truth for all Billframe capabilities, discovery, search,
 * and adaptive workspace scoring.
 */

export type BusinessType =
  | 'freelancer'
  | 'service'
  | 'agency'
  | 'contractor'
  | 'retail'
  | 'wholesale'
  | 'professional'
  | 'other';

export type FeatureAvailability = 'ready' | 'roadmap';

export type FeatureModule =
  | 'billing'
  | 'clients'
  | 'payments'
  | 'expenses'
  | 'jobs'
  | 'inventory'
  | 'reports'
  | 'settings'
  | 'gst'
  | 'documents';

export interface FeatureCapability {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string | null;
  availability: FeatureAvailability;
  roadmapPhase?: string;
  businessRelevance: Record<BusinessType, number>; // 0 to 100
  searchKeywords: string[];
  module: FeatureModule;
  priority: number; // 1 to 100 (higher = shown earlier by default)
}

export const FEATURE_REGISTRY: FeatureCapability[] = [
  // ── READY CAPABILITIES ──
  {
    id: 'create_invoice',
    name: 'Create Invoice',
    description: 'Issue standard invoice with deposits, line items, and tax breakdown',
    icon: 'invoices',
    route: '/document/edit',
    availability: 'ready',
    businessRelevance: {
      freelancer: 100,
      service: 100,
      agency: 100,
      contractor: 95,
      retail: 90,
      wholesale: 100,
      professional: 100,
      other: 95,
    },
    searchKeywords: ['invoice', 'bill', 'new invoice', 'create invoice', 'sale', 'tax bill', 'tax invoice'],
    module: 'billing',
    priority: 100,
  },
  {
    id: 'quick_bill',
    name: 'Quick Bill (30s)',
    description: 'Instant cash billing in 30 seconds for walk-ins and rapid transactions',
    icon: 'quick_bill',
    route: '/quick-bill',
    availability: 'ready',
    businessRelevance: {
      freelancer: 70,
      service: 85,
      agency: 60,
      contractor: 65,
      retail: 100,
      wholesale: 90,
      professional: 60,
      other: 80,
    },
    searchKeywords: ['quick bill', 'fast bill', 'instant sale', 'cash bill', 'pos', 'counter sale', 'counter bill'],
    module: 'billing',
    priority: 95,
  },
  {
    id: 'create_estimate',
    name: 'Create Estimate / Quote',
    description: 'Draft formal quotations and bids that convert directly to invoices',
    icon: 'estimates',
    route: '/document/edit?type=estimate',
    availability: 'ready',
    businessRelevance: {
      freelancer: 85,
      service: 95,
      agency: 95,
      contractor: 100,
      retail: 40,
      wholesale: 80,
      professional: 85,
      other: 75,
    },
    searchKeywords: ['estimate', 'quote', 'quotation', 'bid', 'proposal', 'convert estimate'],
    module: 'billing',
    priority: 90,
  },
  {
    id: 'customers',
    name: 'Customers & Clients',
    description: 'Customer directory, balances, contact information, and billing history',
    icon: 'customers',
    route: '/(tabs)/customers',
    availability: 'ready',
    businessRelevance: {
      freelancer: 95,
      service: 100,
      agency: 100,
      contractor: 95,
      retail: 95,
      wholesale: 100,
      professional: 100,
      other: 90,
    },
    searchKeywords: ['customer', 'client', 'contact', 'customer statement', 'ledger', 'debtor', 'client list'],
    module: 'clients',
    priority: 88,
  },
  {
    id: 'expenses',
    name: 'Expenses & Overhead',
    description: 'Track business expenses, vendor costs, and categorize operating outlays',
    icon: 'expenses',
    route: '/expenses',
    availability: 'ready',
    businessRelevance: {
      freelancer: 90,
      service: 85,
      agency: 90,
      contractor: 95,
      retail: 85,
      wholesale: 85,
      professional: 90,
      other: 85,
    },
    searchKeywords: ['expense', 'spending', 'cost', 'vendor payment', 'receipt', 'overhead', 'payout'],
    module: 'expenses',
    priority: 82,
  },
  {
    id: 'reports',
    name: 'Financial & Aging Reports',
    description: 'Authoritative revenue metrics, unpaid aging buckets, and cash collected',
    icon: 'reports',
    route: '/reports',
    availability: 'ready',
    businessRelevance: {
      freelancer: 85,
      service: 85,
      agency: 90,
      contractor: 90,
      retail: 90,
      wholesale: 95,
      professional: 90,
      other: 85,
    },
    searchKeywords: ['reports', 'aging', 'outstanding', 'revenue', 'summary', 'profit', 'balance sheet', 'analytics'],
    module: 'reports',
    priority: 80,
  },
  {
    id: 'backup_export',
    name: 'Backup & Data Export',
    description: 'Full sandboxed SQLite database backup, restore, and CSV data portability',
    icon: 'backup',
    route: '/backup',
    availability: 'ready',
    businessRelevance: {
      freelancer: 80,
      service: 80,
      agency: 80,
      contractor: 80,
      retail: 80,
      wholesale: 80,
      professional: 80,
      other: 80,
    },
    searchKeywords: ['backup', 'export', 'restore', 'csv', 'database', 'download data', 'data portability'],
    module: 'settings',
    priority: 75,
  },
  {
    id: 'app_lock',
    name: 'Security & App PIN',
    description: 'Device-level biometric and master PIN protection for financial records',
    icon: 'security',
    route: '/security-pin',
    availability: 'ready',
    businessRelevance: {
      freelancer: 70,
      service: 70,
      agency: 75,
      contractor: 70,
      retail: 75,
      wholesale: 75,
      professional: 75,
      other: 70,
    },
    searchKeywords: ['security', 'pin', 'lock', 'app lock', 'password', 'privacy', 'biometrics'],
    module: 'settings',
    priority: 70,
  },
  {
    id: 'workspace_settings',
    name: 'Workspace & Personalization',
    description: 'Customize primary actions, enabled modules, and adaptive layout behavior',
    icon: 'workspace',
    route: '/settings/workspace',
    availability: 'ready',
    businessRelevance: {
      freelancer: 85,
      service: 85,
      agency: 85,
      contractor: 85,
      retail: 85,
      wholesale: 85,
      professional: 85,
      other: 85,
    },
    searchKeywords: ['workspace', 'personalize', 'layout', 'modules', 'customize', 'preferences'],
    module: 'settings',
    priority: 72,
  },
  {
    id: 'payment_gateways',
    name: 'Payments & Gateways',
    description: 'Configure Direct UPI QR codes, bank handles, and Razorpay payment links',
    icon: 'payments',
    route: '/settings/payments',
    availability: 'ready',
    businessRelevance: {
      freelancer: 95,
      service: 95,
      agency: 95,
      contractor: 90,
      retail: 95,
      wholesale: 90,
      professional: 95,
      other: 90,
    },
    searchKeywords: ['upi', 'qr code', 'payment', 'gateway', 'razorpay', 'phonepe', 'gpay', 'paytm', 'bhim', 'online payment', 'payment link'],
    module: 'payments',
    priority: 85,
  },
  {
    id: 'catalog_items',
    name: 'Products & Price List',
    description: 'Catalog of items, services, hourly rates, and standard units',
    icon: 'inventory',
    route: '/catalog',
    availability: 'ready',
    businessRelevance: {
      freelancer: 85,
      service: 90,
      agency: 85,
      contractor: 95,
      retail: 100,
      wholesale: 100,
      professional: 85,
      other: 85,
    },
    searchKeywords: ['catalog', 'items', 'products', 'services', 'rates', 'price list', 'inventory'],
    module: 'inventory',
    priority: 86,
  },
  {
    id: 'gst_filing',
    name: 'GST Reports & HSN/SAC',
    description: 'Place of supply calculation, CGST/SGST/IGST breakdown, and GSTR-1 summaries',
    icon: 'gst',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 2',
    businessRelevance: {
      freelancer: 75,
      service: 85,
      agency: 85,
      contractor: 85,
      retail: 95,
      wholesale: 100,
      professional: 85,
      other: 80,
    },
    searchKeywords: ['gst', 'gst report', 'gstr1', 'hsn', 'sac', 'cgst', 'sgst', 'igst', 'e-invoice'],
    module: 'gst',
    priority: 65,
  },

  // ── ROADMAP CAPABILITIES (Properly tagged with phase) ──
  {
    id: 'credit_note',
    name: 'Credit & Debit Notes',
    description: 'Formal credit notes for sales returns, overcharges, and balance adjustments',
    icon: 'credit_note',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 3',
    businessRelevance: {
      freelancer: 60,
      service: 70,
      agency: 70,
      contractor: 75,
      retail: 90,
      wholesale: 95,
      professional: 65,
      other: 70,
    },
    searchKeywords: ['credit note', 'debit note', 'refund note', 'sales return', 'adjustment note'],
    module: 'documents',
    priority: 60,
  },
  {
    id: 'delivery_challan',
    name: 'Delivery Challan',
    description: 'Goods transit documentation for dispatch and physical logistics',
    icon: 'delivery_challan',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 3',
    businessRelevance: {
      freelancer: 10,
      service: 20,
      agency: 10,
      contractor: 70,
      retail: 75,
      wholesale: 95,
      professional: 10,
      other: 50,
    },
    searchKeywords: ['delivery challan', 'dispatch', 'goods transit', 'transport memo', 'packing slip'],
    module: 'documents',
    priority: 55,
  },
  {
    id: 'collections_workspace',
    name: 'Collections & WhatsApp Reminders',
    description: 'Overdue debtor management, payment reminders, and customer balance statements',
    icon: 'collections',
    route: '/collections',
    availability: 'ready',
    businessRelevance: {
      freelancer: 85,
      service: 90,
      agency: 90,
      contractor: 95,
      retail: 70,
      wholesale: 95,
      professional: 90,
      other: 85,
    },
    searchKeywords: ['collections', 'reminder', 'whatsapp reminder', 'overdue', 'follow up', 'recovery'],
    module: 'payments',
    priority: 62,
  },
  {
    id: 'suppliers_purchases',
    name: 'Suppliers & Purchase Orders',
    description: 'Vendor profiles, purchase orders, goods receipts, and vendor ledger',
    icon: 'purchases',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 5',
    businessRelevance: {
      freelancer: 30,
      service: 40,
      agency: 45,
      contractor: 85,
      retail: 95,
      wholesale: 100,
      professional: 35,
      other: 70,
    },
    searchKeywords: ['supplier', 'vendor', 'purchase order', 'po', 'procurement', 'vendor bill'],
    module: 'inventory',
    priority: 58,
  },
  {
    id: 'jobs_management',
    name: 'Jobs & Projects',
    description: 'Job tracking, project milestones, materials, and contractor job profitability',
    icon: 'jobs',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 6',
    businessRelevance: {
      freelancer: 65,
      service: 95,
      agency: 95,
      contractor: 100,
      retail: 20,
      wholesale: 30,
      professional: 85,
      other: 60,
    },
    searchKeywords: ['job', 'project', 'work order', 'service call', 'milestone', 'job costing'],
    module: 'jobs',
    priority: 60,
  },
  {
    id: 'technician_timesheets',
    name: 'Timesheets & Labor',
    description: 'Log billable hours, labor rates, and convert time logs directly to invoices',
    icon: 'timesheets',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 6',
    businessRelevance: {
      freelancer: 90,
      service: 90,
      agency: 95,
      contractor: 90,
      retail: 10,
      wholesale: 15,
      professional: 95,
      other: 55,
    },
    searchKeywords: ['timesheet', 'time tracking', 'hours', 'billable time', 'labor log', 'hourly rate'],
    module: 'jobs',
    priority: 57,
  },
  {
    id: 'recurring_invoices',
    name: 'Recurring Invoices',
    description: 'Automated periodic invoicing for retainers, scheduled billing, and AMC services',
    icon: 'recurring',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 7',
    businessRelevance: {
      freelancer: 85,
      service: 85,
      agency: 95,
      contractor: 50,
      retail: 25,
      wholesale: 40,
      professional: 85,
      other: 60,
    },
    searchKeywords: ['recurring', 'retainer', 'amc', 'monthly bill', 'auto invoice', 'schedule', 'periodic'],
    module: 'billing',
    priority: 56,
  },
  {
    id: 'inventory_ledger',
    name: 'Inventory & Stock Ledger',
    description: 'Stock levels, low-stock thresholds, item variants, and real-time inventory ledger',
    icon: 'inventory',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 8',
    businessRelevance: {
      freelancer: 15,
      service: 25,
      agency: 10,
      contractor: 75,
      retail: 100,
      wholesale: 100,
      professional: 15,
      other: 60,
    },
    searchKeywords: ['inventory', 'stock', 'low stock', 'sku', 'warehouse', 'stock count', 'catalog item'],
    module: 'inventory',
    priority: 64,
  },
  {
    id: 'barcode_scanner',
    name: 'Barcode Scanner & POS',
    description: 'Camera barcode scanning for instant item lookup and fast register sales',
    icon: 'barcode',
    route: null,
    availability: 'roadmap',
    roadmapPhase: 'Phase 8',
    businessRelevance: {
      freelancer: 10,
      service: 15,
      agency: 5,
      contractor: 40,
      retail: 100,
      wholesale: 90,
      professional: 10,
      other: 45,
    },
    searchKeywords: ['barcode', 'scan', 'upc', 'ean', 'scanner', 'code scanner'],
    module: 'inventory',
    priority: 52,
  },
];

export class FeatureRegistry {
  /**
   * Returns true if running in development / test mode.
   */
  public static isDevelopment(): boolean {
    if (typeof __DEV__ !== 'undefined') {
      return Boolean(__DEV__);
    }
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  }

  /**
   * Returns all canonical registered capabilities in the registry.
   */
  public static getAll(): FeatureCapability[] {
    return [...FEATURE_REGISTRY];
  }

  /**
   * Returns only functional, currently available features.
   */
  public static getReadyFeatures(): FeatureCapability[] {
    return FEATURE_REGISTRY.filter((f) => f.availability === 'ready');
  }

  /**
   * Returns future roadmap features.
   */
  public static getRoadmapFeatures(): FeatureCapability[] {
    return FEATURE_REGISTRY.filter((f) => f.availability === 'roadmap');
  }

  public static getById(id: string): FeatureCapability | undefined {
    return FEATURE_REGISTRY.find((f) => f.id === id);
  }

  public static getByModule(module: FeatureModule, options?: { includeRoadmap?: boolean }): FeatureCapability[] {
    const includeRoadmap = options?.includeRoadmap ?? this.isDevelopment();
    const list = includeRoadmap ? FEATURE_REGISTRY : this.getReadyFeatures();
    return list.filter((f) => f.module === module);
  }

  /**
   * Searches capabilities by name, description, keywords, and module.
   * By default in production (options.includeRoadmap = false), returns ONLY currently usable 'ready' features.
   */
  public static search(query: string, options?: { includeRoadmap?: boolean }): FeatureCapability[] {
    const includeRoadmap = options?.includeRoadmap ?? this.isDevelopment();
    const list = includeRoadmap ? FEATURE_REGISTRY : this.getReadyFeatures();
    const clean = query.trim().toLowerCase();
    if (!clean) return list;

    return list.filter((f) => {
      if (f.name.toLowerCase().includes(clean)) return true;
      if (f.description.toLowerCase().includes(clean)) return true;
      if (f.searchKeywords.some((k) => k.toLowerCase().includes(clean))) return true;
      if (f.module.toLowerCase().includes(clean)) return true;
      return false;
    });
  }
}
