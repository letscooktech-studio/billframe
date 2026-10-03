/**
 * MONEY & FINANCIAL CONTROL PLANE
 * Dedicated financial dashboard unifying Collections Hub, Outstanding Receivables,
 * Payments Ledger, Expense Tracking, and Cash Flow Reports.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  QrCode,
  DollarSign,
  Plus,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { formatMoney, createMoney } from '../../domain/money/Money';

interface RecentPaymentItem {
  id: string;
  invoice_id: string;
  document_number: string;
  customer_name: string;
  amount_minor: number;
  payment_method: string;
  reference: string | null;
  payment_date: number;
}

interface OutstandingInvoiceItem {
  id: string;
  document_number: string;
  customer_name: string;
  balance_minor: number;
  currency: string;
  due_date: number | null;
}

export default function MoneyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [currency, setCurrency] = useState('USD');
  const [locale, setLocale] = useState('en-US');
  const [outstandingMinor, setOutstandingMinor] = useState(0n);
  const [paidThisMonthMinor, setPaidThisMonthMinor] = useState(0n);
  const [expensesThisMonthMinor, setExpensesThisMonthMinor] = useState(0n);
  const [overdueCount, setOverdueCount] = useState(0);

  const [outstandingDocs, setOutstandingDocs] = useState<OutstandingInvoiceItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPaymentItem[]>([]);

  const loadFinancialData = useCallback(async (isMounted: () => boolean) => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      // 1. Currency & locale
      const profile = await db.getFirstAsync<{
        default_currency: string;
        default_document_locale: string;
      }>('SELECT default_currency, default_document_locale FROM business_profiles WHERE is_active = 1 LIMIT 1;');

      if (profile && isMounted()) {
        setCurrency(profile.default_currency);
        setLocale(profile.default_document_locale || 'en-US');
      }

      // 2. Metrics
      const metrics = await DocumentRepository.getHomeDashboardMetricsAsync();
      if (isMounted()) {
        setOutstandingMinor(metrics.outstandingMinor);
        setPaidThisMonthMinor(metrics.paidThisMonthMinor);
      }

      // 3. Expenses this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const expenseRow = await db.getFirstAsync<{ total_expenses: number }>(
        `SELECT COALESCE(SUM(amount_minor), 0) AS total_expenses
         FROM expenses
         WHERE expense_date >= ?;`,
        [startOfMonth.getTime()]
      );
      if (isMounted()) {
        setExpensesThisMonthMinor(BigInt(Math.round(expenseRow?.total_expenses || 0)));
      }

      // 4. Outstanding invoices
      const now = Date.now();
      const docs = await db.getAllAsync<OutstandingInvoiceItem>(
        `SELECT d.id, d.document_number, COALESCE(c.name, 'Unknown Customer') AS customer_name,
                d.balance_minor, d.currency, d.due_date
         FROM documents d
         LEFT JOIN customers c ON d.customer_id = c.id
         WHERE d.doc_type = 'invoice' AND d.lifecycle_status = 'issued' AND d.balance_minor > 0 AND d.is_archived = 0
         ORDER BY d.due_date ASC
         LIMIT 4;`
      );
      if (isMounted()) {
        setOutstandingDocs(docs || []);
        const overdue = (docs || []).filter((d) => d.due_date && d.due_date < now).length;
        setOverdueCount(overdue);
      }

      // 5. Recent payments
      const payments = await db.getAllAsync<RecentPaymentItem>(
        `SELECT p.id, p.invoice_id, d.document_number, COALESCE(c.name, 'Customer') AS customer_name,
                p.amount_minor, p.payment_method, p.reference, p.payment_date
         FROM payments p
         JOIN documents d ON p.invoice_id = d.id
         LEFT JOIN customers c ON d.customer_id = c.id
         ORDER BY p.payment_date DESC
         LIMIT 5;`
      );
      if (isMounted()) {
        setRecentPayments(payments || []);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadFinancialData(() => active);
      return () => {
        active = false;
      };
    }, [loadFinancialData])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Money</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Financial Hub & Collections
            </Text>
          </View>

          {/* Balance Cards Summary */}
          <View style={styles.summaryGrid}>
            {/* Outstanding Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Outstanding Receivables</Text>
              <Text style={[styles.summaryAmount, { color: theme.textPrimary }]}>
                {formatMoney({ amountMinor: outstandingMinor, currency }, locale)}
              </Text>
              {overdueCount > 0 && (
                <View style={styles.overdueBadge}>
                  <AlertCircle color={theme.statusDanger} size={13} />
                  <Text style={[styles.overdueText, { color: theme.statusDanger }]}>
                    {overdueCount} overdue
                  </Text>
                </View>
              )}
            </View>

            {/* Collected vs Expense Row */}
            <View style={styles.twoColRow}>
              <View style={[styles.summaryCardSmall, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.summaryLabelSmall, { color: theme.textSecondary }]}>Collected This Month</Text>
                <Text style={[styles.summaryAmountSmall, { color: theme.statusSuccess }]}>
                  {formatMoney({ amountMinor: paidThisMonthMinor, currency }, locale)}
                </Text>
              </View>

              <View style={[styles.summaryCardSmall, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.summaryLabelSmall, { color: theme.textSecondary }]}>Expenses This Month</Text>
                <Text style={[styles.summaryAmountSmall, { color: theme.textPrimary }]}>
                  {formatMoney({ amountMinor: expensesThisMonthMinor, currency }, locale)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Hub Navigation Cards */}
          <View style={styles.hubGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.hubCard,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/collections')}
              accessibilityRole="button"
              accessibilityLabel="Open Collections Hub"
            >
              <View style={[styles.hubIconBox, { backgroundColor: theme.surfaceSecondary }]}>
                <Clock color={theme.brandAnchor} size={20} />
              </View>
              <View style={styles.hubTextWrap}>
                <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>Collections Hub</Text>
                <Text style={[styles.hubCardDesc, { color: theme.textSecondary }]}>
                  Aging analysis, payment reminders & overdue tracking
                </Text>
              </View>
              <ChevronRight color={theme.textMuted} size={18} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.hubCard,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/expenses')}
              accessibilityRole="button"
              accessibilityLabel="Open Expenses"
            >
              <View style={[styles.hubIconBox, { backgroundColor: theme.surfaceSecondary }]}>
                <Receipt color={theme.brandAnchor} size={20} />
              </View>
              <View style={styles.hubTextWrap}>
                <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>Expenses</Text>
                <Text style={[styles.hubCardDesc, { color: theme.textSecondary }]}>
                  Track business receipts, categories & operational spend
                </Text>
              </View>
              <ChevronRight color={theme.textMuted} size={18} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.hubCard,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/reports')}
              accessibilityRole="button"
              accessibilityLabel="Open Reports"
            >
              <View style={[styles.hubIconBox, { backgroundColor: theme.surfaceSecondary }]}>
                <FileSpreadsheet color={theme.brandAnchor} size={20} />
              </View>
              <View style={styles.hubTextWrap}>
                <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>Reports & Tax Summary</Text>
                <Text style={[styles.hubCardDesc, { color: theme.textSecondary }]}>
                  Revenue, cash flow statements & GST/Tax summaries
                </Text>
              </View>
              <ChevronRight color={theme.textMuted} size={18} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.hubCard,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/settings/payments')}
              accessibilityRole="button"
              accessibilityLabel="Payment Gateway and UPI Settings"
            >
              <View style={[styles.hubIconBox, { backgroundColor: theme.surfaceSecondary }]}>
                <QrCode color={theme.brandAnchor} size={20} />
              </View>
              <View style={styles.hubTextWrap}>
                <Text style={[styles.hubCardTitle, { color: theme.textPrimary }]}>Payment Gateways & UPI</Text>
                <Text style={[styles.hubCardDesc, { color: theme.textSecondary }]}>
                  Offline UPI QR codes, Razorpay, Cashfree & Stripe
                </Text>
              </View>
              <ChevronRight color={theme.textMuted} size={18} />
            </Pressable>
          </View>

          {/* Outstanding Documents Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pending Invoices</Text>
            {outstandingDocs.length > 0 && (
              <Pressable onPress={() => router.push('/collections')}>
                <Text style={[styles.sectionLink, { color: theme.brandAnchor }]}>View all in Collections</Text>
              </Pressable>
            )}
          </View>

          {outstandingDocs.length === 0 ? (
            <View style={[styles.emptySection, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <CheckCircle2 color={theme.statusSuccess} size={28} />
              <Text style={[styles.emptySectionText, { color: theme.textSecondary }]}>
                All issued invoices are completely paid. Zero outstanding balances.
              </Text>
            </View>
          ) : (
            <View style={[styles.listWrapper, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {outstandingDocs.map((doc, idx) => {
                const isOverdue = doc.due_date && doc.due_date < Date.now();
                return (
                  <Pressable
                    key={doc.id}
                    style={({ pressed }) => [
                      styles.docRow,
                      idx < outstandingDocs.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => router.push(`/document/${doc.id}`)}
                  >
                    <View style={styles.docLeft}>
                      <Text style={[styles.docNumber, { color: theme.textPrimary }]}>{doc.document_number}</Text>
                      <Text style={[styles.docCustomer, { color: theme.textSecondary }]} numberOfLines={1}>
                        {doc.customer_name}
                      </Text>
                    </View>
                    <View style={styles.docRight}>
                      <Text style={[styles.docAmount, { color: theme.textPrimary }]}>
                        {formatMoney({ amountMinor: BigInt(Math.round(doc.balance_minor || 0)), currency: doc.currency }, locale)}
                      </Text>
                      {isOverdue && (
                        <Text style={[styles.docOverdue, { color: theme.statusDanger }]}>Overdue</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Recent Payments Section */}
          <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Payments Recorded</Text>
          </View>

          {recentPayments.length === 0 ? (
            <View style={[styles.emptySection, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <CreditCard color={theme.textMuted} size={28} />
              <Text style={[styles.emptySectionText, { color: theme.textSecondary }]}>
                No payments recorded yet. Record payments from the invoice viewer or collections.
              </Text>
            </View>
          ) : (
            <View style={[styles.listWrapper, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {recentPayments.map((p, idx) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [
                    styles.docRow,
                    idx < recentPayments.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => router.push(`/document/${p.invoice_id}`)}
                >
                  <View style={styles.docLeft}>
                    <Text style={[styles.docNumber, { color: theme.textPrimary }]}>
                      {p.document_number} • {p.payment_method.toUpperCase()}
                    </Text>
                    <Text style={[styles.docCustomer, { color: theme.textSecondary }]} numberOfLines={1}>
                      {p.customer_name} {p.reference ? `(${p.reference})` : ''}
                    </Text>
                  </View>
                  <View style={styles.docRight}>
                    <Text style={[styles.docAmount, { color: theme.statusSuccess }]}>
                      +{formatMoney({ amountMinor: BigInt(Math.round(p.amount_minor || 0)), currency }, locale)}
                    </Text>
                    <Text style={[styles.docDate, { color: theme.textMuted }]}>
                      {new Date(p.payment_date).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  container: {
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingVertical: spacing.md,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
  },
  screenSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  summaryGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  overdueText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCardSmall: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  summaryLabelSmall: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  summaryAmountSmall: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  hubGrid: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  hubIconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  hubTextWrap: {
    flex: 1,
  },
  hubCardTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  hubCardDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  sectionLink: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  emptySectionText: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  listWrapper: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  docLeft: {
    flex: 1,
  },
  docNumber: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  docCustomer: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  docRight: {
    alignItems: 'flex-end',
  },
  docAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  docOverdue: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  docDate: {
    fontSize: 11,
    marginTop: 2,
  },
});
