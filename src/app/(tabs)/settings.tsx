/**
 * SETTINGS HUB
 * Focused, organized configurations and preferences for business operations:
 * Profile, Taxes, Payment Methods, Security, Backups, and Sovereign Privacy.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Building2,
  FileText,
  CreditCard,
  Lock,
  Database,
  Shield,
  Info,
  ChevronRight,
  Sparkles,
  Sliders,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  isLast?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const handleAbout = () => {
    Alert.alert(
      'Billframe',
      'Version 1.0.0 (Android API 36 Native Build)\n\n• Sovereign, 100% Local-First Invoicing\n• Offline-First SQLite Persistence\n• Canonical BigInt Integer Money Core\n• Direct Zero-Fee UPI & Regional Tax Packs\n• Zero Mandatory Cloud Accounts or Telemetry',
      [{ text: 'Close', style: 'default' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Local-First Sovereign Privacy',
      'All business records, client contact data, invoice items, and financial ledgers remain strictly on this physical device.\n\nCalculations and PDF compilations execute 100% offline via local engines.',
      [{ text: 'Understood', style: 'default' }]
    );
  };

  const renderItem = ({ icon, title, subtitle, onPress, badge, isLast }: SettingItemProps) => (
    <Pressable
      style={({ pressed }) => [
        styles.rowItem,
        !isLast && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceSecondary }]}>
        {icon}
      </View>
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.badgeText, { color: theme.brandAnchor }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <ChevronRight color={theme.textMuted} size={18} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Settings</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Workspace Configuration & Preferences
            </Text>
          </View>

          {/* Business Group */}
          <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>BUSINESS & INVOICING</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {renderItem({
              icon: <Building2 color={theme.brandAnchor} size={20} />,
              title: 'Business Profile',
              subtitle: 'Business name, address, phone, email & document prefixes',
              onPress: () => router.push('/onboarding/setup'),
            })}
            {renderItem({
              icon: <Sliders color={theme.brandAnchor} size={20} />,
              title: 'Tax Engine & Rules',
              subtitle: 'Regional tax framework, GST/VAT rates & HSN/SAC search',
              onPress: () => router.push('/settings/workspace'),
            })}
            {renderItem({
              icon: <CreditCard color={theme.brandAnchor} size={20} />,
              title: 'Payment Methods & Gateways',
              subtitle: 'Direct UPI VPA, Razorpay, Cashfree & Stripe connections',
              onPress: () => router.push('/settings/payments'),
              isLast: true,
            })}
          </View>

          {/* Security & Data Group */}
          <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>SECURITY & DATA</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {renderItem({
              icon: <Lock color={theme.brandAnchor} size={20} />,
              title: 'App Lock & Security PIN',
              subtitle: 'Biometrics and PIN lock on application resume',
              onPress: () => router.push('/security-pin'),
            })}
            {renderItem({
              icon: <Database color={theme.brandAnchor} size={20} />,
              title: 'Backup & Restore',
              subtitle: 'Export encrypted SQLite database or restore from file',
              onPress: () => router.push('/backup'),
            })}
            {renderItem({
              icon: <Sparkles color={theme.brandAnchor} size={20} />,
              title: 'Customize Onboarding',
              subtitle: 'Re-run business persona and regional location setup',
              onPress: () => router.push('/onboarding'),
              isLast: true,
            })}
          </View>

          {/* Privacy & System Group */}
          <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>SYSTEM & PRIVACY</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {renderItem({
              icon: <Shield color={theme.brandAnchor} size={20} />,
              title: 'Sovereign Privacy Commitment',
              subtitle: 'Zero telemetry, zero cloud tracking, 100% on-device',
              onPress: handlePrivacy,
            })}
            {renderItem({
              icon: <Info color={theme.brandAnchor} size={20} />,
              title: 'About Billframe',
              subtitle: 'Version 1.0.0 (API 36 native build)',
              badge: 'v1.0.0',
              onPress: handleAbout,
              isLast: true,
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  container: {
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingVertical: spacing.md,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
  },
  screenSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  groupCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
