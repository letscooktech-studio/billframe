/**
 * QUICK BILL SCREEN
 * 30-second mobile billing flow for field contractors, freelancers, and tradespeople.
 * Customer + description + amount -> instant issued invoice + optional immediate receipt.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, Check, UserPlus, CreditCard } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../design/tokens';
import { CustomerRepository, CustomerRecord } from '../data/repositories/CustomerRepository';
import { DocumentRepository } from '../data/repositories/DocumentRepository';
import { PaymentRepository } from '../data/repositories/PaymentRepository';
import { DatabaseManager } from '../data/database/DatabaseManager';
import { parseDecimalStringToMoney } from '../domain/money/Money';
import { CustomerPickerModal } from '../features/customers/CustomerPickerModal';

export default function QuickBillScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isPaidNow, setIsPaidNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'upi' | 'card'>('cash');
  const [loading, setLoading] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  useEffect(() => {
    async function loadDefaults() {
      try {
        const db = await DatabaseManager.getDatabaseAsync();
        const profile = await db.getFirstAsync<{ default_currency: string }>(
          'SELECT default_currency FROM business_profiles WHERE is_active = 1 LIMIT 1;'
        );
        if (profile?.default_currency) {
          setCurrency(profile.default_currency);
        }
      } catch {
        // Fallback to USD
      }
    }
    loadDefaults();
  }, []);

  const handleIssueQuickBill = async () => {
    const custName = customer?.name || quickCustomerName.trim();
    if (!custName) {
      Alert.alert('Customer Required', 'Please select a customer or type a customer name.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please enter a brief description for this bill.');
      return;
    }

    let parsedAmountMinor = 0n;
    try {
      const money = parseDecimalStringToMoney(amountStr.trim(), currency);
      parsedAmountMinor = money.amountMinor;
      if (parsedAmountMinor <= 0n) {
        throw new Error();
      }
    } catch {
      Alert.alert('Invalid Amount', 'Please enter a valid billing amount greater than zero.');
      return;
    }

    setLoading(true);
    try {
      // 1. Resolve or create customer
      let targetCustomer = customer;
      if (!targetCustomer) {
        targetCustomer = await CustomerRepository.createCustomer({
          name: custName,
        });
      }

      // 2. Create and autosave draft invoice
      const draft = await DocumentRepository.saveDraft({
        customerId: targetCustomer.id,
        docType: 'invoice',
        currency,
        issueDate: Date.now(),
        items: [
          {
            description: description.trim(),
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
      Alert.alert('Error Creating Bill', err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
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

            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>
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
                {(['cash', 'upi', 'bank_transfer', 'card'] as const).map((method) => {
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
                          { color: active ? theme.surface : theme.textPrimary },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

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
              <ActivityIndicator color={theme.surface} />
            ) : (
              <>
                <Zap color={theme.surface} size={20} fill={theme.surface} />
                <Text style={[styles.issueButtonText, { color: theme.surface }]}>
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
});
