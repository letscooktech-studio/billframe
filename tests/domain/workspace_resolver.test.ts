/**
 * WORKSPACE RESOLVER TEST SUITE
 * Validates deterministic capability resolution, dependency graph traversal,
 * business type adaptation, and field visibility derivations.
 */

import { WorkspaceResolver } from '../../src/domain/workspace/WorkspaceResolver';
import {
  DEFAULT_WORKSPACE_PREFERENCES,
  WorkspacePreferences,
} from '../../src/domain/workspace/AdaptiveWorkspaceEngine';
import { BusinessProfile } from '../../src/domain/profile/types';

describe('WorkspaceResolver — Deterministic Business Personalization Engine', () => {
  const mockProfile: BusinessProfile = {
    id: 'test-biz-profile',
    name: 'Apex Solutions',
    country: 'India',
    country_iso2: 'IN',
    default_currency: 'INR',
    default_document_locale: 'en-IN',
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const createTestPrefs = (overrides?: Partial<WorkspacePreferences>): WorkspacePreferences => ({
    id: 'pref-1',
    businessProfileId: 'test-biz-profile',
    ...DEFAULT_WORKSPACE_PREFERENCES,
    ...overrides,
  });

  describe('1. Dependency Graph Resolution', () => {
    it('resolves direct dependencies for payments', () => {
      const resolved = WorkspaceResolver.resolveDependencies(['payments']);
      expect(resolved).toContain('payments');
      expect(resolved).toContain('invoice.create');
      expect(resolved).toContain('moneyEngine');
      expect(resolved).toContain('balanceEngine');
    });

    it('resolves transitive dependencies for receipts', () => {
      const resolved = WorkspaceResolver.resolveDependencies(['receipts']);
      expect(resolved).toContain('receipts');
      expect(resolved).toContain('payments');
      expect(resolved).toContain('invoice.create');
      expect(resolved).toContain('moneyEngine');
    });

    it('resolves Quick Bill dependencies correctly', () => {
      const resolved = WorkspaceResolver.resolveDependencies(['quick_bill']);
      expect(resolved).toContain('quick_bill');
      expect(resolved).toContain('business_profile');
      expect(resolved).toContain('moneyEngine');
      expect(resolved).toContain('documentCalculator');
      expect(resolved).toContain('payment.record');
    });
  });

  describe('2. Business Type Specialization', () => {
    it('configures Retail business type with Quick Bill priority and items', () => {
      const retailPrefs = createTestPrefs({
        businessType: 'retail',
        salesType: 'products',
        trackInventory: true,
      });

      const config = WorkspaceResolver.resolve(mockProfile, retailPrefs);

      expect(config.businessType).toBe('retail');
      expect(config.quickActions[0].id).toBe('quick_bill');
      expect(config.quickActions[0].route).toBe('/quick-bill');
      expect(config.documentTypes).toContain('invoice');
    });

    it('configures Contractor business type with Estimate and Jobs focus', () => {
      const contractorPrefs = createTestPrefs({
        businessType: 'contractor',
        trackJobs: true,
      });

      const config = WorkspaceResolver.resolve(mockProfile, contractorPrefs);

      expect(config.businessType).toBe('contractor');
      expect(config.quickActions[0].id).toBe('estimate.create');
      expect(config.quickActions[0].route).toBe('/document/edit?type=estimate');
      expect(config.fieldVisibility.showJobField).toBe(true);
      expect(config.documentTypes).toContain('estimate');
      expect(config.documentTypes).toContain('invoice');
    });

    it('configures Freelancer business type with services and invoices focus', () => {
      const freelancerPrefs = createTestPrefs({
        businessType: 'freelancer',
        salesType: 'services',
        trackInventory: false,
        trackJobs: false,
      });

      const config = WorkspaceResolver.resolve(mockProfile, freelancerPrefs);

      expect(config.businessType).toBe('freelancer');
      expect(config.quickActions[0].id).toBe('invoice.create');
      expect(config.quickActions[0].route).toBe('/document/edit');
      expect(config.fieldVisibility.showJobField).toBe(false);
      expect(config.fieldVisibility.taxCodeLabel).toBe('SAC');
    });
  });

  describe('3. Operational Field Visibility Derivation', () => {
    it('activates GST/Tax fields when registered', () => {
      const gstPrefs = createTestPrefs({
        isGstRegistered: true,
      });

      const config = WorkspaceResolver.resolve(mockProfile, gstPrefs);
      expect(config.fieldVisibility.showGstFields).toBe(true);
    });

    it('collapses GST/Tax fields when not registered', () => {
      const nonGstPrefs = createTestPrefs({
        isGstRegistered: false,
      });

      const config = WorkspaceResolver.resolve(mockProfile, nonGstPrefs);
      expect(config.fieldVisibility.showGstFields).toBe(false);
    });

    it('exposes deposit/partial payment fields when partial payments are frequent', () => {
      const partialPrefs = createTestPrefs({
        partialPayments: 'often',
      });

      const config = WorkspaceResolver.resolve(mockProfile, partialPrefs);
      expect(config.fieldVisibility.showDepositField).toBe(true);
    });
  });

  describe('4. Navigation and Core Widgets', () => {
    it('always provides standard 4-tab bottom navigation', () => {
      const config = WorkspaceResolver.resolve(mockProfile, createTestPrefs());
      expect(config.bottomNavigation).toHaveLength(4);
      expect(config.bottomNavigation.map((n) => n.id)).toEqual([
        'tab_home',
        'tab_documents',
        'tab_customers',
        'tab_more',
      ]);
    });

    it('includes core dashboard widgets and conditionally includes expenses', () => {
      const prefsWithExpenses = createTestPrefs({
        primaryModules: ['invoice.create', 'expenses'],
      });
      const config = WorkspaceResolver.resolve(mockProfile, prefsWithExpenses);
      expect(config.dashboardWidgets).toContain('metrics_summary');
      expect(config.dashboardWidgets).toContain('quick_actions');
      expect(config.dashboardWidgets).toContain('recent_documents');
      expect(config.dashboardWidgets).toContain('expenses_summary');
    });
  });
});
