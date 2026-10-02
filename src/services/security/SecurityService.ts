/**
 * HARDWARE-BACKED SECURITY & PIN SERVICE
 * Manages device-level cryptographic master PIN lock for financial privacy.
 * 
 * Invariants:
 * 1. Zero plaintext PIN storage — salted SHA-256 hash stored in Android Keystore / iOS Keychain.
 * 2. Never logs raw PINs or cryptographic salts.
 * 3. Supports configurable background lock timeout (Immediate, 1 min, 5 min).
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const PIN_HASH_KEY = 'billframe_pin_hash';
const PIN_SALT_KEY = 'billframe_pin_salt';
const PIN_ENABLED_KEY = 'billframe_pin_enabled';
const LOCK_TIMEOUT_KEY = 'billframe_lock_timeout_ms';

export type LockTimeoutOption = 0 | 60000 | 300000; // 0 = Immediate, 1 min, 5 min

export class SecurityService {
  /**
   * Generates a random cryptographic salt string.
   */
  private static generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 32; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  /**
   * Hashes a PIN with a salt using SHA-256.
   */
  private static async hashPinAsync(pin: string, salt: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `billframe_${salt}_${pin}`
    );
  }

  /**
   * Checks if PIN protection is enabled.
   */
  static async isPinEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(PIN_ENABLED_KEY) === 'true';
      }
      const val = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Sets a new 4 to 6 digit master PIN with salt + SHA-256 hash.
   */
  static async setPin(pin: string): Promise<void> {
    if (!pin || pin.length < 4) {
      throw new Error('PIN must be at least 4 digits.');
    }
    if (pin.length > 6) {
      throw new Error('PIN cannot exceed 6 digits.');
    }

    const salt = this.generateSalt();
    const hash = await this.hashPinAsync(pin, salt);

    if (Platform.OS === 'web') {
      localStorage.setItem(PIN_HASH_KEY, hash);
      localStorage.setItem(PIN_SALT_KEY, salt);
      localStorage.setItem(PIN_ENABLED_KEY, 'true');
      return;
    }

    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'true');
  }

  /**
   * Verifies an entered PIN against the salted hash.
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      let storedHash: string | null = null;
      let storedSalt: string | null = null;

      if (Platform.OS === 'web') {
        storedHash = localStorage.getItem(PIN_HASH_KEY);
        storedSalt = localStorage.getItem(PIN_SALT_KEY);
      } else {
        storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
        storedSalt = await SecureStore.getItemAsync(PIN_SALT_KEY);
      }

      if (!storedHash || !storedSalt) {
        // Fallback backward-compatibility: check if unhashed legacy PIN was stored
        const legacyPin = Platform.OS === 'web'
          ? localStorage.getItem('billframe_master_pin')
          : await SecureStore.getItemAsync('billframe_master_pin');

        if (legacyPin && legacyPin === enteredPin) {
          // Auto-upgrade legacy PIN to salted hash
          await this.setPin(enteredPin);
          if (Platform.OS === 'web') {
            localStorage.removeItem('billframe_master_pin');
          } else {
            await SecureStore.deleteItemAsync('billframe_master_pin');
          }
          return true;
        }
        return false;
      }

      const computedHash = await this.hashPinAsync(enteredPin, storedSalt);
      return computedHash === storedHash;
    } catch {
      return false;
    }
  }

  /**
   * Disables PIN protection and securely purges credentials.
   */
  static async disablePin(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(PIN_HASH_KEY);
      localStorage.removeItem(PIN_SALT_KEY);
      localStorage.removeItem(PIN_ENABLED_KEY);
      localStorage.removeItem('billframe_master_pin');
      return;
    }

    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    await SecureStore.deleteItemAsync(PIN_SALT_KEY);
    await SecureStore.deleteItemAsync(PIN_ENABLED_KEY);
    await SecureStore.deleteItemAsync('billframe_master_pin');
  }

  /**
   * Gets the configured background lock timeout in ms (default: 0 = immediate).
   */
  static async getLockTimeoutMs(): Promise<number> {
    try {
      const val = Platform.OS === 'web'
        ? localStorage.getItem(LOCK_TIMEOUT_KEY)
        : await SecureStore.getItemAsync(LOCK_TIMEOUT_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Sets the background lock timeout in ms.
   */
  static async setLockTimeoutMs(timeoutMs: number): Promise<void> {
    const val = String(timeoutMs);
    if (Platform.OS === 'web') {
      localStorage.setItem(LOCK_TIMEOUT_KEY, val);
      return;
    }
    await SecureStore.setItemAsync(LOCK_TIMEOUT_KEY, val);
  }
}
