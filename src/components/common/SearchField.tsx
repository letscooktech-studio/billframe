/**
 * SEARCH FIELD COMPONENT
 * Android Design System: Soft rectangular search bar with animated search state & clear transitions.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  StyleProp,
  ViewStyle,
  Animated,
  useColorScheme,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, radii } from '../../design/tokens';
import { AnimatedProcessingIcon } from '../animations/AnimatedProcessingIcon';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  loading?: boolean;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  containerStyle,
  testID,
  loading = false,
}: SearchFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.borderDefault, theme.borderFocused],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: animatedBorderColor,
          borderWidth: isFocused ? 1.5 : 1,
        },
        containerStyle,
      ]}
    >
      {/* Search Icon or Loading Spinner */}
      <View style={styles.searchIcon}>
        {loading ? (
          <AnimatedProcessingIcon
            state="loading"
            size={18}
            color={theme.borderFocused}
            glowColor="#38BDF8"
          />
        ) : (
          <Search size={18} color={isFocused ? theme.textPrimary : theme.textMuted} />
        )}
      </View>

      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            color: theme.textPrimary,
          },
        ]}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 && !loading && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          hitSlop={8}
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <X size={16} color={theme.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
