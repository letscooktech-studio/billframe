/**
 * CUSTOMER STATEMENT MODAL
 * Modal sheet displaying a customer's statement of account with period presets
 * (All Time, This Month, Last Month, This Year), running balance ledger,
 * and 1-tap sharing via Android Sharesheet / WhatsApp.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Share,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { X, Share2, FileText, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';
import { createMoney, formatMoney } from '../../domain/money/Money';
import {
  calculateCustomerStatement,
  formatStatementAsText,
  StatementPeriodPreset,
  StatementSummary,
  StatementInvoiceItem,
  StatementPaymentItem,
} from '../../domain/statements/StatementEngine';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { CustomerRepository, CustomerRecord } from '../../data/repositories/CustomerRepository';

export interface CustomerStatementModalProps {
  visible: boolean;
  customerId: string;
  customerName?: string;
  onClose: () => void;
}

const PERIOD_TABS: { id: StatementPeriodPreset; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
];

export function CustomerStatementModal({
  visible,
  customerId,
  customerName: initialCustomerName,
  onClose,
}: CustomerStatementModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [period, setPeriod] = useState<StatementPeriodPreset>('all');
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [rawInvoices, setRawInvoices] = useState<StatementInvoiceItem[]>([]);
  const [rawPayments, setRawPayments] = useState<StatementPaymentItem[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      // 1. Load customer details
      const cust = await CustomerRepository.getById(customerId);
      setCustomer(cust);

      // 2. Load active business profile
      const prof = await db.getFirstAsync<any>(
        'SELECT * FROM business_profiles WHERE is_active = 1 LIMIT 1;'
      );
      setBusiness(prof);

      // 3. Load non-draft customer invoices
      const invoices = await db.getAllAsync<StatementInvoiceItem>(
        `SELECT id, document_number, issue_date, total_minor, deposit_minor, currency, lifecycle_status, po_number
         FROM documents
         WHERE customer_id = ? AND doc_type = 'invoice' AND lifecycle_status != 'draft' AND is_archived = 0
         ORDER BY issue_date ASC;`,
        [customerId]
      );
      setRawInvoices(invoices);

      // 4. Load payments recorded against this customer's invoices
      const payments = await db.getAllAsync<StatementPaymentItem>(
        `SELECT p.id, p.invoice_id, p.amount_minor, p.payment_date, p.payment_method, p.reference
         FROM payments p
         JOIN documents d ON p.invoice_id = d.id
         WHERE d.customer_id = ?
         ORDER BY p.payment_date ASC;`,
        [customerId]
      );
      setRawPayments(payments);
    } catch {
      // Non-blocking load
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (visible) {
      setPeriod('all');
      setShareSuccess(false);
      loadData();
    }
  }, [visible, loadData]);

  // Re-calculate statement whenever raw data or selected period changes
  useEffect(() => {
    if (!customerId) return;
    const currency = rawInvoices.length > 0 ? rawInvoices[0].currency : (business?.currency || 'USD');
    const computed = calculateCustomerStatement({
      customerId,
      currency,
      preset: period,
      invoices: rawInvoices,
      payments: rawPayments,
    });
    setSummary(computed);
  }, [customerId, period, rawInvoices, rawPayments, business]);

  async function handleShare() {
    if (!summary || !customer) return;

    try {
      const formattedText = formatStatementAsText({
        statement: summary,
        customerName: customer.name,
        customerBusinessName: customer.business_name,
        customerEmail: customer.email,
        businessName: business?.name || 'My Business',
        businessPhone: business?.phone,
        businessEmail: business?.email,
        paymentInstructions: business?.default_notes,
      });

      await Share.share({
        title: `Statement of Account - ${customer.name}`,
        message: formattedText,
      });

      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch {
      // User cancelled share
    }
  }

  const currency = summary?.currency || 'USD';
  const openingMoney = summary ? createMoney(summary.openingBalanceMinor, currency) : createMoney(0n, currency);
  const invoicedMoney = summary ? createMoney(summary.totalInvoicedMinor, currency) : createMoney(0n, currency);
  const paidMoney = summary ? createMoney(summary.totalPaidMinor, currency) : createMoney(0n, currency);
  const closingMoney = summary ? createMoney(summary.closingBalanceMinor, currency) : createMoney(0n, currency);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Statement of Account</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {customer?.name || initialCustomerName || 'Client'}
            </Text>
          </View>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close statement"
          >
            <X size={20} color={theme.textPrimary} />
          </Pressable>
        </View>

        {/* Period Selector Tabs */}
        <View style={[styles.periodBar, { backgroundColor: theme.surface, borderBottomColor: theme.borderSubtle }]}>
          {PERIOD_TABS.map((tab) => {
            const isActive = period === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.periodTab,
                  isActive && { backgroundColor: theme.brandAnchor, borderColor: theme.brandAnchor },
                  !isActive && { borderColor: theme.borderSubtle },
                ]}
                onPress={() => setPeriod(tab.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tab.label}`}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isActive ? { color: theme.surface, fontWeight: '600' } : { color: theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.brandAnchor} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Compiling ledger...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Statement Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {period !== 'all' && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Opening Balance</Text>
                  <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                    {formatMoney(openingMoney)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Invoiced</Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {formatMoney(invoicedMoney)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Paid / Credited</Text>
                <Text style={[styles.summaryValue, { color: theme.statusSuccess }]}>
                  -{formatMoney(paidMoney)}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.closingLabel, { color: theme.textPrimary }]}>Closing Balance Due</Text>
                <Text style={[styles.closingValue, { color: theme.brandAnchor }]}>
                  {formatMoney(closingMoney)}
                </Text>
              </View>
            </View>

            {/* Ledger Activity Section */}
            <View style={styles.ledgerHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                ACTIVITY LEDGER ({summary?.ledger.length || 0})
              </Text>
              <Text style={[styles.periodBadge, { color: theme.textMuted }]}>
                {summary?.periodLabel}
              </Text>
            </View>

            {(!summary || summary.ledger.length === 0) ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <FileText size={32} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No billing activity recorded for this period.
                </Text>
              </View>
            ) : (
              <View style={[styles.ledgerCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                {summary.ledger.map((item, idx) => {
                  const isDebit = item.debitMinor > 0n;
                  const itemAmount = isDebit ? item.debitMinor : item.creditMinor;
                  const moneyVal = createMoney(itemAmount, currency);
                  const balVal = createMoney(item.runningBalanceMinor, currency);
                  const isLast = idx === summary.ledger.length - 1;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.ledgerRow,
                        !isLast && { borderBottomColor: theme.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
                      ]}
                    >
                      <View style={styles.ledgerLeft}>
                        <View style={styles.ledgerTypeRow}>
                          {isDebit ? (
                            <ArrowUpRight size={13} color={theme.statusDanger} />
                          ) : (
                            <ArrowDownLeft size={13} color={theme.statusSuccess} />
                          )}
                          <Text
                            style={[
                              styles.ledgerTypeBadge,
                              { color: isDebit ? theme.statusDanger : theme.statusSuccess },
                            ]}
                          >
                            {item.type.toUpperCase()}
                          </Text>
                          <Text style={[styles.ledgerDate, { color: theme.textSecondary }]}>
                            • {new Date(item.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={[styles.ledgerDesc, { color: theme.textPrimary }]}>{item.description}</Text>
                        <Text style={[styles.ledgerRunning, { color: theme.textMuted }]}>
                          Balance: {formatMoney(balVal)}
                        </Text>
                      </View>
                      <View style={styles.ledgerRight}>
                        <Text
                          style={[
                            styles.ledgerAmount,
                            { color: isDebit ? theme.textPrimary : theme.statusSuccess },
                          ]}
                        >
                          {isDebit ? '' : '-'}{formatMoney(moneyVal)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Actions Bar */}
        <View style={[styles.footer, { borderTopColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
          <Pressable
            style={[styles.shareBtn, { backgroundColor: theme.brandAnchor }]}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share statement via WhatsApp or email"
          >
            {shareSuccess ? (
              <CheckCircle2 color={theme.surface} size={18} />
            ) : (
              <Share2 color={theme.surface} size={18} />
            )}
            <Text style={[styles.shareBtnText, { color: theme.surface }]}>
              {shareSuccess ? 'Statement Shared' : 'Share Statement (WhatsApp / Email)'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  periodTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabText: {
    fontSize: typography.caption.fontSize,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.caption.fontSize,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  summaryCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.supporting.fontSize,
  },
  summaryValue: {
    fontSize: typography.supporting.fontSize,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  closingLabel: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  closingValue: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  periodBadge: {
    fontSize: typography.caption.fontSize,
  },
  emptyCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
  },
  ledgerCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  ledgerLeft: {
    flex: 1,
    paddingRight: spacing.sm,
    gap: 2,
  },
  ledgerTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ledgerTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ledgerDate: {
    fontSize: 11,
  },
  ledgerDesc: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginTop: 1,
  },
  ledgerRunning: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  ledgerRight: {
    alignItems: 'flex-end',
  },
  ledgerAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
  },
  shareBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
