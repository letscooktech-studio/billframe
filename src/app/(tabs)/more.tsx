/**
 * MORE / SETTINGS SCREEN
 * Organized management hub: Business profile, catalog items, taxes, numbering,
 * backups, CSV export, and privacy disclosures.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Building2,
  Package,
  Percent,
  Hash,
  Download,
  FileSpreadsheet,
  Shield,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { colors, ThemeColors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  theme: ThemeColors;
  isLast?: boolean;
}

function SettingRow({ icon, title, subtitle, onPress, theme, isLast }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <ChevronRight color={theme.textMuted} size={18} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>More</Text>
          </View>

          {/* Business Section */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>BUSINESS</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon={<Building2 color={theme.textPrimary} size={20} />}
              title="Business Profile"
              subtitle="Name, address, logo, payment terms"
              onPress={() => router.push('/onboarding/setup')}
              theme={theme}
            />
            <SettingRow
              icon={<Package color={theme.textPrimary} size={20} />}
              title="Items & Services"
              subtitle="Manage saved products, hourly rates, and units"
              onPress={() => router.push('/catalog')}
              theme={theme}
            />
            <SettingRow
              icon={<Percent color={theme.textPrimary} size={20} />}
              title="Taxes & Currency"
              subtitle="User-configured tax rate, currency, document locale"
              onPress={() => router.push('/onboarding/setup')}
              theme={theme}
            />
            <SettingRow
              icon={<Hash color={theme.textPrimary} size={20} />}
              title="Document Numbering"
              subtitle="Prefixes (INV-, EST-, RCP-) and sequence starts"
              onPress={() => router.push('/onboarding/setup')}
              theme={theme}
              isLast
            />
          </View>

          {/* Data & Durability Section */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>DATA & STORAGE</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon={<Download color={theme.textPrimary} size={20} />}
              title="Backup & Restore"
              subtitle="Standard & AES-GCM password-protected archives"
              onPress={() => router.push('/backup')}
              theme={theme}
            />
            <SettingRow
              icon={<FileSpreadsheet color={theme.textPrimary} size={20} />}
              title="Export CSV"
              subtitle="Export customers, invoices, and payments to CSV"
              onPress={() => router.push('/backup')}
              theme={theme}
              isLast
            />
          </View>

          {/* App & Pro Section */}
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>APP</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <SettingRow
              icon={<Sparkles color={theme.statusSuccess} size={20} />}
              title="Upgrade to Pro"
              subtitle="One-time purchase, premium PDF templates, no ads"
              onPress={() => {}}
              theme={theme}
            />
            <SettingRow
              icon={<Shield color={theme.textPrimary} size={20} />}
              title="Privacy & Offline Security"
              subtitle="Zero mandatory accounts, sandboxed local SQLite"
              onPress={() => {}}
              theme={theme}
            />
            <SettingRow
              icon={<Info color={theme.textPrimary} size={20} />}
              title="About Billframe"
              subtitle="Version 1.0.0 • Target API 36 • 16 KB native aligned"
              onPress={() => {}}
              theme={theme}
              isLast
            />
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  header: {
    marginBottom: spacing.md,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: -0.3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  cardGroup: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  rowSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
});
