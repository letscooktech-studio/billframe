/**
 * BADGE / TAG COMPONENT
 * Android Design System: Restrained status badges and tag pills.
 * Enforces pill radius (9999dp) and crisp contrast.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { radii, spacing, typography } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';

export type BadgeVariant =
  | 'default'
  | 'draft'
  | 'issued'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function Badge({
  label,
  variant = 'default',
  style,
  textStyle,
  testID,
}: BadgeProps) {
  const { theme, isDark } = useTheme();

  const getColors = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'draft':
        return {
          bg: theme.surfaceSecondary,
          text: theme.statusDraft,
          border: theme.borderSubtle,
        };
      case 'issued':
        return {
          bg: isDark ? '#1E293B' : '#EFF6FF',
          text: theme.statusIssued,
          border: isDark ? '#334155' : '#BFDBFE',
        };
      case 'success':
        return {
          bg: isDark ? '#143823' : '#F0FDF4',
          text: theme.statusSuccess,
          border: isDark ? '#1D5A34' : '#BBF7D0',
        };
      case 'warning':
        return {
          bg: isDark ? '#3E280C' : '#FFFBEB',
          text: theme.statusWarning,
          border: isDark ? '#6B4310' : '#FDE68A',
        };
      case 'danger':
        return {
          bg: isDark ? '#3E1515' : '#FEF2F2',
          text: theme.statusDanger,
          border: isDark ? '#6B2121' : '#FECACA',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.textSecondary,
          border: theme.borderDefault,
        };
      case 'default':
      default:
        return {
          bg: theme.surfaceSecondary,
          text: theme.textPrimary,
          border: theme.borderSubtle,
        };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border || 'transparent',
          borderWidth: border ? 1 : 0,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
