import { SecurityService } from '../../src/services/security/SecurityService';
import { resetMockStore } from '../mocks/expo-secure-store';

describe('SecurityService (Device PIN Lock)', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('reports PIN disabled by default', async () => {
    const isEnabled = await SecurityService.isPinEnabled();
    expect(isEnabled).toBe(false);
  });

  it('sets and verifies valid PIN', async () => {
    await SecurityService.setPin('1234');
    expect(await SecurityService.isPinEnabled()).toBe(true);

    const match = await SecurityService.verifyPin('1234');
    expect(match).toBe(true);

    const mismatch = await SecurityService.verifyPin('9999');
    expect(mismatch).toBe(false);
  });

  it('rejects short PINs under 4 digits', async () => {
    await expect(SecurityService.setPin('12')).rejects.toThrow('PIN must be at least 4 digits');
  });

  it('disables PIN and purges stored credentials', async () => {
    await SecurityService.setPin('5678');
    expect(await SecurityService.isPinEnabled()).toBe(true);

    await SecurityService.disablePin();
    expect(await SecurityService.isPinEnabled()).toBe(false);
    expect(await SecurityService.verifyPin('5678')).toBe(false);
  });
});
