/**
 * QUICK BILL SCREEN
 * 30-second mobile billing flow for field contractors, freelancers, and tradespeople.
 * Customer + description + amount -> instant issued invoice + optional immediate receipt.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, Check, UserPlus, CreditCard, QrCode, Copy, Share2, AlertCircle, Edit3, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../design/tokens';
import { CustomerRepository, CustomerRecord } from '../data/repositories/CustomerRepository';
import { DocumentRepository } from '../data/repositories/DocumentRepository';
import { PaymentRepository } from '../data/repositories/PaymentRepository';
import { BusinessProfileRepository } from '../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../domain/profile/types';
import { DirectUpiEngine } from '../domain/payments/upi/DirectUpiEngine';
import { ExchangeRateEngine } from '../domain/money/ExchangeRateEngine';
import { UpiQrCode } from '../components/common/UpiQrCode';
import { parseDecimalStringToMoney, moneyToDecimalString, createMoney } from '../domain/money/Money';
import { CustomerPickerModal } from '../features/customers/CustomerPickerModal';
import { showAlert } from '../utils/alert';

export default function QuickBillScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isPaidNow, setIsPaidNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'upi' | 'card'>('upi');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Payee / Vendor UPI customization & inline setup state
  const [customPayeeVpa, setCustomPayeeVpa] = useState('');
  const [customPayeeName, setCustomPayeeName] = useState('');
  const [isEditingPayee, setIsEditingPayee] = useState(false);
  const [inlineVpaInput, setInlineVpaInput] = useState('');
  const [inlineNameInput, setInlineNameInput] = useState('');
  const [inlineVpaError, setInlineVpaError] = useState<string | null>(null);
  const [isSavingProfileVpa, setIsSavingProfileVpa] = useState(false);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);
  const [fxRateTick, setFxRateTick] = useState(0);

  useEffect(() => {
    async function loadDefaults() {
      try {
        const activeProfile = await BusinessProfileRepository.getActiveProfile();
        if (activeProfile) {
          setProfile(activeProfile);
          const initialCurr = activeProfile.default_currency || (activeProfile.country_iso2 === 'IN' ? 'INR' : 'USD');
          setCurrency(initialCurr);
          if (initialCurr === 'INR' || activeProfile.country_iso2 === 'IN' || activeProfile.upi_vpa) {
            setPaymentMethod('upi');
            setIsPaidNow(true);
          }
          if (activeProfile.upi_vpa) {
            setInlineVpaInput(activeProfile.upi_vpa);
          }
          if (activeProfile.legal_name || activeProfile.name) {
            setInlineNameInput(activeProfile.legal_name || activeProfile.name);
          }
        }
      } catch {
        // Fallback
      }

      // Proactively fetch live real-time market exchange rates in background
      try {
        ExchangeRateEngine.fetchLiveRatesAsync().then((updated) => {
          if (updated) {
            setFxRateTick((prev) => prev + 1);
          }
        });
      } catch {
        // Offline resilient
      }
    }
    loadDefaults();
  }, []);

  const handleRefreshLiveRate = async () => {
    setIsRefreshingFx(true);
    try {
      const updated = await ExchangeRateEngine.fetchLiveRatesAsync(true);
      if (updated) {
        setFxRateTick((prev) => prev + 1);
      } else {
        showAlert('Offline Mode', 'Could not reach live market rate servers. Using ECB official reference rate.');
      }
    } catch {
      showAlert('Network Error', 'Unable to fetch real-time market rates right now.');
    } finally {
      setIsRefreshingFx(false);
    }
  };

  const effectiveVpa = useMemo(() => {
    return (customPayeeVpa.trim() || profile?.upi_vpa?.trim() || '');
  }, [customPayeeVpa, profile?.upi_vpa]);

  const effectivePayeeName = useMemo(() => {
    return (
      customPayeeName.trim() ||
      profile?.legal_name?.trim() ||
      profile?.name?.trim() ||
      'Merchant'
    );
  }, [customPayeeName, profile?.legal_name, profile?.name]);

  const quickUpiResult = useMemo(() => {
    if (!isPaidNow || paymentMethod !== 'upi' || !effectiveVpa) {
      return null;
    }
    try {
      let parsedMinor: bigint | undefined = undefined;
      if (amountStr.trim()) {
        const money = parseDecimalStringToMoney(amountStr.trim(), currency);
        if (money.amountMinor > 0n) {
          parsedMinor = money.amountMinor;
        }
      }
      return DirectUpiEngine.buildUpiUriWithCurrencyConversion({
        vpa: effectiveVpa,
        payeeName: effectivePayeeName,
        sourceAmountMinor: parsedMinor,
        sourceCurrency: currency,
        transactionNote: description.trim() || 'Quick Bill',
      });
    } catch {
      return null;
    }
  }, [isPaidNow, paymentMethod, effectiveVpa, effectivePayeeName, amountStr, currency, description, fxRateTick]);

  const handleSaveVpaToProfile = async () => {
    const val = DirectUpiEngine.validateVpa(inlineVpaInput);
    if (!val.isValid || !val.normalizedVpa) {
      setInlineVpaError(val.error || 'Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setInlineVpaError(null);
    setIsSavingProfileVpa(true);
    try {
      const activeProfile = profile || (await BusinessProfileRepository.getActiveProfile());
      if (activeProfile) {
        const updated = {
          ...activeProfile,
          upi_vpa: val.normalizedVpa,
          legal_name: inlineNameInput.trim() || activeProfile.legal_name || activeProfile.name,
        };
        await BusinessProfileRepository.updateProfile(updated);
        setProfile(updated);
      }
      setCustomPayeeVpa('');
      setCustomPayeeName('');
      setIsEditingPayee(false);
      showAlert('UPI ID Saved', `Saved ${val.normalizedVpa} to your business profile.`);
    } catch (err: any) {
      showAlert('Save Failed', err.message || 'Could not save profile.');
    } finally {
      setIsSavingProfileVpa(false);
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
    setInlineVpaInput(profile?.upi_vpa || '');
    setInlineNameInput(profile?.legal_name || profile?.name || '');
    setInlineVpaError(null);
  };

  const executeIssueBill = async (
    targetCustomer: CustomerRecord,
    parsedAmountMinor: bigint,
    itemDescription: string
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 2. Create and autosave draft invoice
      const draft = await DocumentRepository.saveDraft({
        customerId: targetCustomer.id,
        docType: 'invoice',
        currency,
        issueDate: Date.now(),
        items: [
          {
            description: itemDescription,
            quantityScaled: 10000n, // 1.0 item
            unitName: 'item',
            unitPriceMinor: parsedAmountMinor,
          },
        ],
        discountType: 'none',
        taxType: 'none',
      });

      // 3. Issue invoice (assigns sequential INV-XXXX, creates immutable snapshot)
      const issuedInvoice = await DocumentRepository.issueDocument(draft.id);

      // 4. If paid now, record payment and create receipt immediately
      if (isPaidNow) {
        await PaymentRepository.recordPayment({
          invoiceId: issuedInvoice.id,
          amountMinor: parsedAmountMinor,
          paymentMethod,
        });
      }

      // 5. Navigate directly to view the issued document
      router.replace(`/document/${issuedInvoice.id}` as any);
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred while creating the bill.';
      setErrorMessage(msg);
      showAlert('Error Creating Bill', msg);
      setLoading(false);
    }
  };

  const handleIssueQuickBill = async () => {
    setErrorMessage(null);

    // 1. Resolve customer: use selected, typed, or auto-default to 'Walk-in Customer'
    const custName = (customer?.name || quickCustomerName.trim()) || 'Walk-in Customer';

    // 2. Resolve line item description: use typed or auto-default to 'Quick Bill'
    const itemDescription = description.trim() || 'Quick Bill';

    let parsedAmountMinor = 0n;
    try {
      const money = parseDecimalStringToMoney(amountStr.trim() || '0', currency);
      parsedAmountMinor = money.amountMinor;
      if (parsedAmountMinor <= 0n) {
        throw new Error();
      }
    } catch {
      const msg = 'Please enter a valid billing amount greater than zero.';
      setErrorMessage(msg);
      showAlert('Invalid Amount', msg);
      return;
    }

    // 3. Resolve or create customer record
    let targetCustomer = customer;
    if (!targetCustomer) {
      try {
        targetCustomer = await CustomerRepository.create({
          name: custName,
        });
      } catch (err: any) {
        const msg = err.message || 'Could not create customer record.';
        setErrorMessage(msg);
        showAlert('Customer Error', msg);
        return;
      }
    }

    // Cross-Currency UPI Warning & Confirmation (per NPCI regulations)
    if (isPaidNow && paymentMethod === 'upi' && currency !== 'INR' && quickUpiResult?.inrAmountMinor) {
      const inrAmountFormatted = moneyToDecimalString(createMoney(quickUpiResult.inrAmountMinor, 'INR'));
      showAlert(
        'Confirm Cross-Currency UPI',
        `You are billing ${amountStr} ${currency}. UPI apps strictly transact in Indian Rupees (INR).\n\nAt the current live market exchange rate, this charges ₹${inrAmountFormatted} INR.\n\nAre you sure you want to proceed with this payment?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Switch Bill to ₹${inrAmountFormatted} INR`,
            onPress: () => {
              setCurrency('INR');
              setAmountStr(inrAmountFormatted);
            },
          },
          {
            text: `Keep ${currency} & Issue`,
            onPress: () => executeIssueBill(targetCustomer!, parsedAmountMinor, itemDescription),
          },
        ]
      );
      return;
    }

    await executeIssueBill(targetCustomer, parsedAmountMinor, itemDescription);
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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            }}
          >
            <ArrowLeft color={theme.textPrimary} size={22} />
          </Pressable>
          <View style={styles.titleRow}>
            <Zap color={theme.brandAnchor} size={18} fill={theme.brandAnchor} />
            <Text style={[styles.title, { color: theme.textPrimary }]}>Quick Bill</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Customer Selection Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>CUSTOMER</Text>

            {customer ? (
              <View style={styles.selectedCustomerRow}>
                <View style={styles.customerInfo}>
                  <Text style={[styles.customerName, { color: theme.textPrimary }]}>{customer.name}</Text>
                  {customer.business_name && (
                    <Text style={[styles.customerBiz, { color: theme.textSecondary }]}>
                      {customer.business_name}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[styles.smallChangeBtn, { borderColor: theme.borderSubtle }]}
                  onPress={() => {
                    setCustomer(null);
                    setQuickCustomerName('');
                  }}
                >
                  <Text style={[styles.smallChangeText, { color: theme.textPrimary }]}>Change</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.customerInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  placeholder="Enter customer name"
                  placeholderTextColor={theme.textMuted}
                  value={quickCustomerName}
                  onChangeText={setQuickCustomerName}
                />
                <Pressable
                  style={[styles.pickerButton, { borderColor: theme.borderSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel="Select from saved customers"
                  onPress={() => setShowCustomerPicker(true)}
                >
                  <UserPlus color={theme.textPrimary} size={18} />
                  <Text style={[styles.pickerBtnText, { color: theme.textPrimary }]}>Existing</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Description & Amount Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>LINE ITEM</Text>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Service / Item Description</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                  borderColor: theme.borderSubtle,
                },
              ]}
              placeholder="e.g. Electrical service & parts"
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            {/* Currency Selector Strip */}
            <View style={styles.currencySection}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Currency</Text>
              <View style={styles.currencyStrip}>
                {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => {
                  const isSelected = currency === curr;
                  const symbol = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';
                  return (
                    <Pressable
                      key={curr}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: isSelected ? theme.brandAnchor : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text
                        style={[
                          styles.currencyChipText,
                          { color: isSelected ? theme.brandAnchorText : theme.textPrimary },
                        ]}
                      >
                        {symbol} {curr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.xs }]}>
              Amount ({currency})
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                  borderColor: theme.borderSubtle,
                },
              ]}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={amountStr}
              onChangeText={setAmountStr}
            />
          </View>

          {/* Immediate Payment Option Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Pressable
              style={styles.paidToggleRow}
              onPress={() => setIsPaidNow(!isPaidNow)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isPaidNow }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isPaidNow ? theme.statusSuccess : theme.surfaceSecondary,
                    borderColor: isPaidNow ? theme.statusSuccess : theme.borderSubtle,
                  },
                ]}
              >
                {isPaidNow && <Check color="#FFFFFF" size={16} strokeWidth={3} />}
              </View>
              <View style={styles.paidToggleText}>
                <Text style={[styles.paidTitle, { color: theme.textPrimary }]}>Mark as Paid Immediately</Text>
                <Text style={[styles.paidSubtitle, { color: theme.textSecondary }]}>
                  Automatically records payment and generates receipt
                </Text>
              </View>
            </Pressable>

            {isPaidNow && (
              <View style={styles.methodStrip}>
                {(['upi', 'cash', 'bank_transfer', 'card'] as const).map((method) => {
                  const active = paymentMethod === method;
                  const label = method === 'bank_transfer' ? 'Bank' : method.toUpperCase();
                  return (
                    <Pressable
                      key={method}
                      style={[
                        styles.methodChip,
                        {
                          backgroundColor: active ? theme.brandAnchor : theme.surfaceSecondary,
                          borderColor: active ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.methodChipText,
                          { color: active ? theme.brandAnchorText : theme.textPrimary },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {isPaidNow && paymentMethod === 'upi' && (
              <View
                style={[
                  styles.upiCounterCard,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.borderSubtle,
                  },
                ]}
              >
                <View style={styles.upiCounterHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <QrCode size={18} color={theme.brandAnchor} />
                    <Text style={[styles.upiCounterTitle, { color: theme.textPrimary }]}>
                      Scan to Pay via UPI
                    </Text>
                  </View>
                  <View style={[styles.zeroFeeBadge, { backgroundColor: theme.surface }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.statusSuccess }}>0% FEE</Text>
                  </View>
                </View>

                {/* Foreign Currency (USD, EUR, GBP) with UPI Warning & 1-Tap Conversion */}
                {currency !== 'INR' && quickUpiResult?.isConverted && (
                  <View
                    style={[
                      styles.fxWarningCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: '#F59E0B',
                      },
                    ]}
                  >
                    <View style={styles.fxWarningHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <AlertCircle size={15} color="#D97706" />
                        <Text style={[styles.fxWarningTitle, { color: theme.textPrimary }]}>
                          Cross-Currency UPI ({currency} → INR)
                        </Text>
                      </View>
                      <Pressable
                        onPress={handleRefreshLiveRate}
                        disabled={isRefreshingFx}
                        style={[styles.refreshFxBtn, { borderColor: '#F59E0B' }]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Refresh real-time market exchange rate"
                      >
                        {isRefreshingFx ? (
                          <ActivityIndicator size="small" color="#D97706" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <RotateCcw size={11} color="#D97706" />
                            <Text style={styles.refreshFxText}>Refresh Rate</Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                    <Text style={[styles.fxWarningDesc, { color: theme.textSecondary }]}>
                      UPI apps strictly process INR. Converted amount:{' '}
                      <Text style={{ fontWeight: '700', color: theme.statusSuccess }}>
                        ₹{moneyToDecimalString(createMoney(quickUpiResult.inrAmountMinor!, 'INR'))} INR
                      </Text>
                      {'\n'}Rate: {quickUpiResult.exchangeRateLabel}
                    </Text>
                    <Pressable
                      style={[styles.switchInrBtn, { backgroundColor: theme.brandAnchor }]}
                      onPress={() => {
                        setCurrency('INR');
                        setAmountStr(moneyToDecimalString(createMoney(quickUpiResult.inrAmountMinor!, 'INR')));
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.switchInrBtnText, { color: theme.brandAnchorText }]}>
                        Switch Bill Currency to INR (₹{moneyToDecimalString(createMoney(quickUpiResult.inrAmountMinor!, 'INR'))})
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Inline UPI ID Setup / Vendor Override Container */}
                {(!effectiveVpa || isEditingPayee) ? (
                  <View style={[styles.inlineConfigBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                    <View style={styles.inlineConfigHeader}>
                      <Text style={[styles.inlineConfigTitle, { color: theme.textPrimary }]}>
                        {isEditingPayee ? 'Payee / Vendor UPI Override' : 'Configure UPI ID'}
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
                        : 'Enter your merchant UPI ID (Google Pay, PhonePe, Paytm, BHIM) to immediately show payment QR.'}
                    </Text>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                      UPI ID (VPA) *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: inlineVpaError ? theme.statusDanger : theme.borderSubtle,
                        },
                      ]}
                      placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
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
                          backgroundColor: theme.surfaceSecondary,
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
                        disabled={isSavingProfileVpa}
                        accessibilityRole="button"
                      >
                        {isSavingProfileVpa ? (
                          <ActivityIndicator size="small" color={theme.brandAnchorText} />
                        ) : (
                          <Text style={[styles.configPrimaryBtnText, { color: theme.brandAnchorText }]}>
                            Save as Default & Show QR
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={[styles.configSecondaryBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                        onPress={handleUseOnceCustomPayee}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.configSecondaryBtnText, { color: theme.textPrimary }]}>
                          Use Once for this Bill
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.qrHeaderRow}>
                      <Text style={[styles.upiCounterSub, { color: theme.textSecondary }]}>
                        Customer scans with Google Pay, PhonePe, Paytm, or BHIM
                      </Text>
                      <Pressable
                        style={[styles.editUpiBtn, { borderColor: theme.borderSubtle }]}
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
                        <Text style={[styles.editUpiText, { color: theme.textPrimary }]}>
                          {customPayeeVpa ? 'Edit Vendor' : 'Change UPI'}
                        </Text>
                      </Pressable>
                    </View>

                    {customPayeeVpa ? (
                      <View style={[styles.customPayeeBadge, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.customPayeeBadgeText, { color: '#D97706' }]}>
                          Vendor / Custom Payee Active: {customPayeeVpa}
                        </Text>
                        <Pressable onPress={handleResetToProfileDefault} hitSlop={8}>
                          <Text style={[styles.resetUpiText, { color: theme.brandAnchor }]}>Reset</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {/* Live QR Matrix */}
                    {quickUpiResult?.upiUri ? (
                      <View style={styles.upiQrWrapper}>
                        <UpiQrCode
                          value={quickUpiResult.upiUri}
                          size={175}
                          color="#000000"
                          backgroundColor="#FFFFFF"
                        />
                      </View>
                    ) : (
                      <View style={styles.emptyQrBox}>
                        <Text style={{ color: theme.textMuted }}>Enter an amount or UPI ID to generate QR</Text>
                      </View>
                    )}

                    {/* Mode explanation */}
                    <Text style={[styles.qrModeNote, { color: theme.textSecondary }]}>
                      {amountStr.trim() && parseFloat(amountStr) > 0
                        ? `Exact Amount: ${quickUpiResult?.isConverted ? `₹${moneyToDecimalString(createMoney(quickUpiResult.inrAmountMinor!, 'INR'))} INR` : `${amountStr} ${currency}`}`
                        : 'Open Standee QR (Customer enters amount in app)'}
                    </Text>

                    {/* Payee Info */}
                    <View style={styles.upiDetailsBlock}>
                      <Text style={[styles.upiPayeeName, { color: theme.textPrimary }]}>
                        {effectivePayeeName}
                      </Text>
                      <Text style={[styles.upiVpaText, { color: theme.textSecondary }]}>
                        UPI ID: {effectiveVpa}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.upiActionsRow}>
                      <Pressable
                        style={[
                          styles.upiActionBtn,
                          { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                        ]}
                        onPress={() => {
                          if (quickUpiResult?.upiUri) {
                            Share.share({
                              message: `Pay ${description || 'bill'} (${quickUpiResult.isConverted ? `₹${moneyToDecimalString(createMoney(quickUpiResult.inrAmountMinor!, 'INR'))} INR` : `${amountStr} ${currency}`}) via UPI: ${quickUpiResult.upiUri}`,
                              title: 'Quick Bill Payment',
                            });
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Share UPI payment link"
                      >
                        <Share2 size={14} color={theme.textPrimary} />
                        <Text style={[styles.upiActionBtnText, { color: theme.textPrimary }]}>
                          Share Link
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.upiActionBtn,
                          { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                        ]}
                        onPress={() => {
                          showAlert('UPI ID', effectiveVpa, [{ text: 'OK' }]);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="View UPI ID"
                      >
                        <Copy size={14} color={theme.textPrimary} />
                        <Text style={[styles.upiActionBtnText, { color: theme.textPrimary }]}>
                          Copy ID
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Validation & Execution Error Banner */}
          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: theme.surfaceSecondary, borderColor: theme.statusDanger, marginBottom: spacing.md }]}>
              <AlertCircle size={16} color={theme.statusDanger} />
              <Text style={[styles.errorBannerText, { color: theme.statusDanger }]}>{errorMessage}</Text>
            </View>
          )}

          {/* Issue Button */}
          <Pressable
            style={({ pressed }) => [
              styles.issueButton,
              {
                backgroundColor: theme.brandAnchor,
                opacity: pressed || loading ? 0.9 : 1,
              },
            ]}
            disabled={loading}
            onPress={handleIssueQuickBill}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={theme.brandAnchorText} />
            ) : (
              <>
                <Zap color={theme.brandAnchorText} size={20} fill={theme.brandAnchorText} />
                <Text style={[styles.issueButtonText, { color: theme.brandAnchorText }]}>
                  {isPaidNow ? 'Create, Issue & Settle' : 'Create & Issue Invoice'}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        {/* Customer Picker Modal */}
        <CustomerPickerModal
          visible={showCustomerPicker}
          onClose={() => setShowCustomerPicker(false)}
          onSelectCustomer={(c: CustomerRecord) => {
            setCustomer(c);
            setQuickCustomerName(c.name);
            setShowCustomerPicker(false);
          }}
        />
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
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E3',
  },
  backButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  customerInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
  },
  pickerButton: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pickerBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  selectedCustomerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  customerBiz: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  smallChangeBtn: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  smallChangeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  amountInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  paidToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidToggleText: {
    flex: 1,
  },
  paidTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  paidSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  methodStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E3',
  },
  methodChip: {
    flex: 1,
    height: 38,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodChipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  issueButton: {
    height: 54,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  issueButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  upiCounterCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  upiCounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  upiCounterTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  zeroFeeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upiCounterSub: {
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.sm,
  },
  upiQrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    marginVertical: spacing.xs,
  },
  fxBanner: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    alignItems: 'center',
  },
  fxTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#059669',
  },
  fxDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  upiDetailsBlock: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  upiPayeeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  upiVpaText: {
    fontSize: 12,
    marginTop: 2,
  },
  upiActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  upiActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.sm,
    minHeight: 38,
  },
  upiActionBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  currencySection: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  currencyStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  currencyChip: {
    flex: 1,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyChipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  fxWarningCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    gap: 4,
  },
  fxWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  refreshFxBtn: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  refreshFxText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  fxWarningTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  fxWarningDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  switchInrBtn: {
    marginTop: 4,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchInrBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineConfigBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
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
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  editUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  editUpiText: {
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
  emptyQrBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModeNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  noUpiWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  noUpiText: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    lineHeight: 16,
  },
});
