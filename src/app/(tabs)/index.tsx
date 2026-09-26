/**
 * HOME SCREEN
 * Compact dashboard with unmistakable primary actions, outstanding/paid summaries,
 * and recent documents list. No fake charts.
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
import { Plus, FileText, ArrowUpRight } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { formatMoney } from '../../domain/money/Money';

interface RecentDocument {
  id: string;
  document_number: string;
  doc_type: string;
  customer_name: string;
  total_minor: number;
  currency: string;
  lifecycle_status: string;
  issue_date: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [outstandingMinor, setOutstandingMinor] = useState<bigint>(0n);
  const [paidThisMonthMinor, setPaidThisMonthMinor] = useState<bigint>(0n);
  const [currency, setCurrency] = useState<string>('USD');
  const [documentLocale, setDocumentLocale] = useState<string>('en-US');
  const [recents, setRecents] = useState<RecentDocument[]>([]);

  const loadData = useCallback(async () => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      // 1. Fetch business profile currency and locale
      const profile = await db.getFirstAsync<{
        default_currency: string;
        default_document_locale: string;
      }>('SELECT default_currency, default_document_locale FROM business_profiles WHERE is_active = 1 LIMIT 1;');

      if (profile) {
        setCurrency(profile.default_currency);
        setDocumentLocale(profile.default_document_locale);
      }

      // 2. Fetch outstanding balance: total of issued invoices minus payments
      const invTotalRow = await db.getFirstAsync<{ sum_total: number }>(
        "SELECT COALESCE(SUM(total_minor), 0) AS sum_total FROM documents WHERE doc_type = 'invoice' AND lifecycle_status = 'issued';"
      );
      const paymentsRow = await db.getFirstAsync<{ sum_paid: number }>(
        'SELECT COALESCE(SUM(amount_minor), 0) AS sum_paid FROM payments;'
      );

      const totalInvoiced = BigInt(invTotalRow?.sum_total || 0);
      const totalPaid = BigInt(paymentsRow?.sum_paid || 0);
      const outstanding = totalInvoiced > totalPaid ? totalInvoiced - totalPaid : 0n;

      setOutstandingMinor(outstanding);

      // 3. Fetch paid this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthPaymentsRow = await db.getFirstAsync<{ sum_paid: number }>(
        'SELECT COALESCE(SUM(amount_minor), 0) AS sum_paid FROM payments WHERE payment_date >= ?;',
        [startOfMonth.getTime()]
      );
      setPaidThisMonthMinor(BigInt(monthPaymentsRow?.sum_paid || 0));

      // 4. Fetch recent documents
      const recentDocs = await db.getAllAsync<RecentDocument>(
        `SELECT d.id, d.document_number, d.doc_type, COALESCE(c.name, 'No customer') AS customer_name,
                d.total_minor, d.currency, d.lifecycle_status, d.issue_date
         FROM documents d
         LEFT JOIN customers c ON d.customer_id = c.id
         WHERE d.is_archived = 0
         ORDER BY d.created_at DESC
         LIMIT 5;`
      );
      setRecents(recentDocs);
    } catch {
      // Non-blocking: will display zero states
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Billframe</Text>
            <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>Invoice & Estimate</Text>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.brandAnchor, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create new invoice"
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
            >
              <Plus color={theme.surface} size={18} strokeWidth={2.5} />
              <Text style={[styles.primaryButtonText, { color: theme.surface }]}>New Invoice</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create new estimate"
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'estimate' } })}
            >
              <Plus color={theme.textPrimary} size={18} strokeWidth={2.5} />
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>New Estimate</Text>
            </Pressable>
          </View>

          {/* Financial Summary */}
          <View style={[styles.summaryContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Outstanding</Text>
              <Text style={[styles.summaryAmount, { color: theme.textPrimary }]}>
                {formatMoney({ amountMinor: outstandingMinor, currency }, documentLocale)}
              </Text>
            </View>

            <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Paid This Month</Text>
              <Text style={[styles.summaryAmount, { color: theme.statusSuccess }]}>
                {formatMoney({ amountMinor: paidThisMonthMinor, currency }, documentLocale)}
              </Text>
            </View>
          </View>

          {/* Recent Documents Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Documents</Text>
            {recents.length > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/documents')}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="View all documents"
              >
                <Text style={[styles.sectionLink, { color: theme.brandAnchor }]}>View all</Text>
              </Pressable>
            )}
          </View>

          {recents.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <FileText color={theme.textMuted} size={36} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No invoices yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Create your first invoice to begin tracking billing and payments.
              </Text>
              <Pressable
                style={[styles.emptyButton, { backgroundColor: theme.brandAnchor }]}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
              >
                <Text style={[styles.emptyButtonText, { color: theme.surface }]}>Create Invoice</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.listContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {recents.map((doc, idx) => (
                <Pressable
                  key={doc.id}
                  style={({ pressed }) => [
                    styles.docRow,
                    idx < recents.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => router.push(`/document/${doc.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${doc.document_number}, ${doc.customer_name}`}
                >
                  <View style={styles.docLeft}>
                    <Text style={[styles.docNumber, { color: theme.textPrimary }]}>{doc.document_number}</Text>
                    <Text style={[styles.docCustomer, { color: theme.textSecondary }]} numberOfLines={1}>
                      {doc.customer_name}
                    </Text>
                  </View>
                  <View style={styles.docRight}>
                    <Text style={[styles.docAmount, { color: theme.textPrimary }]}>
                      {formatMoney({ amountMinor: BigInt(doc.total_minor), currency: doc.currency }, documentLocale)}
                    </Text>
                    <View style={styles.statusRow}>
                      <Text
                        style={[
                          styles.docStatus,
                          {
                            color:
                              doc.lifecycle_status === 'issued'
                                ? theme.statusIssued
                                : doc.lifecycle_status === 'void'
                                ? theme.statusDanger
                                : theme.statusDraft,
                          },
                        ]}
                      >
                        {doc.lifecycle_status.toUpperCase()}
                      </Text>
                      <ArrowUpRight color={theme.textMuted} size={14} />
                    </View>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  header: {
    marginBottom: spacing.lg,
  },
  appTitle: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: typography.supporting.fontSize,
    lineHeight: typography.supporting.lineHeight,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  secondaryButton: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  summaryContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
  },
  summaryLabel: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontWeight: typography.sectionTitle.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  sectionLink: {
    fontSize: typography.supporting.fontSize,
    fontWeight: '500',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.md,
  },
  emptyButton: {
    height: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  listContainer: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
    fontSize: typography.supporting.fontSize,
    marginTop: 2,
  },
  docRight: {
    alignItems: 'flex-end',
  },
  docAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  docStatus: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
