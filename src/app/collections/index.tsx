/**
 * COLLECTIONS & AGING HUB SCREEN
 * Dedicated accounts receivable tracking, aging bucket breakdown,
 * and 1-tap WhatsApp / SMS payment reminders with dynamic UPI integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MessageCircle,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { AgingEngine } from '../../domain/collections/AgingEngine';
import { OutstandingEngine } from '../../domain/collections/OutstandingEngine';
import { ReminderEngine } from '../../domain/collections/ReminderEngine';
import { AgingBucket, AgingReport, InvoiceAgingRecord } from '../../domain/collections/CollectionTypes';
import { DirectUpiEngine } from '../../domain/payments/upi/DirectUpiEngine';
import { createMoney, formatMoney } from '../../domain/money/Money';
import { PaymentRecordModal } from '../../features/payments/PaymentRecordModal';
import { FeatureIntroductionSheet } from '../../components/common/FeatureIntroductionSheet';

export default function CollectionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  const [activeBucket, setActiveBucket] = useState<'all' | AgingBucket>('all');

  // Payment Recording Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceAgingRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const activeProf = await BusinessProfileRepository.getActiveProfile();
      setProfile(activeProf);

      const rawInvoices = await DocumentRepository.getIssuedInvoicesForAgingAsync();
      const report = AgingEngine.calculateAging(rawInvoices);
      setAgingReport(report);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSendWhatsApp = (inv: InvoiceAgingRecord) => {
    let upiUri: string | null = null;
    if (inv.currency === 'INR' && profile?.upi_vpa) {
      try {
        upiUri = DirectUpiEngine.buildUpiUri({
          vpa: profile.upi_vpa,
          payeeName: profile.legal_name || profile.name || 'Merchant',
          amountMinor: inv.balanceMinor,
          currency: 'INR',
          transactionRef: inv.invoiceNumber,
          transactionNote: `Invoice ${inv.invoiceNumber}`,
        });
      } catch {
        upiUri = null;
      }
    }

    const reminder = ReminderEngine.generateReminder({
      customerName: inv.customerName,
      businessName: profile?.legal_name || profile?.name || 'Billframe Business',
      invoiceNumber: inv.invoiceNumber,
      amountMinor: inv.balanceMinor,
      currency: inv.currency,
      dueDate: inv.dueDate,
      daysOverdue: inv.daysOverdue,
      customerPhone: inv.customerPhone,
      upiVpa: profile?.upi_vpa,
      upiUri: upiUri,
      bankDetails: profile?.default_payment_terms || null,
    });

    if (reminder.whatsAppLink) {
      Linking.openURL(reminder.whatsAppLink).catch(() => {
        Alert.alert('Cannot Open WhatsApp', 'Please ensure WhatsApp is installed on this device.');
      });
    } else {
      Alert.alert(
        'Missing Customer Phone',
        `No valid phone number found for ${inv.customerName}. Please update the customer profile.`
      );
    }
  };

  const handleSendSms = (inv: InvoiceAgingRecord) => {
    const reminder = ReminderEngine.generateReminder({
      customerName: inv.customerName,
      businessName: profile?.legal_name || profile?.name || 'Billframe Business',
      invoiceNumber: inv.invoiceNumber,
      amountMinor: inv.balanceMinor,
      currency: inv.currency,
      dueDate: inv.dueDate,
      daysOverdue: inv.daysOverdue,
      customerPhone: inv.customerPhone,
      upiVpa: profile?.upi_vpa,
      bankDetails: profile?.default_payment_terms || null,
    });

    if (reminder.smsLink) {
      Linking.openURL(reminder.smsLink).catch(() => {
        Alert.alert('Cannot Open Messaging', 'Could not launch SMS app.');
      });
    } else {
      Alert.alert(
        'Missing Customer Phone',
        `No valid phone number found for ${inv.customerName}.`
      );
    }
  };

  const filteredRecords = (agingReport?.records || []).filter((r) => {
    if (activeBucket === 'all') return true;
    return r.bucket === activeBucket;
  });

  const totalOutstanding = agingReport?.totalOutstandingMinor || 0n;
  const totalOverdue = agingReport?.totalOverdueMinor || 0n;
  const currency = agingReport?.currency || 'USD';

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
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Collections & Aging</Text>
          <Text style={[styles.topBarSubtitle, { color: theme.textSecondary }]}>
            Receivables &amp; Overdue Management
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Summary KPIs */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>TOTAL OUTSTANDING</Text>
              <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
                {formatMoney(createMoney(totalOutstanding, currency))}
              </Text>
              <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
                {agingReport?.records.length || 0} unpaid invoices
              </Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.kpiLabel, { color: theme.statusDanger }]}>TOTAL OVERDUE</Text>
              <Text style={[styles.kpiValue, { color: theme.statusDanger }]}>
                {formatMoney(createMoney(totalOverdue, currency))}
              </Text>
              <Text style={[styles.kpiSub, { color: theme.textMuted }]}>
                {agingReport?.overdueCount || 0} overdue accounts
              </Text>
            </View>
          </View>

          {/* DSO / Average Days Overdue Indicator */}
          {(agingReport?.weightedAverageDaysOverdue || 0) > 0 && (
            <View style={[styles.dsoCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
              <AlertTriangle size={16} color={theme.statusWarning} />
              <Text style={[styles.dsoText, { color: theme.textPrimary }]}>
                Weighted Avg Overdue: <Text style={{ fontWeight: '700' }}>{agingReport?.weightedAverageDaysOverdue} days</Text>
              </Text>
            </View>
          )}

          {/* Bucket Chips Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bucketRow}
          >
            {(
              [
                { id: 'all', label: `All (${agingReport?.records.length || 0})` },
                { id: 'current', label: `Current (${agingReport?.buckets.current.count || 0})` },
                { id: 'overdue_1_30', label: `1-30d (${agingReport?.buckets.overdue_1_30.count || 0})` },
                { id: 'overdue_31_60', label: `31-60d (${agingReport?.buckets.overdue_31_60.count || 0})` },
                { id: 'overdue_61_90', label: `61-90d (${agingReport?.buckets.overdue_61_90.count || 0})` },
                { id: 'overdue_90_plus', label: `90d+ (${agingReport?.buckets.overdue_90_plus.count || 0})` },
              ] as const
            ).map((b) => {
              const isSelected = activeBucket === b.id;
              return (
                <Pressable
                  key={b.id}
                  style={[
                    styles.bucketChip,
                    {
                      backgroundColor: isSelected ? theme.brandAnchor : theme.surface,
                      borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                    },
                  ]}
                  onPress={() => setActiveBucket(b.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${b.label}`}
                >
                  <Text
                    style={[
                      styles.bucketChipText,
                      { color: isSelected ? theme.surface : theme.textPrimary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {b.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Invoices List */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            INVOICES ({filteredRecords.length})
          </Text>

          {filteredRecords.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <CheckCircle2 size={36} color={theme.statusSuccess} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Outstanding Receivables</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                {activeBucket === 'all'
                  ? 'All issued invoices have been settled in full.'
                  : `No invoices currently fall in the ${activeBucket} category.`}
              </Text>
            </View>
          ) : (
            filteredRecords.map((item) => {
              const isOverdue = item.daysOverdue > 0;
              const badgeBg = item.daysOverdue > 30 ? '#fee2e2' : item.daysOverdue > 0 ? '#fef3c7' : '#dcfce7';
              const badgeTextColor = item.daysOverdue > 30 ? '#dc2626' : item.daysOverdue > 0 ? '#d97706' : '#15803d';

              return (
                <View
                  key={item.invoiceId}
                  style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
                >
                  <Pressable
                    onPress={() => router.push(`/document/${item.invoiceId}` as any)}
                    accessibilityRole="button"
                    accessibilityLabel={`View invoice ${item.invoiceNumber}`}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.customerName, { color: theme.textPrimary }]}>{item.customerName}</Text>
                        <Text style={[styles.docNumber, { color: theme.textSecondary }]}>{item.invoiceNumber}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.balanceAmount, { color: theme.brandAnchor }]}>
                          {formatMoney(createMoney(item.balanceMinor, item.currency))}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                            {isOverdue ? `${item.daysOverdue}d overdue` : 'On track'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.dateMetaRow}>
                      <Calendar size={12} color={theme.textMuted} />
                      <Text style={[styles.dateMetaText, { color: theme.textMuted }]}>
                        Due {new Date(item.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </Pressable>

                  {/* 1-Tap Action Bar */}
                  <View style={[styles.actionBar, { borderTopColor: theme.borderSubtle }]}>
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary }]}
                      onPress={() => handleSendWhatsApp(item)}
                      accessibilityRole="button"
                      accessibilityLabel="Send WhatsApp reminder"
                    >
                      <MessageCircle size={14} color="#15803d" />
                      <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>WhatsApp</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary }]}
                      onPress={() => handleSendSms(item)}
                      accessibilityRole="button"
                      accessibilityLabel="Send SMS reminder"
                    >
                      <MessageSquare size={14} color={theme.brandAnchor} />
                      <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>SMS</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary }]}
                      onPress={() => {
                        setSelectedInvoice(item);
                        setShowPaymentModal(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Record payment"
                    >
                      <CreditCard size={14} color={theme.statusSuccess} />
                      <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Receive</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <PaymentRecordModal
          visible={showPaymentModal}
          invoiceId={selectedInvoice.invoiceId}
          invoiceNumber={selectedInvoice.invoiceNumber}
          currency={selectedInvoice.currency}
          totalMinor={Number(selectedInvoice.totalMinor)}
          balanceMinor={Number(selectedInvoice.balanceMinor)}
          onPaymentRecorded={async () => {
            await loadData();
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* Feature Introduction Sheet */}
      <FeatureIntroductionSheet
        featureId="collections"
        title="Collections"
        description="Track overdue balances, send reminders, and accelerate cash flow."
        primaryActionLabel="View Collections"
        onPrimaryAction={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  topBarCenter: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  topBarSubtitle: {
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  container: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
    padding: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
  },
  dsoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  dsoText: {
    fontSize: 13,
  },
  bucketRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: spacing.md,
  },
  bucketChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  bucketChipText: {
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  invoiceCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  docNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  dateMetaText: {
    fontSize: 12,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.xs,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: radii.sm,
    minHeight: MIN_TOUCH_TARGET - 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
