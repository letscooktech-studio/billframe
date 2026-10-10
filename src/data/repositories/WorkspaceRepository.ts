/**
 * WORKSPACE REPOSITORY
 * Persistent store for adaptive workspace preferences, module selections,
 * layout locks, and onboarding completion status.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { BusinessType } from '../../domain/features/FeatureRegistry';
import {
  WorkspacePreferences,
  DEFAULT_WORKSPACE_PREFERENCES,
  BUSINESS_TYPE_PRESET_ACTIONS,
} from '../../domain/workspace/AdaptiveWorkspaceEngine';

export class WorkspaceRepository {
  /**
   * Fetches active business profile ID or a default fallback.
   */
  private static async getActiveProfileIdAsync(): Promise<string> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const profile = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM business_profiles WHERE is_active = 1 LIMIT 1;'
      );
      return profile?.id || 'default-profile';
    } catch {
      return 'default-profile';
    }
  }

  /**
   * Retrieves workspace preferences for the active business profile.
   */
  public static async getPreferencesAsync(
    targetProfileId?: string
  ): Promise<WorkspacePreferences> {
    try {
      const db = await DatabaseManager.getDatabaseAsync();
      const profileId = targetProfileId || (await this.getActiveProfileIdAsync());

      const row = await db.getFirstAsync<{
        id: string;
        business_profile_id: string;
        business_type: string;
        sales_type: string;
        is_gst_registered: number;
        track_inventory: number;
        track_jobs: number;
        partial_payments: string;
        recurring_billing: number;
        adaptive_enabled: number;
        layout_locked: number;
        primary_modules_json: string;
        onboarding_completed: number;
        onboarding_version?: number;
        onboarding_completed_at?: number;
        profile_version?: number;
        workspace_config_version?: number;
        geography_dataset_version?: string;
        primary_intent?: string;
        favorite_document_types_json?: string;
        selected_document_families_json?: string;
        onboarding_state?: string;
        onboarding_step?: number;
      }>(
        'SELECT * FROM workspace_preferences WHERE business_profile_id = ? LIMIT 1;',
        [profileId]
      );

      if (!row) {
        return {
          id: `pref-${profileId}`,
          businessProfileId: profileId,
          ...DEFAULT_WORKSPACE_PREFERENCES,
        };
      }

      let primaryModules: string[] = [];
      try {
        primaryModules = JSON.parse(row.primary_modules_json || '[]');
      } catch {
        primaryModules = DEFAULT_WORKSPACE_PREFERENCES.primaryModules;
      }

      let favoriteDocumentTypes: string[] = [];
      try {
        favoriteDocumentTypes = JSON.parse(row.favorite_document_types_json || '[]');
      } catch {
        favoriteDocumentTypes = [];
      }

      let selectedDocumentFamilies: string[] = [];
      try {
        selectedDocumentFamilies = JSON.parse(row.selected_document_families_json || '[]');
      } catch {
        selectedDocumentFamilies = [];
      }

      return {
        id: row.id,
        businessProfileId: row.business_profile_id,
        businessType: (row.business_type as BusinessType) || 'other',
        salesType: (row.sales_type as 'services' | 'products' | 'both') || 'both',
        isGstRegistered: row.is_gst_registered === 1,
        trackInventory: row.track_inventory === 1,
        trackJobs: row.track_jobs === 1,
        partialPayments: (row.partial_payments as 'often' | 'sometimes' | 'rarely') || 'sometimes',
        recurringBilling: row.recurring_billing === 1,
        adaptiveEnabled: row.adaptive_enabled === 1,
        layoutLocked: row.layout_locked === 1,
        primaryModules,
        onboardingCompleted: row.onboarding_completed === 1,
        onboardingVersion: row.onboarding_version ?? 3,
        onboardingCompletedAt: row.onboarding_completed_at ?? null,
        profileVersion: row.profile_version ?? 1,
        workspaceConfigVersion: row.workspace_config_version ?? 1,
        geographyDatasetVersion: row.geography_dataset_version ?? '2026.01',
        primaryIntent: (row.primary_intent as any) || 'business_documents',
        favoriteDocumentTypes,
        selectedDocumentFamilies,
        onboardingState: (row.onboarding_state as any) || (row.onboarding_completed === 1 ? 'completed' : 'not_started'),
        onboardingStep: row.onboarding_step ?? 1,
      };
    } catch {
      return {
        id: 'fallback-pref',
        businessProfileId: 'default-profile',
        ...DEFAULT_WORKSPACE_PREFERENCES,
      };
    }
  }

  /**
   * Saves or updates workspace preferences.
   */
  public static async savePreferencesAsync(
    prefs: Partial<WorkspacePreferences> & { businessProfileId?: string }
  ): Promise<WorkspacePreferences> {
    const db = await DatabaseManager.getDatabaseAsync();
    const profileId = prefs.businessProfileId || (await this.getActiveProfileIdAsync());
    const existing = await this.getPreferencesAsync(profileId);

    const merged: WorkspacePreferences = {
      ...existing,
      ...prefs,
      businessProfileId: profileId,
    };

    const now = Date.now();
    const primaryJson = JSON.stringify(merged.primaryModules || []);
    const favoritesJson = JSON.stringify(merged.favoriteDocumentTypes || []);
    const familiesJson = JSON.stringify(merged.selectedDocumentFamilies || []);

    await db.runAsync(
      `INSERT INTO workspace_preferences (
         id, business_profile_id, business_type, sales_type,
         is_gst_registered, track_inventory, track_jobs,
         partial_payments, recurring_billing, adaptive_enabled,
         layout_locked, primary_modules_json, onboarding_completed,
         onboarding_version, onboarding_completed_at, profile_version,
         workspace_config_version, geography_dataset_version,
         primary_intent, favorite_document_types_json, selected_document_families_json,
         onboarding_state, onboarding_step,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         business_type = excluded.business_type,
         sales_type = excluded.sales_type,
         is_gst_registered = excluded.is_gst_registered,
         track_inventory = excluded.track_inventory,
         track_jobs = excluded.track_jobs,
         partial_payments = excluded.partial_payments,
         recurring_billing = excluded.recurring_billing,
         adaptive_enabled = excluded.adaptive_enabled,
         layout_locked = excluded.layout_locked,
         primary_modules_json = excluded.primary_modules_json,
         onboarding_completed = excluded.onboarding_completed,
         onboarding_version = excluded.onboarding_version,
         onboarding_completed_at = excluded.onboarding_completed_at,
         profile_version = excluded.profile_version,
         workspace_config_version = excluded.workspace_config_version,
         geography_dataset_version = excluded.geography_dataset_version,
         primary_intent = excluded.primary_intent,
         favorite_document_types_json = excluded.favorite_document_types_json,
         selected_document_families_json = excluded.selected_document_families_json,
         onboarding_state = excluded.onboarding_state,
         onboarding_step = excluded.onboarding_step,
         updated_at = excluded.updated_at;`,
      [
        merged.id,
        merged.businessProfileId,
        merged.businessType,
        merged.salesType,
        merged.isGstRegistered ? 1 : 0,
        merged.trackInventory ? 1 : 0,
        merged.trackJobs ? 1 : 0,
        merged.partialPayments,
        merged.recurringBilling ? 1 : 0,
        merged.adaptiveEnabled ? 1 : 0,
        merged.layoutLocked ? 1 : 0,
        primaryJson,
        merged.onboardingCompleted ? 1 : 0,
        merged.onboardingVersion ?? 3,
        merged.onboardingCompletedAt ?? (merged.onboardingCompleted ? now : null),
        merged.profileVersion ?? 1,
        merged.workspaceConfigVersion ?? 1,
        merged.geographyDatasetVersion ?? '2026.01',
        merged.primaryIntent || 'business_documents',
        favoritesJson,
        familiesJson,
        merged.onboardingState || (merged.onboardingCompleted ? 'completed' : 'not_started'),
        merged.onboardingStep ?? 1,
        now,
        now,
      ]
    );

    return merged;
  }

  /**
   * Resumes or updates in-progress onboarding state atomically.
   */
  public static async updateOnboardingProgressAsync(
    progress: Partial<WorkspacePreferences>,
    targetProfileId?: string
  ): Promise<WorkspacePreferences> {
    return this.savePreferencesAsync({
      ...progress,
      businessProfileId: targetProfileId,
      onboardingState: 'in_progress',
    });
  }

  /**
   * Resets workspace preferences back to defaults or a specific business type preset.
   */
  public static async resetPreferencesAsync(
    businessProfileId: string,
    businessType: BusinessType = 'other'
  ): Promise<WorkspacePreferences> {
    const presetModules = BUSINESS_TYPE_PRESET_ACTIONS[businessType] || BUSINESS_TYPE_PRESET_ACTIONS.other;

    return this.savePreferencesAsync({
      businessProfileId,
      businessType,
      primaryModules: presetModules,
      adaptiveEnabled: true,
      layoutLocked: false,
    });
  }

  /**
   * Checks whether the user has completed or dismissed initial onboarding.
   */
  public static async isOnboardingCompletedAsync(): Promise<boolean> {
    try {
      const prefs = await this.getPreferencesAsync();
      return prefs.onboardingCompleted;
    } catch {
      return false;
    }
  }

  /**
   * Marks onboarding completed.
   */
  public static async completeOnboardingAsync(
    prefs: Partial<WorkspacePreferences>
  ): Promise<WorkspacePreferences> {
    return this.savePreferencesAsync({
      ...prefs,
      onboardingCompleted: true,
    });
  }
}
