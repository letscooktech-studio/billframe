/**
 * SEARCHABLE SIDE NAVIGATION DRAWER
 * Section 7 Master Implementation
 * 
 * Invariants:
 * 1. Discoverable entry points: Accessible from top-left header menu and More/All tab.
 * 2. Overlays cleanly without occupying permanent screen width.
 * 3. Dismissible via X button, Android back button, backdrop tap, or item selection.
 * 4. Real-time instant search filter across all groups and features.
 * 5. Strict 48dp minimum touch targets.
 * 6. Responsive to Dark (#111215) and Light (#FFFFFF) themes.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  BackHandler,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Search,
  FilePlus,
  FolderOpen,
  Clock,
  History,
  Layers,
  Palette,
  Sparkles,
  Users,
  UserCheck,
  Truck,
  Briefcase,
  FolderKanban,
  ClipboardList,
  Wrench,
  Package,
  Receipt,
  CreditCard,
  FileCheck,
  Wallet,
  QrCode,
  BarChart3,
  Building2,
  Image as ImageIcon,
  Sliders,
  Settings2,
  SunMedium,
  ShieldCheck,
  Database,
  HardDrive,
  HelpCircle,
  Info,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import { useNavigationDrawer } from './NavigationDrawerContext';
import { useTheme } from '../../design/ThemeContext';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { MIN_TOUCH_TARGET, radii } from '../../design/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

interface DrawerItem {
  id: string;
  label: string;
  route: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  badge?: string;
  keywords?: string[];
}

export interface DrawerGroup {
  id: string;
  title: string;
  items: DrawerItem[];
}

export const DRAWER_GROUPS: DrawerGroup[] = [
  {
    id: 'documents',
    title: 'DOCUMENTS',
    items: [
      { id: 'create_doc', label: 'Create Document', route: '/document/templates?type=invoice', icon: FilePlus, keywords: ['new', 'invoice', 'gst', 'bill', 'order', 'document'] },
      { id: 'doc_library', label: 'Document Library', route: '/(tabs)/documents', icon: FolderOpen, keywords: ['all', 'files', 'records', 'history', 'drafts', 'invoices', 'receipts'] },
      { id: 'template_studio', label: 'Template Studio', route: '/templates/studio', icon: Palette, keywords: ['design', 'brand', 'rule 46', 'layouts', 'templates', 'studio'] },
      { id: 'custom_docs', label: 'Custom Document Builder', route: '/templates/create-type', icon: Sparkles, keywords: ['builder', 'creator', 'custom', 'schema', 'type'] },
    ],
  },
  {
    id: 'people',
    title: 'PEOPLE',
    items: [
      { id: 'customers', label: 'Customers & Clients', route: '/(tabs)/contacts', icon: Users, keywords: ['clients', 'buyers', 'contacts', 'directory', 'ledger'] },
    ],
  },
  {
    id: 'business_work',
    title: 'BUSINESS WORK',
    items: [
      { id: 'inventory_catalog', label: 'Item Catalog & Work', route: '/(tabs)/money', icon: Package, keywords: ['catalog', 'products', 'services', 'hsn', 'rates', 'pricing'] },
      { id: 'expenses', label: 'Expense Records', route: '/expenses', icon: Receipt, keywords: ['spending', 'costs', 'bills', 'outflows', 'receipts'] },
    ],
  },
  {
    id: 'finance',
    title: 'FINANCE',
    items: [
      { id: 'collections', label: 'Collections Hub', route: '/collections', icon: Wallet, keywords: ['overdue', 'aging', 'reminders', 'receivables', 'collections'] },
      { id: 'reports', label: 'Financial Reports & Tax', route: '/reports', icon: BarChart3, keywords: ['analytics', 'p&l', 'gst', 'summary', 'cashflow', 'tax'] },
      { id: 'payment_settings', label: 'Payment Gateways & UPI', route: '/settings/payments', icon: QrCode, keywords: ['qr', 'vpa', 'gateway', 'razorpay', 'cashfree', 'upi'] },
    ],
  },
  {
    id: 'organization',
    title: 'ORGANIZATION',
    items: [
      { id: 'business_profile', label: 'Business Profile', route: '/onboarding/setup', icon: Building2, keywords: ['address', 'tax', 'legal', 'company', 'gstin', 'pan'] },
      { id: 'brand_kit', label: 'Brand Kit & Letterhead', route: '/templates/edit', icon: ImageIcon, keywords: ['logo', 'color', 'typography', 'brand', 'letterhead', 'signature'] },
      { id: 'workspace_prefs', label: 'Tax Engine & Rules', route: '/settings/workspace', icon: Sliders, keywords: ['tax', 'igst', 'cgst', 'sgst', 'rules', 'thresholds'] },
    ],
  },
  {
    id: 'application',
    title: 'APPLICATION',
    items: [
      { id: 'appearance', label: 'Settings & Preferences', route: '/(tabs)/settings', icon: Settings2, keywords: ['dark', 'light', 'system', 'preferences', 'settings', 'theme'] },
      { id: 'security', label: 'Security & PIN Lock', route: '/security-pin', icon: ShieldCheck, keywords: ['biometric', 'app lock', 'pin', 'security'] },
      { id: 'backup_restore', label: 'Backup & Restore', route: '/backup', icon: Database, keywords: ['export', 'import', 'offline', 'backup', 'sqlite'] },
    ],
  },
];

export function SearchableSideDrawer() {
  const { isOpen, closeDrawer } = useNavigationDrawer();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [businessName, setBusinessName] = useState('My Organization');

  useEffect(() => {
    if (isOpen) {
      BusinessProfileRepository.getActiveProfile()
        .then((profile) => {
          if (profile?.name && profile.name.trim()) {
            setBusinessName(profile.name.trim());
          }
        })
        .catch(() => {});
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (!isOpen) return;

    const onBackPress = () => {
      closeDrawer();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isOpen, closeDrawer]);

  const handleNavigate = useCallback(
    (route: string) => {
      closeDrawer();
      router.push(route as any);
    },
    [closeDrawer, router]
  );

  // Filter groups and items in real time
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DRAWER_GROUPS;

    return DRAWER_GROUPS.map((group) => {
      const groupMatches = group.title.toLowerCase().includes(q);
      const matchingItems = group.items.filter((item) => {
        if (groupMatches) return true;
        if (item.label.toLowerCase().includes(q)) return true;
        if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
        return false;
      });

      return {
        ...group,
        items: matchingItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  const bgDrawer = isDark ? '#111215' : '#FFFFFF';
  const borderSep = isDark ? '#1F222B' : '#E5E7EB';
  const textHead = isDark ? '#FFFFFF' : '#111827';
  const textSub = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#191B22' : '#F3F4F6';

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={closeDrawer}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={closeDrawer}
          accessibilityRole="button"
          accessibilityLabel="Close navigation drawer"
        />

        {/* Drawer Canvas */}
        <View
          style={[
            styles.drawerContent,
            {
              width: DRAWER_WIDTH,
              backgroundColor: bgDrawer,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* ── Header: Logo, Organization, Close Button ── */}
          <View style={[styles.drawerHeader, { borderBottomColor: borderSep }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.brandMark, { backgroundColor: isDark ? '#FFFFFF' : '#111827' }]}>
                <Text style={[styles.brandMarkText, { color: isDark ? '#111111' : '#FFFFFF' }]}>
                  BF
                </Text>
              </View>
              <View style={styles.brandTitleWrap}>
                <View style={styles.brandNameRow}>
                  <Text style={[styles.brandNameText, { color: textHead }]}>BILLFRAME</Text>
                  <View style={[styles.versionPill, { backgroundColor: isDark ? '#222530' : '#E5E7EB' }]}>
                    <Text style={[styles.versionText, { color: textSub }]}>4.0</Text>
                  </View>
                </View>
                <Text style={[styles.orgNameText, { color: textSub }]} numberOfLines={1}>
                  {businessName}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={closeDrawer}
              accessibilityRole="button"
              accessibilityLabel="Close drawer"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={textHead} strokeWidth={2} />
            </Pressable>
          </View>

          {/* ── Real-Time Search Bar ── */}
          <View style={styles.searchSection}>
            <View style={[styles.searchBarWrap, { backgroundColor: inputBg, borderColor: borderSep }]}>
              <Search size={16} color={textSub} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: textHead }]}
                placeholder="Search all features..."
                placeholderTextColor={textSub}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
                accessibilityLabel="Search drawer features"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={14} color={textSub} />
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Scrollable Feature Groups ── */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredGroups.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Search size={28} color={textSub} />
                <Text style={[styles.emptyStateTitle, { color: textHead }]}>No features found</Text>
                <Text style={[styles.emptyStateSub, { color: textSub }]}>
                  Try a different search term like "invoice", "client" or "backup".
                </Text>
              </View>
            ) : (
              filteredGroups.map((group) => (
                <View key={group.id} style={styles.groupContainer}>
                  <Text style={[styles.groupTitle, { color: textSub }]}>
                    {group.title}
                  </Text>

                  <View style={styles.itemsList}>
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Pressable
                          key={item.id}
                          style={({ pressed }) => [
                            styles.itemRow,
                            {
                              backgroundColor: pressed
                                ? (isDark ? '#1C1F27' : '#F3F4F6')
                                : 'transparent',
                            },
                          ]}
                          onPress={() => handleNavigate(item.route)}
                          accessibilityRole="button"
                          accessibilityLabel={item.label}
                        >
                          <View style={styles.itemLeft}>
                            <View style={[styles.itemIconWrap, { backgroundColor: isDark ? '#191B22' : '#F3F4F6' }]}>
                              <IconComponent size={16} color={textHead} strokeWidth={2} />
                            </View>
                            <Text style={[styles.itemLabel, { color: textHead }]} numberOfLines={1}>
                              {item.label}
                            </Text>
                          </View>

                          <View style={styles.itemRight}>
                            {item.badge && (
                              <View style={[styles.itemBadge, { backgroundColor: isDark ? '#2E3240' : '#E0E7FF' }]}>
                                <Text style={[styles.itemBadgeText, { color: isDark ? '#A5B4FC' : '#3730A3' }]}>
                                  {item.badge}
                                </Text>
                              </View>
                            )}
                            <ChevronRight size={14} color={textSub} strokeWidth={2} />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* ── Offline Guarantee Footer ── */}
          <View style={[styles.drawerFooter, { borderTopColor: borderSep }]}>
            <View style={styles.offlineDot} />
            <Text style={[styles.offlineText, { color: textSub }]}>
              100% Offline Workspace • Zero Cloud Sync
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContent: {
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandMarkText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTitleWrap: {
    flex: 1,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandNameText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  versionPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  versionText: {
    fontSize: 9,
    fontWeight: '700',
  },
  orgNameText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 8,
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  itemsList: {
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
