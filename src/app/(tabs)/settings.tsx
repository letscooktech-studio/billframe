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
  Users,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';

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
    <AuroraBackground section="all" intensity="subtle">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>All Features</Text>
              <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                Complete Workspace Directory & Settings
              </Text>
            </View>

            {/* Section 1: Sales & Documents */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>SALES & DOCUMENTS</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <FileText color={theme.brandAnchor} size={20} />,
                title: 'Invoices & Estimates',
                subtitle: 'Official tax invoices, quotes & proforma documents',
                onPress: () => router.push('/(tabs)/documents'),
              })}
              {renderItem({
                icon: <Zap color={theme.brandAnchor} size={20} />,
                title: '30s Quick Bill',
                subtitle: 'Instant counter billing with dynamic offline UPI QR code',
                badge: 'Fast',
                onPress: () => router.push('/quick-bill'),
              })}
              {renderItem({
                icon: <Palette color={theme.brandAnchor} size={20} />,
                title: 'Template Studio',
                subtitle: 'Customize PDF typography, layout, brand colors & Rule 46 tables',
                badge: 'Studio',
                onPress: () => router.push('/templates' as any),
                isLast: true,
              })}
            </View>

            {/* Section 2: Payments & Collections */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>PAYMENTS & COLLECTIONS</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <Clock color={theme.brandAnchor} size={20} />,
                title: 'Collections Hub',
                subtitle: 'Accounts receivable aging, payment reminders & overdue tracking',
                onPress: () => router.push('/collections'),
              })}
              {renderItem({
                icon: <QrCode color={theme.brandAnchor} size={20} />,
                title: 'Payment Gateways & UPI',
                subtitle: 'Direct UPI VPA, QR codes, Razorpay, Cashfree & Stripe',
                onPress: () => router.push('/settings/payments'),
                isLast: true,
              })}
            </View>

            {/* Section 3: Business Operations */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>BUSINESS OPERATIONS</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              {renderItem({
                icon: <Package color={theme.brandAnchor} size={20} />,
                title: 'Item Catalog & Inventory',
                subtitle: 'Products, services, HSN/SAC codes & unit pricing',
                onPress: () => router.push('/catalog'),
              })}
              {renderItem({
                icon: <Receipt color={theme.brandAnchor} size={20} />,
                title: 'Expense Records',
                subtitle: 'Categorized business expenses, receipts & operational outflows',
                onPress: () => router.push('/expenses'),
              })}
              {renderItem({
                icon: <FileSpreadsheet color={theme.brandAnchor} size={20} />,
                title: 'Financial Reports & Tax',
                subtitle: 'Profit & loss, cash flow, GST summary & sales tax export',
                onPress: () => router.push('/reports'),
                isLast: true,
              })}
            </View>

            {/* Section 4: Data & System Configuration */}
            <Text style={[styles.groupHeading, { color: theme.textSecondary }]}>DATA & SYSTEM</Text>
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
              })}
              {renderItem({
                icon: <Info color={theme.brandAnchor} size={20} />,
                title: 'About Billframe',
                subtitle: 'Version 2.0.0 (Android Native Build)',
                badge: 'v2.0',
                onPress: handleAbout,
                isLast: true,
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
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
