/**
 * AI CONFIGURATION & SECURE KEY STORAGE
 * Manages Bring-Your-Own-Key (BYOK) for LLM providers:
 * - Groq (openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.8-27b) - Ultra-fast inference & reasoning
 * - Google Gemini (gemini-2.5-flash)
 * - OpenAI (gpt-4o-mini, gpt-4o)
 * - Offline Heuristic Engine (zero network, on-device deterministic rule engine)
 * 
 * Hardware-backed storage via expo-secure-store on iOS/Android, localStorage on Web.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AI_PROVIDER_KEY = 'billframe_ai_provider';
const AI_API_KEY = 'billframe_ai_api_key';
const AI_MODEL_KEY = 'billframe_ai_model';
const AI_UNIVERSAL_USAGE_COUNT = 'billframe_universal_usage_count';

export type AiProvider = 'groq' | 'gemini' | 'openai' | 'offline_heuristic';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  isReady: boolean;
}

export const DEFAULT_GROQ_KEY = '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';
export const MAX_UNIVERSAL_KEY_DOCS = 7;

export const PROVIDER_MODELS: Record<AiProvider, Array<{ id: string; name: string; description: string }>> = {
  groq: [
    {
      id: 'openai/gpt-oss-120b',
      name: 'GPT-OSS 120B (Deep Reasoning)',
      description: 'Highest intelligence with explicit step-by-step reasoning trace on Groq LPU',
    },
    {
      id: 'openai/gpt-oss-20b',
      name: 'GPT-OSS 20B (Ultra Fast)',
      description: 'Sub-200ms generation for rapid document classification and edits',
    },
    {
      id: 'qwen/qwen3.8-27b',
      name: 'Qwen 3.8 27B',
      description: 'High-precision structured document extraction and multilingual support',
    },
  ],
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Google Deepmind multimodal flagship with massive context window',
    },
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Cost-effective, highly accurate OpenAI model',
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o Omnimodel',
      description: 'Top-tier OpenAI flagship reasoning model',
    },
  ],
  offline_heuristic: [
    {
      id: 'offline_heuristic_v1',
      name: 'On-Device Heuristic Engine',
      description: '100% offline, zero-network, local deterministic rule processor',
    },
  ],
};

export class AiConfigService {
  private static async getStorageItem(key: string): Promise<string | null> {
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

  private static async setStorageItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Non-blocking fallback
    }
  }

  private static async deleteStorageItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Retrieves active AI engine configuration
   * Defaults to Groq GPT-OSS 120B with the user's active key for instant intelligence.
   */
  static async getConfig(): Promise<AiConfig> {
    const rawProvider = await this.getStorageItem(AI_PROVIDER_KEY);
    const storedKey = await this.getStorageItem(AI_API_KEY);

    const provider: AiProvider = (rawProvider as AiProvider) || 'groq';
    const apiKey = storedKey !== null ? storedKey : '';

    const defaultModel =
      provider === 'groq'
        ? 'openai/gpt-oss-120b'
        : provider === 'openai'
        ? 'gpt-4o-mini'
        : provider === 'gemini'
        ? 'gemini-2.5-flash'
        : 'offline_heuristic_v1';

    const model = (await this.getStorageItem(AI_MODEL_KEY)) || defaultModel;

    return {
      provider,
      apiKey,
      model,
      isReady: provider === 'offline_heuristic' || Boolean(apiKey.trim()) || (provider === 'groq' && Boolean(DEFAULT_GROQ_KEY)),
    };
  }

  /**
   * Saves API key and provider configuration
   */
  static async saveConfig(config: {
    provider: AiProvider;
    apiKey: string;
    model?: string;
  }): Promise<void> {
    await this.setStorageItem(AI_PROVIDER_KEY, config.provider);
    await this.setStorageItem(AI_API_KEY, config.apiKey.trim());
    const defaultModel =
      config.provider === 'groq'
        ? 'openai/gpt-oss-120b'
        : config.provider === 'openai'
        ? 'gpt-4o-mini'
        : config.provider === 'gemini'
        ? 'gemini-2.5-flash'
        : 'offline_heuristic_v1';

    const model = config.model || defaultModel;
    await this.setStorageItem(AI_MODEL_KEY, model);
  }

  /**
   * Clears API credentials
   */
  static async clearApiKey(): Promise<void> {
    await this.setStorageItem(AI_API_KEY, '');
    await this.setStorageItem(AI_PROVIDER_KEY, 'offline_heuristic');
    await this.deleteStorageItem(AI_API_KEY);
    await this.deleteStorageItem(AI_PROVIDER_KEY);
    await this.deleteStorageItem(AI_MODEL_KEY);
  }

  /**
   * Performs live healthcheck probe with the configured key
   */
  static async testConnection(apiKey?: string, provider: AiProvider = 'groq'): Promise<{ success: boolean; message: string }> {
    const key = apiKey !== undefined ? apiKey : ((await this.getStorageItem(AI_API_KEY)) || (provider === 'groq' ? DEFAULT_GROQ_KEY : ''));

    if (!key && provider !== 'offline_heuristic') {
      return { success: false, message: 'API Key is missing.' };
    }

    if (provider === 'offline_heuristic') {
      return { success: true, message: 'Offline deterministic agent engine is ready.' };
    }

    if (provider === 'groq') {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData?.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, message: 'Connected to Groq AI (Ultra-fast LPU inference) successfully.' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Connection failed' };
      }
    }

    if (provider === 'gemini') {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping. Reply with "PONG".' }] }],
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData?.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, message: 'Connected to Google Gemini AI successfully.' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Connection failed' };
      }
    }

    if (provider === 'openai') {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData?.error?.message || `HTTP ${res.status}` };
        }
        return { success: true, message: 'Connected to OpenAI successfully.' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Connection failed' };
      }
    }

    return { success: false, message: 'Unknown provider' };
  }

  /**
   * Checks whether the current active configuration relies on the universal default key
   * versus a personal user-provided BYOK key.
   */
  static isUsingUniversalKey(config: AiConfig): boolean {
    if (config.provider === 'offline_heuristic') return false;
    if (config.provider !== 'groq') return false;
    return !config.apiKey || config.apiKey.trim() === DEFAULT_GROQ_KEY;
  }

  /**
   * Retrieves how many documents have been generated using the built-in universal key
   */
  static async getUniversalUsageCount(): Promise<number> {
    const raw = await this.getStorageItem(AI_UNIVERSAL_USAGE_COUNT);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Increments the document generation counter for the universal key
   */
  static async incrementUniversalUsage(): Promise<number> {
    const current = await this.getUniversalUsageCount();
    const next = current + 1;
    await this.setStorageItem(AI_UNIVERSAL_USAGE_COUNT, next.toString());
    return next;
  }

  /**
   * Resets the universal usage count (e.g. for testing or key cycling)
   */
  static async resetUniversalUsage(): Promise<void> {
    await this.deleteStorageItem(AI_UNIVERSAL_USAGE_COUNT);
  }

  /**
   * Evaluates if the universal rate limit has been reached.
   * If user has configured their own BYOK key, rate limit is always FALSE (unlimited).
   */
  static async checkUniversalLimit(): Promise<{
    isLimited: boolean;
    count: number;
    max: number;
    isUniversalKey: boolean;
  }> {
    const config = await this.getConfig();
    const isUniversal = this.isUsingUniversalKey(config);

    if (!isUniversal) {
      return {
        isLimited: false,
        count: 0,
        max: MAX_UNIVERSAL_KEY_DOCS,
        isUniversalKey: false,
      };
    }

    const count = await this.getUniversalUsageCount();
    return {
      isLimited: count >= MAX_UNIVERSAL_KEY_DOCS,
      count,
      max: MAX_UNIVERSAL_KEY_DOCS,
      isUniversalKey: true,
    };
  }
}
