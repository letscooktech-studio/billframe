/**
 * FINANCIAL REPORTS & ANALYTICS
 * Authoritative financial statements, revenue summaries, net profit, and customer ranking.
 * Strict mathematical truth, zero fake graphs or decorative gradients.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, DollarSign, Clock, Users, ArrowUpRight } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { formatMoney, toBigIntSafe } from '../../domain/money/Money';

type PeriodPreset = 'this_month' | 'last_month' | 'this_year' | 'all';

interface CustomerRevenue {
  id: string;
  name: string;
  business_name: string | null;
  total_invoiced_minor: number;
}

interface CategoryExpense {
  category: string;
  total_minor: number;
}

export default function ReportsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [period, setPeriod] = useState<PeriodPreset>('this_month');
  const [currency, setCurrency] = useState('USD');
  const [locale, setLocale] = useState('en-US');

  // Metrics
  const [invoicedMinor, setInvoicedMinor] = useState<bigint>(0n);
  const [collectedMinor, setCollectedMinor] = useState<bigint>(0n);
  const [outstandingMinor, setOutstandingMinor] = useState<bigint>(0n);
  const [overdueMinor, setOverdueMinor] = useState<bigint>(0n);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [expensesMinor, setExpensesMinor] = useState<bigint>(0n);
  const [netProfitMinor, setNetProfitMinor] = useState<bigint>(0n);
  const [topCustomers, setTopCustomers] = useState<CustomerRevenue[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);

  const getDateRange = (preset: PeriodPreset): { start?: number; end?: number } => {
    const now = new Date();
    if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { start };
    }
    if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      return { start, end };
    }
    if (preset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return { start };
    }
    return {};
  };

  const loadReportData = useCallback(async () => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      // Profile settings
      const profile = await db.getFirstAsync<{
        default_currency: string;
        default_document_locale: string;
      }>('SELECT default_currency, default_document_locale FROM business_profiles WHERE is_active = 1 LIMIT 1;');

      const cur = profile?.default_currency || 'USD';
      const loc = profile?.default_document_locale || 'en-US';
      setCurrency(cur);
      setLocale(loc);

      const { start, end } = getDateRange(period);

      // Invoiced in period
      let invSql = `SELECT COALESCE(SUM(total_minor), 0) AS sum_total
                    FROM documents
                    WHERE doc_type = 'invoice' AND lifecycle_status != 'draft' AND lifecycle_status != 'void' AND is_archived = 0`;
      const invParams: any[] = [];
      if (start) {
        invSql += ' AND issue_date >= ?';
        invParams.push(start);
      }
      if (end) {
        invSql += ' AND issue_date <= ?';
        invParams.push(end);
      }
      const invRow = await db.getFirstAsync<{ sum_total: number }>(invSql, invParams);
      const totalInvoiced = toBigIntSafe(invRow?.sum_total);
      setInvoicedMinor(totalInvoiced);

      // Collected payments in period
      let paySql = 'SELECT COALESCE(SUM(amount_minor), 0) AS sum_paid FROM payments';
      const payParams: any[] = [];
      if (start || end) {
        paySql += ' WHERE 1=1';
        if (start) {
          paySql += ' AND payment_date >= ?';
          payParams.push(start);
        }
        if (end) {
          paySql += ' AND payment_date <= ?';
          payParams.push(end);
        }
      }
      const payRow = await db.getFirstAsync<{ sum_paid: number }>(paySql, payParams);
      const totalCollected = toBigIntSafe(payRow?.sum_paid);
      setCollectedMinor(totalCollected);

      // Expenses in period
      let expSql = 'SELECT COALESCE(SUM(amount_minor), 0) AS sum_exp FROM expenses';
      const expParams: any[] = [];
      if (start || end) {
        expSql += ' WHERE 1=1';
        if (start) {
          expSql += ' AND expense_date >= ?';
          expParams.push(start);
        }
        if (end) {
          expSql += ' AND expense_date <= ?';
          expParams.push(end);
        }
      }
      const expRow = await db.getFirstAsync<{ sum_exp: number }>(expSql, expParams);
      const totalExpenses = toBigIntSafe(expRow?.sum_exp);
      setExpensesMinor(totalExpenses);

      // Net profit = Cash Collected - Cash Expenses
      setNetProfitMinor(totalCollected - totalExpenses);

      // Total Outstanding across all active invoices (all-time snapshot)
      const outRow = await db.getFirstAsync<{ outstanding: number }>(
        `SELECT COALESCE(SUM(
            d.total_minor - COALESCE((
              SELECT SUM(p.amount_minor) FROM payments p WHERE p.invoice_id = d.id
            ), 0)
          ), 0) AS outstanding
         FROM documents d
         WHERE d.doc_type = 'invoice' AND d.lifecycle_status = 'issued' AND d.is_archived = 0;`
      );
      setOutstandingMinor(toBigIntSafe(Math.max(0, outRow?.outstanding || 0)));

      // Overdue invoices (due_date < now, balance > 0)
      const nowTs = Date.now();
      const overdueDocs = await db.getAllAsync<{ id: string; total_minor: number; due_date: number }>(
        `SELECT d.id, d.total_minor, d.due_date
         FROM documents d
         WHERE d.doc_type = 'invoice'
           AND d.lifecycle_status = 'issued'
           AND d.due_date IS NOT NULL
           AND d.due_date < ?
           AND d.is_archived = 0;`,
        [nowTs]
      );

      let sumOverdue = 0n;
      let cntOverdue = 0;
      for (const d of overdueDocs) {
        const pRow = await db.getFirstAsync<{ sum_paid: number }>(
          'SELECT COALESCE(SUM(amount_minor), 0) AS sum_paid FROM payments WHERE invoice_id = ?;',
          [d.id]
        );
        const paid = pRow?.sum_paid || 0;
        const bal = d.total_minor - paid;
        if (bal > 0) {
          sumOverdue += toBigIntSafe(bal);
          cntOverdue++;
        }
      }
      setOverdueMinor(sumOverdue);
      setOverdueCount(cntOverdue);

      // Top customers by invoiced revenue
      const topCustRows = await db.getAllAsync<CustomerRevenue>(
        `SELECT c.id, c.name, c.business_name,
                COALESCE(SUM(d.total_minor), 0) AS total_invoiced_minor
         FROM customers c
         JOIN documents d ON d.customer_id = c.id
         WHERE d.doc_type = 'invoice' AND d.lifecycle_status != 'draft' AND d.lifecycle_status != 'void' AND d.is_archived = 0
         GROUP BY c.id
         ORDER BY total_invoiced_minor DESC
         LIMIT 5;`
      );
      setTopCustomers(topCustRows);

      // Category expenses breakdown
      let catSql = `SELECT category, COALESCE(SUM(amount_minor), 0) AS total_minor
                    FROM expenses`;
      const catParams: any[] = [];
      if (start || end) {
        catSql += ' WHERE 1=1';
        if (start) {
          catSql += ' AND expense_date >= ?';
          catParams.push(start);
        }
        if (end) {
          catSql += ' AND expense_date <= ?';
          catParams.push(end);
        }
      }
      catSql += ' GROUP BY category ORDER BY total_minor DESC;';
      const catRows = await db.getAllAsync<CategoryExpense>(catSql, catParams);
      setCategoryExpenses(catRows);
    } catch {
      // Non-blocking
    }
  }, [period]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const periods: { id: PeriodPreset; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

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
          <Text style={[styles.title, { color: theme.textPrimary }]}>Financial Reports</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Period Selector Strip */}
          <View style={styles.periodRow}>
            {periods.map((p) => {
              const active = period === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[
                    styles.periodChip,
                    {
                      backgroundColor: active ? theme.brandAnchor : theme.surface,
                      borderColor: active ? theme.brandAnchor : theme.borderSubtle,
                    },
                  ]}
                  accessibilityRole="button"
                  onPress={() => setPeriod(p.id)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      { color: active ? theme.brandAnchorText : theme.textPrimary },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Core Metrics Grid */}
          <View style={styles.grid}>
            {/* Invoiced */}
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL INVOICED</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {formatMoney({ amountMinor: invoicedMinor, currency }, locale)}
              </Text>
            </View>

            {/* Collected */}
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>CASH COLLECTED</Text>
              <Text style={[styles.statValue, { color: theme.statusSuccess }]}>
                {formatMoney({ amountMinor: collectedMinor, currency }, locale)}
              </Text>
            </View>

            {/* Expenses */}
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>EXPENSES</Text>
              <Text style={[styles.statValue, { color: theme.statusWarning }]}>
                {formatMoney({ amountMinor: expensesMinor, currency }, locale)}
              </Text>
            </View>

            {/* Net Operating Profit */}
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>NET OPERATING CASH</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: netProfitMinor >= 0n ? theme.statusSuccess : theme.statusDanger },
                ]}
              >
                {formatMoney({ amountMinor: netProfitMinor, currency }, locale)}
              </Text>
            </View>
          </View>

          {/* Collections & Aging Health */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Collections & Aging Health</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>CURRENT OUTSTANDING</Text>
                <Text style={[styles.statValue, { color: theme.textPrimary, marginTop: 4 }]}>
                  {formatMoney({ amountMinor: outstandingMinor, currency }, locale)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>OVERDUE ({overdueCount})</Text>
                <Text style={[styles.statValue, { color: theme.statusDanger, marginTop: 4 }]}>
                  {formatMoney({ amountMinor: overdueMinor, currency }, locale)}
                </Text>
              </View>
            </View>
          </View>

          {/* Expenses by Category */}
          {categoryExpenses.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Expenses Breakdown</Text>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                {categoryExpenses.map((c, i) => (
                  <View
                    key={c.category}
                    style={[
                      styles.categoryRow,
                      i < categoryExpenses.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
                    ]}
                  >
                    <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
                      {c.category.toUpperCase()}
                    </Text>
                    <Text style={[styles.categoryAmount, { color: theme.textPrimary }]}>
                      {formatMoney({ amountMinor: toBigIntSafe(c.total_minor), currency }, locale)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Top Revenue Customers</Text>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                {topCustomers.map((cust, i) => (
                  <View
                    key={cust.id}
                    style={[
                      styles.customerRow,
                      i < topCustomers.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
                    ]}
                  >
                    <View style={styles.customerLeft}>
                      <Text style={[styles.customerRank, { color: theme.textMuted }]}>#{i + 1}</Text>
                      <View>
                        <Text style={[styles.customerName, { color: theme.textPrimary }]}>{cust.name}</Text>
                        {cust.business_name && (
                          <Text style={[styles.customerBiz, { color: theme.textSecondary }]}>
                            {cust.business_name}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.customerTotal, { color: theme.textPrimary }]}>
                      {formatMoney({ amountMinor: toBigIntSafe(cust.total_invoiced_minor), currency }, locale)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
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
  title: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodChip: {
    flex: 1,
    height: 38,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    marginTop: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryName: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  categoryAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  customerRank: {
    fontSize: 13,
    fontWeight: '700',
    width: 24,
  },
  customerName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  customerBiz: {
    fontSize: typography.caption.fontSize,
    marginTop: 1,
  },
  customerTotal: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
