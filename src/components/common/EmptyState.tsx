/**
 * EMPTY STATE COMPONENT
 * Android Design System: Restrained monochrome empty state illustration/placeholder.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { FileText } from 'lucide-react-native';
import { colors, radii, spacing } from '../../design/tokens';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderDefault,
        },
        style,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
        {icon || <FileText size={28} color={theme.textMuted} strokeWidth={1.5} />}
      </View>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <PrimaryButton label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});
