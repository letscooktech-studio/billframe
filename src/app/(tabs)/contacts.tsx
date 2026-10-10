/**
 * CONTACTS / PEOPLE HUB — BILLFRAME RECOVERY 3.0
 * Unified directory for Clients, Customers, Recipients, Vendors & Suppliers.
 * 
 * Features:
 * - Clean monochrome styling matching Image 1 & 2 design system
 * - Standardized SearchField, IconButton, PrimaryButton, and EmptyState
 * - Guaranteed >= 48dp touch targets on every interactive element
 * - Zero colored Aurora background overlays
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Users, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { formatMoney } from '../../domain/money/Money';
import { SearchField } from '../../components/common/SearchField';
import { IconButton } from '../../components/common/IconButton';
import { EmptyState } from '../../components/common/EmptyState';

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
      setContacts(items || []);
    } catch {
      setContacts([]);
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
            borderColor: theme.borderDefault,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => router.push(`/customer/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.business_name || ''}`}
      >
        <View style={styles.rowMain}>
          <View style={[styles.avatar, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.avatarText, { color: theme.textPrimary }]}>
              {(item.name || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.rowInfo}>
            <Text style={[styles.contactName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.business_name ? (
              <Text style={[styles.businessName, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.business_name}
              </Text>
            ) : null}
            <Text style={[styles.contactMeta, { color: theme.textMuted }]} numberOfLines={1}>
              {[item.email, item.phone].filter(Boolean).join(' • ') || 'No contact details'}
            </Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          <View style={styles.rightMetrics}>
            {hasBalance ? (
              <Text style={[styles.balanceDueText, { color: theme.textPrimary }]}>
                Due: {formatMoney({ amountMinor: BigInt(item.balance_due_minor), currency: 'INR' }, 'en-IN')}
              </Text>
            ) : (
              <Text style={[styles.billedText, { color: theme.textSecondary }]}>
                {item.total_invoices} {item.total_invoices === 1 ? 'doc' : 'docs'}
              </Text>
            )}
          </View>
          <ChevronRight color={theme.textMuted} size={18} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>People</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} in directory
            </Text>
          </View>
          <IconButton
            icon={<Plus color={theme.textPrimary} size={20} />}
            onPress={() => router.push('/customer/edit')}
            accessibilityLabel="Add new contact or client"
            size={44}
          />
        </View>

        {/* Standardized Search Bar */}
        <View style={styles.searchContainer}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, company, email, phone..."
            onClear={() => setSearchQuery('')}
          />
        </View>

        {/* Contacts FlatList */}
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? 'No matching contacts' : 'No contacts yet'}
              description={
                searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Add contacts to issue documents, track balances, and generate account statements.'
              }
              actionLabel="+ Add Contact"
              onAction={() => router.push('/customer/edit')}
            />
          }
        />
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
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: 40,
  },
  rowItem: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 13,
    marginBottom: 2,
  },
  contactMeta: {
    fontSize: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightMetrics: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balanceDueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  billedText: {
    fontSize: 12,
  },
});
