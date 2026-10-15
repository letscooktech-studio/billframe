/**
 * CARD COMPONENT
 * Android Design System: Soft rounded-rectangle surface card.
 * Supports default, elevated, and outline variants with full accessibility.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { radii, spacing, MIN_TOUCH_TARGET } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';

export interface CardProps {
  children?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline' | 'secondary';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderDefault,
          borderWidth: 1,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surfaceSecondary,
          borderColor: theme.borderSubtle,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.borderDefault,
          borderWidth: 1,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.cardBg || theme.surface,
          borderColor: theme.cardBorder || theme.borderSubtle,
          borderWidth: 1,
        };
    }
  };

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          getVariantStyles(),
          { opacity: pressed ? 0.88 : 1 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, getVariantStyles(), style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    padding: spacing.lg,
    marginVertical: spacing.xs,
  },
});
