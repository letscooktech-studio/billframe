/**
 * CANONICAL WORKSPACE RESOLVER & CONFIGURATION ENGINE
 * Derives concrete WorkspaceConfig from BusinessProfile, WorkspacePreferences,
 * and canonical FeatureVerificationRegistry with deterministic dependency resolution.
 */

import { BusinessType, FeatureVerificationRegistry } from '../../features/featureRegistry';
import { WorkspacePreferences, FieldVisibilityDefaults, AdaptiveWorkspaceEngine } from './AdaptiveWorkspaceEngine';
import { BusinessProfile } from '../profile/types';

export interface NavigationItem {
  id: string;
  name: string;
  label: string;
  icon: string;
  route: string;
}

export interface QuickActionItem {
  id: string;
  name: string;
  icon: string;
  route: string;
  description: string;
}

export interface WorkspaceConfig {
  businessType: BusinessType;
  enabledFeatures: string[];
  bottomNavigation: NavigationItem[];
  quickActions: QuickActionItem[];
  dashboardWidgets: string[];
  documentTypes: Array<'invoice' | 'estimate' | 'receipt'>;
  fieldVisibility: FieldVisibilityDefaults;
}

export const CANONICAL_DEPENDENCY_GRAPH: Record<string, string[]> = {
  'invoice.create': ['business_profile', 'moneyEngine', 'documentCalculator'],
  'estimate.create': ['business_profile', 'moneyEngine', 'documentCalculator'],
  'quick_bill': ['business_profile', 'moneyEngine', 'documentCalculator', 'payment.record'],
  'customers': ['business_profile'],
  'catalog': ['business_profile', 'moneyEngine'],
  'payments': ['invoice.create', 'moneyEngine', 'balanceEngine'],
  'receipts': ['payments', 'business_profile'],
  'expenses': ['business_profile', 'moneyEngine'],
  'reports': ['business_profile', 'invoice.create', 'payments'],
  'backup_export': ['business_profile'],
  'search': [],
  'app_lock': [],
  'workspace_settings': [],
  'business_profile': [],
  // Future dependencies
  'collections_workspace': ['customers', 'invoice.create', 'payments'],
  'credit_note': ['invoice.create'],
  'delivery_challan': ['invoice.create'],
};

export class WorkspaceResolver {
  /**
   * Resolves full dependency tree for a list of desired capabilities.
   * Ensures e.g. payments automatically enables invoices.
   */
  public static resolveDependencies(desiredFeatureKeys: string[]): string[] {
    const active = new Set<string>(desiredFeatureKeys);
    let changed = true;

    while (changed) {
      changed = false;
      for (const feat of Array.from(active)) {
        const deps = CANONICAL_DEPENDENCY_GRAPH[feat] || [];
        for (const d of deps) {
          if (!active.has(d)) {
            active.add(d);
            changed = true;
          }
        }
      }
    }

    return Array.from(active);
  }

  /**
   * Resolves complete WorkspaceConfig.
   */
  public static resolve(
    profile: BusinessProfile | null,
    preferences: WorkspacePreferences
  ): WorkspaceConfig {
    const rawFeatures = preferences.primaryModules && preferences.primaryModules.length > 0
      ? preferences.primaryModules
      : this.getDefaultFeaturesForType(preferences.businessType);

    // Filter to only verified / currently ready features in production
    const readySet = new Set(
      FeatureVerificationRegistry.getReadyFeatures().map((f) => f.key)
    );
    const filteredFeatures = rawFeatures.filter((f) => readySet.has(f));

    // Resolve dependencies deterministically
    const enabledFeatures = this.resolveDependencies(filteredFeatures);

    // Derive bottom navigation tabs
    const bottomNavigation: NavigationItem[] = [
      { id: 'tab_home', name: 'index', label: 'Home', icon: 'home', route: '/(tabs)' },
      { id: 'tab_documents', name: 'documents', label: 'Documents', icon: 'invoices', route: '/(tabs)/documents' },
      { id: 'tab_contacts', name: 'contacts', label: 'Contacts', icon: 'customers', route: '/(tabs)/contacts' },
      { id: 'tab_money', name: 'money', label: 'Money', icon: 'payments', route: '/(tabs)/money' },
      { id: 'tab_settings', name: 'settings', label: 'Settings', icon: 'settings', route: '/(tabs)/settings' },
    ];

    // Derive quick actions based on business type preset
    const quickActions = this.resolveQuickActions(preferences.businessType, enabledFeatures);

    // Derive dashboard widgets
    const dashboardWidgets = ['metrics_summary', 'quick_actions', 'recent_documents'];
    if (enabledFeatures.includes('expenses')) {
      dashboardWidgets.push('expenses_summary');
    }

    // Supported document types
    const documentTypes: Array<'invoice' | 'estimate' | 'receipt'> = ['invoice'];
    if (enabledFeatures.includes('estimate.create')) {
      documentTypes.push('estimate');
    }
    if (enabledFeatures.includes('receipts')) {
      documentTypes.push('receipt');
    }

    // Form field defaults
    const fieldVisibility = AdaptiveWorkspaceEngine.getFieldVisibilityDefaults(preferences);

    return {
      businessType: preferences.businessType,
      enabledFeatures,
      bottomNavigation,
      quickActions,
      dashboardWidgets,
      documentTypes,
      fieldVisibility,
    };
  }

  /**
   * Returns default verified capability keys for each business type.
   */
  public static getDefaultFeaturesForType(type: BusinessType): string[] {
    switch (type) {
      case 'freelancer':
        return ['invoice.create', 'estimate.create', 'customers', 'expenses', 'payments', 'reports'];
      case 'consultant':
        return ['invoice.create', 'estimate.create', 'customers', 'expenses', 'payments', 'reports'];
      case 'agency':
      case 'professional':
        return ['invoice.create', 'estimate.create', 'customers', 'expenses', 'payments', 'receipts', 'reports'];
      case 'contractor':
        return ['estimate.create', 'invoice.create', 'expenses', 'customers', 'payments'];
      case 'retail':
        return ['quick_bill', 'invoice.create', 'customers', 'catalog', 'payments', 'receipts'];
      case 'wholesale':
        return ['invoice.create', 'customers', 'catalog', 'payments', 'receipts', 'reports'];
      case 'service':
        return ['invoice.create', 'estimate.create', 'customers', 'expenses', 'payments'];
      case 'small_business':
      case 'other':
      default:
        return ['invoice.create', 'quick_bill', 'customers', 'expenses', 'payments', 'reports'];
    }
  }

  /**
   * Resolves prioritized quick action items with correct routes.
   */
  private static resolveQuickActions(
    type: BusinessType,
    enabledFeatures: string[]
  ): QuickActionItem[] {
    const list: QuickActionItem[] = [];

    if (type === 'retail') {
      list.push({
        id: 'quick_bill',
        name: 'Quick Bill (30s)',
        icon: 'quick_bill',
        route: '/quick-bill',
        description: 'Instant walk-in cash billing',
      });
      list.push({
        id: 'invoice.create',
        name: 'Create Invoice',
        icon: 'new_invoice',
        route: '/document/edit',
        description: 'Standard invoice with customer & tax',
      });
      list.push({
        id: 'customers',
        name: 'Customers',
        icon: 'customers',
        route: '/(tabs)/customers',
        description: 'Customer directory and history',
      });
      list.push({
        id: 'catalog',
        name: 'Products & Items',
        icon: 'inventory',
        route: '/catalog',
        description: 'Product catalog rates',
      });
      return list;
    }

    if (type === 'contractor') {
      list.push({
        id: 'estimate.create',
        name: 'Create Estimate / Quote',
        icon: 'estimates',
        route: '/document/edit?type=estimate',
        description: 'Formal quotation and bid',
      });
      list.push({
        id: 'invoice.create',
        name: 'Create Invoice',
        icon: 'new_invoice',
        route: '/document/edit',
        description: 'Issue progress or final invoice',
      });
      list.push({
        id: 'expenses',
        name: 'Add Expense',
        icon: 'expenses',
        route: '/expenses/add',
        description: 'Track materials & job costs',
      });
      list.push({
        id: 'customers',
        name: 'Clients',
        icon: 'customers',
        route: '/(tabs)/customers',
        description: 'Client ledger & accounts',
      });
      return list;
    }

    // Default / Freelancer / Consultant / Agency / Service
    list.push({
      id: 'invoice.create',
      name: 'Create Invoice',
      icon: 'new_invoice',
      route: '/document/edit',
      description: 'Standard tax invoice or cash bill',
    });
    if (enabledFeatures.includes('estimate.create')) {
      list.push({
        id: 'estimate.create',
        name: 'Create Estimate / Quote',
        icon: 'estimates',
        route: '/document/edit?type=estimate',
        description: 'Draft formal estimate or quote',
      });
    }
    list.push({
      id: 'customers',
      name: 'Clients & Customers',
      icon: 'customers',
      route: '/(tabs)/customers',
      description: 'Customer balances and history',
    });
    if (enabledFeatures.includes('expenses')) {
      list.push({
        id: 'expenses',
        name: 'Add Expense',
        icon: 'expenses',
        route: '/expenses/add',
        description: 'Record operating outlays',
      });
    }

    return list.slice(0, 4);
  }
}
