/**
 * WORKSPACE & PERSONALIZATION SETTINGS
 * Complete user control over the Adaptive Workspace Engine.
 * Allows overriding business types, sales types, module visibility,
 * locking the layout, and resetting preferences to default presets.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  radii,
  typography,
  MIN_TOUCH_TARGET,
  MAX_CONTENT_WIDTH,
} from '../../design/tokens';
import {
  FeatureIcon,
  ChevronRight,
  Check,
  RotateCcw,
  Lock,
  Layers,
  ArrowRight,
} from '../../design/icons';
import { WorkspaceRepository } from '../../data/repositories/WorkspaceRepository';
import { FeatureUsageRepository } from '../../data/repositories/FeatureUsageRepository';
import {
  WorkspacePreferences,
  DEFAULT_WORKSPACE_PREFERENCES,
  BUSINESS_TYPE_PRESET_ACTIONS,
} from '../../domain/workspace/AdaptiveWorkspaceEngine';
import { BusinessType, FeatureRegistry } from '../../domain/features/FeatureRegistry';

const BUSINESS_TYPE_OPTIONS: Array<{ id: BusinessType; label: string; desc: string }> = [
  { id: 'freelancer', label: 'Freelancer / Creator', desc: 'Invoices, clients, expenses, recurring' },
  { id: 'contractor', label: 'Contractor / Trades', desc: 'Jobs, estimates, invoices, expenses' },
  { id: 'retail', label: 'Retail Store', desc: 'Quick bill (30s), inventory, customers, POS' },
  { id: 'service', label: 'Service Business', desc: 'Jobs, customers, invoices, time & materials' },
  { id: 'agency', label: 'Agency / Studio', desc: 'Estimates, projects, invoices, expenses' },
  { id: 'wholesale', label: 'Wholesale / Trading', desc: 'Invoices, bulk ledger, stock, challans' },
  { id: 'professional', label: 'Professional Practice', desc: 'Invoices, clients, expenses, time' },
  { id: 'other', label: 'Other Small Business', desc: 'Balanced small business workspace' },
];

export default function WorkspaceSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [prefs, setPrefs] = useState<WorkspacePreferences>({
    id: 'temp',
    businessProfileId: 'default',
    ...DEFAULT_WORKSPACE_PREFERENCES,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const p = await WorkspaceRepository.getPreferencesAsync();
      setPrefs(p);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async <K extends keyof WorkspacePreferences>(
    key: K,
    value: WorkspacePreferences[K]
  ) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await WorkspaceRepository.savePreferencesAsync(updated);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Workspace Layout',
      'This will reset your dashboard quick actions to the recommended preset for your business type and clear local layout overrides.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const reset = await WorkspaceRepository.resetPreferencesAsync(
              prefs.businessProfileId,
              prefs.businessType
            );
            await FeatureUsageRepository.resetUsageAsync();
            setPrefs(reset);
            Alert.alert('Workspace Reset', 'Your layout has been restored to default.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activePreset = BUSINESS_TYPE_PRESET_ACTIONS[prefs.businessType] || BUSINESS_TYPE_PRESET_ACTIONS.other;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={[styles.backText, { color: theme.textPrimary }]}>Done</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Workspace & Layout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Section: Automation & Adaptability */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>ADAPTIVE ENGINE</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                  Adaptive Workspace
                </Text>
                <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                  Prioritizes actions based on your business type and frequency of use
                </Text>
              </View>
              <Switch
                value={prefs.adaptiveEnabled}
                onValueChange={(val) => updatePreference('adaptiveEnabled', val)}
                thumbColor={Platform.OS === 'android' ? (prefs.adaptiveEnabled ? theme.brandAnchor : '#CCC') : undefined}
                trackColor={{ false: theme.borderSubtle, true: theme.borderFocused }}
              />
            </View>

            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                  Lock My Layout
                </Text>
                <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                  Keeps your dashboard buttons completely fixed with zero dynamic reordering
                </Text>
              </View>
              <Switch
                value={prefs.layoutLocked}
                onValueChange={(val) => updatePreference('layoutLocked', val)}
                thumbColor={Platform.OS === 'android' ? (prefs.layoutLocked ? theme.brandAnchor : '#CCC') : undefined}
                trackColor={{ false: theme.borderSubtle, true: theme.borderFocused }}
              />
            </View>
          </View>

          {/* Section: Business Type */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>BUSINESS PROFILE</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {BUSINESS_TYPE_OPTIONS.map((item, idx) => {
              const selected = prefs.businessType === item.id;
              const isLast = idx === BUSINESS_TYPE_OPTIONS.length - 1;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.row,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
                  ]}
                  onPress={() => updatePreference('businessType', item.id)}
                >
                  <View style={styles.textContainer}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                      {item.desc}
                    </Text>
                  </View>
                  {selected && <Check color={theme.textPrimary} size={18} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </View>

          {/* Section: What do you sell */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>SALES OFFERING</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {[
              { id: 'services' as const, label: 'Services', desc: 'Prioritizes SAC codes, timesheets & projects' },
              { id: 'products' as const, label: 'Physical Products', desc: 'Prioritizes HSN codes, shipping & stock' },
              { id: 'both' as const, label: 'Both Products & Services', desc: 'Displays full capability set' },
            ].map((opt, idx) => {
              const selected = prefs.salesType === opt.id;
              const isLast = idx === 2;
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.row,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
                  ]}
                  onPress={() => updatePreference('salesType', opt.id)}
                >
                  <View style={styles.textContainer}>
                    <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{opt.desc}</Text>
                  </View>
                  {selected && <Check color={theme.textPrimary} size={18} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </View>

          {/* Section: Operational Rules */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>OPERATIONAL DEFAULTS</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>GST Registered</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                  Shows GSTIN, HSN/SAC, and tax rate inputs
                </Text>
              </View>
              <Switch
                value={prefs.isGstRegistered}
                onValueChange={(val) => updatePreference('isGstRegistered', val)}
                thumbColor={Platform.OS === 'android' ? (prefs.isGstRegistered ? theme.brandAnchor : '#CCC') : undefined}
                trackColor={{ false: theme.borderSubtle, true: theme.borderFocused }}
              />
            </View>

            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Track Customer Jobs</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                  Enable job costing and project assignment
                </Text>
              </View>
              <Switch
                value={prefs.trackJobs}
                onValueChange={(val) => updatePreference('trackJobs', val)}
                thumbColor={Platform.OS === 'android' ? (prefs.trackJobs ? theme.brandAnchor : '#CCC') : undefined}
                trackColor={{ false: theme.borderSubtle, true: theme.borderFocused }}
              />
            </View>

            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Track Inventory & Catalog</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                  Manage stock levels, SKU tracking, and item catalogs
                </Text>
              </View>
              <Switch
                value={prefs.trackInventory}
                onValueChange={(val) => updatePreference('trackInventory', val)}
                thumbColor={Platform.OS === 'android' ? (prefs.trackInventory ? theme.brandAnchor : '#CCC') : undefined}
                trackColor={{ false: theme.borderSubtle, true: theme.borderFocused }}
              />
            </View>

            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Recurring Billing & Retainers</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                  Support periodic subscription invoices and monthly retainers
                </Text>
              </View>
              <Switch
                value={prefs.recurringBilling}
                onValueChange={(val) => updatePreference('recurringBilling', val)}
                thumbColor={Platform.OS === 'android' ? (prefs.recurringBilling ? theme.brandAnchor : '#CCC') : undefined}
                trackColor={{ false: theme.borderSubtle, true: theme.borderFocused }}
              />
            </View>
          </View>

          {/* Reset Action */}
          <View style={styles.resetContainer}>
            <Pressable
              style={[styles.resetBtn, { borderColor: theme.borderSubtle }]}
              accessibilityRole="button"
              accessibilityLabel="Reset workspace layout"
              onPress={handleReset}
            >
              <RotateCcw color={theme.statusDanger} size={16} />
              <Text style={[styles.resetBtnText, { color: theme.statusDanger }]}>
                Reset Workspace to Default Layout
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E3',
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  cardGroup: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resetContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.sm,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
