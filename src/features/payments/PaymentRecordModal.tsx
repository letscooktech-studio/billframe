/**
 * PAYMENT RECORD MODAL
 * Production sheet for recording manual partial or full payments against an invoice.
 * Rejects overpayments, validates amount, allocates sequential receipt,
 * and freezes receipt snapshot atomically.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';
import {
  formatMoney,
  moneyToDecimalString,
  parseDecimalStringToMoney,
  createMoney,
} from '../../domain/money/Money';
import { PaymentRepository, PaymentRecord, ReceiptRecord } from '../../data/repositories/PaymentRepository';

export interface PaymentRecordModalProps {
  visible: boolean;
  invoiceId: string;
  invoiceNumber: string;
  currency: string;
  totalMinor: number;
  balanceMinor: number;
  documentLocale?: string;
  onPaymentRecorded: (result: { payment: PaymentRecord; receipt: ReceiptRecord }) => void;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'upi', label: 'UPI' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'other', label: 'Other' },
];

export function PaymentRecordModal({
  visible,
  invoiceId,
  invoiceNumber,
  currency,
  totalMinor,
  balanceMinor,
  documentLocale = 'en-US',
  onPaymentRecorded,
  onClose,
}: PaymentRecordModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isSubmittingRef.current = false;
      // Default amount to full remaining balance for one-tap convenience
      const balMoney = createMoney(BigInt(balanceMinor), currency);
      setAmountStr(moneyToDecimalString(balMoney));
      setPaymentMethod('bank_transfer');
      setReference('');
      setNotes('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible, balanceMinor, currency]);

  function handleFillFullBalance() {
    const balMoney = createMoney(BigInt(balanceMinor), currency);
    setAmountStr(moneyToDecimalString(balMoney));
    setError(null);
  }

  async function handleRecordPayment() {
    if (isSubmittingRef.current) return;
    setError(null);

    let parsedAmountMinor = 0n;
    try {
      const money = parseDecimalStringToMoney(amountStr, currency);
      parsedAmountMinor = money.amountMinor;
    } catch {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (parsedAmountMinor <= 0n) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (parsedAmountMinor > BigInt(balanceMinor)) {
      setError(
        `Amount cannot exceed the remaining balance (${formatMoney(createMoney(BigInt(balanceMinor), currency), documentLocale)}).`
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const result = await PaymentRepository.recordPayment({
        invoiceId,
        amountMinor: parsedAmountMinor,
        paymentMethod,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        paymentDate: Date.now(),
      });

      onPaymentRecorded(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const remainingBalanceMoney = createMoney(BigInt(balanceMinor), currency);
  const totalInvoiceMoney = createMoney(BigInt(totalMinor), currency);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Record Payment</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Invoice {invoiceNumber}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close payment recorder"
            >
              <X color={theme.textPrimary} size={22} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Balance Overview Card */}
            <View style={[styles.balanceCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
              <View style={styles.balanceCol}>
                <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Remaining Balance</Text>
                <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
                  {formatMoney(remainingBalanceMoney, documentLocale)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceCol}>
                <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Invoice Total</Text>
                <Text style={[styles.invoiceTotalValue, { color: theme.textSecondary }]}>
                  {formatMoney(totalInvoiceMoney, documentLocale)}
                </Text>
              </View>
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.statusDanger }]}>
                <AlertCircle color={theme.statusDanger} size={16} />
                <Text style={[styles.errorText, { color: theme.statusDanger }]}>{error}</Text>
              </View>
            )}

            {/* Payment Amount Input */}
            <View style={styles.inputHeaderRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Payment Amount ({currency}) *</Text>
              <Pressable
                onPress={handleFillFullBalance}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Fill full remaining balance"
              >
                <Text style={[styles.quickFillText, { color: theme.brandAnchor }]}>Pay Full Balance</Text>
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.input,
                { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
              ]}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              autoFocus
              accessibilityLabel={`Payment amount in ${currency}`}
            />

            {/* Payment Method Selector */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Payment Method *</Text>
            <View style={styles.methodGrid}>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <Pressable
                    key={method.id}
                    style={[
                      styles.methodChip,
                      {
                        borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                        backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                      },
                    ]}
                    onPress={() => setPaymentMethod(method.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Payment method ${method.label}`}
                  >
                    {isSelected && <CheckCircle size={14} color={theme.brandAnchor} />}
                    <Text
                      style={[
                        styles.methodChipText,
                        { color: isSelected ? theme.textPrimary : theme.textSecondary, fontWeight: isSelected ? '600' : '400' },
                      ]}
                    >
                      {method.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Transaction / Reference ID */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Reference / Transaction ID (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
              ]}
              placeholder="e.g. UTR #129384, Cheque #4021"
              placeholderTextColor={theme.textMuted}
              value={reference}
              onChangeText={setReference}
              accessibilityLabel="Reference or transaction identifier"
            />

            {/* Payment Notes */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
              ]}
              placeholder="Additional payment notes or terms..."
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              accessibilityLabel="Payment notes"
            />

            {/* Submit Action */}
            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: theme.brandAnchor, opacity: isSubmitting ? 0.7 : 1 },
              ]}
              onPress={handleRecordPayment}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Confirm and record payment"
              accessibilityHint="Saves payment, updates invoice balance, and issues an official receipt"
            >
              <Text style={[styles.submitBtnText, { color: theme.surface }]}>
                {isSubmitting ? 'Recording...' : 'Record Payment & Generate Receipt'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
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
  headerTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  balanceCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  balanceLabel: {
    fontSize: typography.caption.fontSize,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  invoiceTotalValue: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    flex: 1,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginTop: 4,
  },
  quickFillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: typography.input.fontSize,
  },
  notesInput: {
    minHeight: 64,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    textAlignVertical: 'top',
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: typography.caption.fontSize,
  },
  submitBtn: {
    minHeight: 50,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  submitBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
});
