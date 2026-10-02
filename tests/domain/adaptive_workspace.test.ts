/**
 * ADAPTIVE WORKSPACE ENGINE & FEATURE REGISTRY TESTS
 * Verifies deterministic scoring, business type presets, feature search,
 * field visibility derivation, layout locking, and local usage signals.
 */

import {
  AdaptiveWorkspaceEngine,
  WorkspacePreferences,
  DEFAULT_WORKSPACE_PREFERENCES,
  FeatureUsageRecord,
} from '../../src/domain/workspace/AdaptiveWorkspaceEngine';
import { FeatureRegistry } from '../../src/domain/features/FeatureRegistry';

describe('FeatureRegistry Tests', () => {
  it('contains all canonical Billframe capabilities', () => {
    const all = FeatureRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(18);

    const invoiceCap = FeatureRegistry.getById('create_invoice');
    expect(invoiceCap).toBeDefined();
    expect(invoiceCap?.availability).toBe('ready');

    const gstCap = FeatureRegistry.getById('gst_filing');
    expect(gstCap).toBeDefined();
    expect(gstCap?.availability).toBe('roadmap');
  });

  it('searches features by keyword, name, and module', () => {
    const invoiceResults = FeatureRegistry.search('invoice');
    expect(invoiceResults.some((f) => f.id === 'create_invoice')).toBe(true);

    const hsnResults = FeatureRegistry.search('hsn');
    expect(hsnResults.some((f) => f.id === 'gst_filing')).toBe(true);

    const barcodeResults = FeatureRegistry.search('barcode');
    expect(barcodeResults.some((f) => f.id === 'barcode_scanner')).toBe(true);

    const emptyResults = FeatureRegistry.search('');
    expect(emptyResults.length).toBe(FeatureRegistry.getAll().length);
  });

  it('strictly isolates production search to ready features only', () => {
    // Production mode search (includeRoadmap = false)
    const prodHsn = FeatureRegistry.search('hsn', { includeRoadmap: false });
    expect(prodHsn.length).toBe(0);

    const prodBarcode = FeatureRegistry.search('barcode', { includeRoadmap: false });
    expect(prodBarcode.length).toBe(0);

    const prodInvoice = FeatureRegistry.search('invoice', { includeRoadmap: false });
    expect(prodInvoice.some((f) => f.id === 'create_invoice')).toBe(true);
    expect(prodInvoice.every((f) => f.availability === 'ready')).toBe(true);

    const readyOnly = FeatureRegistry.getReadyFeatures();
    expect(readyOnly.every((f) => f.availability === 'ready')).toBe(true);

    const roadmapOnly = FeatureRegistry.getRoadmapFeatures();
    expect(roadmapOnly.every((f) => f.availability === 'roadmap')).toBe(true);
  });
});

describe('AdaptiveWorkspaceEngine Tests', () => {
  const basePrefs: WorkspacePreferences = {
    id: 'pref_1',
    businessProfileId: 'bp_1',
    ...DEFAULT_WORKSPACE_PREFERENCES,
  };

  it('prioritizes contractor actions for contractor business type', () => {
    const contractorPrefs: WorkspacePreferences = {
      ...basePrefs,
      businessType: 'contractor',
      salesType: 'services',
      trackJobs: true,
    };

    const actions = AdaptiveWorkspaceEngine.getPrioritizedQuickActions(contractorPrefs, [], 5);
    const actionIds = actions.map((a) => a.id);

    expect(actionIds).toContain('create_estimate');
    expect(actionIds).toContain('create_invoice');
    expect(actionIds).toContain('expenses');
    expect(actionIds).not.toContain('barcode_scanner');
  });

  it('prioritizes retail actions for retail store profile', () => {
    const retailPrefs: WorkspacePreferences = {
      ...basePrefs,
      businessType: 'retail',
      salesType: 'products',
      trackInventory: true,
    };

    const actions = AdaptiveWorkspaceEngine.getPrioritizedQuickActions(retailPrefs, [], 5);
    const actionIds = actions.map((a) => a.id);

    expect(actionIds).toContain('quick_bill');
    expect(actionIds).toContain('customers');
    expect(actionIds).not.toContain('technician_timesheets');
  });

  it('adapts ranking based on local usage signals', () => {
    const freelancerPrefs: WorkspacePreferences = {
      ...basePrefs,
      businessType: 'freelancer',
      adaptiveEnabled: true,
      layoutLocked: false,
    };

    // Simulate heavy usage of expenses
    const usage: FeatureUsageRecord[] = [
      {
        featureKey: 'expenses',
        useCount: 40,
        lastUsedAt: Date.now(),
        dismissCount: 0,
      },
    ];

    const scored = AdaptiveWorkspaceEngine.scoreCapabilities(freelancerPrefs, usage);
    const expenseScore = scored.find((s) => s.capability.id === 'expenses')?.score || 0;
    const baseExpenseScore = AdaptiveWorkspaceEngine.scoreCapabilities(freelancerPrefs, [])
      .find((s) => s.capability.id === 'expenses')?.score || 0;

    expect(expenseScore).toBeGreaterThan(baseExpenseScore);
  });

  it('penalizes features with dismiss signals', () => {
    const prefs: WorkspacePreferences = {
      ...basePrefs,
      adaptiveEnabled: true,
      layoutLocked: false,
    };

    const usageWithDismiss: FeatureUsageRecord[] = [
      {
        featureKey: 'quick_bill',
        useCount: 1,
        lastUsedAt: Date.now(),
        dismissCount: 3,
      },
    ];

    const normalScore = AdaptiveWorkspaceEngine.scoreCapabilities(prefs, [])
      .find((s) => s.capability.id === 'quick_bill')?.score || 0;

    const dismissedScore = AdaptiveWorkspaceEngine.scoreCapabilities(prefs, usageWithDismiss)
      .find((s) => s.capability.id === 'quick_bill')?.score || 0;

    expect(dismissedScore).toBeLessThan(normalScore);
  });

  it('strictly respects layout locked setting and ignores adaptive reordering', () => {
    const lockedPrefs: WorkspacePreferences = {
      ...basePrefs,
      businessType: 'contractor',
      primaryModules: ['create_estimate', 'create_invoice', 'expenses'],
      adaptiveEnabled: true,
      layoutLocked: true, // USER LOCKED LAYOUT
    };

    // Heavy usage on another module
    const usage: FeatureUsageRecord[] = [
      {
        featureKey: 'backup_export',
        useCount: 999,
        lastUsedAt: Date.now(),
        dismissCount: 0,
      },
    ];

    const actions = AdaptiveWorkspaceEngine.getPrioritizedQuickActions(lockedPrefs, usage, 3);
    const actionIds = actions.map((a) => a.id);

    // Exact explicit preset preserved, not hijacked by high usage
    expect(actionIds).toEqual(['create_estimate', 'create_invoice', 'expenses']);
  });

  it('derives field visibility defaults based on profile', () => {
    const gstServicePrefs: WorkspacePreferences = {
      ...basePrefs,
      isGstRegistered: true,
      salesType: 'services',
      partialPayments: 'often',
    };

    const defaults = AdaptiveWorkspaceEngine.getFieldVisibilityDefaults(gstServicePrefs);
    expect(defaults.showGstFields).toBe(true);
    expect(defaults.taxCodeLabel).toBe('SAC');
    expect(defaults.showShippingAddress).toBe(false);
    expect(defaults.showDepositField).toBe(true);

    const nonGstProductPrefs: WorkspacePreferences = {
      ...basePrefs,
      isGstRegistered: false,
      salesType: 'products',
      partialPayments: 'rarely',
    };

    const productDefaults = AdaptiveWorkspaceEngine.getFieldVisibilityDefaults(nonGstProductPrefs);
    expect(productDefaults.showGstFields).toBe(false);
    expect(productDefaults.taxCodeLabel).toBe('HSN');
    expect(productDefaults.showShippingAddress).toBe(true);
    expect(productDefaults.showDepositField).toBe(false);
  });
});
