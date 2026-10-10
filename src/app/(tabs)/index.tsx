/**
 * HOME SCREEN — ARCTIC AURORA COMMAND CENTER
 * Redesigned according to Billframe 2.0 Arctic Aurora specification:
 * - Subtle two-color Arctic Blue & Slate Violet atmospheric aurora wave in header
 * - One primary outstanding summary card (canonical financial state)
 * - Prominent "New Document" action button
 * - Exactly two recent records above the fold
 * - Dedicated "Continue Working" draft card when available
 * - Clean, uncluttered layout with 0 hardcoded demo values
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  Plus,
  ChevronRight,
  Search,
  Settings,
  Briefcase,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { formatMoney } from '../../domain/money/Money';
import { AuroraBackground } from '../../components/common/AuroraBackground';

interface RecentDocument {
  id: string;
  document_number: string;
  doc_type: string;
  customer_name: string;
  total_minor: number;
  currency: string;
  lifecycle_status: string;
  issue_date: number;
  updated_at: number;
}

interface DraftDocument {
  id: string;
  document_number: string;
  doc_type: string;
  updated_at: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDateDisplay(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [businessName, setBusinessName] = useState<string>('My Business');
  const [outstandingMinor, setOutstandingMinor] = useState<bigint>(0n);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [documentLocale, setDocumentLocale] = useState<string>('en-IN');
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [continueDraft, setContinueDraft] = useState<DraftDocument | null>(null);

  const loadData = useCallback(async () => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      // 1. Fetch active business profile
      const profile = await db.getFirstAsync<{
        name: string;
        default_currency: string;
        default_document_locale: string;
      }>('SELECT name, default_currency, default_document_locale FROM business_profiles WHERE is_active = 1 LIMIT 1;');

      if (profile) {
        if (profile.name) setBusinessName(profile.name);
        if (profile.default_currency) setCurrency(profile.default_currency);
        if (profile.default_document_locale) setDocumentLocale(profile.default_document_locale);
      }

      // 2. Fetch authoritative outstanding metrics
      const metrics = await DocumentRepository.getHomeDashboardMetricsAsync();
      setOutstandingMinor(metrics.outstandingMinor);

      // 3. Count overdue invoices
      const overdueRow = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM documents WHERE is_overdue = 1 AND lifecycle_status = 'issued' AND is_archived = 0;`
      );
      setOverdueCount(overdueRow?.count ?? 0);

      // 4. Fetch 2 most recent non-archived documents for clean hierarchy
      const recents = await db.getAllAsync<RecentDocument>(
        `SELECT d.id, d.document_number, d.doc_type, COALESCE(c.name, 'Walk-in Client') AS customer_name,
                d.total_minor, d.currency, d.lifecycle_status, d.issue_date, d.updated_at
         FROM documents d
         LEFT JOIN customers c ON d.customer_id = c.id
         WHERE d.is_archived = 0
         ORDER BY d.created_at DESC
         LIMIT 2;`
      );
      setRecentDocs(recents || []);

      // 5. Fetch most recent unfinished draft for "Continue Working"
      const draft = await db.getFirstAsync<DraftDocument>(
        `SELECT id, document_number, doc_type, updated_at
         FROM documents
         WHERE lifecycle_status = 'draft' AND is_archived = 0
         ORDER BY updated_at DESC
         LIMIT 1;`
      );
      setContinueDraft(draft || null);
    } catch {
      // Non-blocking: will display safe zero states
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <AuroraBackground section="home" intensity="standard">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* Top Bar: Brand, Switcher, Search, Settings */}
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <Image
                  source={require('../../../assets/brand/billframe-mark.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>Billframe</Text>
                  <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>Business Workspace</Text>
                </View>
              </View>

              <View style={styles.topBarActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.iconButton,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                  onPress={() => router.push('/search' as any)}
                >
                  <Search size={18} color={theme.textPrimary} />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.iconButton,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                  onPress={() => router.push('/settings/workspace' as any)}
                >
                  <Settings size={18} color={theme.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Personalized Context Greeting */}
            <View style={styles.greetingSection}>
              <Text style={[styles.greetingTime, { color: theme.textSecondary }]}>{getGreeting()}</Text>
              <Text style={[styles.greetingHeadline, { color: theme.textPrimary }]}>Let's continue your work</Text>
              <Text style={[styles.greetingSubtext, { color: theme.textMuted }]}>
                Create, manage and track all your business documents in one place.
              </Text>
            </View>

            {/* Active Business Switcher Card */}
            <Pressable
              style={({ pressed }) => [
                styles.businessSwitcherCard,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Active business ${businessName}. Tap to switch.`}
              onPress={() => router.push('/settings/workspace' as any)}
            >
              <View style={[styles.businessIconBadge, { backgroundColor: theme.surfaceSecondary }]}>
                <Briefcase size={16} color={theme.textPrimary} />
              </View>
              <View style={styles.businessSwitcherText}>
                <Text style={[styles.businessSwitcherName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {businessName}
                </Text>
                <Text style={[styles.businessSwitcherSubtitle, { color: theme.textSecondary }]}>
                  Business Workspace
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </Pressable>

            {/* Single Primary Business Summary: Outstanding Amount */}
            <Pressable
              style={({ pressed }) => [
                styles.summaryCard,
                { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Outstanding amount ${formatMoney({ amountMinor: outstandingMinor, currency }, documentLocale)}`}
              onPress={() => router.push('/collections' as any)}
            >
              <View style={[styles.summaryIconContainer, { backgroundColor: theme.surfaceSecondary }]}>
                <FileText size={22} color={theme.textPrimary} />
              </View>
              <View style={styles.summaryBody}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Outstanding Amount</Text>
                <Text style={[styles.summaryAmount, { color: theme.textPrimary }]}>
                  {formatMoney({ amountMinor: outstandingMinor, currency }, documentLocale)}
                </Text>
                <Text style={[styles.summarySubtext, { color: overdueCount > 0 ? theme.statusDanger : theme.textMuted }]}>
                  {overdueCount > 0 ? `${overdueCount} invoice${overdueCount > 1 ? 's' : ''} overdue` : 'All invoices settled'}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.textMuted} />
            </Pressable>

            {/* Primary Action Button: New Document */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryNewDocBtn,
                { backgroundColor: theme.brandAnchor, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create New Document"
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
            >
              <View style={styles.newDocBtnInner}>
                <Plus size={20} color={theme.brandAnchorText} strokeWidth={2.5} />
                <Text style={[styles.primaryNewDocText, { color: theme.brandAnchorText }]}>New Document</Text>
              </View>
              <ChevronRight size={18} color={theme.brandAnchorText} strokeWidth={2} />
            </Pressable>

            {/* Section: Recent Documents */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Recent Documents</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all documents"
                onPress={() => router.push('/(tabs)/documents')}
                hitSlop={8}
              >
                <Text style={[styles.viewAllText, { color: theme.textSecondary }]}>View All &gt;</Text>
              </Pressable>
            </View>

            {recentDocs.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <FileText size={32} color={theme.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No documents yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Tap New Document to create your first invoice or quotation.
                </Text>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recentDocs.map((doc) => {
                  const isPaid = doc.lifecycle_status === 'paid';
                  const isDraft = doc.lifecycle_status === 'draft';
                  const statusBadgeColor = isPaid
                    ? theme.statusSuccess
                    : isDraft
                    ? theme.statusDraft
                    : theme.statusIssued;

                  return (
                    <Pressable
                      key={doc.id}
                      style={({ pressed }) => [
                        styles.docCard,
                        { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Document ${doc.document_number}, ${doc.customer_name}`}
                      onPress={() => router.push(`/document/${doc.id}` as any)}
                    >
                      <View style={[styles.docIconBadge, { backgroundColor: theme.surfaceSecondary }]}>
                        <FileText size={18} color={theme.textPrimary} />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={[styles.docNumber, { color: theme.textPrimary }]}>
                          {doc.document_number || 'Draft'}
                        </Text>
                        <Text style={[styles.docCustomer, { color: theme.textSecondary }]} numberOfLines={1}>
                          {doc.customer_name}
                        </Text>
                        <Text style={[styles.docMeta, { color: theme.textMuted }]}>
                          {formatDateDisplay(doc.issue_date || doc.updated_at)} •{' '}
                          {formatMoney({ amountMinor: BigInt(doc.total_minor || 0), currency: doc.currency || currency }, documentLocale)}
                        </Text>
                      </View>
                      <View style={styles.docRight}>
                        <View style={[styles.statusBadge, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                          <View style={[styles.statusDot, { backgroundColor: statusBadgeColor }]} />
                          <Text style={[styles.statusText, { color: theme.textPrimary }]}>
                            {doc.lifecycle_status.charAt(0).toUpperCase() + doc.lifecycle_status.slice(1)}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={theme.textMuted} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Section: Continue Working (only if unfinished draft exists) */}
            {continueDraft && (
              <View style={styles.continueSection}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Continue Working</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.draftCard,
                    { backgroundColor: theme.surface, borderColor: theme.borderSubtle, opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue draft ${continueDraft.document_number || 'Draft'}`}
                  onPress={() => router.push(`/document/${continueDraft.id}` as any)}
                >
                  <View style={[styles.docIconBadge, { backgroundColor: theme.surfaceSecondary }]}>
                    <FileText size={18} color={theme.textPrimary} />
                  </View>
                  <View style={styles.draftInfo}>
                    <Text style={[styles.draftNumber, { color: theme.textPrimary }]}>
                      {continueDraft.document_number || 'DRAFT'}
                    </Text>
                    <Text style={[styles.draftType, { color: theme.textSecondary }]}>
                      {continueDraft.doc_type ? continueDraft.doc_type.replace('_', ' ') : 'Invoice'} • {businessName}
                    </Text>
                    <Text style={[styles.draftTime, { color: theme.textMuted }]}>
                      Last edited {formatRelativeTime(continueDraft.updated_at)}
                    </Text>
                  </View>
                  <View style={styles.docRight}>
                    <View style={[styles.statusBadge, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                      <View style={[styles.statusDot, { backgroundColor: theme.statusDraft }]} />
                      <Text style={[styles.statusText, { color: theme.textPrimary }]}>Draft</Text>
                    </View>
                    <ChevronRight size={16} color={theme.textMuted} />
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    marginBottom: spacing.xl,
  },
  greetingTime: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingHeadline: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  greetingSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  businessSwitcherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  businessIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  businessSwitcherText: {
    flex: 1,
  },
  businessSwitcherName: {
    fontSize: 14,
    fontWeight: '600',
  },
  businessSwitcherSubtitle: {
    fontSize: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  summaryBody: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  primaryNewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 54,
    borderRadius: radii.xl,
    marginBottom: spacing.xxl,
  },
  newDocBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryNewDocText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentList: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  docIconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  docInfo: {
    flex: 1,
  },
  docNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  docCustomer: {
    fontSize: 13,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 11,
  },
  docRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xxl,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  continueSection: {
    marginTop: spacing.sm,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  draftInfo: {
    flex: 1,
  },
  draftNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  draftType: {
    fontSize: 13,
    marginBottom: 2,
  },
  draftTime: {
    fontSize: 11,
  },
});
