/**
 * SECTION HEADER COMPONENT
 * Android Design System: Section title with optional right action link.
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
import { colors, spacing } from '../../design/tokens';

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SectionHeader({
  title,
  actionText,
  onAction,
  style,
  testID,
}: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {actionText && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionText}
          hitSlop={8}
          onPress={onAction}
        >
          <Text style={[styles.action, { color: theme.textSecondary }]}>
            {actionText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  action: {
    fontSize: 14,
    fontWeight: '500',
  },
});
