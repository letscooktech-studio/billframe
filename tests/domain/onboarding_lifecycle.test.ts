/**
 * ONBOARDING LIFECYCLE & PERSISTENCE TEST SUITE
 * Validates compulsory first-launch detection, geography integration,
 * profile synchronization, and persistent completion gates.
 */

import { DatabaseManager } from '../../src/data/database/DatabaseManager';
import { WorkspaceRepository } from '../../src/data/repositories/WorkspaceRepository';
import { BusinessProfileRepository } from '../../src/data/repositories/BusinessProfileRepository';
import { normalizePhoneNumber } from '../../src/data/geography/phone';
import { getCountryFlagEmoji } from '../../src/data/geography/flags';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Onboarding Lifecycle & Geography Persistence', () => {
  beforeEach(async () => {
    const mockDb = getMockDb();
    mockDb.reset();
    await DatabaseManager.initDatabaseAsync(mockDb as any);
  });

  describe('1. First-Launch Compulsory State', () => {
    it('reports onboarding as not completed on fresh initialization', async () => {
      const isCompleted = await WorkspaceRepository.isOnboardingCompletedAsync();
      expect(isCompleted).toBe(false);
    });

    it('persists completion status atomically across queries', async () => {
      const initial = await WorkspaceRepository.isOnboardingCompletedAsync();
      expect(initial).toBe(false);

      const active = await BusinessProfileRepository.getActiveProfile();
      const profileId = active?.id || 'default_business_profile';

      await WorkspaceRepository.completeOnboardingAsync({
        businessProfileId: profileId,
        businessType: 'retail',
        salesType: 'products',
        isGstRegistered: true,
        trackInventory: true,
      });

      const updated = await WorkspaceRepository.isOnboardingCompletedAsync();
      expect(updated).toBe(true);

      const prefs = await WorkspaceRepository.getPreferencesAsync(profileId);
      expect(prefs.onboardingCompleted).toBe(true);
      expect(prefs.businessType).toBe('retail');
      expect(prefs.trackInventory).toBe(true);
    });
  });

  describe('2. Geography and Business Profile Integration', () => {
    it('normalizes phone number with country ISO2 context', () => {
      const resultIndia = normalizePhoneNumber('9876543210', 'IN');
      expect(resultIndia.isValid).toBe(true);
      expect(resultIndia.callingCode).toBe('+91');
      expect(resultIndia.e164).toBe('+919876543210');

      const resultUS = normalizePhoneNumber('4155552671', 'US');
      expect(resultUS.isValid).toBe(true);
      expect(resultUS.callingCode).toBe('+1');
      expect(resultUS.e164).toBe('+14155552671');
    });

    it('generates deterministic vector flag emojis without network dependencies', () => {
      expect(getCountryFlagEmoji('IN')).toBe('🇮🇳');
      expect(getCountryFlagEmoji('US')).toBe('🇺🇸');
      expect(getCountryFlagEmoji('GB')).toBe('🇬🇧');
      expect(getCountryFlagEmoji('AE')).toBe('🇦🇪');
    });

    it('updates business profile with normalized geography and contact data', async () => {
      const active = await BusinessProfileRepository.getActiveProfile();
      const profileId = active?.id || 'default_business_profile';

      await BusinessProfileRepository.updateProfile({
        id: profileId,
        name: 'Apex Engineering Ltd',
        legal_name: 'Apex Engineering Private Limited',
        country: 'India',
        country_iso2: 'IN',
        subdivision_code: 'IN-MH',
        subdivision_name: 'Maharashtra',
        phone_country_iso2: 'IN',
        phone_e164: '+919876543210',
        phone: '098765 43210',
        default_currency: 'INR',
        tax_id: '27AAAAA0000A1Z5',
      });

      const profile = await BusinessProfileRepository.getById(profileId);
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Apex Engineering Ltd');
      expect(profile?.country_iso2).toBe('IN');
      expect(profile?.subdivision_code).toBe('IN-MH');
      expect(profile?.phone_e164).toBe('+919876543210');
      expect(profile?.default_currency).toBe('INR');
      expect(profile?.tax_id).toBe('27AAAAA0000A1Z5');
    });
  });
});
