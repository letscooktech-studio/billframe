/**
 * CONTACTS HUB (Clients, Customers, Vendors & Suppliers)
 * Searchable contact registry with transaction ledgers, quick actions,
 * and direct customer statement generation.
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
import { Search, Plus, Users, ChevronRight, Phone, Mail, Building, FileText } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { formatMoney } from '../../domain/money/Money';

interface ContactItem {
  id: string;
  name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  total_invoices: number;
  balance_due_minor: number;
  total_billed_minor: number;
}

export default function ContactsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>([]);

  const loadContacts = useCallback(async () => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      let query = `
        SELECT c.id, c.name, c.business_name, c.email, c.phone,
               COUNT(d.id) AS total_invoices,
               COALESCE(SUM(CASE WHEN d.lifecycle_status IN ('issued', 'overdue') THEN d.balance_minor ELSE 0 END), 0) AS balance_due_minor,
               COALESCE(SUM(d.total_minor), 0) AS total_billed_minor
        FROM customers c
        LEFT JOIN documents d ON c.id = d.customer_id AND d.is_archived = 0
        WHERE c.is_archived = 0
      `;
      const params: any[] = [];

      if (searchQuery.trim()) {
        query += ' AND (c.name LIKE ? OR c.business_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
        const wild = `%${searchQuery.trim()}%`;
        params.push(wild, wild, wild, wild);
      }

      query += ' GROUP BY c.id ORDER BY c.name ASC;';

      const items = await db.getAllAsync<ContactItem>(query, params);
      setContacts(items);
    } catch {
      // Non-blocking
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const renderItem = ({ item }: { item: ContactItem }) => {
    const hasBalance = item.balance_due_minor > 0;

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
        onPress={() => router.push(`/customer/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.business_name || ''}`}
      >
        <View style={styles.rowMain}>
          <View style={[styles.avatar, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.avatarText, { color: theme.brandAnchor }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.rowInfo}>
            <Text style={[styles.contactName, { color: theme.textPrimary }]}>{item.name}</Text>
            {item.business_name ? (
              <Text style={[styles.businessName, { color: theme.textSecondary }]}>{item.business_name}</Text>
            ) : null}
            <Text style={[styles.contactMeta, { color: theme.textMuted }]}>
              {[item.email, item.phone].filter(Boolean).join(' • ') || 'No contact details'}
            </Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          <View style={styles.rightMetrics}>
            {hasBalance ? (
              <Text style={[styles.balanceDueText, { color: theme.statusWarning }]}>
                Due: {formatMoney({ amountMinor: BigInt(item.balance_due_minor), currency: 'INR' }, 'en-IN')}
              </Text>
            ) : (
              <Text style={[styles.billedText, { color: theme.textSecondary }]}>
                {item.total_invoices} {item.total_invoices === 1 ? 'document' : 'documents'}
              </Text>
            )}
          </View>
          <ChevronRight color={theme.textMuted} size={16} />
        </View>
      </Pressable>
    );
  };

  return (
    <AuroraBackground section="clients" intensity="subtle">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Clients</Text>
              <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                {contacts.length} {contacts.length === 1 ? 'client' : 'clients'} registered
              </Text>
            </View>
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.brandAnchor }]}
              onPress={() => router.push('/customer/edit')}
              accessibilityRole="button"
              accessibilityLabel="Add new client"
            >
              <Plus color={theme.brandAnchorText} size={18} strokeWidth={2.5} />
              <Text style={[styles.addButtonText, { color: theme.brandAnchorText }]}>Add Client</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Search color={theme.textSecondary} size={18} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search by name, company, email, phone..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* List */}
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Users color={theme.textMuted} size={40} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  {searchQuery ? 'No matching clients' : 'No clients yet'}
                </Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Add clients to issue tax invoices, track balances, and generate account statements.'}
                </Text>
                {!searchQuery && (
                  <Pressable
                    style={[styles.emptyButton, { backgroundColor: theme.brandAnchor }]}
                    onPress={() => router.push('/customer/edit')}
                  >
                    <Text style={[styles.emptyButtonText, { color: theme.brandAnchorText }]}>Add First Client</Text>
                  </Pressable>
                )}
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
  },
  screenSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
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
    fontSize: typography.body.fontSize,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderRadius: radii.sm,
    marginBottom: 4,
    minHeight: MIN_TOUCH_TARGET,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  businessName: {
    fontSize: typography.supporting.fontSize,
    marginTop: 1,
  },
  contactMeta: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rightMetrics: {
    alignItems: 'flex-end',
  },
  balanceDueText: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  billedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  invoiceBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.xl,
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
  },
  emptyButton: {
    height: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyButtonText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
});
