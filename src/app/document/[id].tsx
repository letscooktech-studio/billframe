/**
 * DOCUMENT VIEWER & ACTION HUB
 * Production screen for reviewing issued/draft Invoices and Estimates,
 * executing lifecycle transitions (Issue, Accept, Reject, Convert, Void),
 * recording partial/full payments, and viewing payment-linked receipts.
 * 
 * Flattened layout: clean whitespace, subtle hairline dividers,
 * double-tap idempotency protection, dynamic 200% font scaling resilience,
 * and comprehensive TalkBack accessibility semantics.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
  BackHandler,
  Share,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit2,
  FileCheck,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  CreditCard,
  Receipt,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Copy,
  PenTool,
  Shield,
  Share2,
  QrCode,
  RotateCcw,
  Edit3,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { DocumentRepository, FullDocument } from '../../data/repositories/DocumentRepository';
import { PaymentRepository, PaymentRecord, ReceiptRecord } from '../../data/repositories/PaymentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { DirectUpiEngine } from '../../domain/payments/upi/DirectUpiEngine';
import { ExchangeRateEngine } from '../../domain/money/ExchangeRateEngine';
import { UpiQrCode } from '../../components/common/UpiQrCode';
import { PdfService } from '../../services/pdf/PdfService';
import { createMoney, formatMoney, moneyToDecimalString } from '../../domain/money/Money';
import { quantityScaledToString } from '../../features/items/ItemEditorModal';
import { PaymentRecordModal } from '../../features/payments/PaymentRecordModal';
import { SignatureModal } from '../../features/signature/SignatureModal';
import { CustomerStatementModal } from '../../features/statements/CustomerStatementModal';
import { TaxExplainabilityEngine } from '../../domain/tax/TaxExplainability';
import { TaxExplanationModal } from '../../features/tax/TaxExplanationModal';
import { showAlert } from '../../utils/alert';

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [doc, setDoc] = useState<FullDocument | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [paymentInitialMethod, setPaymentInitialMethod] = useState<string | undefined>(undefined);
  const [paymentInitialProvider, setPaymentInitialProvider] = useState<'manual' | 'direct_upi' | 'razorpay' | 'cashfree' | 'stripe' | 'other' | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);

  // Payee / Vendor UPI customization & inline setup state
  const [customPayeeVpa, setCustomPayeeVpa] = useState('');
  const [customPayeeName, setCustomPayeeName] = useState('');
  const [isEditingPayee, setIsEditingPayee] = useState(false);
  const [inlineVpaInput, setInlineVpaInput] = useState('');
  const [inlineNameInput, setInlineNameInput] = useState('');
  const [inlineVpaError, setInlineVpaError] = useState<string | null>(null);
  const [isSavingProfileVpa, setIsSavingProfileVpa] = useState(false);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);
  const [fxRateTick, setFxRateTick] = useState(0);

  const taxExplanation = React.useMemo(() => {
    if (!doc) return null;
    return TaxExplainabilityEngine.explainFromDocument(doc);
  }, [doc]);

  // Double-tap idempotency guard ref
  const isSubmittingRef = useRef(false);

  // Android hardware back handler
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const documentData = await DocumentRepository.getById(id);
      setDoc(documentData);

      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      setProfile(activeProfile);
      if (activeProfile?.upi_vpa) {
        setInlineVpaInput(activeProfile.upi_vpa);
      }
      if (activeProfile?.legal_name || activeProfile?.name) {
        setInlineNameInput(activeProfile.legal_name || activeProfile.name);
      }

      if (documentData && documentData.doc_type === 'invoice') {
        const payList = await PaymentRepository.getPaymentsForInvoice(id);
        const recList = await PaymentRepository.getReceiptsForInvoice(id);
        setPayments(payList);
        setReceipts(recList);

        if (documentData.currency !== 'INR') {
          ExchangeRateEngine.fetchLiveRatesAsync().then((updated) => {
            if (updated) {
              setFxRateTick((prev) => prev + 1);
            }
          });
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSaveVpaToProfile = async () => {
    const val = DirectUpiEngine.validateVpa(inlineVpaInput);
    if (!val.isValid || !val.normalizedVpa) {
      setInlineVpaError(val.error || 'Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setInlineVpaError(null);
    setIsSavingProfileVpa(true);
    try {
      const activeProf = profile || (await BusinessProfileRepository.getActiveProfile());
      if (activeProf) {
        await BusinessProfileRepository.updateProfile({
          id: activeProf.id,
          upi_vpa: val.normalizedVpa,
          legal_name: inlineNameInput.trim() || activeProf.legal_name || activeProf.name,
        });
        const updated = await BusinessProfileRepository.getActiveProfile();
        setProfile(updated);
        setCustomPayeeVpa('');
        setCustomPayeeName('');
        setIsEditingPayee(false);
      }
    } catch (err: any) {
      setInlineVpaError(err.message || 'Failed to save UPI ID to profile');
    } finally {
      setIsSavingProfileVpa(false);
    }
  };

  const handleUseOnceCustomPayee = () => {
    const val = DirectUpiEngine.validateVpa(inlineVpaInput);
    if (!val.isValid || !val.normalizedVpa) {
      setInlineVpaError(val.error || 'Please enter a valid UPI ID (e.g. vendor@bank)');
      return;
    }
    setInlineVpaError(null);
    setCustomPayeeVpa(val.normalizedVpa);
    setCustomPayeeName(inlineNameInput.trim() || 'Vendor');
    setIsEditingPayee(false);
  };

  const handleResetToProfileDefault = () => {
    setCustomPayeeVpa('');
    setCustomPayeeName('');
    setIsEditingPayee(false);
    setInlineVpaError(null);
    if (profile?.upi_vpa) {
      setInlineVpaInput(profile.upi_vpa);
      setInlineNameInput(profile.legal_name || profile.name);
    }
  };

  const handleRefreshLiveRate = async () => {
    setIsRefreshingFx(true);
    try {
      const updated = await ExchangeRateEngine.fetchLiveRatesAsync(true);
      if (updated) {
        setFxRateTick((prev) => prev + 1);
      } else {
        showAlert('Offline Mode', 'Could not reach live market rate servers. Using ECB official reference rate.');
      }
    } catch {
      showAlert('Network Error', 'Unable to fetch real-time market rates right now.');
    } finally {
      setIsRefreshingFx(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isInvoice = doc?.doc_type === 'invoice';
  const isEstimate = doc?.doc_type === 'estimate';
  const isDraft = doc?.lifecycle_status === 'draft';
  const isIssued = doc?.lifecycle_status === 'issued';
  const isAccepted = doc?.lifecycle_status === 'accepted';
  const isRejected = doc?.lifecycle_status === 'rejected';
  const isVoid = doc?.lifecycle_status === 'void';

  const effectiveVpa = (customPayeeVpa.trim() || profile?.upi_vpa || '').trim();
  const effectivePayeeName = (customPayeeName.trim() || profile?.legal_name || profile?.name || 'Merchant').trim();

  const upiConversion = useMemo(() => {
    if (!doc || !isInvoice || !isIssued || (doc.balance_minor ?? 0) <= 0 || !effectiveVpa) {
      return null;
    }
    try {
      return DirectUpiEngine.buildUpiUriWithCurrencyConversion({
        vpa: effectiveVpa,
        payeeName: effectivePayeeName,
        sourceAmountMinor: BigInt(doc.balance_minor),
        sourceCurrency: doc.currency,
        transactionRef: doc.document_number,
        transactionNote: `Invoice ${doc.document_number}`,
      });
    } catch {
      return null;
    }
  }, [doc, isInvoice, isIssued, effectiveVpa, effectivePayeeName, fxRateTick]);

  const upiUri = upiConversion?.upiUri ?? null;

  if (loading || !doc) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Lifecycle actions with double-tap protection
  async function handleIssue() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsOperating(true);
    try {
      await DocumentRepository.issueDocument(doc!.id);
      await loadData();
    } catch (err: any) {
      showAlert('Issuance Failed', err.message || 'Document could not be issued.');
    } finally {
      isSubmittingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleAcceptEstimate() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsOperating(true);
    try {
      await DocumentRepository.acceptEstimate(doc!.id);
      await loadData();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to accept estimate.');
    } finally {
      isSubmittingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleSignAndAcceptEstimate(signatureUri: string, signerName: string) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsOperating(true);
    try {
      await DocumentRepository.acceptEstimateWithSignature(doc!.id, signatureUri);
      await loadData();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to accept estimate with signature.');
    } finally {
      isSubmittingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleSharePdf() {
    if (!doc) return;
    setIsOperating(true);
    try {
      const biz = await BusinessProfileRepository.getActiveProfile();
      if (!biz) {
        showAlert('Profile Needed', 'Please complete your business profile in Settings before exporting PDF.');
        return;
      }
      await PdfService.shareDocumentPdfAsync(doc, biz, 'standard');
    } catch (err: any) {
      showAlert('PDF Export Failed', err.message || 'Could not compile PDF.');
    } finally {
      setIsOperating(false);
    }
  }

  async function handleDuplicate() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsOperating(true);
    try {
      const cloned = await DocumentRepository.duplicateDocument(doc!.id);
      router.push({
        pathname: '/document/edit',
        params: { type: cloned.doc_type, id: cloned.id },
      });
    } catch (err: any) {
      showAlert('Duplicate Failed', err.message || 'Failed to duplicate document.');
    } finally {
      isSubmittingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleRejectEstimate() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsOperating(true);
    try {
      await DocumentRepository.rejectEstimate(doc!.id);
      await loadData();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to reject estimate.');
    } finally {
      isSubmittingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleConvertToInvoice() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsOperating(true);
    try {
      const newInvoice = await DocumentRepository.convertEstimateToInvoice(doc!.id);
      router.push({
        pathname: '/document/edit',
        params: { type: 'invoice', id: newInvoice.id },
      });
    } catch (err: any) {
      showAlert('Conversion Failed', err.message || 'Failed to convert estimate to invoice.');
    } finally {
      isSubmittingRef.current = false;
      setIsOperating(false);
    }
  }

  async function handleVoid() {
    if (isSubmittingRef.current) return;
    showAlert(
      'Void Document',
      'Are you sure you want to void this issued document? This cannot be undone and will remain in records for compliance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void Document',
          style: 'destructive',
          onPress: async () => {
            if (isSubmittingRef.current) return;
            isSubmittingRef.current = true;
            setIsOperating(true);
            try {
              await DocumentRepository.voidDocument(doc!.id);
              await loadData();
            } catch (err: any) {
              showAlert('Error', err.message || 'Failed to void document.');
            } finally {
              isSubmittingRef.current = false;
              setIsOperating(false);
            }
          },
        },
      ]
    );
  }

  async function handleDeleteDraft() {
    if (isSubmittingRef.current) return;
    showAlert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (isSubmittingRef.current) return;
            isSubmittingRef.current = true;
            setIsOperating(true);
            try {
              await DocumentRepository.deleteDraft(doc!.id);
              router.back();
            } catch (err: any) {
              showAlert('Error', err.message || 'Failed to delete draft.');
            } finally {
              isSubmittingRef.current = false;
              setIsOperating(false);
            }
          },
        },
      ]
    );
  }

  const grandTotalMoney = createMoney(BigInt(doc.total_minor), doc.currency);
  const paidMoney = createMoney(BigInt(doc.total_paid_minor), doc.currency);
  const balanceMoney = createMoney(BigInt(doc.balance_minor), doc.currency);
  const subtotalMoney = createMoney(BigInt(doc.subtotal_minor), doc.currency);
  const discountMoney = createMoney(BigInt(doc.discount_minor), doc.currency);
  const taxMoney = createMoney(BigInt(doc.tax_minor), doc.currency);


  const statusColor = isIssued
    ? theme.statusIssued
    : isAccepted
    ? theme.statusSuccess
    : isVoid || isRejected
    ? theme.statusDanger
    : theme.statusDraft;

  const statusLabel =
    doc.lifecycle_status.charAt(0).toUpperCase() + doc.lifecycle_status.slice(1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/documents' as any);
            }
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={theme.textPrimary} size={22} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>{doc.document_number}</Text>
          <Text style={[styles.topBarType, { color: theme.textSecondary }]}>
            {isInvoice ? 'Invoice' : 'Estimate'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isDraft && (
            <Pressable
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: '/document/edit',
                  params: { type: doc.doc_type, id: doc.id },
                })
              }
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Edit draft"
            >
              <Edit2 color={theme.brandAnchor} size={20} />
            </Pressable>
          )}
          <Pressable
            style={[styles.editButton, isDraft ? { marginLeft: 8 } : null]}
            onPress={handleSharePdf}
            disabled={isOperating}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Share PDF document"
          >
            <Share2 color={theme.brandAnchor} size={20} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {actionError && (
            <View style={[styles.errorBox, { borderColor: theme.statusDanger, backgroundColor: theme.surfaceSecondary }]}>
              <AlertTriangle color={theme.statusDanger} size={16} />
              <Text style={[styles.errorText, { color: theme.statusDanger }]}>{actionError}</Text>
            </View>
          )}

          {/* Main Continuous Document Sheet */}
          <View style={[styles.documentSheet, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            {/* 1. Header Overview & Balance */}
            <View style={styles.sectionBlock}>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: theme.surfaceSecondary }]}>
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>

                {isInvoice && isIssued && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        borderColor:
                          doc.payment_status === 'paid'
                            ? theme.statusSuccess
                            : doc.payment_status === 'partially_paid'
                            ? theme.statusIssued
                            : theme.textMuted,
                        backgroundColor: theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            doc.payment_status === 'paid'
                              ? theme.statusSuccess
                              : doc.payment_status === 'partially_paid'
                              ? theme.statusIssued
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {doc.payment_status === 'paid'
                        ? 'Paid'
                        : doc.payment_status === 'partially_paid'
                        ? 'Partially paid'
                        : 'Unpaid'}
                    </Text>
                  </View>
                )}

                {doc.payment_terms_preset ? (
                  <View style={[styles.statusBadge, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.statusBadgeText, { color: theme.textSecondary }]}>
                      {doc.payment_terms_preset.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                ) : null}

                {doc.signature_date ? (
                  <View style={[styles.statusBadge, { borderColor: theme.statusSuccess, backgroundColor: theme.surfaceSecondary }]}>
                    <CheckCircle2 size={12} color={theme.statusSuccess} />
                    <Text style={[styles.statusBadgeText, { color: theme.statusSuccess }]}>
                      Signed {new Date(doc.signature_date).toLocaleDateString()}
                    </Text>
                  </View>
                ) : null}

                {doc.is_overdue && (
                  <View style={[styles.statusBadge, { borderColor: theme.statusDanger, backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.statusBadgeText, { color: theme.statusDanger }]}>Overdue</Text>
                  </View>
                )}
              </View>

              <View style={styles.amountDisplay}>
                <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
                  {isInvoice && isIssued ? 'Remaining balance' : 'Total amount'}
                </Text>
                <Text
                  style={[styles.amountValue, { color: theme.textPrimary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(isInvoice && isIssued ? balanceMoney : grandTotalMoney)}
                </Text>
                {isInvoice && isIssued && doc.total_paid_minor > 0 && (
                  <Text style={[styles.amountSub, { color: theme.textSecondary }]}>
                    Paid: {formatMoney(paidMoney)} of {formatMoney(grandTotalMoney)}
                  </Text>
                )}
              </View>

              {/* Dates row */}
              <View style={[styles.datesRow, { borderTopColor: theme.borderSubtle }]}>
                <View style={styles.dateCol}>
                  <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Issued date</Text>
                  <Text style={[styles.dateValue, { color: theme.textPrimary }]}>
                    {new Date(doc.issue_date).toLocaleDateString()}
                  </Text>
                </View>
                {isInvoice && doc.due_date && (
                  <View style={styles.dateCol}>
                    <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Due date</Text>
                    <Text style={[styles.dateValue, { color: theme.textPrimary }]}>
                      {new Date(doc.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {doc.po_number ? (
                  <View style={styles.dateCol}>
                    <Text style={[styles.dateLabel, { color: theme.textMuted }]}>PO / Ref</Text>
                    <Text style={[styles.dateValue, { color: theme.textPrimary }]}>{doc.po_number}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Hairline Divider */}
            <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 2. Customer Section */}
            <View style={styles.sectionBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>Customer</Text>
                {doc.customer_id ? (
                  <Pressable
                    onPress={() => setShowStatementModal(true)}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel="View customer account statement"
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.brandAnchor }}>View Statement</Text>
                    <ChevronRight size={14} color={theme.brandAnchor} />
                  </Pressable>
                ) : null}
              </View>
              {doc.customer_name ? (
                <Pressable
                  style={({ pressed }) => [styles.customerBlock, pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    if (doc.customer_id) {
                      router.push({ pathname: '/customer/[id]', params: { id: doc.customer_id } });
                    }
                  }}
                  disabled={!doc.customer_id}
                  accessibilityRole={doc.customer_id ? 'button' : undefined}
                  accessibilityLabel={doc.customer_id ? `View customer ${doc.customer_name}` : undefined}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.customerName, { color: theme.textPrimary }]}>{doc.customer_name}</Text>
                    {doc.customer_id && <ChevronRight size={16} color={theme.textMuted} />}
                  </View>
                  {doc.customer_business_name && (
                    <Text style={[styles.customerBusiness, { color: theme.textSecondary }]}>
                      {doc.customer_business_name}
                    </Text>
                  )}
                  {doc.customer_email && (
                    <Text style={[styles.customerDetail, { color: theme.textSecondary }]}>{doc.customer_email}</Text>
                  )}
                  {doc.customer_phone && (
                    <Text style={[styles.customerDetail, { color: theme.textSecondary }]}>{doc.customer_phone}</Text>
                  )}
                  {doc.customer_billing_address && (
                    <Text style={[styles.customerAddress, { color: theme.textMuted }]}>
                      {doc.customer_billing_address}
                    </Text>
                  )}
                  {doc.shipping_address ? (
                    <View style={{ marginTop: spacing.xs }}>
                      <Text style={[styles.customerDetail, { color: theme.textMuted, fontSize: 11, fontWeight: '600' }]}>
                        Job Site Address:
                      </Text>
                      <Text style={[styles.customerAddress, { color: theme.textPrimary }]}>{doc.shipping_address}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ) : (
                <Text style={[styles.noCustomerText, { color: theme.textMuted }]}>No customer assigned</Text>
              )}
            </View>

            {/* Hairline Divider */}
            <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 3. Line Items Section */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Items ({doc.items.length})
              </Text>
              {doc.items.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    idx < doc.items.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <Text style={[styles.itemDesc, { color: theme.textPrimary }]}>{item.description}</Text>
                    {item.item_notes ? (
                      <Text style={[styles.itemNotes, { color: theme.textSecondary }]}>{item.item_notes}</Text>
                    ) : null}
                    <Text style={[styles.itemSub, { color: theme.textSecondary }]}>
                      {quantityScaledToString(BigInt(item.quantity_scaled))} {item.unit_name} ×{' '}
                      {formatMoney(createMoney(BigInt(item.unit_price_minor), doc.currency))}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: theme.textPrimary }]}>
                    {formatMoney(createMoney(BigInt(item.line_total_minor), doc.currency))}
                  </Text>
                </View>
              ))}

              {/* Financial Summary */}
              <View style={[styles.breakdownSection, { borderTopColor: theme.borderSubtle }]}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.breakdownValue, { color: theme.textPrimary }]}>
                    {formatMoney(subtotalMoney)}
                  </Text>
                </View>

                {doc.discount_minor > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Discount</Text>
                    <Text style={[styles.breakdownValue, { color: theme.statusDanger }]}>
                      -{formatMoney(discountMoney)}
                    </Text>
                  </View>
                )}

                {doc.tax_minor > 0 && (
                  <Pressable
                    style={({ pressed }) => [styles.breakdownRow, pressed && { opacity: 0.7 }]}
                    onPress={() => setShowTaxModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`View tax explanation for ${doc.tax_label}`}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
                        {doc.tax_label} ({doc.tax_rate_bp / 100}%)
                      </Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.xs, backgroundColor: theme.brandAnchor + '18' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: theme.brandAnchor }}>
                          Why this rate?
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.breakdownValue, { color: theme.textPrimary }]}>
                      {formatMoney(taxMoney)}
                    </Text>
                  </Pressable>
                )}

                <View style={[styles.grandDivider, { backgroundColor: theme.borderSubtle }]} />

                <View style={styles.breakdownRow}>
                  <Text style={[styles.grandLabel, { color: theme.textPrimary }]}>Grand Total</Text>
                  <Text style={[styles.grandValue, { color: theme.textPrimary }]}>
                    {formatMoney(grandTotalMoney)}
                  </Text>
                </View>

                {doc.deposit_minor > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Deposit Applied</Text>
                    <Text style={[styles.breakdownValue, { color: theme.statusSuccess }]}>
                      -{formatMoney(createMoney(BigInt(doc.deposit_minor), doc.currency))}
                    </Text>
                  </View>
                )}

                {(doc.deposit_minor > 0 || (isInvoice && isIssued)) && (
                  <View style={[styles.breakdownRow, { marginTop: spacing.xs }]}>
                    <Text style={[styles.grandLabel, { color: theme.brandAnchor }]}>Balance Due</Text>
                    <Text style={[styles.grandValue, { color: theme.brandAnchor }]}>
                      {formatMoney(balanceMoney)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Direct UPI Payment Section (Zero Fee) */}
            {isInvoice && isIssued && doc.balance_minor > 0 && (
              <>
                <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={[styles.sectionBlock, { backgroundColor: theme.surface, borderRadius: radii.md, borderWidth: 1, borderColor: theme.borderSubtle, padding: spacing.md }]}>
                  {(!effectiveVpa || isEditingPayee) ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <QrCode size={18} color={theme.brandAnchor} />
                          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
                            {isEditingPayee ? 'Payee / Vendor UPI Override' : 'Configure Direct UPI'}
                          </Text>
                        </View>
                        {isEditingPayee && (
                          <Pressable onPress={() => setIsEditingPayee(false)} hitSlop={8}>
                            <Text style={{ fontSize: 13, color: theme.textSecondary }}>Cancel</Text>
                          </Pressable>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: spacing.md }}>
                        {isEditingPayee
                          ? 'Enter a vendor, contractor, or alternate bank UPI ID to direct this payment.'
                          : 'Enter your business UPI ID (PhonePe, Google Pay, Paytm, BHIM) to instantly generate dynamic balance QR.'}
                      </Text>

                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                        UPI ID (VPA) *
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: inlineVpaError ? theme.statusDanger : theme.borderSubtle,
                          borderWidth: 1,
                          borderRadius: radii.sm,
                          paddingHorizontal: spacing.md,
                          height: 44,
                          fontSize: 14,
                          marginBottom: spacing.sm,
                        }}
                        placeholder="e.g. merchant@icici or vendor@okhdfcbank"
                        placeholderTextColor={theme.textMuted}
                        value={inlineVpaInput}
                        onChangeText={(val) => {
                          setInlineVpaInput(val);
                          if (inlineVpaError) setInlineVpaError(null);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />

                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                        Payee / Vendor Name
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                          borderWidth: 1,
                          borderRadius: radii.sm,
                          paddingHorizontal: spacing.md,
                          height: 44,
                          fontSize: 14,
                          marginBottom: spacing.sm,
                        }}
                        placeholder="e.g. Studio Agency or Contractor Name"
                        placeholderTextColor={theme.textMuted}
                        value={inlineNameInput}
                        onChangeText={setInlineNameInput}
                      />

                      {inlineVpaError && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}>
                          <AlertCircle size={14} color={theme.statusDanger} />
                          <Text style={{ fontSize: 12, color: theme.statusDanger }}>{inlineVpaError}</Text>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.xs }}>
                        <Pressable
                          style={[styles.flexButton, { backgroundColor: theme.brandAnchor }]}
                          onPress={handleSaveVpaToProfile}
                          disabled={isSavingProfileVpa}
                        >
                          {isSavingProfileVpa ? (
                            <ActivityIndicator size="small" color={theme.brandAnchorText} />
                          ) : (
                            <Text style={[styles.secondaryActionText, { color: theme.brandAnchorText, fontSize: 12, fontWeight: '700' }]}>
                              Save as Default & Show QR
                            </Text>
                          )}
                        </Pressable>

                        <Pressable
                          style={[styles.flexButton, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          onPress={handleUseOnceCustomPayee}
                        >
                          <Text style={[styles.secondaryActionText, { color: theme.textPrimary, fontSize: 12 }]}>
                            Use Once for this Doc
                          </Text>
                        </Pressable>
                      </View>

                      {customPayeeVpa ? (
                        <Pressable
                          onPress={handleResetToProfileDefault}
                          style={{ alignSelf: 'center', marginTop: spacing.sm, paddingVertical: 4 }}
                        >
                          <Text style={{ fontSize: 12, color: theme.brandAnchor, fontWeight: '600' }}>
                            Reset to Profile Default ({profile?.upi_vpa || 'None'})
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : upiUri ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <QrCode size={18} color={theme.brandAnchor} />
                          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
                            Direct UPI Payment
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Pressable
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: radii.xs,
                              borderWidth: 1,
                              borderColor: theme.borderSubtle,
                              backgroundColor: theme.surfaceSecondary,
                            }}
                            onPress={() => {
                              setInlineVpaInput(effectiveVpa);
                              setInlineNameInput(effectivePayeeName);
                              setIsEditingPayee(true);
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Change or override payee UPI ID"
                          >
                            <Edit3 size={11} color={theme.textPrimary} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textPrimary }}>
                              {customPayeeVpa ? 'Edit Vendor' : 'Change UPI'}
                            </Text>
                          </Pressable>
                          <View style={{ backgroundColor: theme.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.statusSuccess }}>0% FEE</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: spacing.md }}>
                        Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI app
                      </Text>

                      {customPayeeVpa ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: theme.surfaceSecondary,
                            borderRadius: radii.xs,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 6,
                            marginBottom: spacing.sm,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#D97706' }}>
                            Vendor / Custom Payee Active: {customPayeeVpa}
                          </Text>
                          <Pressable onPress={handleResetToProfileDefault} hitSlop={8}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.brandAnchor }}>Reset</Text>
                          </Pressable>
                        </View>
                      ) : null}

                      <View style={{ alignItems: 'center', marginVertical: spacing.sm, padding: spacing.sm, backgroundColor: '#ffffff', borderRadius: radii.md, alignSelf: 'center' }}>
                        <UpiQrCode value={upiUri} size={150} color="#000000" backgroundColor="#ffffff" />
                      </View>

                      {/* Regional / FX Conversion Banner */}
                      {upiConversion?.isConverted && (
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: theme.brandAnchor,
                            backgroundColor: theme.surfaceSecondary,
                            borderRadius: radii.sm,
                            padding: spacing.sm,
                            marginVertical: spacing.xs,
                            alignItems: 'center',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 2 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.statusSuccess }}>
                              Auto-Converted to INR: ₹{moneyToDecimalString(createMoney(upiConversion.inrAmountMinor!, 'INR'))}
                            </Text>
                            <Pressable
                              onPress={handleRefreshLiveRate}
                              disabled={isRefreshingFx}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: radii.xs,
                                borderWidth: 1,
                                borderColor: theme.borderSubtle,
                              }}
                              hitSlop={8}
                              accessibilityLabel="Refresh real-time market exchange rate"
                            >
                              {isRefreshingFx ? (
                                <ActivityIndicator size="small" color={theme.brandAnchor} />
                              ) : (
                                <>
                                  <RotateCcw size={10} color={theme.textPrimary} />
                                  <Text style={{ fontSize: 10, color: theme.textPrimary, fontWeight: '600' }}>Live Rate</Text>
                                </>
                              )}
                            </Pressable>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginTop: 2 }}>
                            {upiConversion.conversionSummary} ({upiConversion.exchangeRateLabel})
                          </Text>
                        </View>
                      )}

                      <View style={{ alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.sm }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                          {effectivePayeeName}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                          UPI ID: {effectiveVpa}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.xs }}>
                        <Pressable
                          style={[styles.flexButton, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          onPress={() => {
                            Share.share({
                              message: `Pay invoice ${doc.document_number} (${upiConversion?.isConverted ? `₹${moneyToDecimalString(createMoney(upiConversion.inrAmountMinor!, 'INR'))} INR` : formatMoney(balanceMoney)}) via UPI: ${upiUri}`,
                              title: `UPI Payment: ${doc.document_number}`,
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Share UPI payment link"
                        >
                          <Share2 size={14} color={theme.textPrimary} />
                          <Text style={[styles.secondaryActionText, { color: theme.textPrimary, fontSize: 12 }]}>Share Link</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.flexButton, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          onPress={() => {
                            showAlert('UPI ID', effectiveVpa, [{ text: 'OK' }]);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="View UPI ID"
                        >
                          <Copy size={14} color={theme.textPrimary} />
                          <Text style={[styles.secondaryActionText, { color: theme.textPrimary, fontSize: 12 }]}>Copy UPI ID</Text>
                        </Pressable>
                      </View>

                      {/* Primary CTA: I Received the Money */}
                      <Pressable
                        style={[
                          styles.primaryActionBtn,
                          { backgroundColor: theme.statusSuccess, marginTop: spacing.md },
                        ]}
                        onPress={() => {
                          setPaymentInitialMethod('upi');
                          setPaymentInitialProvider('direct_upi');
                          setShowPaymentModal(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="I received the money via UPI"
                        accessibilityHint="Opens payment record sheet to confirm direct UPI receipt"
                      >
                        <CheckCircle2 color="#FFFFFF" size={18} />
                        <Text style={[styles.primaryActionText, { color: '#FFFFFF', fontWeight: '700' }]}>
                          I Received the Money
                        </Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </>
            )}

            {/* 4. Payment History & Receipts (For Invoices) */}
            {isInvoice && isIssued && (
              <>
                <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    Payments & receipts ({payments.length})
                  </Text>

                  {payments.length === 0 ? (
                    <Text style={[styles.emptyPaymentsText, { color: theme.textMuted }]}>
                      No payments recorded yet.
                    </Text>
                  ) : (
                    payments.map((p, idx) => {
                      const linkedReceipt = receipts.find((r) => r.payment_id === p.id);
                      return (
                        <View
                          key={p.id}
                          style={[
                            styles.paymentRow,
                            idx < payments.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
                          ]}
                        >
                          <View style={styles.paymentLeft}>
                            <View style={styles.paymentMethodRow}>
                              <CreditCard size={14} color={theme.brandAnchor} />
                              <Text style={[styles.paymentMethod, { color: theme.textPrimary }]}>
                                {p.payment_method.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.paymentDate, { color: theme.textSecondary }]}>
                              {new Date(p.payment_date).toLocaleDateString()}
                              {p.reference ? ` • Ref: ${p.reference}` : ''}
                            </Text>
                            {linkedReceipt && (
                              <Pressable
                                style={styles.receiptLink}
                                onPress={() => router.push(`/receipt/${linkedReceipt.id}`)}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel={`View receipt ${linkedReceipt.receipt_number}`}
                              >
                                <Receipt size={12} color={theme.brandAnchor} />
                                <Text style={[styles.receiptLinkText, { color: theme.brandAnchor }]}>
                                  View Receipt {linkedReceipt.receipt_number}
                                </Text>
                                <ChevronRight size={12} color={theme.brandAnchor} />
                              </Pressable>
                            )}
                          </View>
                          <Text style={[styles.paymentAmount, { color: theme.statusSuccess }]}>
                            {formatMoney(createMoney(BigInt(p.amount_minor), p.currency))}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </>
            )}

            {/* 5. Notes, Terms & Instructions */}
            {(doc.notes || doc.terms || doc.payment_instructions || doc.internal_notes) && (
              <>
                <View style={[styles.hairlineDivider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.sectionBlock}>
                  {doc.payment_instructions ? (
                    <View style={{ marginBottom: doc.notes || doc.terms || doc.internal_notes ? spacing.md : 0 }}>
                      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Payment Instructions</Text>
                      <Text style={[styles.notesText, { color: theme.textPrimary }]}>{doc.payment_instructions}</Text>
                    </View>
                  ) : null}
                  {doc.notes ? (
                    <View style={{ marginBottom: doc.terms || doc.internal_notes ? spacing.md : 0 }}>
                      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Notes</Text>
                      <Text style={[styles.notesText, { color: theme.textPrimary }]}>{doc.notes}</Text>
                    </View>
                  ) : null}
                  {doc.terms ? (
                    <View style={{ marginBottom: doc.internal_notes ? spacing.md : 0 }}>
                      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Terms</Text>
                      <Text style={[styles.notesText, { color: theme.textPrimary }]}>{doc.terms}</Text>
                    </View>
                  ) : null}
                  {doc.internal_notes ? (
                    <View style={[styles.privateNoteBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Shield size={14} color={theme.textMuted} />
                        <Text style={[styles.privateNoteTitle, { color: theme.textSecondary }]}>
                          Private Internal Note (Owner Only)
                        </Text>
                      </View>
                      <Text style={[styles.notesText, { color: theme.textPrimary }]}>{doc.internal_notes}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </View>

          {/* Action Hub Buttons */}
          <View style={styles.actionsContainer}>
            {/* 1. DRAFT ACTIONS */}
            {isDraft && (
              <>
                <Pressable
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: theme.brandAnchor, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleIssue}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel={isInvoice ? 'Issue official invoice' : 'Issue official estimate'}
                  accessibilityHint="Freezes document numbers and locks financial calculations"
                >
                  <FileCheck color={theme.brandAnchorText} size={18} />
                  <Text style={[styles.primaryActionText, { color: theme.brandAnchorText }]}>
                    {isInvoice ? 'Issue Official Invoice' : 'Issue Official Estimate'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/document/edit',
                      params: { type: doc.doc_type, id: doc.id },
                    })
                  }
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Edit draft"
                >
                  <Edit2 color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Edit Draft</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleDuplicate}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Duplicate draft"
                >
                  <Copy color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Duplicate Draft</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.dangerActionBtn,
                    { borderColor: theme.statusDanger, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleDeleteDraft}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Delete draft"
                >
                  <Trash2 color={theme.statusDanger} size={16} />
                  <Text style={[styles.dangerActionText, { color: theme.statusDanger }]}>Delete Draft</Text>
                </Pressable>
              </>
            )}

            {/* 2. ESTIMATE ACTIONS */}
            {isEstimate && isIssued && (
              <>
                <Pressable
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: theme.statusSuccess, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={() => setShowSignatureModal(true)}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Sign and accept estimate"
                  accessibilityHint="Opens on-device signature capture pad"
                >
                  <PenTool color="#FFFFFF" size={18} />
                  <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>Sign & Accept Estimate</Text>
                </Pressable>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={[
                      styles.flexButton,
                      { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                    ]}
                    onPress={handleAcceptEstimate}
                    disabled={isOperating}
                    accessibilityRole="button"
                    accessibilityLabel="Accept estimate directly"
                  >
                    <CheckCircle2 color={theme.statusSuccess} size={18} />
                    <Text style={[styles.secondaryActionText, { color: theme.statusSuccess }]}>Accept Directly</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.flexButton,
                      { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                    ]}
                    onPress={handleRejectEstimate}
                    disabled={isOperating}
                    accessibilityRole="button"
                    accessibilityLabel="Reject estimate"
                  >
                    <XCircle color={theme.statusDanger} size={18} />
                    <Text style={[styles.secondaryActionText, { color: theme.statusDanger }]}>Reject</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: theme.brandAnchor, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleConvertToInvoice}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Convert estimate to invoice"
                  accessibilityHint="Creates an invoice draft pre-filled with this estimate's customer and items"
                >
                  <ArrowRightLeft color={theme.brandAnchorText} size={18} />
                  <Text style={[styles.primaryActionText, { color: theme.brandAnchorText }]}>Convert to Invoice</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleSharePdf}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Share estimate PDF"
                >
                  <Share2 color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Share Estimate PDF</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleDuplicate}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Duplicate estimate"
                >
                  <Copy color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Duplicate Estimate</Text>
                </Pressable>
              </>
            )}

            {isEstimate && isAccepted && (
              <>
                <Pressable
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: theme.brandAnchor, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleConvertToInvoice}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Convert accepted estimate to invoice"
                >
                  <ArrowRightLeft color={theme.brandAnchorText} size={18} />
                  <Text style={[styles.primaryActionText, { color: theme.brandAnchorText }]}>Convert to Invoice</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleSharePdf}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Share estimate PDF"
                >
                  <Share2 color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Share Estimate PDF</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleDuplicate}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Duplicate estimate"
                >
                  <Copy color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Duplicate Estimate</Text>
                </Pressable>
              </>
            )}

            {/* 3. INVOICE ACTIONS */}
            {isInvoice && isIssued && (
              <>
                {doc.balance_minor > 0 && (
                  <Pressable
                    style={[
                      styles.primaryActionBtn,
                      { backgroundColor: theme.brandAnchor, opacity: isOperating ? 0.6 : 1 },
                    ]}
                    onPress={() => setShowPaymentModal(true)}
                    disabled={isOperating}
                    accessibilityRole="button"
                    accessibilityLabel="Record payment"
                    accessibilityHint="Opens sheet to record partial or full payment and issue a receipt"
                  >
                    <CreditCard color={theme.brandAnchorText} size={18} />
                    <Text style={[styles.primaryActionText, { color: theme.brandAnchorText }]}>Record Payment</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleSharePdf}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Share invoice PDF"
                >
                  <Share2 color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Share Invoice PDF</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleDuplicate}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Duplicate invoice"
                >
                  <Copy color={theme.textPrimary} size={18} />
                  <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Duplicate Invoice</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.dangerActionBtn,
                    { borderColor: theme.borderSubtle, opacity: isOperating ? 0.6 : 1 },
                  ]}
                  onPress={handleVoid}
                  disabled={isOperating}
                  accessibilityRole="button"
                  accessibilityLabel="Void invoice"
                  accessibilityHint="Voids the invoice permanently while keeping compliant audit trail"
                >
                  <AlertTriangle color={theme.textMuted} size={16} />
                  <Text style={[styles.dangerActionText, { color: theme.textSecondary }]}>Void Invoice</Text>
                </Pressable>
              </>
            )}

            {/* 4. VOID / REJECTED ACTIONS */}
            {(isVoid || isRejected) && (
              <Pressable
                style={[
                  styles.secondaryActionBtn,
                  { borderColor: theme.borderSubtle, backgroundColor: theme.surface, opacity: isOperating ? 0.6 : 1 },
                ]}
                onPress={handleDuplicate}
                disabled={isOperating}
                accessibilityRole="button"
                accessibilityLabel="Duplicate to new draft"
              >
                <Copy color={theme.textPrimary} size={18} />
                <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Clone to New Draft</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Payment Record Modal */}
      {isInvoice && (
        <PaymentRecordModal
          visible={showPaymentModal}
          invoiceId={doc.id}
          invoiceNumber={doc.document_number}
          currency={doc.currency}
          totalMinor={doc.total_minor}
          balanceMinor={doc.balance_minor}
          initialMethod={paymentInitialMethod}
          initialProvider={paymentInitialProvider}
          onPaymentRecorded={async () => {
            await loadData();
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentInitialMethod(undefined);
            setPaymentInitialProvider(undefined);
          }}
        />
      )}

      {/* Signature Modal for Estimate Acceptance */}
      {isEstimate && (
        <SignatureModal
          visible={showSignatureModal}
          estimateNumber={doc.document_number}
          customerName={doc.customer_name || ''}
          onConfirm={handleSignAndAcceptEstimate}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {/* Customer Statement Modal */}
      {doc.customer_id && (
        <CustomerStatementModal
          visible={showStatementModal}
          customerId={doc.customer_id}
          customerName={doc.customer_name || ''}
          onClose={() => setShowStatementModal(false)}
        />
      )}

      {/* Tax Authority Explanation Modal */}
      {doc && (
        <TaxExplanationModal
          visible={showTaxModal}
          onClose={() => setShowTaxModal(false)}
          explanation={taxExplanation}
          currency={doc.currency}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  editButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  topBarType: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  // Unified document sheet replacing disconnected card stacks
  documentSheet: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  sectionBlock: {
    padding: spacing.lg,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountDisplay: {
    marginBottom: spacing.md,
  },
  amountLabel: {
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  amountSub: {
    fontSize: typography.caption.fontSize,
    marginTop: 4,
  },
  datesRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  customerBlock: {
    gap: 3,
  },
  customerName: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  customerBusiness: {
    fontSize: typography.supporting.fontSize,
    marginTop: 1,
  },
  customerDetail: {
    fontSize: typography.caption.fontSize,
  },
  customerAddress: {
    fontSize: typography.caption.fontSize,
    marginTop: 4,
  },
  noCustomerText: {
    fontSize: typography.caption.fontSize,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  itemLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  itemDesc: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  itemNotes: {
    fontSize: typography.caption.fontSize,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemSub: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  breakdownSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: typography.supporting.fontSize,
  },
  breakdownValue: {
    fontSize: typography.supporting.fontSize,
    fontVariant: ['tabular-nums'],
  },
  grandDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  grandLabel: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
  },
  grandValue: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  emptyPaymentsText: {
    fontSize: typography.caption.fontSize,
    paddingVertical: spacing.sm,
    fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  paymentLeft: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethod: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: typography.caption.fontSize,
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    minHeight: 28,
  },
  receiptLinkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  notesText: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  privateNoteBox: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  privateNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryActionText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryActionText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  dangerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dangerActionText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
