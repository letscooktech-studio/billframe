/**
 * BACKUP, RESTORE & CSV EXPORT SCREEN
 * Full offline backup engine: SHA-256 verified JSON snapshots, atomic restore
 * with transactional rollback, CSV export for customers/invoices, and CSV import.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  ArrowLeft,
  Database,
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Cloud,
  ChevronRight,
} from 'lucide-react-native';
import {
  colors,
  spacing,
  radii,
  typography,
  MIN_TOUCH_TARGET,
  MAX_CONTENT_WIDTH,
} from '../design/tokens';
import { BackupManager } from '../services/backup/BackupManager';
import { CsvExporter } from '../services/backup/CsvExporter';

type ToastType = 'success' | 'error';

interface ToastMsg {
  type: ToastType;
  text: string;
}

export default function BackupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [busy, setBusy] = useState<string | null>(null); // active operation key
  const [toast, setToast] = useState<ToastMsg | null>(null);

  function showToast(type: ToastType, text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  // ── BACKUP ────────────────────────────────────────────────────────────────

  async function handleExportBackup() {
    if (busy) return;
    setBusy('backup_export');
    try {
      await BackupManager.exportAndShareBackupAsync();
      showToast('success', 'Backup created and shared successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create backup.');
    } finally {
      setBusy(null);
    }
  }

  async function handleImportBackup() {
    if (busy) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const rawJson = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setBusy('backup_import');

      // Validate first
      const validation = await BackupManager.validateBackupJson(rawJson);
      if (!validation.valid || !validation.payload) {
        showToast('error', validation.error || 'Invalid backup file.');
        setBusy(null);
        return;
      }

      const { counts } = validation.payload.manifest;
      Alert.alert(
        'Restore Backup?',
        `This will REPLACE all current data with:\n• ${counts.customers} customer(s)\n• ${counts.documents} document(s)\n• ${counts.payments} payment(s)\n\nThis action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setBusy(null) },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                const restoreResult = await BackupManager.restoreFromPayloadAsync(validation.payload!);
                if (restoreResult.success) {
                  showToast('success', 'Database restored successfully. Please restart the app.');
                } else {
                  showToast('error', restoreResult.error || 'Restore failed.');
                }
              } catch (err: any) {
                showToast('error', err.message || 'Restore failed unexpectedly.');
              } finally {
                setBusy(null);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      showToast('error', err.message || 'Could not open file picker.');
      setBusy(null);
    }
  }

  // ── CSV EXPORT ────────────────────────────────────────────────────────────

  async function handleExportCustomersCsv() {
    setBusy('csv_customers');
    try {
      await CsvExporter.exportCustomersToCsvAsync();
      showToast('success', 'Customers CSV exported and shared.');
    } catch (err: any) {
      showToast('error', err.message || 'CSV export failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleExportInvoicesCsv() {
    setBusy('csv_invoices');
    try {
      await CsvExporter.exportInvoicesToCsvAsync();
      showToast('success', 'Invoices CSV exported and shared.');
    } catch (err: any) {
      showToast('error', err.message || 'CSV export failed.');
    } finally {
      setBusy(null);
    }
  }

  // ── CSV IMPORT ────────────────────────────────────────────────────────────

  async function handleImportCustomersCsv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const csvText = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setBusy('csv_import_customers');
      const { importedCount, errors } = await CsvExporter.importCustomersFromCsvAsync(csvText);

      if (errors.length > 0) {
        showToast(
          'error',
          `Imported ${importedCount} customers. ${errors.length} row(s) failed: ${errors[0]}`
        );
      } else {
        showToast('success', `${importedCount} customer(s) imported from CSV.`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'CSV import failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleImportCatalogCsv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const csvText = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setBusy('csv_import_catalog');
      const { importedCount, errors } = await CsvExporter.importCatalogFromCsvAsync(csvText);

      if (errors.length > 0) {
        showToast(
          'error',
          `Imported ${importedCount} items. ${errors.length} row(s) failed: ${errors[0]}`
        );
      } else {
        showToast('success', `${importedCount} catalog item(s) imported from CSV.`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Catalog CSV import failed.');
    } finally {
      setBusy(null);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={theme.textPrimary} size={22} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Data & Backup</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Toast */}
      {toast && (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: toast.type === 'success' ? theme.statusSuccess : theme.statusDanger,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 color="#fff" size={16} />
          ) : (
            <AlertCircle color="#fff" size={16} />
          )}
          <Text style={styles.toastText}>{toast.text}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          {/* ── CLOUD SYNC & AUTO-BACKUP ───────────────────────── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CLOUD DELTA SYNC</Text>
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: 'rgba(245, 158, 11, 0.35)',
                marginBottom: spacing.lg,
              },
            ]}
            onPress={() => router.push('/settings/cloud-sync' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Cloud color="#F59E0B" size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: 2 }]}>
                    Supabase Cloud Delta Sync
                  </Text>
                  <Text style={[styles.cardDescription, { color: theme.textSecondary, marginBottom: 0 }]}>
                    Mirror local SQLite to your private Supabase Postgres cluster for multi-device sync & cloud backup.
                  </Text>
                </View>
              </View>
              <ChevronRight color={theme.textMuted} size={18} />
            </View>
          </Pressable>

          {/* ── BACKUP & RESTORE ─────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>OFFLINE BACKUP & RESTORE</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <ShieldCheck color={theme.statusSuccess} size={20} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Offline JSON Backup</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              Creates a SHA-256 verified snapshot of all your data. Use Android's share sheet to
              save to Google Drive, email, or any storage app.
            </Text>

            <ActionButton
              label="Export Full Backup"
              sublabel=".bfbk — all customers, invoices, payments"
              icon={<Download color="#fff" size={18} />}
              onPress={handleExportBackup}
              loading={busy === 'backup_export'}
              primary
              theme={theme}
            />

            <ActionButton
              label="Restore from Backup"
              sublabel="Replaces all data — irreversible"
              icon={<Upload color={theme.textPrimary} size={18} />}
              onPress={handleImportBackup}
              loading={busy === 'backup_import'}
              destructive
              theme={theme}
            />
          </View>

          {/* ── CSV EXPORT ─────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CSV EXPORT</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <FileSpreadsheet color={theme.brandAnchor} size={20} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Spreadsheet Export</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              Export your data to CSV format, compatible with Excel, Google Sheets, and
              accounting software.
            </Text>

            <ActionButton
              label="Export Customers"
              sublabel="Name, contact, address for all customers"
              icon={<Users color="#fff" size={18} />}
              onPress={handleExportCustomersCsv}
              loading={busy === 'csv_customers'}
              primary
              theme={theme}
            />

            <ActionButton
              label="Export Invoices"
              sublabel="All issued invoices with totals and status"
              icon={<FileText color="#fff" size={18} />}
              onPress={handleExportInvoicesCsv}
              loading={busy === 'csv_invoices'}
              primary
              theme={theme}
            />
          </View>

          {/* ── CSV IMPORT ─────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CSV IMPORT</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <Database color={theme.textPrimary} size={20} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Import from CSV</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              Import existing customers or catalog items from CSV. Duplicate names are skipped.
              Required columns: <Text style={{ fontWeight: '600' }}>Name</Text>.
            </Text>

            <ActionButton
              label="Import Customers from CSV"
              sublabel="Columns: Name, Business Name, Email, Phone"
              icon={<Upload color={theme.textPrimary} size={18} />}
              onPress={handleImportCustomersCsv}
              loading={busy === 'csv_import_customers'}
              theme={theme}
            />

            <ActionButton
              label="Import Catalog Items from CSV"
              sublabel="Columns: Name, Description, Unit Price, Unit"
              icon={<Upload color={theme.textPrimary} size={18} />}
              onPress={handleImportCatalogCsv}
              loading={busy === 'csv_import_catalog'}
              theme={theme}
            />
          </View>

          {/* ── STORAGE INFO ─────────────────────────────────── */}
          <View style={[styles.infoCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              All data is stored in a private sandboxed SQLite database on your device.
              No account or internet connection required. You have 100% data ownership.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ACTION BUTTON COMPONENT ─────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onPress: () => void;
  loading?: boolean;
  primary?: boolean;
  destructive?: boolean;
  theme: any;
}

function ActionButton({ label, sublabel, icon, onPress, loading, primary, destructive, theme }: ActionButtonProps) {
  const isDark = theme.isDark ?? (theme.surface !== '#FFFFFF' && theme.surface !== '#FAFAFA');
  const bgColor = primary
    ? theme.brandAnchor
    : destructive
    ? theme.statusDanger
    : theme.surfaceSecondary;

  const textColor = primary
    ? theme.brandAnchorText
    : destructive
    ? '#FFFFFF'
    : theme.textPrimary;

  const subtextColor = primary
    ? (theme.brandAnchorText === '#FFFFFF' ? 'rgba(255,255,255,0.85)' : '#475569')
    : destructive
    ? 'rgba(255,255,255,0.85)'
    : theme.textSecondary;

  const borderColor = primary || destructive ? 'transparent' : theme.borderSubtle;

  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, { color: textColor })
    : icon;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity: pressed || loading ? 0.8 : 1,
          marginTop: spacing.sm,
        },
      ]}
      onPress={onPress}
      disabled={!!loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionButtonIcon}>
        {loading ? <ActivityIndicator color={textColor} size="small" /> : renderedIcon}
      </View>
      <View style={styles.actionButtonText}>
        <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.actionSublabel, { color: subtextColor }]}>{sublabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toastText: {
    color: '#fff',
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  cardDescription: {
    fontSize: typography.supporting.fontSize,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  actionButtonIcon: {
    marginRight: spacing.md,
    width: 24,
    alignItems: 'center',
  },
  actionButtonText: { flex: 1 },
  actionLabel: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  actionSublabel: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoText: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
});
