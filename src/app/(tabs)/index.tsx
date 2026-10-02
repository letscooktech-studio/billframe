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
  Image,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, ArrowUpRight, Zap, ChevronRight, Search, Sparkles } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { FeatureIcon } from '../../design/icons';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { WorkspaceRepository } from '../../data/repositories/WorkspaceRepository';
import { FeatureUsageRepository } from '../../data/repositories/FeatureUsageRepository';
import { AdaptiveWorkspaceEngine } from '../../domain/workspace/AdaptiveWorkspaceEngine';
import { FeatureCapability } from '../../domain/features/FeatureRegistry';
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
  const [adaptiveActions, setAdaptiveActions] = useState<FeatureCapability[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);

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
        setDocumentLocale(profile.default_document_locale || 'en-US');
      }

      // 2. Fetch authoritative business metrics from canonical domain/repository layer
      const metrics = await DocumentRepository.getHomeDashboardMetricsAsync();
      setOutstandingMinor(metrics.outstandingMinor);
      setPaidThisMonthMinor(metrics.paidThisMonthMinor);

      // 3. Fetch adaptive workspace preferences & local usage signals
      const [workspacePrefs, usageHistory] = await Promise.all([
        WorkspaceRepository.getPreferencesAsync(),
        FeatureUsageRepository.getAllUsageAsync(),
      ]);
      setOnboardingCompleted(workspacePrefs.onboardingCompleted);

      const prioritized = AdaptiveWorkspaceEngine.getPrioritizedQuickActions(
        workspacePrefs,
        usageHistory,
        4
      );
      setAdaptiveActions(prioritized);

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

  const handleActionPress = async (action: FeatureCapability) => {
    await FeatureUsageRepository.recordUsageAsync(action.id);
    if (action.availability === 'ready' && action.route) {
      router.push(action.route as any);
    } else {
      Alert.alert(
        `${action.name} (${action.roadmapPhase || 'Roadmap'})`,
        `${action.description}\n\nThis capability is planned for ${action.roadmapPhase || 'an upcoming release'}.`,
        [{ text: 'Got it' }]
      );
    }
  };

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
          {/* Header with Approved Brand Mark & Instant Search */}
          <View style={styles.headerRow}>
            <View style={styles.headerBrand}>
              <View style={styles.brandMarkBadge}>
                <Image
                  source={require('../../../assets/brand/billframe-mark.png')}
                  style={styles.brandMarkSmall}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Billframe</Text>
                <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>Business Workspace</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.searchHeaderBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.borderSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search Billframe"
              onPress={() => router.push('/search' as any)}
            >
              <Search color={theme.textSecondary} size={16} />
              <Text style={[styles.searchHeaderText, { color: theme.textMuted }]}>Search</Text>
            </Pressable>
          </View>

          {/* Onboarding Banner (if not yet configured) */}
          {!onboardingCompleted && (
            <Pressable
              style={[
                styles.onboardingBanner,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Set up your business workspace"
              onPress={() => router.push('/onboarding' as any)}
            >
              <Sparkles color={theme.brandAnchor} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.onboardingTitle, { color: theme.textPrimary }]}>
                  Customize Billframe (2 min)
                </Text>
                <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary }]}>
                  Set up your business type, GST & personalized workspace
                </Text>
              </View>
              <ChevronRight color={theme.textMuted} size={16} />
            </Pressable>
          )}

          {/* Quick Bill Action Banner (Instant Walk-in Cash Bill) */}
          <Pressable
            style={({ pressed }) => [
              styles.quickBillCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="30-second Quick Bill"
            onPress={() => {
              FeatureUsageRepository.recordUsageAsync('quick_bill');
              router.push('/quick-bill' as any);
            }}
          >
            <View style={styles.quickBillLeft}>
              <View style={[styles.quickBillIcon, { backgroundColor: theme.brandAnchor }]}>
                <Zap color={theme.surface} size={16} fill={theme.surface} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickBillTitle, { color: theme.textPrimary }]}>Quick Bill (30s)</Text>
                <Text style={[styles.quickBillSubtitle, { color: theme.textSecondary }]}>
                  Single item + customer → instant bill & receipt
                </Text>
              </View>
            </View>
            <ChevronRight color={theme.textMuted} size={18} />
          </Pressable>

          {/* Adaptive Workspace Quick Actions */}
          <View style={styles.adaptiveActionGrid}>
            {adaptiveActions.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.adaptiveActionBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderSubtle,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.name}
                onPress={() => handleActionPress(action)}
              >
                <FeatureIcon name={action.icon} size="sm" color={theme.textPrimary} />
                <Text
                  style={[styles.adaptiveActionText, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {action.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Financial Summary */}
          <Pressable
            style={[styles.summaryContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
            accessibilityRole="button"
            accessibilityLabel="View full financial reports"
            onPress={() => router.push('/reports/index' as any)}
          >
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
          </Pressable>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMarkBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0B0B0D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandMarkSmall: {
    width: 26,
    height: 26,
  },
  searchHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: spacing.xs,
  },
  searchHeaderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  onboardingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  onboardingSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  adaptiveActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  adaptiveActionBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  adaptiveActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  quickBillCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  quickBillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  quickBillIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBillTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  quickBillSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 1,
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
