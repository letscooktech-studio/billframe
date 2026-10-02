/**
 * EXPENSES LIST SCREEN
 * Chronological expense ledger with category filters and total summary.
 * Supports materials, labour, subcontractors, equipment, fuel, travel, permits.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Receipt, Filter } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { ExpenseRepository, ExpenseRecord, ExpenseCategory } from '../../data/repositories/ExpenseRepository';
import { formatMoney, createMoney } from '../../domain/money/Money';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: 'Materials',
  labour: 'Labour',
  subcontractor: 'Subcontractor',
  equipment: 'Equipment',
  fuel: 'Fuel',
  travel: 'Travel',
  permits: 'Permits',
  other: 'Other',
};

const CATEGORY_FILTERS: Array<ExpenseCategory | 'all'> = [
  'all', 'materials', 'labour', 'subcontractor', 'equipment', 'fuel', 'travel', 'permits', 'other',
];

export default function ExpensesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ExpenseCategory | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      // useFocusEffect callback must be synchronous; call the async function inside.
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const all = await ExpenseRepository.listAllExpensesAsync();
          if (!cancelled) setExpenses(all);
        } catch {
          if (!cancelled) setExpenses([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const filtered = filter === 'all'
    ? expenses
    : expenses.filter((e) => e.category === filter);

  const total = filtered.reduce((acc, e) => acc + e.amount_minor, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
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
        <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Expenses</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.brandAnchor }]}
          onPress={() => router.push('/expenses/add')}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <Plus color="#fff" size={18} />
        </Pressable>
      </View>

      {/* Category Filter Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = filter === cat;
          return (
            <Pressable
              key={cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.brandAnchor : theme.surfaceSecondary,
                  borderColor: isActive ? theme.brandAnchor : theme.borderSubtle,
                },
              ]}
              onPress={() => setFilter(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${cat}`}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? '#fff' : theme.textSecondary },
                ]}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat as ExpenseCategory]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Summary Bar */}
      {filtered.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: theme.surfaceSecondary, borderBottomColor: theme.borderSubtle }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.summaryTotal, { color: theme.textPrimary }]}>
            {formatMoney(createMoney(BigInt(total), filtered[0]?.currency || 'USD'))}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator color={theme.brandAnchor} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} theme={theme} onAdd={() => router.push('/expenses/add')} />
          ) : (
            filtered.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} theme={theme} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── EXPENSE ROW ─────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  expense: ExpenseRecord;
  theme: any;
}

function ExpenseRow({ expense, theme }: ExpenseRowProps) {
  const date = new Date(expense.expense_date).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const amount = formatMoney(createMoney(BigInt(expense.amount_minor), expense.currency));

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowDescription, { color: theme.textPrimary }]} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.textSecondary }]}>
          {CATEGORY_LABELS[expense.category]}  ·  {date}
          {expense.is_billable ? '  ·  Billable' : ''}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: theme.textPrimary }]}>{amount}</Text>
    </View>
  );
}

// ── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState({
  filter, theme, onAdd,
}: {
  filter: ExpenseCategory | 'all';
  theme: any;
  onAdd: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Receipt color={theme.textMuted} size={36} />
      <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        {filter === 'all' ? 'No Expenses Yet' : `No ${CATEGORY_LABELS[filter]} Expenses`}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        Track materials, labour, and other costs to calculate job profitability.
      </Text>
      <Pressable
        style={[styles.emptyAddButton, { borderColor: theme.brandAnchor }]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add first expense"
      >
        <Plus color={theme.brandAnchor} size={16} />
        <Text style={[styles.emptyAddText, { color: theme.brandAnchor }]}>Add Expense</Text>
      </Pressable>
    </View>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  summaryLabel: { fontSize: typography.caption.fontSize },
  summaryTotal: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  rowLeft: { flex: 1, marginRight: spacing.md },
  rowDescription: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  rowMeta: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  emptySubtitle: {
    fontSize: typography.supporting.fontSize,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyAddText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
