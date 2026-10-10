/**
 * CUSTOMER DETAIL & STATEMENT SCREEN
 * Displays customer contact info, financial statement balance,
 * and historical document timeline.
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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Plus,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { CustomerRepository, CustomerRecord } from '../../data/repositories/CustomerRepository';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { createMoney, formatMoney } from '../../domain/money/Money';
import { CustomerStatementModal } from '../../features/statements/CustomerStatementModal';

interface CustomerDocSummary {
  id: string;
  doc_type: string;
  document_number: string;
  total_minor: number;
  currency: string;
  lifecycle_status: string;
  issue_date: number;
}

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [docs, setDocs] = useState<CustomerDocSummary[]>([]);
  const [statement, setStatement] = useState({
    totalInvoicedMinor: 0n,
    totalPaidMinor: 0n,
    outstandingMinor: 0n,
    currency: 'USD',
  });
  const [statementModalVisible, setStatementModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const cust = await CustomerRepository.getById(id);
      setCustomer(cust);

      const db = await DatabaseManager.getDatabaseAsync();

      // Fetch documents for this customer
      const customerDocs = await db.getAllAsync<CustomerDocSummary>(
        `SELECT id, doc_type, document_number, total_minor, currency, lifecycle_status, issue_date
         FROM documents
         WHERE customer_id = ? AND is_archived = 0
         ORDER BY created_at DESC;`,
        [id]
      );
      setDocs(customerDocs);

      // Fetch total invoiced (issued invoices)
      const invRow = await db.getFirstAsync<{ sum_total: number; currency: string }>(
        `SELECT COALESCE(SUM(total_minor), 0) AS sum_total, currency
         FROM documents
         WHERE customer_id = ? AND doc_type = 'invoice' AND lifecycle_status = 'issued'
         GROUP BY currency;`,
        [id]
      );

      // Fetch total paid
      const payRow = await db.getFirstAsync<{ sum_paid: number }>(
        `SELECT COALESCE(SUM(p.amount_minor), 0) AS sum_paid
         FROM payments p
         JOIN documents d ON p.invoice_id = d.id
         WHERE d.customer_id = ?;`,
        [id]
      );

      const totalInvoiced = BigInt(invRow?.sum_total || 0);
      const totalPaid = BigInt(payRow?.sum_paid || 0);
      const outstanding = totalInvoiced > totalPaid ? totalInvoiced - totalPaid : 0n;

      setStatement({
        totalInvoicedMinor: totalInvoiced,
        totalPaidMinor: totalPaid,
        outstandingMinor: outstanding,
        currency: invRow?.currency || 'USD',
      });
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading || !customer) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading customer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const outstandingMoney = createMoney(statement.outstandingMinor, statement.currency);
  const invoicedMoney = createMoney(statement.totalInvoicedMinor, statement.currency);
  const paidMoney = createMoney(statement.totalPaidMinor, statement.currency);

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
        <Text style={[styles.topBarTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {customer.name}
        </Text>
        <Pressable
          style={styles.editBtn}
          onPress={() => router.push({ pathname: '/customer/edit', params: { id: customer.id } })}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Edit customer"
        >
          <Edit2 color={theme.brandAnchor} size={20} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Customer Overview Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, { color: theme.brandAnchor }]}>
                  {(customer.name || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileMain}>
                <Text style={[styles.nameText, { color: theme.textPrimary }]}>{customer.name}</Text>
                {customer.business_name && (
                  <Text style={[styles.businessText, { color: theme.textSecondary }]}>
                    {customer.business_name}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.contactList, { borderTopColor: theme.borderSubtle }]}>
              {customer.email && (
                <View style={styles.contactItem}>
                  <Mail size={16} color={theme.textMuted} />
                  <Text style={[styles.contactText, { color: theme.textPrimary }]}>{customer.email}</Text>
                </View>
              )}
              {customer.phone && (
                <View style={styles.contactItem}>
                  <Phone size={16} color={theme.textMuted} />
                  <Text style={[styles.contactText, { color: theme.textPrimary }]}>{customer.phone}</Text>
                </View>
              )}
              {customer.billing_address && (
                <View style={styles.contactItem}>
                  <MapPin size={16} color={theme.textMuted} />
                  <Text style={[styles.contactText, { color: theme.textPrimary }]}>
                    {customer.billing_address}
                  </Text>
                </View>
              )}
              {customer.tax_id && (
                <View style={styles.taxIdRow}>
                  <Text style={[styles.taxIdLabel, { color: theme.textMuted }]}>Tax ID / VAT:</Text>
                  <Text style={[styles.taxIdValue, { color: theme.textSecondary }]}>{customer.tax_id}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Statement Balance Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>FINANCIAL STATEMENT</Text>
              <Pressable
                onPress={() => setStatementModalVisible(true)}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                accessibilityRole="button"
                accessibilityLabel="View full customer statement"
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.brandAnchor }}>View Statement</Text>
                <ChevronRight size={14} color={theme.brandAnchor} />
              </Pressable>
            </View>

            <View style={styles.statementRow}>
              <View style={styles.statementCol}>
                <Text style={[styles.statementLabel, { color: theme.textSecondary }]}>Outstanding</Text>
                <Text style={[styles.statementValue, { color: theme.textPrimary }]}>
                  {formatMoney(outstandingMoney)}
                </Text>
              </View>
              <View style={styles.statementDivider} />
              <View style={styles.statementCol}>
                <Text style={[styles.statementLabel, { color: theme.textSecondary }]}>Total Paid</Text>
                <Text style={[styles.statementSubValue, { color: theme.statusSuccess }]}>
                  {formatMoney(paidMoney)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.brandAnchor }]}
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice', customerId: customer.id } })}
              accessibilityRole="button"
            >
              <Plus color={theme.surface} size={16} strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: theme.surface }]}>New Invoice</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtnSecondary, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'estimate', customerId: customer.id } })}
              accessibilityRole="button"
            >
              <Plus color={theme.textPrimary} size={16} strokeWidth={2.5} />
              <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary }]}>New Estimate</Text>
            </Pressable>
          </View>

          {/* Document History */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              DOCUMENT HISTORY ({docs.length})
            </Text>

            {docs.length === 0 ? (
              <Text style={[styles.emptyDocsText, { color: theme.textMuted }]}>
                No documents created for this customer yet.
              </Text>
            ) : (
              docs.map((d, idx) => (
                <Pressable
                  key={d.id}
                  style={({ pressed }) => [
                    styles.docRow,
                    idx < docs.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => router.push(`/document/${d.id}`)}
                >
                  <View style={styles.docLeft}>
                    <Text style={[styles.docNumber, { color: theme.textPrimary }]}>{d.document_number}</Text>
                    <Text style={[styles.docType, { color: theme.textMuted }]}>
                      {(d.doc_type || 'DOCUMENT').toUpperCase()} • {d.issue_date ? new Date(d.issue_date).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <View style={styles.docRight}>
                    <Text style={[styles.docAmount, { color: theme.textPrimary }]}>
                      {formatMoney(createMoney(BigInt(d.total_minor), d.currency))}
                    </Text>
                    <ChevronRight size={16} color={theme.textMuted} />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {customer && (
        <CustomerStatementModal
          visible={statementModalVisible}
          customerId={customer.id}
          customerName={customer.name}
          onClose={() => setStatementModalVisible(false)}
        />
      )}
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
    borderBottomWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  editBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  topBarTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    maxWidth: 220,
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
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: '#EFEFED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileMain: {
    flex: 1,
  },
  nameText: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  businessText: {
    fontSize: typography.supporting.fontSize,
    marginTop: 2,
  },
  contactList: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: typography.bodyMedium.fontSize,
  },
  taxIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  taxIdLabel: {
    fontSize: typography.caption.fontSize,
  },
  taxIdValue: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statementCol: {
    flex: 1,
    alignItems: 'center',
  },
  statementDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statementLabel: {
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statementValue: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  statementSubValue: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
  },
  actionBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  emptyDocsText: {
    fontSize: typography.caption.fontSize,
    paddingVertical: spacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  docLeft: {
    flex: 1,
  },
  docNumber: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  docType: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  docRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  docAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
});
