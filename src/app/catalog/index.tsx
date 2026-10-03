/**
 * CATALOG & SERVICES SCREEN
 * Management screen for reusable items, hourly rates, and standard units.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Plus, Trash2, Package, X } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { CatalogRepository, CatalogItemRecord } from '../../data/repositories/CatalogRepository';
import { createMoney, formatMoney, parseDecimalStringToMoney } from '../../domain/money/Money';

export default function CatalogScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [items, setItems] = useState<CatalogItemRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [unitName, setUnitName] = useState('item');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const list = await CatalogRepository.search(searchQuery);
      setItems(list);
    } catch {
      // Non-blocking
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  async function handleCreateItem() {
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    try {
      const money = parseDecimalStringToMoney(priceStr || '0', currency);
      await CatalogRepository.create({
        name: name.trim(),
        description: description.trim() || null,
        unitPriceMinor: money.amountMinor,
        currency,
        unitName: unitName.trim() || 'item',
      });

      setShowAddModal(false);
      setName('');
      setDescription('');
      setPriceStr('');
      setUnitName('item');
      setError(null);
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    }
  }

  async function handleArchiveItem(id: string, itemName: string) {
    Alert.alert('Archive Item', `Remove "${itemName}" from your catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await CatalogRepository.archive(id);
          await loadItems();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header */}
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
        <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Items & Services</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: theme.brandAnchor }]}
          onPress={() => setShowAddModal(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add catalog item"
        >
          <Plus color={theme.brandAnchorText} size={18} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.container}>
        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <Search color={theme.textSecondary} size={18} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search items and services..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={styles.itemMain}>
                <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                {item.description && (
                  <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{item.description}</Text>
                )}
                <Text style={[styles.itemUnitPrice, { color: theme.textPrimary }]}>
                  {formatMoney(createMoney(BigInt(item.unit_price_minor), item.currency))} / {item.unit_name}
                </Text>
              </View>

              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleArchiveItem(item.id, item.name)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Archive item"
              >
                <Trash2 color={theme.textMuted} size={18} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color={theme.textMuted} size={40} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No catalog items yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Save standard items, rates, and services to insert them into invoices in one tap.
              </Text>
              <Pressable
                style={[styles.emptyButton, { backgroundColor: theme.brandAnchor }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={[styles.emptyButtonText, { color: theme.brandAnchorText }]}>Add Item</Text>
              </Pressable>
            </View>
          }
        />
      </View>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>New Catalog Item</Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={10}>
                <X color={theme.textPrimary} size={22} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              {error && <Text style={[styles.errorText, { color: theme.statusDanger }]}>{error}</Text>}

              <Text style={[styles.label, { color: theme.textSecondary }]}>Item or Service Name *</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. Website Design, Consulting"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="Optional details or specifications..."
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Unit Price ({currency}) *</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    value={priceStr}
                    onChangeText={setPriceStr}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Unit Name</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="hrs, item, project"
                    placeholderTextColor={theme.textMuted}
                    value={unitName}
                    onChangeText={setUnitName}
                  />
                </View>
              </View>

              <Pressable
                style={[styles.saveBtn, { backgroundColor: theme.brandAnchor }]}
                onPress={handleCreateItem}
              >
                <Text style={[styles.saveBtnText, { color: theme.brandAnchorText }]}>Save Item</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.input.fontSize,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  itemDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    padding: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginTop: 4,
  },
  input: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.input.fontSize,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  saveBtn: {
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
});
