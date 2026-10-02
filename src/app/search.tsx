/**
 * GLOBAL COMMAND SEARCH
 * Instant on-device capability search across all active Billframe features.
 * In production: returns ONLY currently usable, functional features.
 * In development: roadmap modules appear in an explicitly separated section.
 */

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
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
} from '../design/tokens';
import {
  FeatureIcon,
  Search,
  X,
  ChevronRight,
} from '../design/icons';
import {
  FeatureCapability,
  FeatureRegistry,
  FeatureModule,
} from '../domain/features/FeatureRegistry';
import { FeatureUsageRepository } from '../data/repositories/FeatureUsageRepository';

const ALL_MODULE_FILTERS: Array<{ id: 'all' | FeatureModule; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'billing', label: 'Billing' },
  { id: 'clients', label: 'Clients' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'gst', label: 'GST' },
];

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const isDev = FeatureRegistry.isDevelopment();
  const [query, setQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<'all' | FeatureModule>('all');

  // Filter chips: in production, show only modules with ready features
  const activeFilters = useMemo(() => {
    if (isDev) return ALL_MODULE_FILTERS;
    return ALL_MODULE_FILTERS.filter((m) =>
      ['all', 'billing', 'clients', 'expenses', 'reports', 'settings'].includes(m.id)
    );
  }, [isDev]);

  const { readyFeatures, roadmapFeatures } = useMemo(() => {
    const allMatches = FeatureRegistry.search(query, { includeRoadmap: isDev });
    let filtered = allMatches;
    if (selectedModule !== 'all') {
      filtered = filtered.filter((f) => f.module === selectedModule);
    }

    return {
      readyFeatures: filtered.filter((f) => f.availability === 'ready'),
      roadmapFeatures: isDev ? filtered.filter((f) => f.availability === 'roadmap') : [],
    };
  }, [query, selectedModule, isDev]);

  const handleSelectFeature = async (feature: FeatureCapability) => {
    // Record local feature usage telemetry
    await FeatureUsageRepository.recordUsageAsync(feature.id);

    if (feature.availability === 'ready' && feature.route) {
      router.push(feature.route as any);
    } else {
      Alert.alert(
        `${feature.name} (${feature.roadmapPhase || 'Roadmap'})`,
        `${feature.description}\n\nThis capability is planned for ${feature.roadmapPhase || 'an upcoming release'}. Billframe follows a strict phase-gated engineering schedule.`,
        [{ text: 'Got it', style: 'default' }]
      );
    }
  };

  const totalResults = readyFeatures.length + roadmapFeatures.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderFocused,
            },
          ]}
        >
          <Search color={theme.textSecondary} size={18} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search features (invoice, backup, expenses, reports...)"
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
              style={styles.clearBtn}
            >
              <X color={theme.textSecondary} size={16} />
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={[styles.cancelText, { color: theme.textPrimary }]}>Cancel</Text>
        </Pressable>
      </View>

      {/* Module filter chips */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {activeFilters.map((f) => {
            const active = selectedModule === f.id;
            return (
              <Pressable
                key={f.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.brandAnchor : theme.surface,
                    borderColor: active ? theme.brandAnchor : theme.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedModule(f.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? theme.surface : theme.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Feature results */}
      <ScrollView
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {totalResults === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No actions found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try searching for "invoice", "estimate", "customer", "backup", or "expenses".
              </Text>
            </View>
          ) : (
            <>
              {/* Ready / Functional Features */}
              {readyFeatures.length > 0 && (
                <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                  {readyFeatures.map((feat, idx) => {
                    const isLast = idx === readyFeatures.length - 1;

                    return (
                      <Pressable
                        key={feat.id}
                        style={({ pressed }) => [
                          styles.row,
                          !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={feat.name}
                        onPress={() => handleSelectFeature(feat)}
                      >
                        <View style={styles.iconContainer}>
                          <FeatureIcon
                            name={feat.icon}
                            size="md"
                            color={theme.textPrimary}
                          />
                        </View>

                        <View style={styles.textContainer}>
                          <Text style={[styles.featName, { color: theme.textPrimary }]}>
                            {feat.name}
                          </Text>
                          <Text style={[styles.featDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                            {feat.description}
                          </Text>
                        </View>

                        <ChevronRight color={theme.textMuted} size={16} />
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Development-Only Roadmap Section (Hidden in production) */}
              {isDev && roadmapFeatures.length > 0 && (
                <View style={styles.devSection}>
                  <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
                    DEVELOPMENT ROADMAP (DEV ONLY)
                  </Text>
                  <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                    {roadmapFeatures.map((feat, idx) => {
                      const isLast = idx === roadmapFeatures.length - 1;

                      return (
                        <Pressable
                          key={feat.id}
                          style={({ pressed }) => [
                            styles.row,
                            !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderSubtle },
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={feat.name}
                          onPress={() => handleSelectFeature(feat)}
                        >
                          <View style={styles.iconContainer}>
                            <FeatureIcon
                              name={feat.icon}
                              size="md"
                              color={theme.textMuted}
                            />
                          </View>

                          <View style={styles.textContainer}>
                            <View style={styles.nameRow}>
                              <Text style={[styles.featName, { color: theme.textPrimary }]}>
                                {feat.name}
                              </Text>
                              <View
                                style={[
                                  styles.roadmapPill,
                                  { backgroundColor: theme.surfaceSecondary },
                                ]}
                              >
                                <Text style={[styles.roadmapPillText, { color: theme.textSecondary }]}>
                                  {feat.roadmapPhase || 'Roadmap'}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.featDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                              {feat.description}
                            </Text>
                          </View>

                          <ChevronRight color={theme.textMuted} size={16} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearBtn: {
    padding: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  filterScrollWrapper: {
    paddingBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  cardGroup: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  featName: {
    fontSize: 14,
    fontWeight: '600',
  },
  featDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  roadmapPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  roadmapPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  devSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
});
