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
  Zap,
  Palette,
  Clock,
  QrCode,
  Package,
  Receipt,
  FileSpreadsheet,
  Moon,
  Users,
  Search,
  Menu,
  Cloud,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';
import { useTheme } from '../../design/ThemeContext';
import { useNavigationDrawer } from '../../components/navigation/NavigationDrawerContext';

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
  const { theme, themePreference, setThemePreference, activeTheme } = useTheme();
  const { openDrawer } = useNavigationDrawer();

  const handleAppearance = () => {
    Alert.alert(
      'Appearance & Theme',
      'Choose your preferred visual theme. All actions and surfaces adapt seamlessly.',
      [
        {
          text: `Dark Mode ${themePreference === 'dark' ? '✓' : ''}`,
          onPress: () => setThemePreference('dark'),
        },
        {
          text: `Light Mode ${themePreference === 'light' ? '✓' : ''}`,
          onPress: () => setThemePreference('light'),
        },
        {
          text: `Follow System ${themePreference === 'system' ? '✓' : ''}`,
          onPress: () => setThemePreference('system'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Billframe 2.0',
      'Version 2.0.0 (Android Native Build)\n\n• Sovereign, 100% Local-First Business Document OS\n• Offline-First SQLite Persistence\n• Canonical BigInt Integer Money Core\n• Direct Zero-Fee UPI & Regional Tax Packs\n• Zero Mandatory Cloud Accounts or Telemetry',
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header Row with Hamburger Drawer Toggle */}
            <View style={styles.header}>
              <Pressable
                onPress={openDrawer}
                style={styles.headerMenuBtn}
                accessibilityRole="button"
                accessibilityLabel="Open navigation drawer"
                hitSlop={8}
              >
                <Menu size={22} color={theme.textPrimary} strokeWidth={2} />
              </Pressable>
              <View style={styles.headerTextCol}>
                <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Settings</Text>
                <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                  Preferences, Security & System Configuration
                </Text>
              </View>
            </View>

            {/* Section 1: Organization & Regional Tax */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>ORGANIZATION & TAX</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <Building2 color={theme.brandAnchor} size={20} />,
                title: 'Business Profile',
                subtitle: 'Business identity, address, GSTIN/PAN & numbering sequences',
                onPress: () => router.push('/onboarding/setup'),
              })}
              {renderItem({
                icon: <Palette color={theme.brandAnchor} size={20} />,
                title: 'Organization Brand Kit',
                subtitle: 'Company logo, letterhead presets, brand identity & footer defaults',
                badge: 'Brand Kit',
                onPress: () => router.push('/templates/edit' as any),
              })}
              {renderItem({
                icon: <Sliders color={theme.brandAnchor} size={20} />,
                title: 'Tax Engine & Rules',
                subtitle: 'Regional tax configuration, IGST/CGST/SGST & thresholds',
                onPress: () => router.push('/settings/workspace'),
              })}
              {renderItem({
                icon: <QrCode color={theme.brandAnchor} size={20} />,
                title: 'Payment Gateways & UPI',
                subtitle: 'Direct UPI VPA, QR codes, Razorpay, Cashfree & Stripe',
                onPress: () => router.push('/settings/payments'),
                isLast: true,
              })}
            </View>

            {/* Section: AI Agent & Workflows */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>AI AGENT & AUTOMATION</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <Sparkles color="#F59E0B" size={20} />,
                title: 'AI Document Assistant (Chat)',
                subtitle: 'Autonomous natural language drafting, live preview & SQLite grounding',
                badge: 'Agentic',
                onPress: () => router.push('/ai/assistant' as any),
                isLast: true,
              })}
            </View>

            {/* Section 2: Security & Local Database */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>SECURITY, BACKUP & CLOUD</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <Cloud color={theme.brandAnchor} size={20} />,
                title: 'Cloud Sync Engine (Supabase)',
                subtitle: 'Local-first delta sync, cross-device relay & cloud backup',
                badge: 'Local-First',
                onPress: () => router.push('/settings/cloud-sync' as any),
              })}
              {renderItem({
                icon: <Lock color={theme.brandAnchor} size={20} />,
                title: 'Security & App Lock',
                subtitle: 'Device biometrics and PIN lock on application resume',
                onPress: () => router.push('/security-pin'),
              })}
              {renderItem({
                icon: <Database color={theme.brandAnchor} size={20} />,
                title: 'Backup & Restore',
                subtitle: 'Encrypted SQLite database backup export & restore',
                onPress: () => router.push('/backup'),
              })}
              {renderItem({
                icon: <Shield color={theme.brandAnchor} size={20} />,
                title: 'Sovereign Privacy',
                subtitle: 'Zero cloud tracking, zero analytics, 100% on-device data',
                onPress: handlePrivacy,
                isLast: true,
              })}
            </View>

            {/* Section 3: Preferences & System */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>PREFERENCES & SYSTEM</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <Moon color={theme.brandAnchor} size={20} />,
                title: 'Appearance & Theme',
                subtitle: `Current: ${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)} (Active: ${activeTheme})`,
                badge: themePreference.toUpperCase(),
                onPress: handleAppearance,
              })}
              {renderItem({
                icon: <Info color={theme.brandAnchor} size={20} />,
                title: 'About Billframe',
                subtitle: 'Version 4.0.0 (Android Native Build)',
                badge: 'v4.0',
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
    backgroundColor: 'transparent',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  headerMenuBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
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
  drawerHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  drawerHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  drawerHeroIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  drawerHeroTextWrap: {
    flex: 1,
  },
  drawerHeroTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  drawerHeroSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
