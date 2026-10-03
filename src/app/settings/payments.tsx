/**
 * PAYMENT METHODS & GATEWAYS SETTINGS SCREEN
 * Configuration for Direct UPI QR payments and Razorpay Connect online payment links.
 * 
 * Invariants:
 * 1. Offline-first: UPI requires zero network; works immediately.
 * 2. Razorpay configuration persists to payment_provider_connections table in local SQLite.
 * 3. Never requires cloud account to accept payments.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  radii,
  typography,
  MIN_TOUCH_TARGET,
  MAX_CONTENT_WIDTH,
} from '../../design/tokens';
import {
  FeatureIcon,
  Check,
  AlertCircle,
} from '../../design/icons';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { PaymentConnectionRepository } from '../../data/repositories/PaymentConnectionRepository';
import { DirectUpiEngine } from '../../domain/payments/upi/DirectUpiEngine';
import { UpiQrCode } from '../../components/common/UpiQrCode';

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');

  // Direct UPI State
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [upiError, setUpiError] = useState<string | null>(null);
  const [testAmountStr, setTestAmountStr] = useState<string>('');

  // Razorpay Gateway State
  const [razorpayActive, setRazorpayActive] = useState<boolean>(false);
  const [isTestnet, setIsTestnet] = useState<boolean>(true);
  const [keyId, setKeyId] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const profile = await BusinessProfileRepository.getActiveProfile();
      if (profile) {
        setProfileId(profile.id);
        setBusinessName(profile.name || 'Merchant');
        setUpiVpa(profile.upi_vpa || '');

        const rzpConn = await PaymentConnectionRepository.getConnection(profile.id, 'razorpay');
        if (rzpConn) {
          setRazorpayActive(Boolean(rzpConn.is_active));
          setIsTestnet(Boolean(rzpConn.is_testnet));
          setKeyId(rzpConn.key_id || '');
        }
      }
    } catch (err: any) {
      const msg = 'Failed to load payment settings: ' + (err.message || 'Unknown error');
      setStatusBanner({ type: 'error', message: msg });
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVpaChange = (text: string) => {
    setUpiVpa(text);
    setStatusBanner(null);
    if (!text.trim()) {
      setUpiError(null);
      return;
    }
    const val = DirectUpiEngine.validateVpa(text);
    setUpiError(val.isValid ? null : val.error || 'Invalid UPI ID format');
  };

  const handleSave = async () => {
    setStatusBanner(null);

    if (upiVpa.trim()) {
      const val = DirectUpiEngine.validateVpa(upiVpa);
      if (!val.isValid) {
        const err = val.error || 'Please enter a valid UPI VPA';
        setStatusBanner({ type: 'error', message: err });
        Alert.alert('Invalid UPI ID', err);
        return;
      }
    }

    if (razorpayActive && isTestnet && !keyId.trim()) {
      const err = 'Razorpay Test Key ID is required when Test Mode is enabled.';
      setStatusBanner({ type: 'error', message: err });
      Alert.alert('Missing Key ID', err);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Ensure target profile ID
      let targetProfileId = profileId;
      if (!targetProfileId) {
        const prof = await BusinessProfileRepository.getActiveProfile();
        targetProfileId = prof?.id || 'default_business_profile';
        setProfileId(targetProfileId);
      }

      // 2. Update UPI VPA on Business Profile
      await BusinessProfileRepository.updateProfile({
        id: targetProfileId,
        upi_vpa: upiVpa.trim() || undefined,
      });

      // 3. Upsert Razorpay Connection with non-secret partner architecture
      if (razorpayActive) {
        await PaymentConnectionRepository.upsertConnection({
          businessProfileId: targetProfileId,
          provider: 'razorpay',
          status: isTestnet ? 'sandbox' : 'partner_approval_required',
          keyId: isTestnet ? keyId.trim() : null,
          isActive: razorpayActive,
          isTestnet,
        });
      }

      await loadSettings();
      setSavedSuccess(true);
      setStatusBanner({ type: 'success', message: 'Payment configuration successfully updated!' });
      setTimeout(() => {
        setSavedSuccess(false);
        setStatusBanner(null);
      }, 4000);
      Alert.alert('Saved', 'Payment configuration successfully updated.');
    } catch (err: any) {
      const msg = err.message || 'Failed to save settings';
      setStatusBanner({ type: 'error', message: msg });
      Alert.alert('Error', 'Failed to save settings: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isUpiValid = upiVpa.trim().length > 0 && !upiError;

  let parsedTestAmountMinor: bigint | undefined = undefined;
  if (testAmountStr.trim()) {
    try {
      const parsedFloat = parseFloat(testAmountStr.trim());
      if (!isNaN(parsedFloat) && parsedFloat > 0) {
        const parts = testAmountStr.trim().split('.');
        const whole = BigInt(parts[0] || '0');
        const frac = parts[1] ? parts[1].padEnd(2, '0').slice(0, 2) : '00';
        parsedTestAmountMinor = whole * 100n + BigInt(frac);
      }
    } catch {
      parsedTestAmountMinor = undefined;
    }
  }

  const sampleUpiUri = isUpiValid
    ? DirectUpiEngine.buildUpiUri({
        vpa: upiVpa.trim(),
        payeeName: businessName || 'Merchant',
        amountMinor: parsedTestAmountMinor, // If undefined, builds open-amount static standee QR!
        currency: 'INR',
        transactionRef: parsedTestAmountMinor ? 'PREVIEW-01' : undefined,
        transactionNote: parsedTestAmountMinor ? 'Test Payment' : undefined,
      })
    : '';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityLabel="Back to settings"
        >
          <Text style={[styles.backText, { color: theme.brandAnchor }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Payments & Gateways</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* SECTION 1: DIRECT UPI (INDIA) */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderTitleRow}>
              <FeatureIcon name="payments" size={20} color={theme.brandAnchor} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Direct UPI & QR (Zero Fee)
              </Text>
            </View>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Receive payments directly into your bank account via PhonePe, Google Pay, Paytm, or BHIM. Zero gateway fees.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Merchant UPI VPA (UPI ID)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                  borderColor: upiError ? theme.statusDanger : theme.borderSubtle,
                },
              ]}
              value={upiVpa}
              onChangeText={handleVpaChange}
              placeholder="e.g. yourname@okhdfcbank or store@paytm"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {upiError ? (
              <Text style={[styles.errorHint, { color: theme.statusDanger }]}>{upiError}</Text>
            ) : isUpiValid ? (
              <View style={styles.validRow}>
                <Check color={theme.statusSuccess} size={14} />
                <Text style={[styles.validHint, { color: theme.statusSuccess }]}>
                  Valid UPI ID — Ready for instant QR codes
                </Text>
              </View>
            ) : (
              <Text style={[styles.helperHint, { color: theme.textMuted }]}>
                Printed on invoices and shown on screen for instant customer scanning.
              </Text>
            )}

            {isUpiValid && (
              <View style={[styles.qrPreviewCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Text style={[styles.previewLabel, { color: theme.textPrimary, fontWeight: '700' }]}>
                    Live QR Code Preview
                  </Text>
                  <View style={{ backgroundColor: theme.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: theme.borderSubtle }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: parsedTestAmountMinor ? theme.brandAnchor : theme.statusSuccess }}>
                      {parsedTestAmountMinor ? `FIXED ₹${testAmountStr}` : 'OPEN STANDEE (ANY AMOUNT)'}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: spacing.sm }}>
                  {parsedTestAmountMinor
                    ? `Customer pays fixed ₹${testAmountStr} on scanning.`
                    : 'Customer enters any amount on their phone when scanning (standard merchant shop standee).'}
                </Text>

                {/* Amount Mode Quick Chips */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.sm, flexWrap: 'wrap' }}>
                  <Pressable
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      borderWidth: 1,
                      backgroundColor: !testAmountStr ? theme.brandAnchor : theme.surface,
                      borderColor: !testAmountStr ? theme.brandAnchor : theme.borderSubtle,
                    }}
                    onPress={() => setTestAmountStr('')}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: !testAmountStr ? theme.brandAnchorText : theme.textPrimary }}>
                      Open Standee (Default)
                    </Text>
                  </Pressable>

                  {['1', '10', '100'].map((amt) => {
                    const isSelected = testAmountStr === amt;
                    return (
                      <Pressable
                        key={amt}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 14,
                          borderWidth: 1,
                          backgroundColor: isSelected ? theme.brandAnchor : theme.surface,
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                        }}
                        onPress={() => setTestAmountStr(amt)}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? theme.brandAnchorText : theme.textPrimary }}>
                          ₹{amt} Test
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Amount Input */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Test Amount (₹):</Text>
                  <TextInput
                    style={{
                      flex: 1,
                      height: 34,
                      backgroundColor: theme.surface,
                      borderColor: theme.borderSubtle,
                      borderWidth: 1,
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      fontSize: 13,
                      color: theme.textPrimary,
                    }}
                    placeholder="Leave empty for open amount"
                    placeholderTextColor={theme.textMuted}
                    value={testAmountStr}
                    onChangeText={setTestAmountStr}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.qrContainer}>
                  <UpiQrCode
                    value={sampleUpiUri}
                    size={160}
                  />
                </View>

                <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} numberOfLines={2}>
                    {sampleUpiUri}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 2: RAZORPAY CONNECT */}
          <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
            <View style={styles.sectionHeaderTitleRow}>
              <FeatureIcon name="settings" size={20} color={theme.brandAnchor} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Razorpay Online Payment Links
              </Text>
            </View>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Generate credit/debit card, netbanking, and online payment links for remote clients.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {/* Toggle Enable */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                  Enable Razorpay Gateway
                </Text>
                <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                  Allows generating shareable payment links on invoices
                </Text>
              </View>
              <Switch
                value={razorpayActive}
                onValueChange={setRazorpayActive}
                trackColor={{ false: theme.borderSubtle, true: theme.brandAnchor }}
                thumbColor="#FFFFFF"
              />
            </View>

            {razorpayActive && (
              <View style={styles.gatewayForm}>
                {/* Environment Mode */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                      Test Mode (Sandbox)
                    </Text>
                    <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                      {isTestnet ? 'Simulates payment links without real charges' : 'Production gateway connection'}
                    </Text>
                  </View>
                  <Switch
                    value={isTestnet}
                    onValueChange={setIsTestnet}
                    trackColor={{ false: theme.borderSubtle, true: theme.statusWarning }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {isTestnet ? (
                  <View>
                    {/* Key ID in Test Mode */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>
                      Razorpay Test Key ID
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      value={keyId}
                      onChangeText={setKeyId}
                      placeholder="rzp_test_..."
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={[styles.helperHint, { color: theme.textMuted, marginTop: spacing.xs }]}>
                      Sandbox keys simulate checkout and payment confirmation. Never requires or stores client-side secrets.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.infoBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.statusWarning, marginTop: spacing.md }]}>
                    <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
                      Partner Integration Pending
                    </Text>
                    <Text style={[styles.infoBody, { color: theme.textSecondary }]}>
                      Razorpay connected payments are being enabled for this region through Billframe Partner Integration. Direct UPI remains 100% active and available with zero gateway fees.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* SAVE BUTTON */}
          <Pressable
            style={[
              styles.saveBtn,
              {
                backgroundColor: theme.brandAnchor,
                opacity: isSaving ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save payment settings"
          >
            {isSaving ? (
              <ActivityIndicator color={theme.brandAnchorText} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: theme.brandAnchorText }]}>
                {savedSuccess ? 'Saved ✓' : 'Save Payment Settings'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  backText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: '700',
  },
  headerRightPlaceholder: {
    width: 48,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  container: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
  },
  errorHint: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  validHint: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  helperHint: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  qrPreviewCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  qrContainer: {
    padding: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.sm,
  },
  previewSubtext: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  gatewayForm: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  infoBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  infoBody: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  copyBtn: {
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  saveBtn: {
    height: 52,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
});
