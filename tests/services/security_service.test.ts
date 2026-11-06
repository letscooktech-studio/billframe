import { SecurityService, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS } from '../../src/services/security/SecurityService';
import { resetMockStore } from '../mocks/expo-secure-store';

describe('SecurityService (Device PIN Lock & Hardened Cryptography)', () => {
  beforeEach(async () => {
    resetMockStore();
    await SecurityService.resetFailedAttempts();
  });

  it('reports PIN disabled by default', async () => {
    const isEnabled = await SecurityService.isPinEnabled();
    expect(isEnabled).toBe(false);
  });

  it('generates high-entropy cryptographic salts (64 hex characters, unique per call)', () => {
    const salt1 = SecurityService.generateSalt();
    const salt2 = SecurityService.generateSalt();

    expect(salt1).toHaveLength(64);
    expect(salt2).toHaveLength(64);
    expect(salt1).toMatch(/^[0-9a-f]{64}$/);
    expect(salt1).not.toBe(salt2);
  });

  it('performs constant-time string comparison reliably', () => {
    expect(SecurityService.constantTimeEqual('abcdef123456', 'abcdef123456')).toBe(true);
    expect(SecurityService.constantTimeEqual('abcdef123456', 'abcdef123457')).toBe(false);
    expect(SecurityService.constantTimeEqual('abcdef123456', 'abcdef')).toBe(false);
    expect(SecurityService.constantTimeEqual('', '')).toBe(true);
  });

  it('sets and verifies valid PIN', async () => {
    await SecurityService.setPin('1234');
    expect(await SecurityService.isPinEnabled()).toBe(true);

    const match = await SecurityService.verifyPin('1234');
    expect(match).toBe(true);

    const mismatch = await SecurityService.verifyPin('9999');
    expect(mismatch).toBe(false);
  });

  it('rejects short PINs under 4 digits and long PINs over 6 digits', async () => {
    await expect(SecurityService.setPin('12')).rejects.toThrow('PIN must be at least 4 digits');
    await expect(SecurityService.setPin('1234567')).rejects.toThrow('PIN cannot exceed 6 digits');
  });

  it('enforces brute-force lockout after MAX_FAILED_ATTEMPTS', async () => {
    await SecurityService.setPin('4321');

    // 4 wrong attempts should not trigger lockout yet
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      const ok = await SecurityService.verifyPin('0000');
      expect(ok).toBe(false);
      expect(await SecurityService.isLockedOut()).toBe(false);
    }

    // 5th wrong attempt triggers lockout
    const fifth = await SecurityService.verifyPin('0000');
    expect(fifth).toBe(false);
    expect(await SecurityService.isLockedOut()).toBe(true);
    expect(await SecurityService.getLockoutRemainingMs()).toBeGreaterThan(0);

    // Even the correct PIN is rejected while lockout is active
    const duringLockout = await SecurityService.verifyPin('4321');
    expect(duringLockout).toBe(false);

    // Resetting lockout restores normal verification
    await SecurityService.resetFailedAttempts();
    expect(await SecurityService.isLockedOut()).toBe(false);
    const afterReset = await SecurityService.verifyPin('4321');
    expect(afterReset).toBe(true);
  });

  it('disables PIN and purges stored credentials and attempts', async () => {
    await SecurityService.setPin('5678');
    expect(await SecurityService.isPinEnabled()).toBe(true);

    await SecurityService.disablePin();
    expect(await SecurityService.isPinEnabled()).toBe(false);
    expect(await SecurityService.verifyPin('5678')).toBe(false);
    expect(await SecurityService.getFailedAttempts()).toBe(0);
  });
});
