/**
 * DOCUMENT UPI MODAL
 * Instant QR code collection modal for documents in listings.
 * Supports dynamic amount adjustment, open standee mode,
 * automatic cross-currency conversion to INR via official exchange rates,
 * and seamless one-tap payment recording handoff.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, QrCode, Copy, Share2, CreditCard, AlertCircle, Check, Edit3, RotateCcw } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';
import { BusinessProfile } from '../../domain/profile/types';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { DirectUpiEngine } from '../../domain/payments/upi/DirectUpiEngine';
import { ExchangeRateEngine } from '../../domain/money/ExchangeRateEngine';
import { UpiQrCode } from '../../components/common/UpiQrCode';
import {
  createMoney,
  formatMoney,
  moneyToDecimalString,
  parseDecimalStringToMoney,
} from '../../domain/money/Money';

export interface DocumentUpiModalItem {
  id: string;
  doc_type: string;
  document_number: string;
  customer_name: string;
  total_minor: number;
  balance_minor?: number;
  currency: string;
  lifecycle_status: string;
  issue_date?: number;
}

export interface DocumentUpiModalProps {
  visible: boolean;
  document: DocumentUpiModalItem | null;
  profile: BusinessProfile | null;
  locale?: string;
  onClose: () => void;
  onRecordPayment?: (item: DocumentUpiModalItem) => void;
}

export function DocumentUpiModal({
  visible,
  document,
  profile,
  locale = 'en-US',
  onClose,
  onRecordPayment,
}: DocumentUpiModalProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [localProfile, setLocalProfile] = useState<BusinessProfile | null>(profile);
  const [amountMode, setAmountMode] = useState<'balance' | 'open' | 'custom'>('balance');
  const [amountStr, setAmountStr] = useState('');

  // Vendor / custom payee UPI override state
  const [customPayeeVpa, setCustomPayeeVpa] = useState('');
  const [customPayeeName, setCustomPayeeName] = useState('');
  const [isEditingPayee, setIsEditingPayee] = useState(false);
  const [inlineVpaInput, setInlineVpaInput] = useState('');
  const [inlineNameInput, setInlineNameInput] = useState('');
  const [inlineVpaError, setInlineVpaError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);
  const [fxRateTick, setFxRateTick] = useState(0);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // Synchronize amount when modal opens or document changes
  useEffect(() => {
    if (visible && document) {
      setAmountMode('balance');
      const targetMinor =
        document.balance_minor !== undefined && document.balance_minor > 0
          ? document.balance_minor
          : document.total_minor;
      const initialMoney = createMoney(BigInt(targetMinor), document.currency);
      setAmountStr(moneyToDecimalString(initialMoney));
      setIsEditingPayee(false);
      setInlineVpaError(null);

      // Proactively fetch live market rates if document is in foreign currency
      if (document.currency !== 'INR') {
        ExchangeRateEngine.fetchLiveRatesAsync().then((updated) => {
          if (updated) {
            setFxRateTick((prev) => prev + 1);
          }
        });
      }
    }
  }, [visible, document]);

  const handleRefreshLiveRate = async () => {
    setIsRefreshingFx(true);
    try {
      const updated = await ExchangeRateEngine.fetchLiveRatesAsync(true);
      if (updated) {
        setFxRateTick((prev) => prev + 1);
      } else {
        Alert.alert('Offline Mode', 'Could not reach live market rate servers. Using ECB official reference rate.');
      }
    } catch {
      Alert.alert('Network Error', 'Unable to fetch real-time market rates right now.');
    } finally {
      setIsRefreshingFx(false);
    }
  };

  const effectiveVpa = useMemo(() => {
    return customPayeeVpa.trim() || localProfile?.upi_vpa?.trim() || '';
  }, [customPayeeVpa, localProfile?.upi_vpa]);

  const effectivePayeeName = useMemo(() => {
    return (
      customPayeeName.trim() ||
      localProfile?.legal_name?.trim() ||
      localProfile?.name?.trim() ||
      'Merchant'
    );
  }, [customPayeeName, localProfile?.legal_name, localProfile?.name]);

  const effectiveMinor = useMemo(() => {
    if (!document) return 0n;
    if (amountMode === 'open') return undefined;
    try {
      if (amountStr.trim()) {
        const parsed = parseDecimalStringToMoney(amountStr.trim(), document.currency);
        return parsed.amountMinor > 0n ? parsed.amountMinor : undefined;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }, [document, amountMode, amountStr]);

  const upiResult = useMemo(() => {
    if (!effectiveVpa || !document) return null;
    try {
      return DirectUpiEngine.buildUpiUriWithCurrencyConversion({
        vpa: effectiveVpa,
        payeeName: effectivePayeeName,
        sourceAmountMinor: effectiveMinor,
        sourceCurrency: document.currency,
        transactionRef: document.document_number,
        transactionNote: `Invoice ${document.document_number}`,
      });
    } catch {
      return null;
    }
  }, [effectiveVpa, effectivePayeeName, document, effectiveMinor, fxRateTick]);

  const handleSaveVpaToProfile = async () => {
    const val = DirectUpiEngine.validateVpa(inlineVpaInput);
    if (!val.isValid || !val.normalizedVpa) {
      setInlineVpaError(val.error || 'Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setInlineVpaError(null);
    setIsSavingProfile(true);
    try {
      const activeProf = localProfile || (await BusinessProfileRepository.getActiveProfile());
      if (activeProf) {
        const updated = {
          ...activeProf,
          upi_vpa: val.normalizedVpa,
          legal_name: inlineNameInput.trim() || activeProf.legal_name || activeProf.name,
        };
        await BusinessProfileRepository.updateProfile(updated);
        setLocalProfile(updated);
      }
      setCustomPayeeVpa('');
      setCustomPayeeName('');
      setIsEditingPayee(false);
      Alert.alert('UPI ID Saved', `Saved ${val.normalizedVpa} to your business profile.`);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUseOnceCustomPayee = () => {
    const val = DirectUpiEngine.validateVpa(inlineVpaInput);
    if (!val.isValid || !val.normalizedVpa) {
      setInlineVpaError(val.error || 'Please enter a valid UPI ID (e.g. vendor@bank)');
      return;
    }
    setInlineVpaError(null);
    setCustomPayeeVpa(val.normalizedVpa);
    setCustomPayeeName(inlineNameInput.trim());
    setIsEditingPayee(false);
  };

  const handleResetToProfileDefault = () => {
    setCustomPayeeVpa('');
    setCustomPayeeName('');
    setIsEditingPayee(false);
    setInlineVpaInput(localProfile?.upi_vpa || '');
    setInlineNameInput(localProfile?.legal_name || localProfile?.name || '');
    setInlineVpaError(null);
  };

  if (!document) return null;

  const balanceMinor =
    document.balance_minor !== undefined ? document.balance_minor : document.total_minor;
  const balanceMoney = createMoney(BigInt(balanceMinor), document.currency);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <QrCode size={18} color={theme.brandAnchor} />
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  Collect via UPI QR
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {document.document_number} • {document.customer_name}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close QR modal"
            >
              <X size={22} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {(!effectiveVpa || isEditingPayee) ? (
              <View style={[styles.inlineConfigBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                <View style={styles.inlineConfigHeader}>
                  <Text style={[styles.inlineConfigTitle, { color: theme.textPrimary }]}>
                    {isEditingPayee ? 'Vendor / Custom Payee UPI Override' : 'Configure UPI ID'}
                  </Text>
                  {isEditingPayee && (
                    <Pressable onPress={handleResetToProfileDefault} hitSlop={8}>
                      <Text style={[styles.cancelEditText, { color: theme.textSecondary }]}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.inlineConfigDesc, { color: theme.textSecondary }]}>
                  {isEditingPayee
                    ? 'Enter a vendor, contractor, or alternate bank UPI ID to direct this payment.'
                    : 'Enter your merchant UPI ID (Google Pay, PhonePe, Paytm, BHIM) to generate an instant payment QR.'}
                </Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                  UPI ID (VPA) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                      borderColor: inlineVpaError ? theme.statusDanger : theme.borderSubtle,
                    },
                  ]}
                  placeholder="e.g. merchant@okhdfcbank or 9876543210@paytm"
                  placeholderTextColor={theme.textMuted}
                  value={inlineVpaInput}
                  onChangeText={(val) => {
                    setInlineVpaInput(val);
                    if (inlineVpaError) setInlineVpaError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                  Payee / Business Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  placeholder="e.g. Store Name or Vendor Name"
                  placeholderTextColor={theme.textMuted}
                  value={inlineNameInput}
                  onChangeText={setInlineNameInput}
                />

                {inlineVpaError && (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={14} color={theme.statusDanger} />
                    <Text style={[styles.errorBannerText, { color: theme.statusDanger }]}>
                      {inlineVpaError}
                    </Text>
                  </View>
                )}

                <View style={styles.configBtnRow}>
                  <Pressable
                    style={[styles.configPrimaryBtn, { backgroundColor: theme.brandAnchor }]}
                    onPress={handleSaveVpaToProfile}
                    disabled={isSavingProfile}
                    accessibilityRole="button"
                  >
                    {isSavingProfile ? (
                      <ActivityIndicator size="small" color={theme.brandAnchorText} />
                    ) : (
                      <Text style={[styles.configPrimaryBtnText, { color: theme.brandAnchorText }]}>
                        Save to Profile & Show QR
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.configSecondaryBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
                    onPress={handleUseOnceCustomPayee}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.configSecondaryBtnText, { color: theme.textPrimary }]}>
                      Use for this Invoice Only
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {/* Header row with Amount Mode & Edit Payee Link */}
                <View style={styles.topControlRow}>
                  {/* Amount Mode Selector */}
                  <View style={styles.modeRow}>
                    <Pressable
                      style={[
                        styles.modeChip,
                        {
                          backgroundColor:
                            amountMode === 'balance' ? theme.brandAnchor : theme.surfaceSecondary,
                          borderColor:
                            amountMode === 'balance' ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        setAmountMode('balance');
                        setAmountStr(moneyToDecimalString(balanceMoney));
                      }}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          { color: amountMode === 'balance' ? theme.surface : theme.textPrimary },
                        ]}
                      >
                        Balance ({formatMoney(balanceMoney, locale)})
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.modeChip,
                        {
                          backgroundColor:
                            amountMode === 'open' ? theme.brandAnchor : theme.surfaceSecondary,
                          borderColor:
                            amountMode === 'open' ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        setAmountMode('open');
                        setAmountStr('');
                      }}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          { color: amountMode === 'open' ? theme.surface : theme.textPrimary },
                        ]}
                      >
                        Open Amount
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.modeChip,
                        {
                          backgroundColor:
                            amountMode === 'custom' ? theme.brandAnchor : theme.surfaceSecondary,
                          borderColor:
                            amountMode === 'custom' ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => setAmountMode('custom')}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          { color: amountMode === 'custom' ? theme.surface : theme.textPrimary },
                        ]}
                      >
                        Custom
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={[styles.editPayeeBtn, { borderColor: theme.borderSubtle }]}
                    onPress={() => {
                      setInlineVpaInput(effectiveVpa);
                      setInlineNameInput(effectivePayeeName);
                      setIsEditingPayee(true);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Change or override payee UPI ID"
                  >
                    <Edit3 size={12} color={theme.textPrimary} />
                    <Text style={[styles.editPayeeText, { color: theme.textPrimary }]}>
                      {customPayeeVpa ? 'Edit Vendor' : 'Change UPI'}
                    </Text>
                  </Pressable>
                </View>

                {customPayeeVpa ? (
                  <View style={[styles.customPayeeBadge, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.customPayeeBadgeText, { color: '#D97706' }]}>
                      Vendor / Custom Payee Active: {customPayeeVpa}
                    </Text>
                    <Pressable onPress={handleResetToProfileDefault} hitSlop={8}>
                      <Text style={[styles.resetUpiText, { color: theme.brandAnchor }]}>Reset</Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Custom Amount Input */}
                {amountMode === 'custom' && (
                  <View style={styles.customInputRow}>
                    <Text style={[styles.customLabel, { color: theme.textSecondary }]}>
                      Amount ({document.currency}):
                    </Text>
                    <TextInput
                      style={[
                        styles.customInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      keyboardType="decimal-pad"
                      value={amountStr}
                      onChangeText={setAmountStr}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                      autoFocus
                    />
                  </View>
                )}

                {/* Live QR Matrix */}
                {upiResult?.upiUri ? (
                  <View style={styles.qrWrapper}>
                    <UpiQrCode
                      value={upiResult.upiUri}
                      size={180}
                      color="#000000"
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Text style={{ color: theme.textMuted }}>Enter a valid amount to generate QR</Text>
                  </View>
                )}

                {/* Auto-Converted FX Banner */}
                {upiResult?.isConverted && (
                  <View
                    style={[
                      styles.fxBanner,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.brandAnchor,
                      },
                    ]}
                  >
                    <View style={styles.fxBannerHeader}>
                      <Text style={[styles.fxTitle, { color: theme.statusSuccess }]}>
                        Auto-Converted to INR: ₹
                        {moneyToDecimalString(createMoney(upiResult.inrAmountMinor!, 'INR'))}
                      </Text>
                      <Pressable
                        onPress={handleRefreshLiveRate}
                        disabled={isRefreshingFx}
                        style={[styles.refreshFxBtn, { borderColor: theme.brandAnchor }]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Refresh real-time market exchange rate"
                      >
                        {isRefreshingFx ? (
                          <ActivityIndicator size="small" color={theme.brandAnchor} />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <RotateCcw size={11} color={theme.brandAnchor} />
                            <Text style={[styles.refreshFxText, { color: theme.brandAnchor }]}>Refresh Rate</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                    <Text style={[styles.fxDesc, { color: theme.textSecondary }]}>
                      {upiResult.conversionSummary} • {upiResult.exchangeRateLabel}
                    </Text>
                  </View>
                )}

                {/* Payee Info */}
                <View style={styles.payeeInfo}>
                  <Text style={[styles.payeeName, { color: theme.textPrimary }]}>
                    {effectivePayeeName}
                  </Text>
                  <Text style={[styles.payeeVpa, { color: theme.textSecondary }]}>
                    UPI ID: {effectiveVpa}
                  </Text>
                </View>

                {/* Monospace URI String */}
                {upiResult?.upiUri && (
                  <View style={[styles.uriBox, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text
                      style={[
                        styles.uriText,
                        {
                          color: theme.textMuted,
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {upiResult.upiUri}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
                    ]}
                    onPress={() => {
                      if (upiResult?.upiUri) {
                        Share.share({
                          message: `Pay invoice ${document.document_number} (${
                            upiResult.isConverted
                              ? `₹${moneyToDecimalString(createMoney(upiResult.inrAmountMinor!, 'INR'))} INR`
                              : `${amountStr || formatMoney(balanceMoney)} ${document.currency}`
                          }) via UPI: ${upiResult.upiUri}`,
                          title: `UPI Payment: ${document.document_number}`,
                        });
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Share payment link"
                  >
                    <Share2 size={16} color={theme.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Share</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
                    ]}
                    onPress={() => {
                      Alert.alert('UPI ID', effectiveVpa, [{ text: 'OK' }]);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Copy UPI ID"
                  >
                    <Copy size={16} color={theme.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
                      Copy ID
                    </Text>
                  </Pressable>

                  {onRecordPayment && (
                    <Pressable
                      style={[
                        styles.actionBtn,
                        styles.recordBtn,
                        { backgroundColor: theme.brandAnchor, borderColor: theme.brandAnchor },
                      ]}
                      onPress={() => {
                        onClose();
                        onRecordPayment(document);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Record payment received"
                    >
                      <CreditCard size={16} color={theme.brandAnchorText} />
                      <Text style={[styles.actionBtnText, { color: theme.brandAnchorText }]}>
                        Record Pay
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  customLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  customInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    fontSize: typography.bodyMedium.fontSize,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    marginVertical: spacing.xs,
  },
  qrPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fxBanner: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  fxBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  refreshFxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  refreshFxText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fxTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  fxDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  payeeInfo: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  payeeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  payeeVpa: {
    fontSize: 12,
    marginTop: 2,
  },
  uriBox: {
    padding: spacing.xs,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  uriText: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  recordBtn: {
    flex: 1.3,
  },
  actionBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  editPayeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: spacing.xs,
  },
  editPayeeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customPayeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  customPayeeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetUpiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineConfigBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  inlineConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineConfigTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inlineConfigDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  errorBannerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  configBtnRow: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  configPrimaryBtn: {
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  configSecondaryBtn: {
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
