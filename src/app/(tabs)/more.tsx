/**
 * MORE / SETTINGS HUB
 * Grouped information architecture:
 * - QUICK ACTIONS
 * - BUSINESS
 * - FINANCE
 * - TOOLS
 * - WORKSPACE
 * - SETTINGS
 *
 * Production builds render ONLY currently functional modules.
 * Roadmap items appear exclusively in development builds under a separate section.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FeatureIcon,
  ChevronRight,
  ChevronDown,
} from '../../design/icons';
import {
  colors,
  ThemeColors,
  spacing,
  radii,
  typography,
  MIN_TOUCH_TARGET,
  MAX_CONTENT_WIDTH,
} from '../../design/tokens';
import { FeatureRegistry, FeatureCapability } from '../../domain/features/FeatureRegistry';

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  theme: ThemeColors;
  isLast?: boolean;
  badge?: string;
}

function SettingRow({ icon, title, subtitle, onPress, theme, isLast, badge }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.iconContainer}>
        <FeatureIcon name={icon} size="md" color={theme.textPrimary} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight color={theme.textMuted} size={16} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const isDev = FeatureRegistry.isDevelopment();
  const [showDevRoadmap, setShowDevRoadmap] = useState<boolean>(false);

  const roadmapFeatures = isDev ? FeatureRegistry.getRoadmapFeatures() : [];

  const handleAbout = () => {
    Alert.alert(
      'Billframe',
      'Version 1.0.0 (API 36)\n\n• 100% Free Core Billing\n• Offline-First SQLite Architecture\n• Zero Mandatory Cloud Account\n• Native BigInt Money Engine',
      [{ text: 'Close', style: 'default' }]
    );
  };

  const handlePrivacyInfo = () => {
    Alert.alert(
      'Local-First Data Privacy',
      'Your business documents, client accounts, invoices, and financial records never leave this device.\n\nAll ledger calculations and PDF generations run purely on local hardware.',
      [{ text: 'Understood', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>More</Text>
          </View>

          {/* 1. QUICK ACTIONS */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon="new_invoice"
              title="Create Invoice"
              subtitle="Standard tax invoice or cash bill"
              onPress={() => router.push('/document/edit' as any)}
              theme={theme}
            />
            <SettingRow
              icon="quick_bill"
              title="Quick Bill (30s)"
              subtitle="Instant counter bill without customer setup"
              onPress={() => router.push('/quick-bill' as any)}
              theme={theme}
            />
            <SettingRow
              icon="estimates"
              title="Create Estimate / Quote"
              subtitle="Formal quotation, proposal, or bid"
              onPress={() => router.push('/document/edit?type=estimate' as any)}
              theme={theme}
            />
            <SettingRow
              icon="customers"
              title="Customers & Clients"
              subtitle="Customer ledger, directory, and balances"
              onPress={() => router.push('/(tabs)/customers' as any)}
              theme={theme}
              isLast
            />
          </View>

          {/* 2. BUSINESS */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>BUSINESS</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon="settings"
              title="Business Profile"
              subtitle="Business name, address, contact, and logo"
              onPress={() => router.push('/onboarding/setup')}
              theme={theme}
            />
            <SettingRow
              icon="inventory"
              title="Items & Services"
              subtitle="Manage saved products, service rates, and units"
              onPress={() => router.push('/catalog')}
              theme={theme}
            />
            <SettingRow
              icon="invoices"
              title="Document Numbering"
              subtitle="Custom prefixes (INV-, EST-) and sequences"
              onPress={() => router.push('/onboarding/setup')}
              theme={theme}
              isLast
            />
          </View>

          {/* 3. FINANCE */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>FINANCE</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon="expenses"
              title="Expenses & Overhead"
              subtitle="Track materials, operating costs, and vendor bills"
              onPress={() => router.push('/expenses' as any)}
              theme={theme}
            />
            <SettingRow
              icon="reports"
              title="Financial Reports"
              subtitle="Revenue statements, operating cash, and aging"
              onPress={() => router.push('/reports/index' as any)}
              theme={theme}
            />
            <SettingRow
              icon="payments"
              title="Taxes & Currency"
              subtitle="Default tax rates, currency, and locale"
              onPress={() => router.push('/onboarding/setup')}
              theme={theme}
              isLast
            />
          </View>

          {/* 4. TOOLS */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>TOOLS</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon="backup"
              title="Backup & Restore"
              subtitle="Encrypted & standard local archives"
              onPress={() => router.push('/backup')}
              theme={theme}
            />
            <SettingRow
              icon="invoices"
              title="Export CSV Data"
              subtitle="Export customers, invoices, and payments"
              onPress={() => router.push('/backup')}
              theme={theme}
            />
            <SettingRow
              icon="search"
              title="Search Billframe"
              subtitle="Instant search across all active features"
              onPress={() => router.push('/search' as any)}
              theme={theme}
              isLast
            />
          </View>

          {/* 5. WORKSPACE */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>WORKSPACE</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon="workspace"
              title="Workspace & Layout"
              subtitle="Adaptive dashboard sorting, lock layout, business focus"
              onPress={() => router.push('/settings/workspace' as any)}
              theme={theme}
            />
            <SettingRow
              icon="settings"
              title="Reconfigure Business Type"
              subtitle="Switch business category and default workflows"
              onPress={() => router.push('/onboarding' as any)}
              theme={theme}
              isLast
            />
          </View>

          {/* 6. SETTINGS & SECURITY */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>SETTINGS & SECURITY</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon="lock"
              title="App Lock & PIN"
              subtitle="Device PIN and biometric protection"
              onPress={() => router.push('/security-pin' as any)}
              theme={theme}
            />
            <SettingRow
              icon="security"
              title="Privacy & Local Storage"
              subtitle="100% offline-first, local SQLite storage guarantee"
              onPress={handlePrivacyInfo}
              theme={theme}
            />
            <SettingRow
              icon="info"
              title="About Billframe"
              subtitle="Version 1.0.0 • Target API 36 • 100% Free Core"
              onPress={handleAbout}
              theme={theme}
              isLast
            />
          </View>

          {/* 7. DEV ONLY: ROADMAP PREVIEW (Strictly hidden in production builds) */}
          {isDev && roadmapFeatures.length > 0 && (
            <View style={styles.devSection}>
              <Pressable
                style={[styles.devToggle, { borderColor: theme.borderSubtle }]}
                onPress={() => setShowDevRoadmap(!showDevRoadmap)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.devTitle, { color: theme.textSecondary }]}>
                    DEVELOPMENT ROADMAP (DEV ONLY)
                  </Text>
                  <Text style={[styles.devSubtitle, { color: theme.textMuted }]}>
                    {showDevRoadmap ? 'Tap to collapse upcoming modules' : `${roadmapFeatures.length} upcoming modules planned`}
                  </Text>
                </View>
                {showDevRoadmap ? (
                  <ChevronDown color={theme.textMuted} size={16} />
                ) : (
                  <ChevronRight color={theme.textMuted} size={16} />
                )}
              </Pressable>

              {showDevRoadmap && (
                <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle, marginTop: spacing.xs }]}>
                  {roadmapFeatures.map((feat, idx) => (
                    <SettingRow
                      key={feat.id}
                      icon={feat.icon}
                      title={feat.name}
                      subtitle={feat.description}
                      badge={feat.roadmapPhase}
                      onPress={() => {
                        Alert.alert(
                          `${feat.name} (${feat.roadmapPhase})`,
                          `${feat.description}\n\nThis module is strictly scheduled for future delivery.`
                        );
                      }}
                      theme={theme}
                      isLast={idx === roadmapFeatures.length - 1}
                    />
                  ))}
                </View>
              )}
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
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  header: {
    marginBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: -0.3,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardGroup: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  devSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  devToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  devSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
