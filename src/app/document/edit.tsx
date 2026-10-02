/**
 * DOCUMENT EDITOR SCREEN (Alpha 0.3)
 * Mobile-native flattened layout with progressive disclosure.
 * No SaaS card-stack aesthetic, no premature validation screaming,
 * autosave without redundant Save button, compact customer row,
 * double-tap idempotency guard, and Android BackHandler resilience.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar,
  FileCheck,
  AlertCircle,
  Eye,
  X,
  Shield,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { CustomerRepository, CustomerRecord } from '../../data/repositories/CustomerRepository';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { calculateDocument } from '../../domain/documents/DocumentCalculator';
import {
  DiscountType,
  DocumentType,
  LineItemInput,
  PaymentTermsPreset,
} from '../../domain/documents/types';
import { TaxType } from '../../domain/tax/TaxEngine';
import {
  createMoney,
  formatMoney,
  moneyToDecimalString,
  parseDecimalStringToMoney,
} from '../../domain/money/Money';
import { CustomerPickerModal } from '../../features/customers/CustomerPickerModal';
import { ItemEditorModal, quantityScaledToString } from '../../features/items/ItemEditorModal';

const PAYMENT_TERMS_PRESETS: { id: PaymentTermsPreset; label: string }[] = [
  { id: 'due_on_receipt', label: 'Due on Receipt' },
  { id: 'net_7', label: 'Net 7' },
  { id: 'net_15', label: 'Net 15' },
  { id: 'net_30', label: 'Net 30' },
  { id: 'net_45', label: 'Net 45' },
  { id: 'net_60', label: 'Net 60' },
  { id: 'custom', label: 'Custom' },
];

export default function DocumentEditScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ type?: string; id?: string; customerId?: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const docType: DocumentType = searchParams.type === 'estimate' ? 'estimate' : 'invoice';
  const existingId = searchParams.id;

  // Form State
  const [docId, setDocId] = useState<string>(existingId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [businessProfileId, setBusinessProfileId] = useState<string>('default_business_profile');
  const [currency, setCurrency] = useState<string>('USD');
  const [documentLocale, setDocumentLocale] = useState<string>('en-US');
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [issueDate, setIssueDate] = useState<number>(Date.now());
  const [dueDate, setDueDate] = useState<number | null>(Date.now() + 30 * 86400000);
  const [items, setItems] = useState<LineItemInput[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValueStr, setDiscountValueStr] = useState<string>('');
  const [taxType, setTaxType] = useState<TaxType>('none');
  const [taxRateStr, setTaxRateStr] = useState<string>('0');
  const [taxLabel, setTaxLabel] = useState<string>('Tax');
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>('');

  // Enhanced metadata & controls
  const [poNumber, setPoNumber] = useState<string>('');
  const [paymentTermsPreset, setPaymentTermsPreset] = useState<PaymentTermsPreset>('net_30');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [depositStr, setDepositStr] = useState<string>('');

  // Progressive Disclosure Sections
  const [isTaxDiscountExpanded, setIsTaxDiscountExpanded] = useState(false);
  const [isNotesTermsExpanded, setIsNotesTermsExpanded] = useState(false);
  const [isMoreOptionsExpanded, setIsMoreOptionsExpanded] = useState(false);

  // Validation State (No premature validation — only active after an issuance attempt)
  const [hasAttemptedIssue, setHasAttemptedIssue] = useState(false);

  // Modals & UI status
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: LineItemInput | null; index: number } | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  // Idempotency & Lifecycle Refs
  const isSubmittingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadInitial() {
      if (existingId) {
        const existing = await DocumentRepository.getById(existingId);
        if (existing) {
          setDocId(existing.id);
          setBusinessProfileId(existing.business_profile_id);
          setCurrency(existing.currency);
          setIssueDate(existing.issue_date);
          setDueDate(existing.due_date);
          setDiscountType(existing.discount_type);
          if (existing.discount_type === 'percentage') {
            setDiscountValueStr((existing.discount_value / 100).toString());
          } else if (existing.discount_type === 'fixed') {
            setDiscountValueStr(moneyToDecimalString(createMoney(BigInt(existing.discount_value), existing.currency)));
          }
          setTaxType(existing.tax_type);
          setTaxRateStr((existing.tax_rate_bp / 100).toString());
          setTaxLabel(existing.tax_label);
          setNotes(existing.notes || '');
          setTerms(existing.terms || '');

          setPoNumber(existing.po_number || '');
          setPaymentTermsPreset((existing.payment_terms_preset as PaymentTermsPreset) || 'net_30');
          setShippingAddress(existing.shipping_address || '');
          setPaymentInstructions(existing.payment_instructions || '');
          setInternalNotes(existing.internal_notes || '');
          if (existing.deposit_minor && existing.deposit_minor > 0) {
            setDepositStr(moneyToDecimalString(createMoney(BigInt(existing.deposit_minor), existing.currency)));
          }

          if (existing.tax_type !== 'none' || existing.discount_type !== 'none') {
            setIsTaxDiscountExpanded(true);
          }
          if (existing.notes || existing.terms) {
            setIsNotesTermsExpanded(true);
          }
          if (existing.po_number || existing.shipping_address || existing.payment_instructions || existing.internal_notes) {
            setIsMoreOptionsExpanded(true);
          }

          if (existing.customer_id) {
            const cust = await CustomerRepository.getById(existing.customer_id);
            setCustomer(cust);
          }

          setItems(
            existing.items.map((i) => ({
              id: i.id,
              description: i.description,
              itemNotes: i.item_notes,
              quantityScaled: BigInt(i.quantity_scaled),
              unitName: i.unit_name,
              unitPriceMinor: BigInt(i.unit_price_minor),
            }))
          );
        }
      } else if (searchParams.customerId) {
        const cust = await CustomerRepository.getById(searchParams.customerId);
        if (cust) {
          setCustomer(cust);
        }
      }
      initialLoadDone.current = true;
    }
    loadInitial();
  }, [existingId, searchParams.customerId]);

  // Payment terms preset handler
  function handleSelectPaymentTerms(preset: PaymentTermsPreset) {
    setPaymentTermsPreset(preset);
    const baseDate = issueDate || Date.now();
    if (preset === 'due_on_receipt') {
      setDueDate(baseDate);
    } else if (preset === 'net_7') {
      setDueDate(baseDate + 7 * 86400000);
    } else if (preset === 'net_15') {
      setDueDate(baseDate + 15 * 86400000);
    } else if (preset === 'net_30') {
      setDueDate(baseDate + 30 * 86400000);
    } else if (preset === 'net_45') {
      setDueDate(baseDate + 45 * 86400000);
    } else if (preset === 'net_60') {
      setDueDate(baseDate + 60 * 86400000);
    }
  }

  // Pure domain calculation for live preview
  let calculatedDiscountValue = 0n;
  if (discountType === 'percentage') {
    const pct = parseFloat(discountValueStr) || 0;
    calculatedDiscountValue = BigInt(Math.round(pct * 100));
  } else if (discountType === 'fixed') {
    try {
      const money = parseDecimalStringToMoney(discountValueStr || '0', currency);
      calculatedDiscountValue = money.amountMinor;
    } catch {
      calculatedDiscountValue = 0n;
    }
  }

  const taxRateBp = BigInt(Math.round((parseFloat(taxRateStr) || 0) * 100));

  let calculatedDepositMinor = 0n;
  try {
    const depositMoney = parseDecimalStringToMoney(depositStr || '0', currency);
    calculatedDepositMinor = depositMoney.amountMinor;
  } catch {
    calculatedDepositMinor = 0n;
  }

  const calculation = calculateDocument({
    currency,
    items,
    discountType,
    discountValue: calculatedDiscountValue,
    taxType,
    taxRateBasisPoints: taxRateBp,
    taxLabel,
    depositMinor: calculatedDepositMinor,
    totalPaymentsMinor: 0n,
    dueDateTimestamp: dueDate,
    currentTimestamp: Date.now(),
    lifecycleStatus: 'draft',
  });

  // Autosave flush
  const flushAutosave = useCallback(async () => {
    if (!initialLoadDone.current) return;
    try {
      await DocumentRepository.saveDraft({
        id: docId,
        businessProfileId,
        docType,
        customerId: customer?.id || null,
        issueDate,
        dueDate: docType === 'invoice' ? dueDate : null,
        currency,
        discountType,
        discountValue: calculatedDiscountValue,
        taxType,
        taxRateBp,
        taxLabel,
        notes,
        terms,
        items,
        poNumber: poNumber.trim() || undefined,
        paymentTermsPreset: docType === 'invoice' ? paymentTermsPreset : undefined,
        shippingAddress: shippingAddress.trim() || undefined,
        paymentInstructions: paymentInstructions.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        depositMinor: calculatedDepositMinor,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  }, [
    docId,
    businessProfileId,
    docType,
    customer,
    issueDate,
    dueDate,
    currency,
    discountType,
    calculatedDiscountValue,
    taxType,
    taxRateBp,
    taxLabel,
    notes,
    terms,
    items,
    poNumber,
    paymentTermsPreset,
    shippingAddress,
    paymentInstructions,
    internalNotes,
    calculatedDepositMinor,
  ]);

  // Debounced autosave mechanism
  const triggerAutosave = useCallback(() => {
    if (!initialLoadDone.current) return;
    setSaveStatus('unsaved');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      await flushAutosave();
    }, 750);
  }, [flushAutosave]);

  useEffect(() => {
    triggerAutosave();
  }, [triggerAutosave]);

  // Hardware Back Handler integration (ensures draft is saved on exit)
  useEffect(() => {
    const onBackPress = () => {
      flushAutosave();
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [flushAutosave, router]);

  // Line item handlers
  function handleSaveItem(item: {
    id?: string;
    description: string;
    itemNotes?: string;
    quantityScaled: bigint;
    unitName?: string;
    unitPriceMinor: bigint;
  }) {
    if (editingItem && editingItem.index >= 0) {
      const updated = [...items];
      updated[editingItem.index] = {
        id: item.id || items[editingItem.index].id,
        description: item.description,
        itemNotes: item.itemNotes,
        quantityScaled: item.quantityScaled,
        unitName: item.unitName || 'item',
        unitPriceMinor: item.unitPriceMinor,
      };
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}_${prev.length}`,
          description: item.description,
          itemNotes: item.itemNotes,
          quantityScaled: item.quantityScaled,
          unitName: item.unitName || 'item',
          unitPriceMinor: item.unitPriceMinor,
        },
      ]);
    }
  }

  function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Issuance Handler with double-tap protection
  async function handleIssue() {
    setHasAttemptedIssue(true);
    setServerErrorMessage(null);

    // Contextual checks
    if (!customer) {
      return;
    }
    if (items.length === 0) {
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsIssuing(true);

    try {
      await DocumentRepository.saveDraft({
        id: docId,
        businessProfileId,
        docType,
        customerId: customer.id,
        issueDate,
        dueDate: docType === 'invoice' ? dueDate : null,
        currency,
        discountType,
        discountValue: calculatedDiscountValue,
        taxType,
        taxRateBp,
        taxLabel,
        notes,
        terms,
        items,
        poNumber: poNumber.trim() || undefined,
        paymentTermsPreset: docType === 'invoice' ? paymentTermsPreset : undefined,
        shippingAddress: shippingAddress.trim() || undefined,
        paymentInstructions: paymentInstructions.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        depositMinor: calculatedDepositMinor,
      });

      const issued = await DocumentRepository.issueDocument(docId);
      router.replace(`/document/${issued.id}`);
    } catch (err: any) {
      setServerErrorMessage(err.message || 'Failed to issue document');
      setIsIssuing(false);
      isSubmittingRef.current = false;
    }
  }

  const isCustomerMissing = hasAttemptedIssue && !customer;
  const isItemsMissing = hasAttemptedIssue && items.length === 0;

  // Tax & discount summary preview label
  let taxDiscountSummary = 'None';
  if (taxType !== 'none' && discountType !== 'none') {
    taxDiscountSummary = `${taxLabel} (${taxRateStr}%) • ${discountType === 'percentage' ? `${discountValueStr}% off` : 'Discount'}`;
  } else if (taxType !== 'none') {
    taxDiscountSummary = `${taxLabel} (${taxRateStr}%)`;
  } else if (discountType !== 'none') {
    taxDiscountSummary = discountType === 'percentage' ? `${discountValueStr}% discount` : 'Fixed discount';
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Top Header: Clean, Autosaved, No Redundant "Save" Button */}
        <View style={[styles.topBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              flushAutosave();
              router.back();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={theme.textPrimary} size={22} />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>
              {existingId
                ? docType === 'invoice'
                  ? 'Edit Invoice Draft'
                  : 'Edit Estimate Draft'
                : docType === 'invoice'
                ? 'New Invoice'
                : 'New Estimate'}
            </Text>
            <Text style={[styles.topBarStatus, { color: theme.textMuted }]}>
              {saveStatus === 'saving' ? 'Saving draft...' : 'Draft saved'}
            </Text>
          </View>
          <Pressable
            style={styles.previewTopBtn}
            onPress={() => setShowPreviewModal(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Preview document"
          >
            <Eye color={theme.brandAnchor} size={18} />
            <Text style={[styles.previewTopText, { color: theme.brandAnchor }]}>Preview</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Server / Execution Failure Banner (Only for genuine execution errors) */}
            {serverErrorMessage && (
              <View style={[styles.errorBanner, { backgroundColor: theme.surfaceSecondary, borderColor: theme.statusDanger }]}>
                <AlertCircle color={theme.statusDanger} size={18} />
                <Text style={[styles.errorBannerText, { color: theme.statusDanger }]}>{serverErrorMessage}</Text>
              </View>
            )}

            {/* 1. Customer Section (Flattened Form Field) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: isCustomerMissing ? theme.statusDanger : theme.textPrimary }]}>
                  Customer *
                </Text>
                {customer && (
                  <Pressable onPress={() => setShowCustomerPicker(true)} hitSlop={8}>
                    <Text style={[styles.linkActionText, { color: theme.brandAnchor }]}>Change</Text>
                  </Pressable>
                )}
              </View>

              {customer ? (
                <Pressable
                  style={[styles.fieldRowSelected, { borderBottomColor: theme.borderSubtle }]}
                  onPress={() => setShowCustomerPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Selected customer: ${customer.name}`}
                >
                  <View style={styles.customerSelectedInfo}>
                    <Text style={[styles.customerSelectedName, { color: theme.textPrimary }]}>{customer.name}</Text>
                    {customer.business_name ? (
                      <Text style={[styles.customerSelectedSub, { color: theme.textSecondary }]}>
                        {customer.business_name}
                      </Text>
                    ) : null}
                    {customer.email ? (
                      <Text style={[styles.customerSelectedContact, { color: theme.textMuted }]}>{customer.email}</Text>
                    ) : null}
                  </View>
                  <ChevronRight color={theme.textMuted} size={18} />
                </Pressable>
              ) : (
                <Pressable
                  style={[
                    styles.fieldRowEmpty,
                    {
                      borderColor: isCustomerMissing ? theme.statusDanger : theme.borderSubtle,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => setShowCustomerPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select customer"
                  accessibilityHint="Opens searchable customer list"
                >
                  <Text style={[styles.fieldPlaceholderText, { color: theme.textSecondary }]}>Select customer</Text>
                  <ChevronRight color={theme.textMuted} size={18} />
                </Pressable>
              )}

              {isCustomerMissing && (
                <Text style={[styles.fieldInlineError, { color: theme.statusDanger }]}>
                  Please select a customer before issuing.
                </Text>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 2. Dates Section (Compact Form Rows) */}
            <View style={styles.sectionBlock}>
              <View style={styles.datesGrid}>
                <View style={styles.dateCol}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Issue date</Text>
                  <View style={[styles.dateDisplayRow, { borderBottomColor: theme.borderSubtle }]}>
                    <Calendar color={theme.textMuted} size={16} />
                    <Text style={[styles.dateText, { color: theme.textPrimary }]}>
                      {new Date(issueDate).toLocaleDateString(documentLocale)}
                    </Text>
                  </View>
                </View>

                {docType === 'invoice' && (
                  <View style={styles.dateCol}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Due date</Text>
                    <View style={[styles.dateDisplayRow, { borderBottomColor: theme.borderSubtle }]}>
                      <Calendar color={theme.textMuted} size={16} />
                      <Text style={[styles.dateText, { color: theme.textPrimary }]}>
                        {dueDate ? new Date(dueDate).toLocaleDateString(documentLocale) : 'Due on receipt'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {docType === 'invoice' && (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Payment Terms</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termsPresetsScroll}>
                    {PAYMENT_TERMS_PRESETS.map((p) => {
                      const isSelected = paymentTermsPreset === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          style={[
                            styles.termsChip,
                            {
                              backgroundColor: isSelected ? theme.brandAnchor : theme.surfaceSecondary,
                              borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                            },
                          ]}
                          onPress={() => handleSelectPaymentTerms(p.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Set payment terms to ${p.label}`}
                        >
                          <Text
                            style={[
                              styles.termsChipText,
                              {
                                color: isSelected ? theme.surface : theme.textSecondary,
                                fontWeight: isSelected ? '600' : '400',
                              },
                            ]}
                          >
                            {p.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 3. Line Items Section (Disciplined List, No Card Box) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: isItemsMissing ? theme.statusDanger : theme.textPrimary }]}>
                  Line items ({items.length})
                </Text>
                <Pressable
                  onPress={() => {
                    setEditingItem(null);
                    setShowItemModal(true);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add line item"
                >
                  <Text style={[styles.linkActionText, { color: theme.brandAnchor }]}>+ Add item</Text>
                </Pressable>
              </View>

              {items.length === 0 ? (
                <View style={[styles.emptyItemsWrapper, isItemsMissing && { borderColor: theme.statusDanger, borderWidth: 1, borderRadius: radii.sm, padding: spacing.md }]}>
                  <Text style={[styles.emptyItemsHeading, { color: theme.textPrimary }]}>No line items yet</Text>
                  <Text style={[styles.emptyItemsSub, { color: theme.textSecondary }]}>
                    Add a product or service to this {docType}.
                  </Text>
                  {isItemsMissing && (
                    <Text style={[styles.fieldInlineError, { color: theme.statusDanger, marginTop: 4 }]}>
                      Add at least one line item before issuing this {docType}.
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {items.map((item, idx) => {
                    const itemTotal = calculateDocument({
                      currency,
                      items: [item],
                      discountType: 'none',
                      discountValue: 0n,
                      taxType: 'none',
                      taxRateBasisPoints: 0n,
                      taxLabel: '',
                      totalPaymentsMinor: 0n,
                    }).grandTotal;

                    return (
                      <Pressable
                        key={item.id || idx}
                        style={({ pressed }) => [
                          styles.itemRow,
                          idx < items.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          setEditingItem({ item, index: idx });
                          setShowItemModal(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.description}, ${formatMoney(itemTotal, documentLocale)}`}
                      >
                        <View style={styles.itemLeft}>
                          <Text style={[styles.itemDesc, { color: theme.textPrimary }]}>{item.description}</Text>
                          {item.itemNotes ? (
                            <Text style={[styles.itemNotesPreview, { color: theme.textSecondary }]} numberOfLines={1}>
                              {item.itemNotes}
                            </Text>
                          ) : null}
                          <Text style={[styles.itemSub, { color: theme.textMuted }]}>
                            {quantityScaledToString(item.quantityScaled)} {item.unitName || 'item'} ×{' '}
                            {formatMoney(createMoney(item.unitPriceMinor, currency), documentLocale)}
                          </Text>
                        </View>
                        <Text style={[styles.itemTotal, { color: theme.textPrimary }]}>
                          {formatMoney(itemTotal, documentLocale)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 4. Taxes & Discounts (Progressive Disclosure) */}
            <View style={styles.sectionBlock}>
              <Pressable
                style={styles.disclosureHeader}
                onPress={() => setIsTaxDiscountExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle taxes and discounts section"
              >
                <View style={styles.disclosureTitleCol}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Tax & discount</Text>
                  <Text style={[styles.disclosureSummary, { color: theme.textMuted }]}>{taxDiscountSummary}</Text>
                </View>
                {isTaxDiscountExpanded ? (
                  <ChevronUp color={theme.textMuted} size={20} />
                ) : (
                  <ChevronDown color={theme.textMuted} size={20} />
                )}
              </Pressable>

              {isTaxDiscountExpanded && (
                <View style={styles.expandedContent}>
                  {/* Tax Type selector */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tax Calculation</Text>
                  <View style={styles.pillRow}>
                    {(['none', 'exclusive', 'inclusive'] as TaxType[]).map((t) => (
                      <Pressable
                        key={t}
                        style={[
                          styles.pill,
                          {
                            borderColor: taxType === t ? theme.brandAnchor : theme.borderSubtle,
                            backgroundColor: taxType === t ? theme.surfaceSecondary : theme.surface,
                          },
                        ]}
                        onPress={() => setTaxType(t)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: taxType === t ? theme.textPrimary : theme.textSecondary, fontWeight: taxType === t ? '600' : '400' },
                          ]}
                        >
                          {t === 'none' ? 'No Tax' : t === 'exclusive' ? 'Exclusive (+ Tax)' : 'Inclusive (in price)'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {taxType !== 'none' && (
                    <View style={[styles.row, { marginTop: spacing.sm }]}>
                      <View style={styles.col}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tax Label</Text>
                        <TextInput
                          style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          placeholder="e.g. GST, VAT"
                          placeholderTextColor={theme.textMuted}
                          value={taxLabel}
                          onChangeText={setTaxLabel}
                        />
                      </View>
                      <View style={styles.col}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tax Rate (%)</Text>
                        <TextInput
                          style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          placeholder="e.g. 18 or 8.25"
                          placeholderTextColor={theme.textMuted}
                          value={taxRateStr}
                          onChangeText={setTaxRateStr}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  )}

                  {/* Discount selector */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>Discount</Text>
                  <View style={styles.pillRow}>
                    {(['none', 'percentage', 'fixed'] as DiscountType[]).map((d) => (
                      <Pressable
                        key={d}
                        style={[
                          styles.pill,
                          {
                            borderColor: discountType === d ? theme.brandAnchor : theme.borderSubtle,
                            backgroundColor: discountType === d ? theme.surfaceSecondary : theme.surface,
                          },
                        ]}
                        onPress={() => setDiscountType(d)}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: discountType === d ? theme.textPrimary : theme.textSecondary, fontWeight: discountType === d ? '600' : '400' },
                          ]}
                        >
                          {d === 'none' ? 'None' : d === 'percentage' ? 'Percentage (%)' : `Fixed (${currency})`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {discountType !== 'none' && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                        {discountType === 'percentage' ? 'Discount Percentage (%)' : `Discount Amount (${currency})`}
                      </Text>
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                        placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 50.00'}
                        placeholderTextColor={theme.textMuted}
                        value={discountValueStr}
                        onChangeText={setDiscountValueStr}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 5. Notes & Terms (Progressive Disclosure) */}
            <View style={styles.sectionBlock}>
              <Pressable
                style={styles.disclosureHeader}
                onPress={() => setIsNotesTermsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle notes and terms section"
              >
                <View style={styles.disclosureTitleCol}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Notes & terms</Text>
                  <Text style={[styles.disclosureSummary, { color: theme.textMuted }]}>
                    {notes || terms ? 'Configured' : 'Optional'}
                  </Text>
                </View>
                {isNotesTermsExpanded ? (
                  <ChevronUp color={theme.textMuted} size={20} />
                ) : (
                  <ChevronDown color={theme.textMuted} size={20} />
                )}
              </Pressable>

              {isNotesTermsExpanded && (
                <View style={styles.expandedContent}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes (Visible to customer)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.multiInput,
                      { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                    ]}
                    placeholder="Thank you for your business..."
                    placeholderTextColor={theme.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Terms & Conditions</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.multiInput,
                      { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
                    ]}
                    placeholder="Payment is due within 30 days..."
                    placeholderTextColor={theme.textMuted}
                    value={terms}
                    onChangeText={setTerms}
                    multiline
                  />
                </View>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 6. More Options (Progressive Disclosure) */}
            <View style={styles.sectionBlock}>
              <Pressable
                style={styles.disclosureHeader}
                onPress={() => setIsMoreOptionsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle more options section"
              >
                <View style={styles.disclosureTitleCol}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>More options</Text>
                  <Text style={[styles.disclosureSummary, { color: theme.textMuted }]}>
                    {poNumber || shippingAddress || paymentInstructions || internalNotes ? 'Configured' : 'PO #, site address, bank details, internal note'}
                  </Text>
                </View>
                {isMoreOptionsExpanded ? (
                  <ChevronUp color={theme.textMuted} size={20} />
                ) : (
                  <ChevronDown color={theme.textMuted} size={20} />
                )}
              </Pressable>

              {isMoreOptionsExpanded && (
                <View style={styles.expandedContent}>
                  {/* PO / Ref # */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PO / Reference Number</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="e.g. PO-98241 or Project Alpha"
                    placeholderTextColor={theme.textMuted}
                    value={poNumber}
                    onChangeText={setPoNumber}
                    accessibilityLabel="Purchase order or reference number"
                  />

                  {/* Shipping / Service Address */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Service / Job Site Address</Text>
                  <TextInput
                    style={[styles.input, styles.multiInput, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="Where work was completed (if different from billing address)..."
                    placeholderTextColor={theme.textMuted}
                    value={shippingAddress}
                    onChangeText={setShippingAddress}
                    multiline
                    accessibilityLabel="Job site or shipping address"
                  />

                  {/* Payment Instructions (Bank / UPI / Wire) */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.sm }]}>Payment Instructions (Bank / UPI / Wire)</Text>
                  <TextInput
                    style={[styles.input, styles.multiInput, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder="Bank: ACME Bank, A/C: 123456789, IFSC/Routing: 123, UPI: name@upi"
                    placeholderTextColor={theme.textMuted}
                    value={paymentInstructions}
                    onChangeText={setPaymentInstructions}
                    multiline
                    accessibilityLabel="Payment instructions or bank details"
                  />

                  {/* Private Internal Note */}
                  <View style={{ marginTop: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Private Internal Note</Text>
                      <View style={[styles.privateBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                        <Text style={[styles.privateBadgeText, { color: theme.textMuted }]}>PRIVATE</Text>
                      </View>
                    </View>
                    <Text style={[styles.privateExplanation, { color: theme.textMuted }]}>
                      Only visible to you. Strictly excluded from customer PDFs and shared documents.
                    </Text>
                    <TextInput
                      style={[styles.input, styles.multiInput, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                      placeholder="Internal customer notes, subcontractor costs, private margin notes..."
                      placeholderTextColor={theme.textMuted}
                      value={internalNotes}
                      onChangeText={setInternalNotes}
                      multiline
                      accessibilityLabel="Private internal note"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 7. Calculated Totals Summary Card (Only card on the screen) */}
            <View style={[styles.totalsCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.totalValue, { color: theme.textPrimary }]}>
                  {formatMoney(calculation.subtotal, documentLocale)}
                </Text>
              </View>

              {calculation.discount.amountMinor > 0n && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Discount</Text>
                  <Text style={[styles.totalValue, { color: theme.statusDanger }]}>
                    -{formatMoney(calculation.discount, documentLocale)}
                  </Text>
                </View>
              )}

              {taxType !== 'none' && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Taxable Base</Text>
                    <Text style={[styles.totalValue, { color: theme.textSecondary }]}>
                      {formatMoney(calculation.taxableBase, documentLocale)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                      {taxLabel} ({taxRateStr}%)
                    </Text>
                    <Text style={[styles.totalValue, { color: theme.textPrimary }]}>
                      {formatMoney(calculation.tax, documentLocale)}
                    </Text>
                  </View>
                </>
              )}

              <View style={[styles.grandTotalDivider, { backgroundColor: theme.borderSubtle }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Total Amount</Text>
                <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>
                  {formatMoney(calculation.grandTotal, documentLocale)}
                </Text>
              </View>

              {docType === 'invoice' && (
                <>
                  <View style={[styles.depositInputRow, { borderTopColor: theme.borderSubtle }]}>
                    <Text style={[styles.depositInputLabel, { color: theme.textSecondary }]}>
                      Deposit / Advance Received ({currency})
                    </Text>
                    <TextInput
                      style={[styles.depositInput, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                      value={depositStr}
                      onChangeText={setDepositStr}
                      keyboardType="numeric"
                      accessibilityLabel="Deposit amount received"
                    />
                  </View>

                  {calculation.deposit.amountMinor > 0n && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Deposit Applied</Text>
                      <Text style={[styles.totalValue, { color: theme.statusSuccess }]}>
                        -{formatMoney(calculation.deposit, documentLocale)}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.totalRow, { marginTop: spacing.xs }]}>
                    <Text style={[styles.balanceDueLabel, { color: theme.brandAnchor }]}>Balance Due</Text>
                    <Text style={[styles.balanceDueValue, { color: theme.brandAnchor }]}>
                      {formatMoney(calculation.balance, documentLocale)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* 8. Primary Issuance Action */}
            <Pressable
              style={[
                styles.issueButton,
                { backgroundColor: theme.brandAnchor, opacity: isIssuing ? 0.7 : 1 },
              ]}
              onPress={handleIssue}
              disabled={isIssuing}
              accessibilityRole="button"
              accessibilityLabel={docType === 'invoice' ? 'Issue official invoice' : 'Issue official estimate'}
            >
              <FileCheck color={theme.surface} size={20} />
              <Text style={[styles.issueButtonText, { color: theme.surface }]}>
                {isIssuing
                  ? 'Issuing Document...'
                  : docType === 'invoice'
                  ? 'Issue Official Invoice'
                  : 'Issue Official Estimate'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Document Preview Modal */}
        <Modal
          visible={showPreviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPreviewModal(false)}
        >
          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={[styles.topBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
              <View style={styles.topBarCenter}>
                <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>
                  {docType === 'invoice' ? 'Invoice Preview' : 'Estimate Preview'}
                </Text>
                <Text style={[styles.topBarStatus, { color: theme.textMuted }]}>
                  Draft (Not yet issued)
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPreviewModal(false)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <X color={theme.textPrimary} size={22} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.previewSheet, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                {/* Header */}
                <View style={styles.previewHeaderRow}>
                  <View>
                    <Text style={[styles.previewDocType, { color: theme.textPrimary }]}>
                      {docType.toUpperCase()}
                    </Text>
                    <View style={[styles.previewDraftTag, { borderColor: theme.statusDraft, backgroundColor: theme.surfaceSecondary }]}>
                      <Text style={[styles.previewDraftTagText, { color: theme.statusDraft }]}>DRAFT</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.previewDateLabel, { color: theme.textSecondary }]}>Issue Date</Text>
                    <Text style={[styles.previewDateValue, { color: theme.textPrimary }]}>
                      {new Date(issueDate).toLocaleDateString(documentLocale)}
                    </Text>
                    {docType === 'invoice' && dueDate && (
                      <>
                        <Text style={[styles.previewDateLabel, { color: theme.textSecondary, marginTop: 4 }]}>Due Date</Text>
                        <Text style={[styles.previewDateValue, { color: theme.textPrimary }]}>
                          {new Date(dueDate).toLocaleDateString(documentLocale)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {poNumber ? (
                  <View style={[styles.previewSectionBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                    <Text style={[styles.previewMetaLabel, { color: theme.textSecondary }]}>PO / Ref Number:</Text>
                    <Text style={[styles.previewMetaValue, { color: theme.textPrimary }]}>{poNumber}</Text>
                  </View>
                ) : null}

                {/* Customer */}
                <View style={[styles.previewSectionBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                  <Text style={[styles.previewSectionHeading, { color: theme.textSecondary }]}>Bill To:</Text>
                  {customer ? (
                    <View style={{ marginTop: 2 }}>
                      <Text style={[styles.previewCustomerName, { color: theme.textPrimary }]}>{customer.name}</Text>
                      {customer.business_name ? (
                        <Text style={[styles.previewCustomerSub, { color: theme.textSecondary }]}>{customer.business_name}</Text>
                      ) : null}
                      {customer.email ? (
                        <Text style={[styles.previewCustomerSub, { color: theme.textMuted }]}>{customer.email}</Text>
                      ) : null}
                      {customer.billing_address ? (
                        <Text style={[styles.previewCustomerSub, { color: theme.textMuted }]}>{customer.billing_address}</Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={{ color: theme.textMuted, fontStyle: 'italic', marginTop: 2 }}>No customer selected</Text>
                  )}

                  {shippingAddress ? (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text style={[styles.previewSectionHeading, { color: theme.textSecondary }]}>Job / Service Site:</Text>
                      <Text style={[styles.previewCustomerSub, { color: theme.textPrimary }]}>{shippingAddress}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Items */}
                <View style={[styles.previewSectionBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                  <Text style={[styles.previewSectionHeading, { color: theme.textSecondary, marginBottom: spacing.xs }]}>
                    Line Items ({items.length})
                  </Text>
                  {items.map((item, idx) => {
                    const itemTotal = calculateDocument({
                      currency,
                      items: [item],
                      discountType: 'none',
                      discountValue: 0n,
                      taxType: 'none',
                      taxRateBasisPoints: 0n,
                      taxLabel: '',
                      totalPaymentsMinor: 0n,
                    }).grandTotal;

                    return (
                      <View
                        key={item.id || idx}
                        style={[
                          styles.previewItemRow,
                          idx < items.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: spacing.sm }}>
                          <Text style={[styles.previewItemDesc, { color: theme.textPrimary }]}>{item.description}</Text>
                          {item.itemNotes ? (
                            <Text style={[styles.previewItemNotes, { color: theme.textSecondary }]}>{item.itemNotes}</Text>
                          ) : null}
                          <Text style={[styles.previewItemSub, { color: theme.textMuted }]}>
                            {quantityScaledToString(item.quantityScaled)} {item.unitName || 'item'} × {formatMoney(createMoney(item.unitPriceMinor, currency), documentLocale)}
                          </Text>
                        </View>
                        <Text style={[styles.previewItemTotal, { color: theme.textPrimary }]}>
                          {formatMoney(itemTotal, documentLocale)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Financial Summary */}
                <View style={[styles.previewTotalsBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotal</Text>
                    <Text style={[styles.totalValue, { color: theme.textPrimary }]}>
                      {formatMoney(calculation.subtotal, documentLocale)}
                    </Text>
                  </View>
                  {calculation.discount.amountMinor > 0n && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Discount</Text>
                      <Text style={[styles.totalValue, { color: theme.statusDanger }]}>
                        -{formatMoney(calculation.discount, documentLocale)}
                      </Text>
                    </View>
                  )}
                  {taxType !== 'none' && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{taxLabel} ({taxRateStr}%)</Text>
                      <Text style={[styles.totalValue, { color: theme.textPrimary }]}>
                        {formatMoney(calculation.tax, documentLocale)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.grandTotalDivider, { backgroundColor: theme.borderSubtle }]} />
                  <View style={styles.totalRow}>
                    <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Total Amount</Text>
                    <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>
                      {formatMoney(calculation.grandTotal, documentLocale)}
                    </Text>
                  </View>
                  {docType === 'invoice' && calculation.deposit.amountMinor > 0n && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Deposit Applied</Text>
                      <Text style={[styles.totalValue, { color: theme.statusSuccess }]}>
                        -{formatMoney(calculation.deposit, documentLocale)}
                      </Text>
                    </View>
                  )}
                  {docType === 'invoice' && (
                    <View style={[styles.totalRow, { marginTop: 4 }]}>
                      <Text style={[styles.balanceDueLabel, { color: theme.brandAnchor }]}>Balance Due</Text>
                      <Text style={[styles.balanceDueValue, { color: theme.brandAnchor }]}>
                        {formatMoney(calculation.balance, documentLocale)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payment instructions, notes, and terms */}
                {paymentInstructions ? (
                  <View style={[styles.previewSectionBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                    <Text style={[styles.previewSectionHeading, { color: theme.textSecondary }]}>Payment Instructions</Text>
                    <Text style={[styles.previewMetaValue, { color: theme.textPrimary }]}>{paymentInstructions}</Text>
                  </View>
                ) : null}

                {notes ? (
                  <View style={[styles.previewSectionBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                    <Text style={[styles.previewSectionHeading, { color: theme.textSecondary }]}>Notes</Text>
                    <Text style={[styles.previewMetaValue, { color: theme.textPrimary }]}>{notes}</Text>
                  </View>
                ) : null}

                {terms ? (
                  <View style={[styles.previewSectionBlock, { borderTopColor: theme.borderSubtle, borderTopWidth: 1 }]}>
                    <Text style={[styles.previewSectionHeading, { color: theme.textSecondary }]}>Terms & Conditions</Text>
                    <Text style={[styles.previewMetaValue, { color: theme.textPrimary }]}>{terms}</Text>
                  </View>
                ) : null}

                {/* Internal note callout if present */}
                {internalNotes ? (
                  <View style={[styles.previewPrivateBox, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Shield size={14} color={theme.textMuted} />
                      <Text style={[styles.previewPrivateTitle, { color: theme.textSecondary }]}>
                        Private Internal Note (Not visible on customer PDF)
                      </Text>
                    </View>
                    <Text style={[styles.previewPrivateText, { color: theme.textPrimary }]}>{internalNotes}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                style={[styles.closePreviewBtn, { backgroundColor: theme.brandAnchor }]}
                onPress={() => setShowPreviewModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <Text style={[styles.closePreviewBtnText, { color: theme.surface }]}>Close Preview</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Customer Picker Modal */}
        <CustomerPickerModal
          visible={showCustomerPicker}
          selectedCustomerId={customer?.id}
          onSelectCustomer={(c) => {
            setCustomer(c);
            setShowCustomerPicker(false);
          }}
          onClose={() => setShowCustomerPicker(false)}
        />

        {/* Item Editor Modal */}
        <ItemEditorModal
          visible={showItemModal}
          item={editingItem?.item}
          currency={currency}
          documentLocale={documentLocale}
          onSave={handleSaveItem}
          onDelete={editingItem?.item?.id ? handleDeleteItem : undefined}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  topBarStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  topBarRight: {
    width: 44,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    flex: 1,
  },
  sectionBlock: {
    paddingVertical: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  linkActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldRowEmpty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  fieldPlaceholderText: {
    fontSize: 14,
  },
  fieldRowSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  customerSelectedInfo: {
    flex: 1,
    gap: 2,
  },
  customerSelectedName: {
    fontSize: 15,
    fontWeight: '600',
  },
  customerSelectedSub: {
    fontSize: 13,
  },
  customerSelectedContact: {
    fontSize: 12,
  },
  fieldInlineError: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionDivider: {
    height: 1,
    width: '100%',
  },
  datesGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  dateCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 40,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyItemsWrapper: {
    paddingVertical: spacing.sm,
  },
  emptyItemsHeading: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyItemsSub: {
    fontSize: 13,
    marginTop: 2,
  },
  itemsList: {
    marginTop: spacing.xs,
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
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  disclosureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  disclosureTitleCol: {
    gap: 2,
  },
  disclosureSummary: {
    fontSize: 12,
  },
  expandedContent: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    height: 38,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  input: {
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  multiInput: {
    height: 60,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  totalsCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
  },
  totalValue: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  grandTotalDivider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  issueButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  previewTopText: {
    fontSize: 13,
    fontWeight: '600',
  },
  termsPresetsScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  termsChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsChipText: {
    fontSize: 12,
  },
  itemNotesPreview: {
    fontSize: 11,
    marginTop: 1,
  },
  depositInputRow: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  depositInputLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  depositInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    fontSize: 13,
  },
  balanceDueLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  balanceDueValue: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  privateBadge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  privateExplanation: {
    fontSize: 11,
    marginBottom: 4,
    marginTop: 1,
  },
  previewSheet: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.md,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewDocType: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewDraftTag: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  previewDraftTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewDateLabel: {
    fontSize: 11,
  },
  previewDateValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  previewSectionBlock: {
    paddingTop: spacing.sm,
  },
  previewMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  previewMetaValue: {
    fontSize: 13,
    marginTop: 2,
  },
  previewSectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCustomerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewCustomerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  previewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  previewItemDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewItemNotes: {
    fontSize: 11,
    marginTop: 1,
  },
  previewItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  previewItemTotal: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  previewTotalsBlock: {
    paddingTop: spacing.sm,
    gap: 4,
  },
  previewPrivateBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  previewPrivateTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewPrivateText: {
    fontSize: 12,
  },
  closePreviewBtn: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    height: 48,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  closePreviewBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
