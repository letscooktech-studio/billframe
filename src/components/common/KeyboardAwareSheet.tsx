/**
 * KEYBOARD-AWARE BOTTOM SHEET MODAL
 * Resilient bottom sheet for Android API 36 + iOS that avoids IME overlap,
 * preserves touch target accessibility, and provides smooth scroll insets.
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useColorScheme,
  BackHandler,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';

export interface KeyboardAwareSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeightPercent?: number; // e.g. 85
  dismissOnBackdropPress?: boolean;
}

export function KeyboardAwareSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightPercent = 88,
  dismissOnBackdropPress = true,
}: KeyboardAwareSheetProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  // Android hardware back handler
  useEffect(() => {
    if (!visible) return;
    const onBackPress = () => {
      onClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {dismissOnBackdropPress && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close dialog backdrop"
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderSubtle,
                maxHeight: `${maxHeightPercent}%` as any,
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handleBar, { backgroundColor: theme.borderSubtle }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
              <View style={styles.headerTitleWrap}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
              >
                <X color={theme.textPrimary} size={22} />
              </Pressable>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>

            {/* Optional Sticky Footer */}
            {footer && (
              <View style={[styles.footerContainer, { borderTopColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
                {footer}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    width: '100%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: radii.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
});
