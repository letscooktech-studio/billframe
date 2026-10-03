/**
 * CUSTOMER PICKER MODAL
 * Fast, searchable customer selection sheet with inline customer creation.
 * Never forces user to leave the document editor.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Search, Plus, X, Check, Users } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';
import { CustomerRepository, CustomerRecord } from '../../data/repositories/CustomerRepository';

interface CustomerPickerModalProps {
  visible: boolean;
  selectedCustomerId?: string | null;
  initialQuickAdd?: boolean;
  onSelectCustomer: (customer: CustomerRecord) => void;
  onClose: () => void;
}

export function CustomerPickerModal({
  visible,
  selectedCustomerId,
  initialQuickAdd = false,
  onSelectCustomer,
  onClose,
}: CustomerPickerModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);

  // Quick-Add fields
  const [quickName, setQuickName] = useState('');
  const [quickBusiness, setQuickBusiness] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCustomers(searchQuery);
      setIsCreatingQuick(Boolean(initialQuickAdd));
      setQuickError(null);
    }
  }, [visible, searchQuery, initialQuickAdd]);

  async function loadCustomers(query: string) {
    const list = await CustomerRepository.search(query);
    setCustomers(list);
  }

  async function handleQuickAdd() {
    if (!quickName.trim()) {
      setQuickError('Customer name is required.');
      return;
    }

    try {
      const created = await CustomerRepository.create({
        name: quickName.trim(),
        businessName: quickBusiness.trim() || null,
        email: quickEmail.trim() || null,
        phone: quickPhone.trim() || null,
      });

      onSelectCustomer(created);
      onClose();
    } catch (err: any) {
      setQuickError(err.message || 'Failed to create customer');
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
              {isCreatingQuick ? 'Quick Add Customer' : 'Select Customer'}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close customer picker"
            >
              <X color={theme.textPrimary} size={22} />
            </Pressable>
          </View>

          {isCreatingQuick ? (
            <ScrollView
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {quickError && <Text style={[styles.errorText, { color: theme.statusDanger }]}>{quickError}</Text>}

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. John Doe"
                placeholderTextColor={theme.textMuted}
                value={quickName}
                onChangeText={setQuickName}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Company / Business Name</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="e.g. Acme Corp"
                placeholderTextColor={theme.textMuted}
                value={quickBusiness}
                onChangeText={setQuickBusiness}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="john@example.com"
                    placeholderTextColor={theme.textMuted}
                    value={quickEmail}
                    onChangeText={setQuickEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="+1 555-0199"
                    placeholderTextColor={theme.textMuted}
                    value={quickPhone}
                    onChangeText={setQuickPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: theme.borderSubtle }]}
                  onPress={() => setIsCreatingQuick(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, { backgroundColor: theme.brandAnchor }]}
                  onPress={handleQuickAdd}
                >
                  <Text style={[styles.saveBtnText, { color: theme.brandAnchorText }]}>Save & Select</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            <>
              {/* Search bar + Quick Add button */}
              <View style={styles.searchRow}>
                <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                  <Search color={theme.textSecondary} size={18} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Search customers..."
                    placeholderTextColor={theme.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <Pressable
                  style={[styles.quickAddBtn, { backgroundColor: theme.brandAnchor }]}
                  onPress={() => setIsCreatingQuick(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Quick add new customer"
                >
                  <Plus color={theme.brandAnchorText} size={18} strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Customer List */}
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedCustomerId;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.customerRow,
                        { borderBottomColor: theme.borderSubtle, opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => {
                        onSelectCustomer(item);
                        onClose();
                      }}
                    >
                      <View style={styles.customerInfo}>
                        <Text style={[styles.customerName, { color: theme.textPrimary }]}>{item.name}</Text>
                        {item.business_name && (
                          <Text style={[styles.customerBusiness, { color: theme.textSecondary }]}>
                            {item.business_name}
                          </Text>
                        )}
                        {(item.email || item.phone) && (
                          <Text style={[styles.customerContact, { color: theme.textMuted }]}>
                            {[item.email, item.phone].filter(Boolean).join(' • ')}
                          </Text>
                        )}
                      </View>
                      {isSelected && <Check color={theme.statusSuccess} size={20} />}
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Users color={theme.textMuted} size={36} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      {searchQuery ? 'No customers match your search.' : 'No customers found.'}
                    </Text>
                    <Pressable
                      style={[styles.createFirstBtn, { backgroundColor: theme.brandAnchor }]}
                      onPress={() => setIsCreatingQuick(true)}
                    >
                      <Text style={[styles.createFirstBtnText, { color: theme.brandAnchorText }]}>Add Customer</Text>
                    </Pressable>
                  </View>
                }
              />
            </>
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
    maxHeight: '88%',
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
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.input.fontSize,
  },
  quickAddBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  customerBusiness: {
    fontSize: typography.supporting.fontSize,
    marginTop: 1,
  },
  customerContact: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  createFirstBtn: {
    height: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  createFirstBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  formContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  inputLabel: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  saveBtn: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
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
});
