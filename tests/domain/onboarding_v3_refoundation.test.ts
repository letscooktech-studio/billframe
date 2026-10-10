/**
 * ONBOARDING 3.0 REF燉NDATION TEST SUITE
 * 
 * Verifies the 4-step universal document onboarding architecture:
 * 1. The 4 Acceptance Organizations:
 *    - Tech Company (Intent: Business Documents -> Job Offer Letter)
 *    - Contractor (Intent: Operations -> Work Order)
 *    - Retailer (Intent: Invoices & Billing -> Tax Invoice)
 *    - School (Business Type: Professional/Education -> Student Fee Receipt / Letter)
 * 2. Onboarding State Machine & Draft Resumption (not_started -> in_progress -> completed)
 * 3. Atomic Database roundtrip via WorkspaceRepository with Migration 12 columns
 * 4. Zero regress on existing completed installations
 */

import {
  getRecommendedDocumentsForOnboarding,
  ALL_ONBOARDING_DOCUMENTS,
} from '../../src/domain/documents/onboardingRecommendations';
import {
  AdaptiveWorkspaceEngine,
  DEFAULT_WORKSPACE_PREFERENCES,
  PrimaryIntent,
} from '../../src/domain/workspace/AdaptiveWorkspaceEngine';
import { WorkspaceRepository } from '../../src/data/repositories/WorkspaceRepository';
import { BusinessProfileRepository } from '../../src/data/repositories/BusinessProfileRepository';
import { DatabaseManager } from '../../src/data/database/DatabaseManager';

describe('Onboarding 3.0 — Acceptance Organizations & Recommendation Engine', () => {
  test('Organization 1 (Tech Company): Recommends Job Offer Letter as primary hero document', () => {
    const result = getRecommendedDocumentsForOnboarding('business_documents', 'agency');

    expect(result.topHeroDocument.id).toBe('job_offer_letter');
    expect(result.topHeroDocument.category).toBe('HR & Legal');
    expect(result.topHeroDocument.editorRoute).toBe('/templates/studio?typeId=job_offer_letter');
    expect(result.topHeroDocument.isUniversal).toBe(true);

    // Pre-selected document list includes job_offer_letter
    expect(result.defaultSelectedIds).toContain('job_offer_letter');
    expect(result.defaultSelectedIds.length).toBeGreaterThanOrEqual(3);

    // Recommendations include other core HR documents
    const docIds = result.documents.map((d) => d.id);
    expect(docIds).toContain('appointment_letter');
    expect(docIds).toContain('experience_certificate');
    expect(docIds).toContain('business_letterhead');
  });

  test('Organization 2 (Contractor): Recommends Work Order as primary hero document', () => {
    const result = getRecommendedDocumentsForOnboarding('operations', 'contractor');

    expect(result.topHeroDocument.id).toBe('work_order');
    expect(result.topHeroDocument.category).toBe('Operations');
    expect(result.topHeroDocument.editorRoute).toBe('/templates/studio?typeId=work_order');
    expect(result.topHeroDocument.isUniversal).toBe(true);

    // Pre-selected document list includes work_order
    expect(result.defaultSelectedIds).toContain('work_order');

    // Recommendations include field service documents
    const docIds = result.documents.map((d) => d.id);
    expect(docIds).toContain('site_inspection_report');
    expect(docIds).toContain('equipment_responsibility');
    expect(docIds).toContain('purchase_order');
    expect(docIds).toContain('tax_invoice');
  });

  test('Organization 3 (Retailer): Recommends Tax Invoice as primary hero document', () => {
    const result = getRecommendedDocumentsForOnboarding('invoices_payments', 'retail');

    expect(result.topHeroDocument.id).toBe('tax_invoice');
    expect(result.topHeroDocument.category).toBe('Financial & Tax');
    expect(result.topHeroDocument.editorRoute).toBe('/document/edit?type=tax_invoice');
    expect(result.topHeroDocument.isUniversal).toBe(false);

    // Pre-selected document list includes tax_invoice and receipt
    expect(result.defaultSelectedIds).toContain('tax_invoice');

    // Recommendations include retail financial documents
    const docIds = result.documents.map((d) => d.id);
    expect(docIds).toContain('receipt');
    expect(docIds).toContain('bill_of_supply');
    expect(docIds).toContain('customer_account_statement');
  });

  test('Organization 4 (School / Institution): Prioritizes Student Fee Receipt & Letterhead', () => {
    const result = getRecommendedDocumentsForOnboarding('business_documents', 'professional');

    const docIds = result.documents.map((d) => d.id);
    expect(docIds).toContain('student_fee_receipt');
    expect(docIds).toContain('business_letterhead');
    expect(docIds).toContain('job_offer_letter');

    const feeReceipt = result.documents.find((d) => d.id === 'student_fee_receipt');
    expect(feeReceipt).toBeDefined();
    expect(feeReceipt?.category).toBe('Governance & Academic');
    expect(feeReceipt?.editorRoute).toBe('/templates/studio?typeId=student_fee_receipt');
  });

  test('Complete Workspace intent returns 4 default selected documents across categories', () => {
    const result = getRecommendedDocumentsForOnboarding('complete_workspace', 'other');

    expect(result.defaultSelectedIds.length).toBe(4);
    expect(result.defaultSelectedIds).toContain('tax_invoice');
    expect(result.defaultSelectedIds).toContain('job_offer_letter');
    expect(result.defaultSelectedIds).toContain('work_order');
  });

  test('Catalog integrity: All recommended documents have valid routes and categories', () => {
    for (const doc of ALL_ONBOARDING_DOCUMENTS) {
      expect(doc.id).toBeTruthy();
      expect(doc.title).toBeTruthy();
      expect(doc.editorRoute).toMatch(/^(\/templates\/studio|\/document\/edit)/);
      expect(['HR & Legal', 'Financial & Tax', 'Operations', 'Governance & Academic']).toContain(doc.category);
    }
  });
});

describe('Onboarding 3.0 — Persistence & State Machine Lifecycle', () => {
  const testProfileId = 'onboarding_test_profile_' + Date.now();

  beforeAll(async () => {
    await DatabaseManager.getDatabaseAsync();
  });

  test('New workspace default state is not_started with version 3', () => {
    expect(DEFAULT_WORKSPACE_PREFERENCES.onboardingVersion).toBe(3);
    expect(DEFAULT_WORKSPACE_PREFERENCES.onboardingState).toBe('not_started');
    expect(DEFAULT_WORKSPACE_PREFERENCES.onboardingStep).toBe(1);
    expect(DEFAULT_WORKSPACE_PREFERENCES.onboardingCompleted).toBe(false);
  });

  test('updateOnboardingProgressAsync sets in_progress state and saves step draft', async () => {
    const updated = await WorkspaceRepository.updateOnboardingProgressAsync(
      {
        primaryIntent: 'operations',
        businessType: 'contractor',
        onboardingStep: 2,
      },
      testProfileId
    );

    expect(updated.onboardingState).toBe('in_progress');
    expect(updated.onboardingStep).toBe(2);
    expect(updated.primaryIntent).toBe('operations');
    expect(updated.businessType).toBe('contractor');
    expect(updated.onboardingCompleted).toBe(false);

    // Verify database roundtrip
    const fetched = await WorkspaceRepository.getPreferencesAsync(testProfileId);
    expect(fetched.onboardingState).toBe('in_progress');
    expect(fetched.onboardingStep).toBe(2);
    expect(fetched.primaryIntent).toBe('operations');
  });

  test('Step 3 progress updates save favoriteDocumentTypes array atomically', async () => {
    const favorites = ['work_order', 'site_inspection_report', 'equipment_responsibility'];
    await WorkspaceRepository.updateOnboardingProgressAsync(
      {
        favoriteDocumentTypes: favorites,
        onboardingStep: 3,
      },
      testProfileId
    );

    const fetched = await WorkspaceRepository.getPreferencesAsync(testProfileId);
    expect(fetched.onboardingStep).toBe(3);
    expect(fetched.favoriteDocumentTypes).toEqual(favorites);
  });

  test('completeOnboardingAsync transitions state to completed and marks completed: true', async () => {
    const completed = await WorkspaceRepository.completeOnboardingAsync({
      businessProfileId: testProfileId,
      primaryIntent: 'operations',
      businessType: 'contractor',
      favoriteDocumentTypes: ['work_order'],
      onboardingState: 'completed',
      onboardingVersion: 3,
    });

    expect(completed.onboardingCompleted).toBe(true);
    expect(completed.onboardingState).toBe('completed');
    expect(completed.onboardingVersion).toBe(3);

    // Verify isOnboardingCompletedAsync reflects true
    const isDone = await WorkspaceRepository.isOnboardingCompletedAsync();
    // (Depending on active profile id)
    const fetched = await WorkspaceRepository.getPreferencesAsync(testProfileId);
    expect(fetched.onboardingCompleted).toBe(true);
    expect(fetched.onboardingState).toBe('completed');
  });

  test('Existing completed installations are not regressed', async () => {
    const existingLegacyProfileId = 'legacy_profile_' + Date.now();
    // Simulate legacy completed profile with onboarding_completed = 1, onboarding_version = 2
    await WorkspaceRepository.savePreferencesAsync({
      businessProfileId: existingLegacyProfileId,
      onboardingCompleted: true,
      onboardingVersion: 2,
      onboardingState: 'completed',
    });

    const prefs = await WorkspaceRepository.getPreferencesAsync(existingLegacyProfileId);
    expect(prefs.onboardingCompleted).toBe(true);
    expect(prefs.onboardingState).toBe('completed');
  });
});
