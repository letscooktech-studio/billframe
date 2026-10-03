/**
 * HOME SCREEN — BILLFRAME COMMAND CENTER
 * Adaptive personalized business workspace with deterministic persona indicators,
 * connected workflow launchers, authoritative outstanding/paid summaries, and recent activity.
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
import {
  Plus,
  FileText,
  ArrowUpRight,
  Zap,
  ChevronRight,
  Search,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Package,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { FeatureIcon } from '../../design/icons';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { WorkspaceRepository } from '../../data/repositories/WorkspaceRepository';
import { FeatureUsageRepository } from '../../data/repositories/FeatureUsageRepository';
import { AdaptiveWorkspaceEngine } from '../../domain/workspace/AdaptiveWorkspaceEngine';
import { FeatureCapability, BusinessType } from '../../domain/features/FeatureRegistry';
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

const WORKSPACE_META: Record<string, { label: string; mode: string; subtitle: string }> = {
  freelancer: {
    label: 'FREELANCER & CONSULTING',
    mode: 'Freelancer Workspace',
    subtitle: 'Direct billing, client proposals & WhatsApp reminders',
  },
  contractor: {
    label: 'CONTRACTOR & TRADES',
    mode: 'Contractor & Trades Workspace',
    subtitle: 'Quotes, progressive billing & project expenses',
  },
  retail: {
    label: 'RETAIL & STOREFRONT',
    mode: 'Retail & POS Workspace',
    subtitle: '30s quick counter billing, catalog & store ledger',
  },
  service: {
    label: 'SERVICE BUSINESS',
    mode: 'Service Business Workspace',
    subtitle: 'Service quotes, client invoicing & payment recovery',
  },
  agency: {
    label: 'AGENCY & STUDIO',
    mode: 'Agency & Studio Workspace',
    subtitle: 'Retainers, proposals & client account statements',
  },
  wholesale: {
    label: 'WHOLESALE & B2B',
    mode: 'Wholesale & B2B Workspace',
    subtitle: 'Bulk invoicing, catalog rates & debtor aging',
  },
  professional: {
    label: 'PROFESSIONAL PRACTICE',
    mode: 'Professional Practice Workspace',
    subtitle: 'Client retainers, instant billing & payment receipts',
  },
  other: {
    label: 'BUSINESS OPERATING MODE',
    mode: 'Business Workspace',
    subtitle: 'Invoicing, expenses, collections & reports',
  },
};

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
  const [businessType, setBusinessType] = useState<BusinessType>('other');
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

      // 2. Fetch authoritative business metrics
      const metrics = await DocumentRepository.getHomeDashboardMetricsAsync();
      setOutstandingMinor(metrics.outstandingMinor);
      setPaidThisMonthMinor(metrics.paidThisMonthMinor);

      // 3. Fetch adaptive workspace preferences & local usage signals
      const [workspacePrefs, usageHistory] = await Promise.all([
        WorkspaceRepository.getPreferencesAsync(),
        FeatureUsageRepository.getAllUsageAsync(),
      ]);
      setOnboardingCompleted(workspacePrefs.onboardingCompleted);
      setBusinessType(workspacePrefs.businessType);

      // Resolve prioritized ready actions for the active business persona (strictly ready with real routes)
      const prioritized = AdaptiveWorkspaceEngine.getPrioritizedQuickActions(
        workspacePrefs,
        usageHistory,
        6
      ).filter((a) => a.availability === 'ready' && Boolean(a.route));
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const currentMeta = WORKSPACE_META[businessType] || WORKSPACE_META.other;

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

          {/* Active Personalized Workspace Persona Card */}
          <Pressable
            style={({ pressed }) => [
              styles.personaCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Active ${currentMeta.mode}. Tap to customize.`}
            onPress={() => router.push('/settings/workspace' as any)}
          >
            <View style={styles.personaCardLeft}>
              <View style={styles.personaTagRow}>
                <View style={[styles.personaTag, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                  <Text style={[styles.personaTagText, { color: theme.brandAnchor }]}>
                    {currentMeta.label}
                  </Text>
                </View>
                <View style={styles.adaptiveIndicator}>
                  <Sparkles size={11} color={theme.textSecondary} />
                  <Text style={[styles.adaptiveText, { color: theme.textSecondary }]}>Personalized</Text>
                </View>
              </View>
              <Text style={[styles.personaModeTitle, { color: theme.textPrimary }]}>
                {currentMeta.mode}
              </Text>
              <Text style={[styles.personaSubtitle, { color: theme.textSecondary }]}>
                {currentMeta.subtitle}
              </Text>
            </View>

            <View style={[styles.customizePill, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
              <SlidersHorizontal size={13} color={theme.textPrimary} />
              <Text style={[styles.customizeText, { color: theme.textPrimary }]}>Change</Text>
            </View>
          </Pressable>

          {/* Section: Tailored Quick Actions */}
          <Text style={[styles.sectionSubtitleLabel, { color: theme.textSecondary }]}>
            RECOMMENDED FOR YOUR WORKSPACE
          </Text>

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
                <FeatureIcon name={action.icon} size="sm" color={theme.brandAnchor} />
                <Text
                  style={[styles.adaptiveActionText, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {action.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Connected Workflows Quick Strip */}
          <View style={styles.connectedWorkflowSection}>
            <Text style={[styles.sectionSubtitleLabel, { color: theme.textSecondary }]}>
              CONNECTED WORKFLOWS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowScroll}>
              <Pressable
                style={({ pressed }) => [
                  styles.flowChip,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
              >
                <Plus size={13} color={theme.brandAnchor} />
                <Text style={[styles.flowChipText, { color: theme.textPrimary }]}>New Invoice</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.flowChip,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push({ pathname: '/document/edit', params: { type: 'estimate' } })}
              >
                <Plus size={13} color={theme.brandAnchor} />
                <Text style={[styles.flowChipText, { color: theme.textPrimary }]}>New Estimate</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.flowChip,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push('/quick-bill' as any)}
              >
                <Zap size={13} color={theme.brandAnchor} fill={theme.brandAnchor} />
                <Text style={[styles.flowChipText, { color: theme.textPrimary }]}>30s Quick Bill</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.flowChip,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push('/collections' as any)}
              >
                <Clock size={13} color={theme.brandAnchor} />
                <Text style={[styles.flowChipText, { color: theme.textPrimary }]}>Collections & Reminders</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.flowChip,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push('/catalog' as any)}
              >
                <Package size={13} color={theme.brandAnchor} />
                <Text style={[styles.flowChipText, { color: theme.textPrimary }]}>Price Catalog</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.flowChip,
                  { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => router.push('/expenses/add' as any)}
              >
                <Plus size={13} color={theme.brandAnchor} />
                <Text style={[styles.flowChipText, { color: theme.textPrimary }]}>Add Expense</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Financial Summary */}
          <Pressable
            style={[styles.summaryContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
            accessibilityRole="button"
            accessibilityLabel="View full financial reports"
            onPress={() => router.push('/reports' as any)}
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
                <Text style={[styles.emptyButtonText, { color: theme.brandAnchorText }]}>Create Invoice</Text>
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
  personaCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  personaCardLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  personaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  personaTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  personaTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adaptiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  adaptiveText: {
    fontSize: 11,
    fontWeight: '500',
  },
  personaModeTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
    marginTop: 2,
  },
  personaSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  customizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  customizeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSubtitleLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  adaptiveActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  adaptiveActionBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 46,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  adaptiveActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  connectedWorkflowSection: {
    marginBottom: spacing.md,
  },
  flowScroll: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  flowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  flowChipText: {
    fontSize: 12,
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
  summaryContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
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
