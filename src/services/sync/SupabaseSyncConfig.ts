/**
 * SUPABASE SYNC CONFIG SERVICE — BILLFRAME
 * Securely stores Supabase credentials with zero external heavy SDK overhead.
 * Platform-agnostic: uses expo-secure-store on Native, localStorage on Web.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CloudSyncConfig } from './types';

const STORAGE_KEYS = {
  SUPABASE_URL: 'billframe_sync_supabase_url',
  SUPABASE_ANON_KEY: 'billframe_sync_supabase_anon_key',
  AUTH_TOKEN: 'billframe_sync_auth_token',
  USER_ID: 'billframe_sync_user_id',
  AUTO_SYNC: 'billframe_sync_auto_sync',
  LAST_SYNCED_AT: 'billframe_sync_last_synced_at',
};

export const DEFAULT_SUPABASE_URL = 'https://ufxqohdxwvnrmyvrsqdd.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeHFvaGR4d3Zucm15dnJzcWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTEwMDMsImV4cCI6MjEwNzc4NzAwM30.YJ_tRRpIg9YCEn2BjPd0O-8lx5YcIN4RzvamvLdZjvU';

export class SupabaseSyncConfigService {
  private static async getRaw(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }

  private static async setRaw(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Graceful fallback
    }
  }

  private static async deleteRaw(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Graceful fallback
    }
  }

  static async getConfig(): Promise<CloudSyncConfig> {
    const rawUrl = await this.getRaw(STORAGE_KEYS.SUPABASE_URL);
    const rawKey = await this.getRaw(STORAGE_KEYS.SUPABASE_ANON_KEY);

    const supabaseUrl = rawUrl !== null ? rawUrl : DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = rawKey !== null ? rawKey : DEFAULT_SUPABASE_ANON_KEY;
    const authToken = (await this.getRaw(STORAGE_KEYS.AUTH_TOKEN)) || undefined;
    const userId = (await this.getRaw(STORAGE_KEYS.USER_ID)) || undefined;
    const autoSyncRaw = await this.getRaw(STORAGE_KEYS.AUTO_SYNC);
    const autoSync = autoSyncRaw === 'true';
    const lastSyncedAtRaw = await this.getRaw(STORAGE_KEYS.LAST_SYNCED_AT);
    const lastSyncedAt = lastSyncedAtRaw ? parseInt(lastSyncedAtRaw, 10) : undefined;

    return {
      supabaseUrl,
      supabaseAnonKey,
      authToken,
      userId,
      autoSync,
      lastSyncedAt,
    };
  }

  static async saveConfig(config: Partial<CloudSyncConfig>): Promise<void> {
    if (config.supabaseUrl !== undefined) {
      // Strip trailing slash if present
      const cleanUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
      await this.setRaw(STORAGE_KEYS.SUPABASE_URL, cleanUrl);
    }
    if (config.supabaseAnonKey !== undefined) {
      await this.setRaw(STORAGE_KEYS.SUPABASE_ANON_KEY, config.supabaseAnonKey.trim());
    }
    if (config.authToken !== undefined) {
      await this.setRaw(STORAGE_KEYS.AUTH_TOKEN, config.authToken.trim());
    }
    if (config.userId !== undefined) {
      await this.setRaw(STORAGE_KEYS.USER_ID, config.userId.trim());
    }
    if (config.autoSync !== undefined) {
      await this.setRaw(STORAGE_KEYS.AUTO_SYNC, config.autoSync ? 'true' : 'false');
    }
    if (config.lastSyncedAt !== undefined) {
      await this.setRaw(STORAGE_KEYS.LAST_SYNCED_AT, String(config.lastSyncedAt));
    }
  }

  static async clearConfig(): Promise<void> {
    await this.setRaw(STORAGE_KEYS.SUPABASE_URL, '');
    await this.setRaw(STORAGE_KEYS.SUPABASE_ANON_KEY, '');
    await this.deleteRaw(STORAGE_KEYS.AUTH_TOKEN);
    await this.deleteRaw(STORAGE_KEYS.USER_ID);
    await this.deleteRaw(STORAGE_KEYS.AUTO_SYNC);
    await this.deleteRaw(STORAGE_KEYS.LAST_SYNCED_AT);
  }

  /**
   * Tests connectivity to the Supabase endpoint
   */
  static async testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    if (!url.trim() || !anonKey.trim()) {
      return { success: false, message: 'Please provide both Supabase Project URL and Anon API Key.' };
    }

    const cleanUrl = url.trim().replace(/\/+$/, '');

    try {
      // 1. Probe Auth health endpoint
      const authRes = await fetch(`${cleanUrl}/auth/v1/health`, {
        method: 'GET',
        headers: {
          apikey: anonKey.trim(),
        },
      });

      if (authRes.ok || authRes.status === 200) {
        return { success: true, message: 'Connected to Supabase cluster successfully.' };
      }

      // 2. Fallback probe REST
      const restRes = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: anonKey.trim(),
          Authorization: `Bearer ${anonKey.trim()}`,
        },
      });

      if (restRes.ok || restRes.status === 200 || restRes.status === 404) {
        return { success: true, message: 'Connected to Supabase cluster successfully.' };
      }

      return {
        success: false,
        message: `HTTP ${authRes.status}: Failed to authenticate with Supabase. Check Project URL and Anon Key.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Network unreachable'}. Check URL or internet access.`,
      };
    }
  }
}
