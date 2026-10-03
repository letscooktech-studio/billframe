/**
 * ITEM EDITOR MODAL
 * Production line item editor sheet for Invoices and Estimates.
 * Supports catalog item auto-fill, exact decimal quantity scaling,
 * unit price in currency minor units, and live line-total preview.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { X, Trash2, PackageCheck, Layers } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';
import { QUANTITY_SCALE } from '../../domain/documents/types';
import {
  formatMoney,
  moneyToDecimalString,
  parseDecimalStringToMoney,
  roundHalfUp,
  createMoney,
} from '../../domain/money/Money';
import { CatalogRepository, CatalogItemRecord } from '../../data/repositories/CatalogRepository';
import {
  parseQuantityStringToScaled,
  quantityScaledToString,
} from '../../domain/documents/quantity';

export { parseQuantityStringToScaled, quantityScaledToString };

export const UNIT_PRESETS = ['item', 'hrs', 'days', 'pcs', 'kg', 'm', 'sq ft', 'project', 'service'] as const;

export interface ItemEditorModalProps {
  visible: boolean;
  item?: {
    id?: string;
    description: string;
    itemNotes?: string | null;
    quantityScaled: bigint;
    unitName?: string;
    unitPriceMinor: bigint;
  } | null;
  currency: string;
  documentLocale?: string;
  onSave: (item: {
    id?: string;
    description: string;
    itemNotes?: string;
    quantityScaled: bigint;
    unitName: string;
    unitPriceMinor: bigint;
  }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function ItemEditorModal({
  visible,
  item,
  currency,
  documentLocale = 'en-US',
  onSave,
  onDelete,
  onClose,
}: ItemEditorModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [description, setDescription] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [quantityStr, setQuantityStr] = useState('1');
  const [unitName, setUnitName] = useState('item');
  const [unitPriceStr, setUnitPriceStr] = useState('');
  const [catalogItems, setCatalogItems] = useState<CatalogItemRecord[]>([]);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isSubmittingRef.current = false;
      if (item) {
        setDescription(item.description);
        setItemNotes(item.itemNotes || '');
        setQuantityStr(quantityScaledToString(item.quantityScaled));
        setUnitName(item.unitName || 'item');
        setUnitPriceStr(moneyToDecimalString(createMoney(item.unitPriceMinor, currency)));
      } else {
        setDescription('');
        setItemNotes('');
        setQuantityStr('1');
        setUnitName('item');
        setUnitPriceStr('');
      }
      setShowCatalogPicker(false);
      setError(null);
      loadCatalog();
    }
  }, [visible, item, currency]);

  async function loadCatalog() {
    try {
      const items = await CatalogRepository.search('');
      setCatalogItems(items);
    } catch {
      // Non-blocking
    }
  }

  function handleSelectCatalogItem(cat: CatalogItemRecord) {
    setDescription(cat.name);
    setItemNotes(cat.description || '');
    setUnitName(cat.unit_name || 'item');
    setUnitPriceStr(moneyToDecimalString(createMoney(BigInt(cat.unit_price_minor), cat.currency || currency)));
    setShowCatalogPicker(false);
  }

  // Derive calculated line total in real time
  let liveLineTotalMinor = 0n;
  try {
    const qtyScaled = parseQuantityStringToScaled(quantityStr);
    const priceMoney = parseDecimalStringToMoney(unitPriceStr || '0', currency);
    liveLineTotalMinor = roundHalfUp(qtyScaled * priceMoney.amountMinor, QUANTITY_SCALE);
  } catch {
    liveLineTotalMinor = 0n;
  }

  function handleSave() {
    if (isSubmittingRef.current) return;

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      const qtyScaled = parseQuantityStringToScaled(quantityStr);
      if (qtyScaled <= 0n) {
        setError('Quantity must be greater than zero.');
        return;
      }

      const priceMoney = parseDecimalStringToMoney(unitPriceStr || '0', currency);

      isSubmittingRef.current = true;
      onSave({
        id: item?.id,
        description: description.trim(),
        itemNotes: itemNotes.trim() ? itemNotes.trim() : undefined,
        quantityScaled: qtyScaled,
        unitName: unitName.trim() || 'item',
        unitPriceMinor: priceMoney.amountMinor,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid item values');
      isSubmittingRef.current = false;
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handleBar, { backgroundColor: theme.borderSubtle }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {showCatalogPicker ? 'Select from Catalog' : item ? 'Edit Item' : 'Add Line Item'}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close item editor"
            >
              <X color={theme.textPrimary} size={22} />
            </Pressable>
          </View>

          {showCatalogPicker ? (
            <View style={styles.catalogContainer}>
              <FlatList
                data={catalogItems}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.catalogList}
                renderItem={({ item: cat }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.catalogRow,
                      { borderBottomColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleSelectCatalogItem(cat)}
                  >
                    <View style={styles.catalogInfo}>
                      <Text style={[styles.catalogName, { color: theme.textPrimary }]}>{cat.name}</Text>
                      {cat.description && (
                        <Text style={[styles.catalogDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                          {cat.description}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.catalogPrice, { color: theme.textPrimary }]}>
                      {formatMoney(createMoney(BigInt(cat.unit_price_minor), cat.currency), documentLocale)}
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyCatalog}>
                    <Layers color={theme.textMuted} size={32} />
                    <Text style={[styles.emptyCatalogText, { color: theme.textSecondary }]}>
                      No saved catalog items yet.
                    </Text>
                  </View>
                }
              />
              <Pressable
                style={[styles.catalogBackBtn, { borderColor: theme.borderSubtle }]}
                onPress={() => setShowCatalogPicker(false)}
              >
                <Text style={[styles.catalogBackText, { color: theme.textPrimary }]}>Back to manual entry</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {error && <Text style={[styles.errorText, { color: theme.statusDanger }]}>{error}</Text>}

              {/* Catalog quick-import button */}
              {catalogItems.length > 0 && (
                <Pressable
                  style={[styles.catalogImportBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => setShowCatalogPicker(true)}
                >
                  <PackageCheck color={theme.brandAnchor} size={18} />
                  <Text style={[styles.catalogImportText, { color: theme.brandAnchor }]}>
                    Choose from Saved Catalog ({catalogItems.length})
                  </Text>
                </Pressable>
              )}

              {/* Description */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Description *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                ]}
                placeholder="Item or service description..."
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                accessibilityLabel="Item description"
              />

              {/* Line Item Notes / Scope */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Item Notes / Scope (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.itemNotesArea,
                  { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                ]}
                placeholder="Dimensions, specifications, scope of work, warranty..."
                placeholderTextColor={theme.textMuted}
                value={itemNotes}
                onChangeText={setItemNotes}
                multiline
                numberOfLines={2}
                accessibilityLabel="Item notes or scope"
              />

              {/* Unit Presets Chips */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Unit</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitPresetsScroll}
              >
                {UNIT_PRESETS.map((preset) => {
                  const isSelected = unitName.trim().toLowerCase() === preset.toLowerCase();
                  return (
                    <Pressable
                      key={preset}
                      style={[
                        styles.unitPresetChip,
                        {
                          backgroundColor: isSelected ? theme.brandAnchor : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => setUnitName(preset)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set unit to ${preset}`}
                    >
                      <Text
                        style={[
                          styles.unitPresetText,
                          {
                            color: isSelected ? theme.brandAnchorText : theme.textSecondary,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {preset}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Quantity and Custom Unit Name */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Quantity *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                    ]}
                    placeholder="1"
                    placeholderTextColor={theme.textMuted}
                    value={quantityStr}
                    onChangeText={setQuantityStr}
                    keyboardType="numeric"
                    accessibilityLabel="Item quantity"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Unit Label</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                    ]}
                    placeholder="e.g. hrs, pcs, item"
                    placeholderTextColor={theme.textMuted}
                    value={unitName}
                    onChangeText={setUnitName}
                    accessibilityLabel="Unit of measurement"
                  />
                </View>
              </View>

              {/* Unit Price */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Unit Price ({currency}) *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                ]}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={unitPriceStr}
                onChangeText={setUnitPriceStr}
                keyboardType="numeric"
                accessibilityLabel={`Unit price in ${currency}`}
              />

              {/* Live Line Total Card */}
              <View style={[styles.liveTotalCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.liveTotalLabel, { color: theme.textSecondary }]}>Line Total</Text>
                <Text style={[styles.liveTotalValue, { color: theme.textPrimary }]}>
                  {formatMoney(createMoney(liveLineTotalMinor, currency), documentLocale)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {item?.id && onDelete && (
                  <Pressable
                    style={[styles.deleteBtn, { borderColor: theme.statusDanger }]}
                    onPress={() => {
                      if (isSubmittingRef.current) return;
                      isSubmittingRef.current = true;
                      onDelete(item.id!);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Delete item"
                    accessibilityHint="Removes this line item from the document"
                  >
                    <Trash2 color={theme.statusDanger} size={18} />
                  </Pressable>
                )}
                <Pressable
                  style={[styles.saveBtn, { backgroundColor: theme.brandAnchor }]}
                  onPress={handleSave}
                  accessibilityRole="button"
                  accessibilityLabel="Save line item"
                >
                  <Text style={[styles.saveBtnText, { color: theme.brandAnchorText }]}>
                    {item ? 'Update Item' : 'Add Item'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xxl,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: radii.full,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  catalogImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  catalogImportText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginTop: 4,
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: typography.input.fontSize,
  },
  textArea: {
    minHeight: 72,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    textAlignVertical: 'top',
  },
  itemNotesArea: {
    minHeight: 56,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    textAlignVertical: 'top',
    fontSize: typography.caption.fontSize,
  },
  unitPresetsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  unitPresetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitPresetText: {
    fontSize: typography.caption.fontSize,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  liveTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  liveTotalLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveTotalValue: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  deleteBtn: {
    width: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  catalogContainer: {
    padding: spacing.lg,
  },
  catalogList: {
    paddingBottom: spacing.md,
  },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  catalogInfo: {
    flex: 1,
  },
  catalogName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  catalogDesc: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  catalogPrice: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  emptyCatalog: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyCatalogText: {
    fontSize: typography.body.fontSize,
  },
  catalogBackBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  catalogBackText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
});
