/**
 * PRIMARY BUTTON COMPONENT
 * Android Design System: Off-white rounded-rectangle action button with spring micro-interactions.
 * Enforces >= 48dp touch target, 14dp radius, bold monochrome contrast & smooth loading transitions.
 */

import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { radii, MIN_TOUCH_TARGET } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { AnimatedProcessingIcon } from '../animations/AnimatedProcessingIcon';

export interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
  fullWidth?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  rightIcon,
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  fullWidth = true,
}: PrimaryButtonProps) {
  const { theme } = useTheme();

  // Spring scale micro-interaction
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: theme.primaryActionBg,
            opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ]}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <AnimatedProcessingIcon
              state="loading"
              size={20}
              color={theme.primaryActionText}
              glowColor="#93C5FD"
            />
            <Text
              style={[
                styles.label,
                { color: theme.primaryActionText, marginLeft: 10 },
                textStyle,
              ]}
              numberOfLines={1}
            >
              Processing...
            </Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.leftIconWrapper}>{icon}</View>}
            <Text
              style={[
                styles.label,
                { color: theme.primaryActionText },
                textStyle,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(MIN_TOUCH_TARGET, 52),
    height: 54,
    borderRadius: radii.button,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
