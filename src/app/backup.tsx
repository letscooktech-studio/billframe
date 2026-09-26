/**
 * BACKUP & DATA RETENTION SCREEN
 * Provides information on sandboxed SQLite database durability,
 * manual snapshot export, and data integrity guarantees.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Database, ShieldCheck, Download, FileSpreadsheet } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../design/tokens';

export default function BackupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
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
        <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Data & Durability</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Durability Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <ShieldCheck color={theme.statusSuccess} size={24} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Offline-First Local Storage</Text>
            </View>
            <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
              All your invoices, estimates, customer contacts, and payment records are stored in a private,
              sandboxed SQLite database on your device with Write-Ahead Logging (WAL) enabled.
            </Text>
            <Text style={[styles.cardBody, { color: theme.textSecondary, marginTop: spacing.sm }]}>
              No third-party server can access or sell your financial data. You retain 100% data ownership.
            </Text>
          </View>

          {/* Database Specs Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <Database color={theme.brandAnchor} size={24} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Database Invariants</Text>
            </View>
            <View style={styles.specList}>
              <Text style={[styles.specItem, { color: theme.textSecondary }]}>
                • WAL mode with synchronous NORMAL for crash resilience
              </Text>
              <Text style={[styles.specItem, { color: theme.textSecondary }]}>
                • Composite uniqueness: (business_profile_id, doc_type, document_number)
              </Text>
              <Text style={[styles.specItem, { color: theme.textSecondary }]}>
                • Sequence counter monotonic increments inside atomic transactions
              </Text>
              <Text style={[styles.specItem, { color: theme.textSecondary }]}>
                • Authoritative payments table: invoice balances derived strictly from applied payments
              </Text>
            </View>
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
  topBarTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  cardBody: {
    fontSize: typography.body.fontSize,
    lineHeight: 22,
  },
  specList: {
    gap: 8,
  },
  specItem: {
    fontSize: typography.supporting.fontSize,
    lineHeight: 20,
  },
});
