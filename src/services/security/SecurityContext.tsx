/**
 * SECURITY & APP LOCK CONTEXT
 * Enforces session-level authentication state machine and Android lifecycle lock.
 * 
 * Rules:
 * 1. Cold start / process launch always starts with isSessionUnlocked = false.
 * 2. If PIN is enabled, app presents Lock challenge BEFORE any dashboard or customer data renders.
 * 3. AppState monitoring locks the session when background elapsed time >= configured timeout.
 * 4. Zero plaintext secrets in memory or logs.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SecurityService } from './SecurityService';

export interface SecurityContextType {
  isPinConfigured: boolean;
  isSessionUnlocked: boolean;
  isLocked: boolean;
  isLoading: boolean;
  lockTimeoutMs: number;
  unlockSessionAsync: (pin: string) => Promise<boolean>;
  lockSession: () => void;
  refreshSecurityStateAsync: () => Promise<void>;
  updateLockTimeoutAsync: (timeoutMs: number) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType>({
  isPinConfigured: false,
  isSessionUnlocked: false,
  isLocked: false,
  isLoading: true,
  lockTimeoutMs: 0,
  unlockSessionAsync: async () => false,
  lockSession: () => {},
  refreshSecurityStateAsync: async () => {},
  updateLockTimeoutAsync: async () => {},
});

export const useSecurity = () => useContext(SecurityContext);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isPinConfigured, setIsPinConfigured] = useState(false);
  const [isSessionUnlocked, setIsSessionUnlocked] = useState(false);
  const [lockTimeoutMs, setLockTimeoutMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const lastBackgroundedAtRef = useRef<number | null>(null);

  const refreshSecurityStateAsync = useCallback(async () => {
    try {
      const [enabled, timeout] = await Promise.all([
        SecurityService.isPinEnabled(),
        SecurityService.getLockTimeoutMs(),
      ]);
      setIsPinConfigured(enabled);
      setLockTimeoutMs(timeout);
      if (!enabled) {
        setIsSessionUnlocked(true);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSecurityStateAsync();
  }, [refreshSecurityStateAsync]);

  // AppState lifecycle listener (Background -> Foreground timeout enforcement)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lastBackgroundedAtRef.current = Date.now();
      } else if (nextAppState === 'active') {
        if (isPinConfigured && lastBackgroundedAtRef.current) {
          const elapsed = Date.now() - lastBackgroundedAtRef.current;
          // If timeout is 0 (immediate) or elapsed exceeds timeout, lock session
          if (lockTimeoutMs === 0 || elapsed >= lockTimeoutMs) {
            setIsSessionUnlocked(false);
          }
        }
        lastBackgroundedAtRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isPinConfigured, lockTimeoutMs]);

  const unlockSessionAsync = async (pin: string): Promise<boolean> => {
    const isValid = await SecurityService.verifyPin(pin);
    if (isValid) {
      setIsSessionUnlocked(true);
      return true;
    }
    return false;
  };

  const lockSession = () => {
    if (isPinConfigured) {
      setIsSessionUnlocked(false);
    }
  };

  const updateLockTimeoutAsync = async (timeoutMs: number) => {
    await SecurityService.setLockTimeoutMs(timeoutMs);
    setLockTimeoutMs(timeoutMs);
  };

  const isLocked = !isLoading && isPinConfigured && !isSessionUnlocked;

  return (
    <SecurityContext.Provider
      value={{
        isPinConfigured,
        isSessionUnlocked,
        isLocked,
        isLoading,
        lockTimeoutMs,
        unlockSessionAsync,
        lockSession,
        refreshSecurityStateAsync,
        updateLockTimeoutAsync,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}
