/**
 * PAYMENT-LINKED RECEIPT SCREEN
 * Official receipt viewer backed by frozen immutable receipt snapshot.
 * Displays receipt number, amount paid, payment method, transaction reference,
 * and links back to the originating invoice with authoritative balance.
 * 
 * Flattened layout: clean whitespace, subtle hairline dividers,
 * dynamic 200% font scaling resilience, and TalkBack accessibility semantics.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Receipt,
  FileText,
  Calendar,
  CreditCard,
  Hash,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { PaymentRepository, ReceiptRecord } from '../../data/repositories/PaymentRepository';
import { createMoney, formatMoney } from '../../domain/money/Money';

export default function ReceiptDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Android hardware back handler
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    async function loadReceipt() {
      if (!id) return;
      try {
        const record = await PaymentRepository.getReceiptById(id);
        if (record) {
          setReceipt(record);
          setSnapshot(JSON.parse(record.receipt_snapshot_json));
        }
      } catch {
        // Non-blocking
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [id]);

  if (loading || !receipt || !snapshot) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const amountMoney = createMoney(BigInt(snapshot.amountMinor), snapshot.currency);
  const invoiceTotalMoney = createMoney(BigInt(snapshot.invoiceReference.totalMinor), snapshot.currency);
  const remainingBalMoney = createMoney(BigInt(snapshot.invoiceReference.remainingBalanceMinor), snapshot.currency);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={theme.textPrimary} size={22} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>{receipt.receipt_number}</Text>
          <Text style={[styles.topBarSubtitle, { color: theme.textSecondary }]}>Payment receipt</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Main Continuous Receipt Sheet */}
          <View style={[styles.sheetSurface, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {/* 1. Header & Amount Received */}
            <View style={styles.sectionBlock}>
              <View style={styles.receiptBadgeRow}>
                <View style={[styles.receiptBadge, { borderColor: theme.statusSuccess, backgroundColor: theme.surfaceSecondary }]}>
                  <Receipt color={theme.statusSuccess} size={14} />
                  <Text style={[styles.receiptBadgeText, { color: theme.statusSuccess }]}>Payment confirmed</Text>
                </View>
              </View>

              <View style={styles.amountDisplay}>
                <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Amount received</Text>
                <Text
                  style={[styles.amountValue, { color: theme.statusSuccess }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(amountMoney)}
                </Text>
              </View>

              <View style={[styles.detailsGrid, { borderTopColor: theme.borderSubtle }]}>
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <Calendar size={14} color={theme.textMuted} />
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Payment date</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                    {new Date(snapshot.paymentDate).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <CreditCard size={14} color={theme.textMuted} />
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Payment method</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                    {snapshot.paymentMethod.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                {snapshot.reference && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Hash size={14} color={theme.textMuted} />
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Reference / UTR</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{snapshot.reference}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Hairline Divider */}
            <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 2. Applied to Invoice */}
            <View style={styles.sectionBlock}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Applied to invoice</Text>
                <Pressable
                  style={styles.invoiceLinkBtn}
                  onPress={() => router.push(`/document/${snapshot.invoiceReference.id}`)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`View invoice ${snapshot.invoiceReference.number}`}
                >
                  <Text style={[styles.invoiceLinkText, { color: theme.brandAnchor }]}>View Invoice</Text>
                  <ChevronRight size={14} color={theme.brandAnchor} />
                </Pressable>
              </View>

              <View style={styles.invoiceInfoRow}>
                <FileText size={20} color={theme.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invoiceNumber, { color: theme.textPrimary }]}>
                    Invoice {snapshot.invoiceReference.number}
                  </Text>
                  <Text style={[styles.invoiceSub, { color: theme.textSecondary }]}>
                    Invoice total: {formatMoney(invoiceTotalMoney)}
                  </Text>
                </View>
              </View>

              <View style={[styles.balanceDivider, { backgroundColor: theme.borderSubtle }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Remaining invoice balance</Text>
                <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
                  {formatMoney(remainingBalMoney)}
                </Text>
              </View>
            </View>

            {/* 3. Customer (Buyer) Snapshot */}
            {snapshot.buyer && (
              <>
                <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Received from</Text>
                  <Text style={[styles.customerName, { color: theme.textPrimary }]}>{snapshot.buyer.name}</Text>
                  {snapshot.buyer.businessName && (
                    <Text style={[styles.customerSub, { color: theme.textSecondary }]}>
                      {snapshot.buyer.businessName}
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* 4. Notes (if any) */}
            {snapshot.notes && (
              <>
                <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Payment notes</Text>
                  <Text style={[styles.notesText, { color: theme.textPrimary }]}>{snapshot.notes}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  topBarSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.lg,
  },
  sheetSurface: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  sectionBlock: {
    padding: spacing.lg,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  receiptBadgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  receiptBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountDisplay: {
    marginBottom: spacing.md,
  },
  amountLabel: {
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  detailsGrid: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: typography.supporting.fontSize,
  },
  detailValue: {
    fontSize: typography.supporting.fontSize,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  invoiceLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  invoiceLinkText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  invoiceNumber: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  invoiceSub: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  balanceDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  balanceValue: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  customerName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    marginTop: 4,
  },
  customerSub: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  notesText: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
    marginTop: 4,
  },
});
