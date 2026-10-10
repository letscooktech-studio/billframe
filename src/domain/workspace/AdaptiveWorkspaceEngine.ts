/**
 * ADAPTIVE WORKSPACE ENGINE
 * Local, deterministic preference and layout prioritization engine for Billframe.
 *
 * Principles:
 * 1. 100% Offline & Private — zero cloud inference or tracking.
 * 2. Deterministic scoring — predictable, reproducible, debuggable.
 * 3. Non-destructive — never hides capabilities or makes them inaccessible.
 * 4. User-overrideable — respects layout locks and explicit user choices.
 */

import {
  BusinessType,
  FeatureCapability,
  FeatureRegistry,
  FEATURE_REGISTRY,
} from '../features/FeatureRegistry';

export type { BusinessType };

export type PrimaryIntent =
  | 'business_documents'
  | 'invoices_payments'
  | 'operations'
  | 'complete_workspace';

export type OnboardingState = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface WorkspacePreferences {
  id: string;
  businessProfileId: string;
  businessType: BusinessType;
  salesType: 'services' | 'products' | 'both';
  isGstRegistered: boolean;
  trackInventory: boolean;
  trackJobs: boolean;
  partialPayments: 'often' | 'sometimes' | 'rarely';
  recurringBilling: boolean;
  adaptiveEnabled: boolean;
  layoutLocked: boolean;
  primaryModules: string[];
  onboardingCompleted: boolean;
  onboardingVersion?: number;
  onboardingCompletedAt?: number | null;
  profileVersion?: number;
  workspaceConfigVersion?: number;
  geographyDatasetVersion?: string;

  // ── Onboarding 3.0 Extensions ──
  primaryIntent?: PrimaryIntent;
  favoriteDocumentTypes?: string[];
  selectedDocumentFamilies?: string[];
  onboardingStep?: number;
  onboardingState?: OnboardingState;
}

export interface FeatureUsageRecord {
  featureKey: string;
  useCount: number;
  lastUsedAt: number;
  dismissCount: number;
  businessId?: string;
}

export interface FieldVisibilityDefaults {
  showGstFields: boolean;
  taxCodeLabel: 'SAC' | 'HSN' | 'Tax Code';
  showShippingAddress: boolean;
  showJobField: boolean;
  showDepositField: boolean;
  showPoNumber: boolean;
}

export const DEFAULT_WORKSPACE_PREFERENCES: Omit<WorkspacePreferences, 'id' | 'businessProfileId'> = {
  businessType: 'other',
  salesType: 'both',
  isGstRegistered: false,
  trackInventory: false,
  trackJobs: false,
  partialPayments: 'sometimes',
  recurringBilling: false,
  adaptiveEnabled: true,
  layoutLocked: false,
  primaryModules: [],
  onboardingCompleted: false,
  onboardingVersion: 3,
  onboardingCompletedAt: null,
  profileVersion: 1,
  workspaceConfigVersion: 1,
  geographyDatasetVersion: '2026.01',
  primaryIntent: 'business_documents',
  favoriteDocumentTypes: [],
  selectedDocumentFamilies: [],
  onboardingStep: 1,
  onboardingState: 'not_started',
};

export const BUSINESS_TYPE_PRESET_ACTIONS: Record<BusinessType, string[]> = {
  freelancer: ['create_invoice', 'create_estimate', 'collections_workspace', 'expenses', 'catalog_items', 'reports'],
  contractor: ['create_estimate', 'create_invoice', 'expenses', 'collections_workspace', 'catalog_items', 'reports'],
  retail: ['quick_bill', 'create_invoice', 'catalog_items', 'customers', 'reports', 'expenses'],
  service: ['create_invoice', 'create_estimate', 'customers', 'collections_workspace', 'expenses', 'catalog_items'],
  agency: ['create_estimate', 'create_invoice', 'customers', 'collections_workspace', 'expenses', 'reports'],
  wholesale: ['create_invoice', 'quick_bill', 'catalog_items', 'customers', 'collections_workspace', 'reports'],
  professional: ['create_invoice', 'create_estimate', 'customers', 'collections_workspace', 'expenses', 'reports'],
  other: ['create_invoice', 'quick_bill', 'customers', 'expenses', 'catalog_items', 'reports'],
};

export class AdaptiveWorkspaceEngine {
  /**
   * Deterministically calculates ranking scores for all features.
   */
  public static scoreCapabilities(
    preferences: WorkspacePreferences,
    usageRecords: FeatureUsageRecord[] = [],
    now: number = Date.now()
  ): Array<{ capability: FeatureCapability; score: number }> {
    const usageMap = new Map<string, FeatureUsageRecord>();
    for (const u of usageRecords) {
      usageMap.set(u.featureKey, u);
    }

    const presetActions = BUSINESS_TYPE_PRESET_ACTIONS[preferences.businessType] || BUSINESS_TYPE_PRESET_ACTIONS.other;
    const explicitSet = new Set(
      preferences.primaryModules && preferences.primaryModules.length > 0
        ? preferences.primaryModules
        : presetActions
    );

    return FEATURE_REGISTRY.map((cap) => {
      let score = 0;

      // 1. Base Priority: 0 to 100
      score += cap.priority * 0.2; // max 20

      // 2. Business Type Relevance: 0 to 100
      const relevance = cap.businessRelevance[preferences.businessType] ?? 50;
      score += relevance * 0.4; // max 40

      // 3. Explicit User Preference / Presets: +100
      if (explicitSet.has(cap.id)) {
        score += 100;
      }

      // 4. Sales Type Alignment
      if (preferences.salesType === 'services') {
        if (cap.module === 'inventory') score -= 40;
        if (cap.id === 'technician_timesheets' || cap.id === 'jobs_management') score += 15;
      } else if (preferences.salesType === 'products') {
        if (cap.module === 'jobs' || cap.id === 'technician_timesheets') score -= 40;
        if (cap.module === 'inventory') score += 20;
      }

      // 5. GST alignment
      if (preferences.isGstRegistered && cap.module === 'gst') {
        score += 25;
      }

      // 6. Local Usage Feedback (only if adaptive is enabled and layout is not locked)
      if (preferences.adaptiveEnabled && !preferences.layoutLocked) {
        const usage = usageMap.get(cap.id);
        if (usage) {
          // Frequency bonus: up to +50
          score += Math.min(usage.useCount * 5, 50);

          // Recency bonus: +15 if used in the last 7 days
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (now - usage.lastUsedAt < sevenDaysMs) {
            score += 15;
          }

          // Dismissal penalty: -20 per dismissal
          score -= usage.dismissCount * 20;
        }
      }

      return { capability: cap, score };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Returns prioritized quick actions for Home screen banner / action bar.
   * If layout is locked or adaptive is disabled, strictly respects explicit presets.
   */
  public static getPrioritizedQuickActions(
    preferences: WorkspacePreferences,
    usageRecords: FeatureUsageRecord[] = [],
    limit: number = 4
  ): FeatureCapability[] {
    if (preferences.layoutLocked || !preferences.adaptiveEnabled) {
      const explicitIds = preferences.primaryModules.length > 0
        ? preferences.primaryModules
        : (BUSINESS_TYPE_PRESET_ACTIONS[preferences.businessType] || BUSINESS_TYPE_PRESET_ACTIONS.other);

      const resolved = explicitIds
        .map((id) => FeatureRegistry.getById(id))
        .filter((c): c is FeatureCapability => Boolean(c && c.availability === 'ready' && c.route));

      return resolved.slice(0, limit);
    }

    const scored = this.scoreCapabilities(preferences, usageRecords)
      .filter((s) => s.capability.availability === 'ready' && Boolean(s.capability.route));
    return scored.slice(0, limit).map((s) => s.capability);
  }

  /**
   * Derives smart defaults for form field visibility based on business profile.
   * Advanced fields are collapsed by default when not relevant to avoid cognitive noise,
   * but can always be expanded by the user in the form.
   */
  public static getFieldVisibilityDefaults(
    preferences: WorkspacePreferences
  ): FieldVisibilityDefaults {
    return {
      showGstFields: preferences.isGstRegistered,
      taxCodeLabel: preferences.salesType === 'services' ? 'SAC' : 'HSN',
      showShippingAddress: preferences.salesType !== 'services',
      showJobField: preferences.trackJobs || preferences.businessType === 'contractor' || preferences.businessType === 'service',
      showDepositField: preferences.partialPayments !== 'rarely',
      showPoNumber: preferences.businessType === 'contractor' || preferences.businessType === 'wholesale' || preferences.businessType === 'agency',
    };
  }
}
