/**
 * CUSTOMERS DIRECTORY SCREEN
 * Fast searchable list of clients and businesses. Shows contact details and total outstanding balance.
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
import { Search, Plus, Users, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DatabaseManager } from '../../data/database/DatabaseManager';

interface CustomerListItem {
  id: string;
  name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  total_invoices: number;
}

export default function CustomersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);

  const loadCustomers = useCallback(async () => {
    try {
      const db = await DatabaseManager.getDatabaseAsync();

      let query = `
        SELECT c.id, c.name, c.business_name, c.email, c.phone,
               COUNT(d.id) AS total_invoices
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

      const items = await db.getAllAsync<CustomerListItem>(query, params);
      setCustomers(items);
    } catch {
      // Non-blocking
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  const renderItem = ({ item }: { item: CustomerListItem }) => (
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
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: theme.brandAnchor }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.rowInfo}>
          <Text style={[styles.customerName, { color: theme.textPrimary }]}>{item.name}</Text>
          {item.business_name ? (
            <Text style={[styles.businessName, { color: theme.textSecondary }]}>{item.business_name}</Text>
          ) : null}
          <Text style={[styles.contactInfo, { color: theme.textMuted }]}>
            {[item.email, item.phone].filter(Boolean).join(' • ') || 'No contact details'}
          </Text>
        </View>

        <View style={styles.rowRight}>
          <Text style={[styles.invoiceCount, { color: theme.textSecondary }]}>
            {item.total_invoices} {item.total_invoices === 1 ? 'doc' : 'docs'}
          </Text>
          <ChevronRight color={theme.textMuted} size={16} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Customers</Text>
          <Pressable
            style={[styles.createBtn, { backgroundColor: theme.brandAnchor }]}
            accessibilityRole="button"
            accessibilityLabel="Add customer"
            onPress={() => router.push('/customer/edit')}
          >
            <Plus color={theme.surface} size={18} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <Search color={theme.textSecondary} size={18} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search by name, company, email..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* List / Empty State */}
        {customers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users color={theme.textMuted} size={40} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No customers yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery ? 'No customers match your search.' : 'Add your clients to speed up invoice creation.'}
            </Text>
            {!searchQuery && (
              <Pressable
                style={[styles.emptyButton, { backgroundColor: theme.brandAnchor }]}
                accessibilityRole="button"
                onPress={() => router.push('/customer/edit')}
              >
                <Text style={[styles.emptyButtonText, { color: theme.surface }]}>Add Customer</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <FlatList
            data={customers}
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
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: '#EFEFED',
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
  customerName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  businessName: {
    fontSize: typography.supporting.fontSize,
    marginTop: 1,
  },
  contactInfo: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  invoiceCount: {
    fontSize: typography.caption.fontSize,
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
