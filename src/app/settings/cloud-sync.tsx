/**
 * CLOUD SYNC SETTINGS SCREEN — BILLFRAME
 * Manages Supabase Local-First Delta Synchronization.
 * 
 * Philosophy:
 * - 100% Local-First: Local SQLite is always primary.
 * - Zero Lock-in: Runs completely offline without cloud setup.
 * - BYOK (Bring-Your-Own-Database): Connect free Supabase project in 60 seconds.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  ExternalLink,
  Copy,
  Info,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { SupabaseSyncConfigService } from '../../services/sync/SupabaseSyncConfig';
import { SupabaseSyncService } from '../../services/sync/SupabaseSyncService';
import { SyncResult } from '../../services/sync/types';

export default function CloudSyncScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [userId, setUserId] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await SupabaseSyncConfigService.getConfig();
      setSupabaseUrl(cfg.supabaseUrl);
      setSupabaseAnonKey(cfg.supabaseAnonKey);
      setUserId(cfg.userId || '');
      setLastSyncedAt(cfg.lastSyncedAt);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await SupabaseSyncConfigService.saveConfig({
      supabaseUrl,
      supabaseAnonKey,
      userId: userId.trim() || undefined,
    });
    setStatusMessage({ text: 'Cloud configuration saved successfully.', success: true });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setStatusMessage({ text: 'Please enter Supabase URL and Anon Key first.', success: false });
      return;
    }
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await SupabaseSyncConfigService.testConnection(supabaseUrl, supabaseAnonKey);
      setStatusMessage({ text: res.message, success: res.success });
      if (res.success) {
        await handleSave();
      }
    } finally {
      setTesting(false);
    }
  };

  const handleRunSync = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      await handleSave();
      const result = await SupabaseSyncService.sync();
      setLastSyncResult(result);
      setLastSyncedAt(result.syncedAt);
      setStatusMessage({ text: result.message, success: result.success });
    } catch (err: any) {
      setStatusMessage({ text: `Sync failed: ${err.message}`, success: false });
    } finally {
      setSyncing(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Disconnect Cloud Sync?',
      'Your local SQLite database will remain 100% intact. Cloud sync credentials will be removed from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await SupabaseSyncConfigService.clearConfig();
            setSupabaseUrl('');
            setSupabaseAnonKey('');
            setUserId('');
            setLastSyncedAt(undefined);
            setLastSyncResult(null);
            setStatusMessage({ text: 'Cloud Sync disconnected. Operating in local-first mode.', success: true });
          },
        },
      ]
    );
  };

  const isConfigured = Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Cloud Sync Engine</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Local-First SQLite + Supabase Relay
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Architecture Status Badge */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: isConfigured ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                borderColor: isConfigured ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              },
            ]}
          >
            <View style={styles.statusBannerIcon}>
              {isConfigured ? (
                <CheckCircle2 size={20} color="#22C55E" />
              ) : (
                <Database size={20} color="#F59E0B" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusBannerTitle, { color: theme.textPrimary }]}>
                {isConfigured ? 'Cloud Sync Connected' : 'Local-First SQLite Active (Offline)'}
              </Text>
              <Text style={[styles.statusBannerDesc, { color: theme.textSecondary }]}>
                {isConfigured
                  ? 'Changes are mirrored between your local SQLite database and your private Supabase Postgres cluster.'
                  : 'All invoices, customers, and slips are saved safely on-device. Connect Supabase below for multi-device sync and auto-backup.'}
              </Text>
              {lastSyncedAt ? (
                <Text style={[styles.lastSyncText, { color: theme.textMuted }]}>
                  Last synced: {new Date(lastSyncedAt).toLocaleString()}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Feedback message */}
          {statusMessage ? (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor: statusMessage.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: statusMessage.success ? '#22C55E' : '#EF4444',
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  { color: statusMessage.success ? '#22C55E' : '#EF4444' },
                ]}
              >
                {statusMessage.text}
              </Text>
            </View>
          ) : null}

          {/* Sync Trigger Card */}
          {isConfigured && (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderDefault }]}>
              <View style={styles.syncCardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Bidirectional Sync</Text>
                  <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                    Pushes local changes & pulls remote updates without data loss.
                  </Text>
                </View>
                <Pressable
                  onPress={handleRunSync}
                  disabled={syncing}
                  style={[
                    styles.syncNowBtn,
                    {
                      backgroundColor: theme.primaryActionBg,
                      opacity: syncing ? 0.6 : 1,
                    },
                  ]}
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color={theme.primaryActionText} />
                  ) : (
                    <>
                      <RefreshCw size={15} color={theme.primaryActionText} />
                      <Text style={[styles.syncNowBtnText, { color: theme.primaryActionText }]}>Sync Now</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {lastSyncResult && (
                <View style={[styles.syncResultBox, { backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.syncResultStat, { color: theme.textPrimary }]}>
                    ↑ Pushed: {lastSyncResult.pushedCount} records  ·  ↓ Pulled: {lastSyncResult.pulledCount} records
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Credentials Form */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderDefault }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Supabase Configuration</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
              Use your free Supabase project ($0/mo tier includes 500MB DB + 50,000 monthly users).
            </Text>

            {/* Project URL */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Project URL</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: theme.borderDefault,
                  },
                ]}
                placeholder="https://your-project.supabase.co"
                placeholderTextColor={theme.textMuted}
                value={supabaseUrl}
                onChangeText={setSupabaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Anon Key */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Anon API Key (public)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: theme.borderDefault,
                  },
                ]}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                placeholderTextColor={theme.textMuted}
                value={supabaseAnonKey}
                onChangeText={setSupabaseAnonKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>

            {/* Tenant User ID (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                User / Workspace ID (Optional UUID)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: theme.borderDefault,
                  },
                ]}
                placeholder="00000000-0000-0000-0000-000000000001"
                placeholderTextColor={theme.textMuted}
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Buttons Row */}
            <View style={styles.btnRow}>
              <Pressable
                onPress={handleTestConnection}
                disabled={testing}
                style={[
                  styles.actionBtnSecondary,
                  {
                    borderColor: theme.borderFocused,
                    backgroundColor: theme.surfaceSecondary,
                    opacity: testing ? 0.6 : 1,
                  },
                ]}
              >
                {testing ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary }]}>
                    Test Connection
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={[styles.actionBtnPrimary, { backgroundColor: theme.primaryActionBg }]}
              >
                <Text style={[styles.actionBtnPrimaryText, { color: theme.primaryActionText }]}>
                  Save Settings
                </Text>
              </Pressable>
            </View>

            {isConfigured && (
              <Pressable onPress={handleClear} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Disconnect & Return to Local-Only</Text>
              </Pressable>
            )}
          </View>

          {/* Quick Setup Guide & SQL */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderDefault }]}>
            <View style={styles.guideHeader}>
              <Server size={18} color="#F59E0B" />
              <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
                How Supabase Sync Works
              </Text>
            </View>
            <Text style={[styles.cardDesc, { color: theme.textSecondary, marginTop: 8 }]}>
              1. Create a free project at <Text style={{ fontWeight: '700', color: theme.textPrimary }}>supabase.com</Text> ($0/month).
              {'\n'}2. Open the <Text style={{ fontWeight: '700', color: theme.textPrimary }}>SQL Editor</Text> in your Supabase dashboard.
              {'\n'}3. Paste and run our ready schema script (`src/services/sync/cloudSyncSchema.sql`).
              {'\n'}4. Copy your Project URL & Anon Key from Settings → API and paste them above.
            </Text>

            <Pressable
              onPress={() => setShowSqlGuide(!showSqlGuide)}
              style={[
                styles.sqlToggleBtn,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderDefault },
              ]}
            >
              <Text style={[styles.sqlToggleBtnText, { color: theme.textPrimary }]}>
                {showSqlGuide ? 'Hide Schema Overview' : 'View Schema & Architecture Details'}
              </Text>
            </Pressable>

            {showSqlGuide && (
              <View style={[styles.sqlBox, { backgroundColor: '#050608', borderColor: theme.borderDefault }]}>
                <Text style={styles.sqlCode}>
                  {`-- Synced Tables:\n-- 1. cloud_business_profiles\n-- 2. cloud_customers\n-- 3. cloud_catalog_items\n-- 4. cloud_documents (Invoices, Slips, Offers)\n-- 5. cloud_document_items\n-- 6. cloud_payments\n-- 7. cloud_universal_documents\n\n-- Features:\n-- • Row Level Security (RLS) enabled\n-- • Monotonic delta sync (server_updated_at)\n-- • Zero float arithmetic (BigInt preserved)`}
                </Text>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  container: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
  },
  statusBannerIcon: {
    marginTop: 2,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBannerDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  lastSyncText: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  feedbackBox: {
    padding: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  syncCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radii.button,
  },
  syncNowBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  syncResultBox: {
    marginTop: spacing.md,
    padding: 10,
    borderRadius: radii.sm,
  },
  syncResultStat: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sqlToggleBtn: {
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  sqlToggleBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  sqlBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  sqlCode: {
    color: '#A1A1AA',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});
