/**
 * TAX EXPLANATION MODAL ("Why This Rate?")
 * Interactive, legally grounded explanation of tax rates, place of supply,
 * multi-component breakdowns, and statutory citations.
 */

import React from 'react';
import { StyleSheet, View, Text, useColorScheme, Pressable } from 'react-native';
import { ShieldCheck, Scale, FileText, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { KeyboardAwareSheet } from '../../components/common/KeyboardAwareSheet';
import { TaxExplanation } from '../../domain/tax/TaxExplainability';
import { formatMoney, createMoney } from '../../domain/money/Money';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';

export interface TaxExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  explanation: TaxExplanation | null;
  currency?: string;
}

export function TaxExplanationModal({
  visible,
  onClose,
  explanation,
  currency = 'INR',
}: TaxExplanationModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  if (!explanation) return null;

  return (
    <KeyboardAwareSheet
      visible={visible}
      onClose={onClose}
      title="Tax Authority Explanation"
      subtitle={explanation.taxSystem}
      maxHeightPercent={85}
      footer={
        <Pressable
          style={[styles.doneBtn, { backgroundColor: theme.brandAnchor }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss tax explanation"
        >
          <Text style={[styles.doneBtnText, { color: theme.brandAnchorText }]}>Understood</Text>
        </Pressable>
      }
    >
      <View style={styles.container}>
        {/* Classification Badge & Title */}
        <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: theme.brandAnchor + '1A', borderColor: theme.brandAnchor }]}>
              <Text style={[styles.typeBadgeText, { color: theme.brandAnchor }]}>
                {explanation.supplyTypeLabel}
              </Text>
            </View>
            <View style={styles.posWrap}>
              <Text style={[styles.posLabel, { color: theme.textMuted }]}>Place of Supply:</Text>
              <Text style={[styles.posValue, { color: theme.textPrimary }]}>{explanation.placeOfSupply}</Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{explanation.title}</Text>
          <Text style={[styles.cardSummary, { color: theme.textSecondary }]}>{explanation.summary}</Text>
        </View>

        {/* Statutory Citation Card */}
        <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <View style={styles.cardHeader}>
            <Scale size={16} color={theme.brandAnchor} />
            <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary }]}>Statutory Basis</Text>
          </View>
          <Text style={[styles.citationText, { color: theme.textSecondary }]}>
            {explanation.statutoryCitation}
          </Text>
          <Text style={[styles.citationNote, { color: theme.textMuted }]}>
            Determined by place-of-supply resolution pursuant to applicable taxation law schedules.
          </Text>
        </View>

        {/* Component Breakdown Table */}
        {explanation.componentBreakdown.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <FileText size={16} color={theme.brandAnchor} />
              <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary }]}>Component Breakdown</Text>
            </View>
            <View style={styles.table}>
              {explanation.componentBreakdown.map((comp, idx) => (
                <View
                  key={`${comp.code}_${idx}`}
                  style={[
                    styles.tableRow,
                    idx < explanation.componentBreakdown.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <View style={styles.componentLeft}>
                    <Text style={[styles.componentName, { color: theme.textPrimary }]}>{comp.name}</Text>
                    <Text style={[styles.componentCode, { color: theme.textMuted }]}>
                      {comp.code} · {comp.ratePercent}
                    </Text>
                  </View>
                  <Text style={[styles.componentAmount, { color: theme.textPrimary }]}>
                    {formatMoney(createMoney(comp.amountMinor, currency))}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reverse Charge Notice */}
        {explanation.reverseChargeNote && (
          <View style={[styles.warningBox, { borderColor: theme.statusWarning, backgroundColor: theme.statusWarning + '14' }]}>
            <AlertCircle size={18} color={theme.statusWarning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: theme.statusWarning }]}>Reverse Charge Applicable</Text>
              <Text style={[styles.warningText, { color: theme.textSecondary }]}>
                {explanation.reverseChargeNote}
              </Text>
            </View>
          </View>
        )}

        {/* Applied Rules / Facts */}
        <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <Text style={[styles.rulesHeader, { color: theme.textMuted }]}>DETERMINATION FACTORS</Text>
          {explanation.rulesApplied.map((rule, idx) => (
            <View key={idx} style={styles.ruleItem}>
              <CheckCircle2 size={13} color={theme.statusSuccess} style={{ marginTop: 2 }} />
              <Text style={[styles.ruleText, { color: theme.textSecondary }]}>{rule}</Text>
            </View>
          ))}
        </View>

        {/* Verified Local-First Engine Notice */}
        <View style={styles.engineNotice}>
          <ShieldCheck size={14} color={theme.textMuted} />
          <Text style={[styles.engineNoticeText, { color: theme.textMuted }]}>
            Evaluated on-device by Billframe Tax Authority Pipeline. No external tax data exposed.
          </Text>
        </View>
      </View>
    </KeyboardAwareSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  posWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  posLabel: {
    fontSize: 11,
  },
  posValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  citationText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  citationNote: {
    fontSize: 11,
    lineHeight: 15,
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  componentLeft: {
    flex: 1,
  },
  componentName: {
    fontSize: 13,
    fontWeight: '600',
  },
  componentCode: {
    fontSize: 11,
    marginTop: 1,
  },
  componentAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 17,
  },
  rulesHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  ruleText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  engineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  engineNoticeText: {
    fontSize: 11,
    textAlign: 'center',
    flexShrink: 1,
  },
  doneBtn: {
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
