/**
 * ROOT APPLICATION LAYOUT
 * Sets up GestureHandlerRootView, SafeAreaProvider, system theme detection,
 * and initializes local SQLite database in WAL mode.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseManager } from '../data/database/DatabaseManager';
import { colors } from '../design/tokens';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await DatabaseManager.getDatabaseAsync();
        setDbReady(true);
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

  if (!dbReady) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={[styles.flex, { backgroundColor: theme.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
          <Stack.Screen name="receipt/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="customer/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="customer/edit" options={{ presentation: 'card' }} />
          <Stack.Screen name="catalog/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="onboarding/setup" options={{ presentation: 'card' }} />
          <Stack.Screen name="backup" options={{ presentation: 'card' }} />
        </Stack>
      </GestureHandlerRootView>
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
