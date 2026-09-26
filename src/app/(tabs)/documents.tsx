/**
 * DOCUMENTS SCREEN
 * Central repository for all business documents (Invoices, Estimates, Receipts).
 * Supports real-time text search, type filters, and lifecycle filters.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, FileText, Plus, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { formatMoney } from '../../domain/money/Money';

interface DocumentListItem {
  id: string;
  doc_type: string;
  document_number: string;
  customer_name: string;
  total_minor: number;
  currency: string;
  lifecycle_status: string;
  issue_date: number;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'invoice' | 'estimate' | 'receipt'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [locale, setLocale] = useState('en-US');

  const loadDocuments = useCallback(async () => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      const profile = await db.getFirstAsync<{ default_document_locale: string }>(
        'SELECT default_document_locale FROM business_profiles WHERE is_active = 1 LIMIT 1;'
      );
      if (profile?.default_document_locale) {
        setLocale(profile.default_document_locale);
      }

      let query = `
        SELECT d.id, d.doc_type, d.document_number, COALESCE(c.name, 'No customer') AS customer_name,
               d.total_minor, d.currency, d.lifecycle_status, d.issue_date
        FROM documents d
        LEFT JOIN customers c ON d.customer_id = c.id
        WHERE d.is_archived = 0
      `;
      const params: any[] = [];

      if (selectedType !== 'all') {
        query += ' AND d.doc_type = ?';
        params.push(selectedType);
      }

      if (selectedStatus !== 'all') {
        query += ' AND d.lifecycle_status = ?';
        params.push(selectedStatus);
      }

      if (searchQuery.trim()) {
        query += ' AND (d.document_number LIKE ? OR c.name LIKE ? OR d.notes LIKE ?)';
        const wild = `%${searchQuery.trim()}%`;
        params.push(wild, wild, wild);
      }

      query += ' ORDER BY d.created_at DESC;';

      const items = await db.getAllAsync<DocumentListItem>(query, params);
      setDocuments(items);
    } catch {
      // Non-blocking
    }
  }, [searchQuery, selectedType, selectedStatus]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const renderItem = ({ item }: { item: DocumentListItem }) => {
    const isIssued = item.lifecycle_status === 'issued';
    const isVoid = item.lifecycle_status === 'void';
    const statusColor = isIssued ? theme.statusIssued : isVoid ? theme.statusDanger : theme.statusDraft;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.rowItem,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderSubtle,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => router.push(`/document/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.document_number}, ${item.customer_name}, ${item.lifecycle_status}`}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowLeft}>
            <View style={styles.numberRow}>
              <Text style={[styles.docNumber, { color: theme.textPrimary }]}>{item.document_number}</Text>
              <View style={[styles.typeBadge, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.typeBadgeText, { color: theme.textSecondary }]}>
                  {item.doc_type.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.customerName, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.customer_name}
            </Text>
          </View>

          <View style={styles.rowRight}>
            <Text style={[styles.docAmount, { color: theme.textPrimary }]}>
              {formatMoney({ amountMinor: BigInt(item.total_minor), currency: item.currency }, locale)}
            </Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.lifecycle_status.toUpperCase()}</Text>
              <ChevronRight color={theme.textMuted} size={16} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Documents</Text>
          <Pressable
            style={[styles.createBtn, { backgroundColor: theme.brandAnchor }]}
            accessibilityRole="button"
            accessibilityLabel="Create document"
            onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
          >
            <Plus color={theme.surface} size={18} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <Search color={theme.textSecondary} size={18} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search documents or customers..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Type Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'invoice', 'estimate', 'receipt'] as const).map((type) => {
            const isSelected = selectedType === type;
            return (
              <Pressable
                key={type}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.brandAnchor : theme.surface,
                    borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedType(type)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? theme.surface : theme.textPrimary },
                  ]}
                >
                  {type === 'all' ? 'All' : type === 'invoice' ? 'Invoices' : type === 'estimate' ? 'Estimates' : 'Receipts'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Documents List or Empty State */}
        {documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText color={theme.textMuted} size={40} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No documents found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search query.' : 'Create an invoice or estimate to get started.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: -0.3,
  },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.input.fontSize,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  rowItem: {
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flex: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  docNumber: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  customerName: {
    fontSize: typography.supporting.fontSize,
    marginTop: 2,
  },
  rowRight: {
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
});
