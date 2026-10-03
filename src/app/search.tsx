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
  { id: 'payments', label: 'Payments' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'inventory', label: 'Catalog' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [query, setQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<'all' | FeatureModule>('all');

  const readyFeatures = useMemo(() => {
    const allMatches = FeatureRegistry.search(query, { includeRoadmap: false });
    let filtered = allMatches.filter((f) => f.availability === 'ready' && Boolean(f.route));
    if (selectedModule !== 'all') {
      filtered = filtered.filter((f) => f.module === selectedModule);
    }
    return filtered;
  }, [query, selectedModule]);

  const handleSelectFeature = async (feature: FeatureCapability) => {
    // Record local feature usage telemetry
    await FeatureUsageRepository.recordUsageAsync(feature.id);

    if (feature.availability === 'ready' && feature.route) {
      router.push(feature.route as any);
    }
  };

  const totalResults = readyFeatures.length;

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
          {ALL_MODULE_FILTERS.map((f) => {
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
  featName: {
    fontSize: 14,
    fontWeight: '600',
  },
  featDesc: {
    fontSize: 12,
    lineHeight: 16,
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
});
