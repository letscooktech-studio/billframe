/**
 * SECONDARY BUTTON COMPONENT
 * Android Design System: Charcoal filled surface with restrained border.
 * Used for secondary actions (e.g. Preview, Save Draft).
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { colors, radii, MIN_TOUCH_TARGET } from '../../design/tokens';

export interface SecondaryButtonProps {
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

export function SecondaryButton({
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
  fullWidth = false,
}: SecondaryButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.secondaryActionBg,
          borderColor: theme.borderAction,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          flex: fullWidth ? 0 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.secondaryActionText} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.leftIconWrapper}>{icon}</View>}
          <Text
            style={[
              styles.label,
              { color: theme.secondaryActionText },
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
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(MIN_TOUCH_TARGET, 48),
    height: 50,
    borderRadius: radii.button,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 6,
  },
  rightIconWrapper: {
    marginLeft: 6,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
