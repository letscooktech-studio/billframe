/**
 * ROOT APPLICATION LAYOUT
 * Sets up GestureHandlerRootView, SafeAreaProvider, system theme detection,
 * SecurityProvider for App Lock lifecycle, and SQLite initialization.
 * 
 * Enforces:
 * 1. Zero data flash: App Lock renders before protected financial records mount.
 * 2. Compulsory onboarding: First launch renders OnboardingScreen directly with zero dashboard flash.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseManager } from '../data/database/DatabaseManager';
import { WorkspaceRepository } from '../data/repositories/WorkspaceRepository';
import { SecurityProvider, useSecurity } from '../services/security/SecurityContext';
import { LockChallengeScreen } from '../components/security/LockChallengeScreen';
import { ExchangeRateEngine } from '../domain/money/ExchangeRateEngine';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import OnboardingScreen from './onboarding';
import { colors } from '../design/tokens';
import { ThemeProvider, useTheme } from '../design/ThemeContext';
import { NavigationDrawerProvider } from '../components/navigation/NavigationDrawerContext';
import { SearchableSideDrawer } from '../components/navigation/SearchableSideDrawer';

function RootLayoutInner() {
  const { theme } = useTheme();
  const security = useSecurity();

  const [dbReady, setDbReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Lifecycle-safe navigation: Dispatches only after the Stack navigator has cleanly mounted
  useEffect(() => {
    if (onboardingCompleted && pendingRoute) {
      const target = pendingRoute;
      setPendingRoute(null);
      router.replace(target as any);
    }
  }, [onboardingCompleted, pendingRoute]);

  useEffect(() => {
    async function init() {
      try {
        await DatabaseManager.getDatabaseAsync();
        setDbReady(true);
        const completed = await WorkspaceRepository.isOnboardingCompletedAsync();
        setOnboardingCompleted(completed);
        // Silently pre-fetch real-time market exchange rates from internet in background
        ExchangeRateEngine.fetchLiveRatesAsync().catch(() => {});
      } catch (err: any) {
        setDbError(err?.message || 'Database initialization failed');
      }
    }
    init();
  }, []);

  if (dbError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorTitle, { color: theme.statusDanger }]}>Database Error</Text>
        <Text style={[styles.errorBody, { color: theme.textSecondary }]}>{dbError}</Text>
      </View>
    );
  }

  // Splash Screen while initializing SQLite, Security, or checking Onboarding
  if (!dbReady || security.isLoading || onboardingCompleted === null) {
    return (
      <View style={[styles.centered, { backgroundColor: '#0B0B0D' }]}>
        <StatusBar style="light" />
        <Image
          source={require('../../assets/brand/billframe-mark.png')}
          style={{ width: 88, height: 88 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Session Lock Gate: Protected data is NEVER mounted when locked
  if (security.isLocked) {
    return <LockChallengeScreen />;
  }

  // Compulsory Onboarding Gate: First-time users see onboarding directly (0% dashboard flash)
  if (!onboardingCompleted) {
    return (
      <OnboardingScreen
        onCompleted={(targetRoute?: string) => {
          if (targetRoute) {
            setPendingRoute(targetRoute);
          }
          setOnboardingCompleted(true);
        }}
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="document/edit" options={{ presentation: 'card' }} />
      <Stack.Screen name="document/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="ai/assistant" options={{ presentation: 'card' }} />
      <Stack.Screen name="templates/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="templates/studio" options={{ presentation: 'card' }} />
      <Stack.Screen name="templates/edit" options={{ presentation: 'card' }} />
      <Stack.Screen name="templates/create-type" options={{ presentation: 'card' }} />
      <Stack.Screen name="receipt/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="customer/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="customer/edit" options={{ presentation: 'card' }} />
      <Stack.Screen name="catalog/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="onboarding" options={{ presentation: 'card' }} />
      <Stack.Screen name="onboarding/setup" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/workspace" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/payments" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings/cloud-sync" options={{ presentation: 'card' }} />
      <Stack.Screen name="collections/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="backup" options={{ presentation: 'card' }} />
      <Stack.Screen name="expenses/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="expenses/add" options={{ presentation: 'card' }} />
      <Stack.Screen name="security-pin" options={{ presentation: 'card' }} />
      <Stack.Screen name="reports/index" options={{ presentation: 'card' }} />
      <Stack.Screen name="quick-bill" options={{ presentation: 'card' }} />
      <Stack.Screen name="search" options={{ presentation: 'card' }} />
    </Stack>
  );
}

function RootContainer() {
  const { theme, isDark } = useTheme();

  return (
    <GestureHandlerRootView style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ErrorBoundary>
        <SecurityProvider>
          <NavigationDrawerProvider>
            <RootLayoutInner />
            <SearchableSideDrawer />
          </NavigationDrawerProvider>
        </SecurityProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootContainer />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    textAlign: 'center',
  },
});
