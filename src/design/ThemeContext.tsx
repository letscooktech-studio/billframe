/**
 * THEME CONTEXT & PROVIDER
 * Canonical theme provider supporting Dark, Light, and Follow System modes.
 * Enforces strict monochrome contrast and seamless dynamic theme switching
 * without resetting user drafts, input values, or scroll positions.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { colors, ThemeColors } from './tokens';
import { SettingsRepository } from '../data/repositories/SettingsRepository';

export type ThemePreference = 'system' | 'dark' | 'light';

export interface ThemeContextType {
  themePreference: ThemePreference;
  activeTheme: 'dark' | 'light';
  theme: ThemeColors;
  isDark: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

const defaultContext: ThemeContextType = {
  themePreference: 'system',
  activeTheme: 'dark',
  theme: colors.dark,
  isDark: true,
  setThemePreference: async () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const deviceScheme = useDeviceColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await SettingsRepository.get('theme_preference', 'dark');
        if (isMounted && saved && (saved === 'system' || saved === 'dark' || saved === 'light')) {
          setThemePreferenceState(saved as ThemePreference);
        }
      } catch (err) {
        console.warn('[ThemeProvider] Error loading theme preference:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await SettingsRepository.set('theme_preference', pref);
    } catch (err) {
      console.error('[ThemeProvider] Error saving theme preference:', err);
    }
  }, []);

  const activeTheme: 'dark' | 'light' = useMemo(() => {
    if (themePreference === 'dark') return 'dark';
    if (themePreference === 'light') return 'light';
    return deviceScheme === 'light' ? 'light' : 'dark';
  }, [themePreference, deviceScheme]);

  const theme: ThemeColors = useMemo(() => {
    return activeTheme === 'dark' ? colors.dark : colors.light;
  }, [activeTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      themePreference,
      activeTheme,
      theme,
      isDark: activeTheme === 'dark',
      setThemePreference,
    }),
    [themePreference, activeTheme, theme, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to consume the current theme context.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context || defaultContext;
}
