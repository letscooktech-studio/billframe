/**
 * ICON BUTTON COMPONENT
 * Android Design System: Circular charcoal action button.
 * Enforces >= 48dp accessible touch target via hitSlop and 44dp visual container.
 */

import React from 'react';
import {
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { colors, radii, MIN_TOUCH_TARGET } from '../../design/tokens';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  size = 44,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
}: IconButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const hitSlopAmount = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - size) / 2));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={{
        top: hitSlopAmount,
        bottom: hitSlopAmount,
        left: hitSlopAmount,
        right: hitSlopAmount,
      }}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.secondaryActionBg,
          borderColor: theme.borderAction,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
