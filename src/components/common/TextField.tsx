/**
 * TEXT FIELD COMPONENT
 * Android Design System: Soft rectangular outline input.
 * Height 52dp, borderRadius 12dp, restrained charcoal surface and focus ring.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { colors, radii, spacing } from '../../design/tokens';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export function TextField({
  label,
  error,
  helper,
  containerStyle,
  inputStyle,
  leftAccessory,
  rightAccessory,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? theme.statusDanger
    : isFocused
    ? theme.borderFocused
    : theme.borderDefault;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor,
          },
        ]}
      >
        {leftAccessory && <View style={styles.leftAccessory}>{leftAccessory}</View>}

        <TextInput
          placeholderTextColor={theme.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: theme.textPrimary,
            },
            inputStyle,
          ]}
          {...rest}
        />

        {rightAccessory && <View style={styles.rightAccessory}>{rightAccessory}</View>}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.statusDanger }]}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputContainer: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
  },
  leftAccessory: {
    marginRight: 10,
  },
  rightAccessory: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
