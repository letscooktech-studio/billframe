/**
 * ADD EXPENSE SCREEN
 * Records a new expense with category, description, amount, date, and billable flag.
 * Supports all 8 expense categories from schema.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import {
  ExpenseRepository,
  ExpenseCategory,
} from '../../data/repositories/ExpenseRepository';

const CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: 'materials', label: 'Materials' },
  { value: 'labour', label: 'Labour' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'travel', label: 'Travel' },
  { value: 'permits', label: 'Permits' },
  { value: 'other', label: 'Other' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [category, setCategory] = useState<ExpenseCategory>('materials');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isBillable, setIsBillable] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Derive today's date as YYYY-MM-DD string for display
  const todayLabel = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  async function handleSave() {
    const trimDesc = description.trim();
    if (!trimDesc) {
      setError('Description is required.');
      return;
    }

    const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    const amountMinor = Math.round(amount * 100);

    setIsSaving(true);
    setError(null);

    try {
      await ExpenseRepository.createExpenseAsync({
        category,
        description: trimDesc,
        amountMinor,
        currency,
        isBillable,
        expenseDate: Date.now(),
      });
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense.');
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Top Bar */}
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
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Add Expense</Text>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.brandAnchor, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save expense"
          >
            <Text style={[styles.saveBtnText, { color: theme.brandAnchorText }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Error */}
            {error && (
              <View style={[styles.errorBox, { borderColor: theme.statusDanger, backgroundColor: theme.surfaceSecondary }]}>
                <AlertCircle color={theme.statusDanger} size={16} />
                <Text style={[styles.errorText, { color: theme.statusDanger }]}>{error}</Text>
              </View>
            )}

            {/* Category */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(({ value, label }) => {
                  const isSelected = category === value;
                  return (
                    <Pressable
                      key={value}
                      style={[
                        styles.categoryChip,
                        {
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                          backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                        },
                      ]}
                      onPress={() => setCategory(value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Category: ${label}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: isSelected ? theme.brandAnchor : theme.textSecondary,
                            fontWeight: isSelected ? '700' : '400',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Details */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DETAILS</Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Description *</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                placeholder="What was this expense for?"
                placeholderTextColor={theme.textMuted}
                value={description}
                onChangeText={setDescription}
                accessibilityLabel="Expense description"
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Amount</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.currencyInput,
                    { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                  ]}
                  placeholder="USD"
                  placeholderTextColor={theme.textMuted}
                  value={currency}
                  onChangeText={(v) => setCurrency(v.toUpperCase().slice(0, 3))}
                  maxLength={3}
                  autoCapitalize="characters"
                  accessibilityLabel="Currency code"
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.amountInput,
                    { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  value={amountStr}
                  onChangeText={setAmountStr}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Expense amount"
                />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Date</Text>
              <View style={[styles.dateDisplay, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.dateText, { color: theme.textPrimary }]}>{todayLabel}</Text>
              </View>
              <Text style={[styles.hint, { color: theme.textMuted }]}>Date recorded as today.</Text>
            </View>

            {/* Billable Toggle */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                    Billable to Customer
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                    Mark to include in a future invoice as a reimbursable expense.
                  </Text>
                </View>
                <Switch
                  value={isBillable}
                  onValueChange={setIsBillable}
                  trackColor={{ false: theme.borderSubtle, true: theme.brandAnchor }}
                  thumbColor="#fff"
                  accessibilityLabel="Billable toggle"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
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
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  saveBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: typography.caption.fontSize,
  },
  fieldLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.input.fontSize,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  currencyInput: { width: 72 },
  amountInput: { flex: 1 },
  dateDisplay: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  dateText: { fontSize: typography.input.fontSize },
  hint: {
    fontSize: 11,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleTextBlock: { flex: 1 },
  toggleTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  toggleSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
});
