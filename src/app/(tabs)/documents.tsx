/**
 * DOCUMENTS SCREEN
 * Central repository for all business documents (Invoices, Estimates, Receipts).
 * Supports real-time text search, type filters, and lifecycle filters.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  useColorScheme,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, FileText, Plus, ChevronRight, QrCode, Zap, FilePlus2, X, Palette, Receipt } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { formatMoney } from '../../domain/money/Money';
import { DocumentUpiModal } from '../../features/payments/DocumentUpiModal';
import { PaymentRecordModal } from '../../features/payments/PaymentRecordModal';

interface DocumentListItem {
  id: string;
  doc_type: string;
  document_number: string;
  customer_name: string;
  total_minor: number;
  balance_minor?: number;
  currency: string;
  lifecycle_status: string;
  issue_date: number;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'invoice' | 'estimate' | 'receipt'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'issued'>('all');
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [locale, setLocale] = useState('en-US');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [upiDoc, setUpiDoc] = useState<DocumentListItem | null>(null);
  const [recordPaymentDoc, setRecordPaymentDoc] = useState<DocumentListItem | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      setProfile(activeProfile);
      if (activeProfile?.default_document_locale) {
        setLocale(activeProfile.default_document_locale);
      }

      const db = await DatabaseManager.getDatabaseAsync();

      let items: DocumentListItem[] = [];

      if (selectedType === 'receipt') {
        if (selectedStatus === 'draft') {
          // Receipts cannot be drafts
          items = [];
        } else {
          try {
            let rQuery = `
              SELECT r.id, 'receipt' AS doc_type, r.receipt_number AS document_number,
                     COALESCE(c.name, 'Customer') AS customer_name,
                     COALESCE(p.amount_minor, 0) AS total_minor,
                     0 AS balance_minor,
                     COALESCE(d.currency, 'INR') AS currency,
                     'paid' AS lifecycle_status,
                     r.issue_date
              FROM receipts r
              LEFT JOIN payments p ON r.payment_id = p.id
              LEFT JOIN documents d ON r.invoice_id = d.id
              LEFT JOIN customers c ON d.customer_id = c.id
            `;
            const rParams: any[] = [];
            if (searchQuery.trim()) {
              rQuery += ' WHERE (r.receipt_number LIKE ? OR c.name LIKE ? OR p.reference LIKE ?)';
              const wild = `%${searchQuery.trim()}%`;
              rParams.push(wild, wild, wild);
            }
            rQuery += ' ORDER BY r.issue_date DESC';
            items = await db.getAllAsync<DocumentListItem>(rQuery, rParams);
          } catch {
            items = [];
          }
        }
      } else {
        let query = `
          SELECT d.id, d.doc_type, d.document_number, COALESCE(c.name, 'No customer') AS customer_name,
                 d.total_minor, d.balance_minor, d.currency, d.lifecycle_status, d.issue_date
          FROM documents d
          LEFT JOIN customers c ON d.customer_id = c.id
          WHERE d.is_archived = 0
        `;
        const params: any[] = [];

        if (selectedType !== 'all') {
          query += ' AND d.doc_type = ?';
          params.push(selectedType);
        }

        if (selectedStatus === 'draft') {
          query += " AND d.lifecycle_status = 'draft'";
        } else if (selectedStatus === 'issued') {
          query += " AND d.lifecycle_status IN ('issued', 'paid')";
        }

        if (searchQuery.trim()) {
          query += ' AND (d.document_number LIKE ? OR c.name LIKE ? OR d.notes LIKE ?)';
          const wild = `%${searchQuery.trim()}%`;
          params.push(wild, wild, wild);
        }

        query += ' ORDER BY d.created_at DESC';
        const docItems = await db.getAllAsync<DocumentListItem>(query, params);

        if (selectedType === 'all' && (selectedStatus === 'all' || selectedStatus === 'issued')) {
          try {
            let rQuery = `
              SELECT r.id, 'receipt' AS doc_type, r.receipt_number AS document_number,
                     COALESCE(c.name, 'Customer') AS customer_name,
                     COALESCE(p.amount_minor, 0) AS total_minor,
                     0 AS balance_minor,
                     COALESCE(d.currency, 'INR') AS currency,
                     'paid' AS lifecycle_status,
                     r.issue_date
              FROM receipts r
              LEFT JOIN payments p ON r.payment_id = p.id
              LEFT JOIN documents d ON r.invoice_id = d.id
              LEFT JOIN customers c ON d.customer_id = c.id
            `;
            const rParams: any[] = [];
            if (searchQuery.trim()) {
              rQuery += ' WHERE (r.receipt_number LIKE ? OR c.name LIKE ? OR p.reference LIKE ?)';
              const wild = `%${searchQuery.trim()}%`;
              rParams.push(wild, wild, wild);
            }
            rQuery += ' ORDER BY r.issue_date DESC';
            const receiptItems = await db.getAllAsync<DocumentListItem>(rQuery, rParams);
            items = [...docItems, ...receiptItems].sort((a, b) => b.issue_date - a.issue_date);
          } catch {
            items = docItems;
          }
        } else {
          items = docItems;
        }
      }

      // Strict client-side filter guarantee
      if (selectedType !== 'all') {
        items = items.filter((d) => d.doc_type === selectedType);
      }

      setDocuments(items);
    } catch {
      setDocuments([]);
    }
  }, [searchQuery, selectedType, selectedStatus]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const renderItem = ({ item }: { item: DocumentListItem }) => {
    const isIssued = item.lifecycle_status === 'issued';
    const isPaid = item.lifecycle_status === 'paid';
    const isVoid = item.lifecycle_status === 'void';
    const statusColor = isPaid
      ? theme.statusSuccess
      : isIssued
      ? theme.statusIssued
      : isVoid
      ? theme.statusDanger
      : theme.statusDraft;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.rowItem,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderSubtle,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => {
          if (item.doc_type === 'receipt') {
            router.push(`/receipt/${item.id}`);
          } else {
            router.push(`/document/${item.id}`);
          }
        }}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.document_number}, ${item.customer_name}, ${item.lifecycle_status}`}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowLeft}>
            <View style={styles.numberRow}>
              <Text style={[styles.docNumber, { color: theme.textPrimary }]}>{item.document_number}</Text>
              <View style={[styles.typeBadge, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.typeBadgeText, { color: theme.textSecondary }]}>
                  {item.doc_type.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.customerName, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.customer_name}
            </Text>
          </View>

          <View style={styles.rowRight}>
            <View style={styles.amountActionRow}>
              {item.doc_type === 'invoice' && item.lifecycle_status === 'issued' && (
                <Pressable
                  style={[
                    styles.qrCollectBtn,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setUpiDoc(item);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Collect ${item.document_number} with UPI QR`}
                >
                  <QrCode size={13} color={theme.brandAnchor} />
                  <Text style={[styles.qrCollectText, { color: theme.brandAnchor }]}>Pay QR</Text>
                </Pressable>
              )}
              <Text style={[styles.docAmount, { color: theme.textPrimary }]}>
                {formatMoney({ amountMinor: BigInt(item.total_minor), currency: item.currency }, locale)}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.lifecycle_status.toUpperCase()}</Text>
              <ChevronRight color={theme.textMuted} size={16} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <AuroraBackground section="documents" intensity="subtle">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          {/* Screen Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Documents</Text>
              <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                Billing & Document Hub
              </Text>
            </View>
            <View style={styles.headerRightActions}>
              <Pressable
                style={[styles.templateStudioBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Open Template Studio"
                onPress={() => router.push('/templates' as any)}
              >
                <Palette color={theme.textPrimary} size={16} />
                <Text style={[styles.templateStudioBtnText, { color: theme.textPrimary }]}>Studio</Text>
              </Pressable>
              <Pressable
                style={[styles.createBtn, { backgroundColor: theme.brandAnchor }]}
                accessibilityRole="button"
                accessibilityLabel="Create document"
                onPress={() => {
                  if (selectedType === 'estimate') {
                    router.push({ pathname: '/document/edit', params: { type: 'estimate' } });
                  } else if (selectedType === 'invoice') {
                    router.push({ pathname: '/document/edit', params: { type: 'invoice' } });
                  } else {
                    setShowCreateSheet(true);
                  }
                }}
              >
                <Plus color={theme.brandAnchorText} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Quick Categories Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            style={styles.categoryScrollView}
          >
            <Pressable
              style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
            >
              <FileText size={16} color={theme.textPrimary} />
              <Text style={[styles.categoryCardTitle, { color: theme.textPrimary }]}>+ Invoice</Text>
            </Pressable>
            <Pressable
              style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
              onPress={() => router.push({ pathname: '/document/edit', params: { type: 'estimate' } })}
            >
              <FilePlus2 size={16} color={theme.textPrimary} />
              <Text style={[styles.categoryCardTitle, { color: theme.textPrimary }]}>+ Estimate</Text>
            </Pressable>
            <Pressable
              style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
              onPress={() => router.push('/quick-bill')}
            >
              <Zap size={16} color={theme.brandAnchor} />
              <Text style={[styles.categoryCardTitle, { color: theme.textPrimary }]}>⚡ Quick Bill</Text>
            </Pressable>
            <Pressable
              style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}
              onPress={() => router.push('/templates' as any)}
            >
              <Palette size={16} color={theme.textSecondary} />
              <Text style={[styles.categoryCardTitle, { color: theme.textPrimary }]}>Templates</Text>
            </Pressable>
          </ScrollView>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
            <Search color={theme.textSecondary} size={18} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search documents or customers..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>

          {/* Document Type Filter Tabs */}
          <View style={styles.filterRow}>
            {(['all', 'invoice', 'estimate', 'receipt'] as const).map((type) => {
              const isSelected = selectedType === type;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? theme.brandAnchor : theme.surface,
                      borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                    },
                  ]}
                  onPress={() => setSelectedType(type)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? theme.brandAnchorText : theme.textPrimary },
                    ]}
                  >
                    {type === 'all' ? 'All' : type === 'invoice' ? 'Invoices' : type === 'estimate' ? 'Estimates' : 'Receipts'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Status Filter Tabs (All / Drafts / Issued) */}
          <View style={styles.statusFilterRow}>
            {(['all', 'draft', 'issued'] as const).map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <Pressable
                  key={status}
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isSelected ? theme.surfaceElevated : 'transparent',
                      borderColor: isSelected ? theme.borderSubtle : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedStatus(status)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isSelected ? theme.textPrimary : theme.textMuted },
                    ]}
                  >
                    {status === 'all' ? 'All Status' : status === 'draft' ? 'Drafts' : 'Issued'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

        {/* Documents List or Empty State */}
        {documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText color={theme.textMuted} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery
                ? 'No documents found'
                : selectedType === 'invoice'
                ? 'No invoices yet'
                : selectedType === 'estimate'
                ? 'No estimates yet'
                : selectedType === 'receipt'
                ? 'No receipts yet'
                : 'No documents yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Try adjusting your search query.'
                : selectedType === 'invoice'
                ? 'Create a professional invoice or issue a 30s quick counter bill.'
                : selectedType === 'estimate'
                ? 'Create a quotation or cost estimate to send to your client.'
                : selectedType === 'receipt'
                ? 'Receipts are automatically generated when recording payments or settling quick bills.'
                : 'Create an invoice or estimate to get started.'}
            </Text>

            {!searchQuery && (
              <View style={styles.emptyActionsRow}>
                {(selectedType === 'all' || selectedType === 'invoice') && (
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: theme.brandAnchor }]}
                    onPress={() => router.push({ pathname: '/document/edit', params: { type: 'invoice' } })}
                    accessibilityRole="button"
                    accessibilityLabel="Create new invoice"
                  >
                    <Plus size={15} color={theme.brandAnchorText} strokeWidth={2.5} />
                    <Text style={[styles.emptyActionBtnText, { color: theme.brandAnchorText }]}>+ New Invoice</Text>
                  </Pressable>
                )}

                {(selectedType === 'all' || selectedType === 'estimate') && (
                  <Pressable
                    style={[
                      styles.emptyActionBtn,
                      selectedType === 'estimate'
                        ? { backgroundColor: theme.brandAnchor }
                        : { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle, borderWidth: 1 },
                    ]}
                    onPress={() => router.push({ pathname: '/document/edit', params: { type: 'estimate' } })}
                    accessibilityRole="button"
                    accessibilityLabel="Create new estimate"
                  >
                    <FileText size={15} color={selectedType === 'estimate' ? theme.brandAnchorText : theme.textPrimary} />
                    <Text
                      style={[
                        styles.emptyActionBtnText,
                        { color: selectedType === 'estimate' ? theme.brandAnchorText : theme.textPrimary },
                      ]}
                    >
                      + New Estimate
                    </Text>
                  </Pressable>
                )}

                {(selectedType === 'all' || selectedType === 'invoice') && (
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle, borderWidth: 1 }]}
                    onPress={() => router.push('/quick-bill')}
                    accessibilityRole="button"
                    accessibilityLabel="Open Quick Bill"
                  >
                    <Zap size={15} color={theme.brandAnchor} />
                    <Text style={[styles.emptyActionBtnText, { color: theme.textPrimary }]}>⚡ Quick Bill</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Instant UPI QR Collect Modal */}
        <DocumentUpiModal
          visible={!!upiDoc}
          document={upiDoc}
          profile={profile}
          locale={locale}
          onClose={() => setUpiDoc(null)}
          onRecordPayment={(item) => {
            const found = documents.find((d) => d.id === item.id) || null;
            setRecordPaymentDoc(found);
          }}
        />

        {/* Payment Record Modal */}
        {recordPaymentDoc && (
          <PaymentRecordModal
            visible={!!recordPaymentDoc}
            invoiceId={recordPaymentDoc.id}
            invoiceNumber={recordPaymentDoc.document_number}
            currency={recordPaymentDoc.currency}
            totalMinor={recordPaymentDoc.total_minor}
            balanceMinor={recordPaymentDoc.balance_minor ?? recordPaymentDoc.total_minor}
            documentLocale={locale}
            initialMethod="upi"
            initialProvider="direct_upi"
            initialSource="direct_qr"
            onPaymentRecorded={() => {
              setRecordPaymentDoc(null);
              loadDocuments();
            }}
            onClose={() => setRecordPaymentDoc(null)}
          />
        )}

        {/* Create Document Bottom Sheet Modal */}
        <Modal
          visible={showCreateSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateSheet(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowCreateSheet(false)}
              accessibilityLabel="Dismiss creation sheet"
            />
            <View style={[styles.createModalSheet, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={styles.createModalHeader}>
                <Text style={[styles.createModalTitle, { color: theme.textPrimary }]}>Create Document</Text>
                <Pressable onPress={() => setShowCreateSheet(false)} hitSlop={12} accessibilityLabel="Close creation sheet">
                  <X size={20} color={theme.textMuted} />
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.createOptionRow,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setShowCreateSheet(false);
                  router.push({ pathname: '/document/edit', params: { type: 'invoice' } });
                }}
                accessibilityRole="button"
                accessibilityLabel="Create New Invoice"
              >
                <View style={[styles.createOptionIcon, { backgroundColor: theme.brandAnchor + '18' }]}>
                  <FileText size={20} color={theme.brandAnchor} />
                </View>
                <View style={styles.createOptionTextWrap}>
                  <Text style={[styles.createOptionName, { color: theme.textPrimary }]}>New Invoice</Text>
                  <Text style={[styles.createOptionDesc, { color: theme.textSecondary }]}>
                    Official tax invoice with itemized pricing & payment terms
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.textMuted} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createOptionRow,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setShowCreateSheet(false);
                  router.push({ pathname: '/document/edit', params: { type: 'estimate' } });
                }}
                accessibilityRole="button"
                accessibilityLabel="Create New Estimate"
              >
                <View style={[styles.createOptionIcon, { backgroundColor: theme.brandAnchor + '18' }]}>
                  <FilePlus2 size={20} color={theme.brandAnchor} />
                </View>
                <View style={styles.createOptionTextWrap}>
                  <Text style={[styles.createOptionName, { color: theme.textPrimary }]}>New Estimate</Text>
                  <Text style={[styles.createOptionDesc, { color: theme.textSecondary }]}>
                    Quotation or proposal for client approval & conversion
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.textMuted} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createOptionRow,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  setShowCreateSheet(false);
                  router.push('/quick-bill');
                }}
                accessibilityRole="button"
                accessibilityLabel="Open 30-second Quick Bill"
              >
                <View style={[styles.createOptionIcon, { backgroundColor: theme.brandAnchor + '18' }]}>
                  <Zap size={20} color={theme.brandAnchor} fill={theme.brandAnchor} />
                </View>
                <View style={styles.createOptionTextWrap}>
                  <Text style={[styles.createOptionName, { color: theme.textPrimary }]}>30s Quick Bill</Text>
                  <Text style={[styles.createOptionDesc, { color: theme.textSecondary }]}>
                    Counter sale / instant billing with direct live UPI QR
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.textMuted} />
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  screenTitle: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontWeight: typography.screenTitle.fontWeight,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  templateStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  templateStudioBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScrollView: {
    marginBottom: spacing.md,
    maxHeight: 46,
  },
  categoryScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  categoryCardTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.input.fontSize,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  rowItem: {
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flex: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  docNumber: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  customerName: {
    fontSize: typography.supporting.fontSize,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  amountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qrCollectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  qrCollectText: {
    fontSize: 10,
    fontWeight: '700',
  },
  docAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  emptyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  createModalSheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  createModalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  createOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  createOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  createOptionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  createOptionDesc: {
    fontSize: 12,
  },
});
