/**
 * APP LOCK & SECURITY PIN SCREEN
 * Configure device-level master PIN lock for financial data privacy.
 * Supports configurable auto-lock timeout (Immediate, 1m, 5m, 15m) and salted SHA-256 storage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  useColorScheme,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Lock, CheckCircle2, Clock } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../design/tokens';
import { SecurityService } from '../services/security/SecurityService';
import { useSecurity } from '../services/security/SecurityContext';

const TIMEOUT_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '1 minute', value: 60 * 1000 },
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '15 minutes', value: 15 * 60 * 1000 },
];

export default function SecurityPinScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const security = useSecurity();

  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Setup mode states
  const [mode, setMode] = useState<'view' | 'setup' | 'disable'>('view');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPinToDisable, setCurrentPinToDisable] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshStatus = useCallback(async () => {
    try {
      const enabled = await SecurityService.isPinEnabled();
      setIsPinEnabled(enabled);
      await security.refreshSecurityStateAsync();
    } finally {
      setLoading(false);
    }
  }, [security]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleSavePin = async () => {
    setErrorMsg('');
    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }

    try {
      await SecurityService.setPin(pin);
      await security.refreshSecurityStateAsync();
      Alert.alert('PIN Lock Enabled', 'Your financial data is now protected on this device.');
      setPin('');
      setConfirmPin('');
      setMode('view');
      await refreshStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save PIN.');
    }
  };

  const handleDisablePin = async () => {
    setErrorMsg('');
    const isValid = await SecurityService.verifyPin(currentPinToDisable);
    if (!isValid) {
      setErrorMsg('Incorrect current PIN.');
      return;
    }

    await SecurityService.disablePin();
    await security.refreshSecurityStateAsync();
    Alert.alert('PIN Disabled', 'Device PIN lock has been turned off.');
    setCurrentPinToDisable('');
    setMode('view');
    await refreshStatus();
  };

  const handleTimeoutChange = async (timeoutMs: number) => {
    await security.updateLockTimeoutAsync(timeoutMs);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
          >
            <ArrowLeft color={theme.textPrimary} size={22} />
          </Pressable>
          <Text style={[styles.title, { color: theme.textPrimary }]}>App Lock & Security</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {loading ? null : mode === 'view' ? (
            <View style={styles.content}>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <View style={styles.statusRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isPinEnabled ? '#DCFCE7' : theme.surfaceSecondary }]}>
                    {isPinEnabled ? (
                      <Lock color="#15803D" size={24} />
                    ) : (
                      <Shield color={theme.textSecondary} size={24} />
                    )}
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                      {isPinEnabled ? 'PIN Protection Active' : 'No PIN Configured'}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                      {isPinEnabled
                        ? 'Device PIN is required to access your financial records.'
                        : 'Secure your invoices, balances, and customer data with a local PIN.'}
                    </Text>
                  </View>
                </View>

                {isPinEnabled ? (
                  <Pressable
                    style={[styles.dangerButton, { borderColor: theme.statusDanger }]}
                    accessibilityRole="button"
                    onPress={() => {
                      setErrorMsg('');
                      setMode('disable');
                    }}
                  >
                    <Text style={[styles.dangerButtonText, { color: theme.statusDanger }]}>Disable PIN Lock</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.primaryButton, { backgroundColor: theme.brandAnchor }]}
                    accessibilityRole="button"
                    onPress={() => {
                      setErrorMsg('');
                      setPin('');
                      setConfirmPin('');
                      setMode('setup');
                    }}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.surface }]}>Set Master PIN</Text>
                  </Pressable>
                )}
              </View>

              {/* Lock Timeout Configuration (When PIN Enabled) */}
              {isPinEnabled && (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                  <View style={styles.sectionHeader}>
                    <Clock size={18} color={theme.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Auto-Lock Timeout</Text>
                  </View>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
                    Require PIN challenge when app is backgrounded for longer than:
                  </Text>
                  <View style={styles.timeoutGrid}>
                    {TIMEOUT_OPTIONS.map((opt) => {
                      const selected = security.lockTimeoutMs === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          style={[
                            styles.timeoutChip,
                            {
                              backgroundColor: selected ? theme.brandAnchor : theme.surfaceSecondary,
                              borderColor: selected ? theme.brandAnchor : theme.borderSubtle,
                            },
                          ]}
                          onPress={() => handleTimeoutChange(opt.value)}
                        >
                          <Text
                            style={[
                              styles.timeoutChipText,
                              { color: selected ? theme.surface : theme.textPrimary },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={[styles.infoBox, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>Offline Privacy Invariant</Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Your PIN is stored as a salted SHA-256 digest inside the hardware security enclave.
                  Billframe has zero cloud servers and cannot reset or view your PIN.
                </Text>
              </View>
            </View>
          ) : mode === 'setup' ? (
            <View style={styles.content}>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: spacing.md }]}>
                  Create Master PIN
                </Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Enter 4-6 Digit PIN</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="••••"
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>
                  Confirm Master PIN
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="••••"
                  placeholderTextColor={theme.textMuted}
                />

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: theme.borderSubtle }]}
                    onPress={() => setMode('view')}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.primaryButton, { flex: 1, backgroundColor: theme.brandAnchor }]}
                    onPress={handleSavePin}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.surface }]}>Activate PIN</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: spacing.md }]}>
                  Confirm Current PIN to Disable
                </Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Current PIN</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={currentPinToDisable}
                  onChangeText={setCurrentPinToDisable}
                  placeholder="••••"
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                />

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: theme.borderSubtle }]}
                    onPress={() => setMode('view')}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.dangerButton, { flex: 1, borderColor: theme.statusDanger }]}
                    onPress={handleDisablePin}
                  >
                    <Text style={[styles.dangerButtonText, { color: theme.statusDanger }]}>Turn Off PIN</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E3',
    marginBottom: spacing.lg,
  },
  backButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  content: {
    gap: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeoutChip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  timeoutChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  cardSubtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
    marginTop: 2,
  },
  primaryButton: {
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  secondaryButton: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  dangerButton: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dangerButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  infoBox: {
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: typography.caption.fontSize,
  },
});
