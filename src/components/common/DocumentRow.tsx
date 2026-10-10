/**
 * DOCUMENT ROW COMPONENT
 * Android Design System: Clean monochrome document item card/row.
 * Height/Touch target >= 48dp, 12dp radius, charcoal surface with restrained border.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { ChevronRight, FileText } from 'lucide-react-native';
import { colors, radii, spacing, MIN_TOUCH_TARGET } from '../../design/tokens';

export interface DocumentRowProps {
  title: string;
  subtitle: string;
  statusText?: string;
  amountText?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}

export function DocumentRow({
  title,
  subtitle,
  statusText,
  amountText,
  onPress,
  style,
  testID,
  accessibilityLabel,
  icon,
}: DocumentRowProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${title}, ${subtitle}${amountText ? `, ${amountText}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderDefault,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceSecondary }]}>
        {icon || <FileText size={18} color={theme.textPrimary} strokeWidth={2} />}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {amountText && (
            <Text style={[styles.amount, { color: theme.textPrimary }]} numberOfLines={1}>
              {amountText}
            </Text>
          )}
        </View>

        <View style={styles.subtitleRow}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
          {statusText && (
            <View style={[styles.statusBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {statusText}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight size={18} color={theme.textMuted} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chevron: {
    marginLeft: 8,
  },
});
