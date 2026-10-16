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
  Alert,
  Image,
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
  Info,
  Package,
  CheckCircle2,
  Trash2,
  Users,
  Save,
  Share2,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { CustomerRepository, CustomerRecord } from '../../data/repositories/CustomerRepository';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
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
import {
  ItemEditorModal,
  quantityScaledToString,
  parseQuantityStringToScaled,
} from '../../features/items/ItemEditorModal';
import { TaxExplainabilityEngine } from '../../domain/tax/TaxExplainability';
import { TaxExplanationModal } from '../../features/tax/TaxExplanationModal';
import { showAlert } from '../../utils/alert';
import { BusinessProfile } from '../../domain/profile/types';
import { LogoUploader } from '../../components/common/LogoUploader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { PdfService } from '../../services/pdf/PdfService';
import { PdfTemplateType } from '../../services/pdf/types';
import { DocumentReadinessValidator } from '../../domain/documents/universal/DocumentReadinessValidator';
import { TemplateQualityScoreEngine } from '../../domain/documents/universal/TemplateQualityScore';
import { GST_LAYOUT_DEFINITIONS } from '../../services/pdf/templates/gst';
import { COUNTRIES } from '../../data/geography/countries';
import { DocumentTypeRegistry } from '../../domain/documents/DocumentTypeRegistry';
import { DOCUMENT_TYPE_CONFIGS } from './templates';

const COMMON_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar' },
];

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
  const searchParams = useLocalSearchParams<{ type?: string; id?: string; customerId?: string; templateId?: string }>();
  const { theme } = useTheme();

  // Dynamic Document Type & Provenance Resolution
  const requestedTypeRaw = (searchParams.type || 'invoice').toLowerCase().replace(/-/g, '_');
  const initialDocDef = DocumentTypeRegistry.get(requestedTypeRaw);
  const initialDocType = (initialDocDef?.defaultDocType || (requestedTypeRaw in DOCUMENT_TYPE_CONFIGS ? requestedTypeRaw : 'invoice')) as DocumentType;

  const [docType, setDocType] = useState<DocumentType>(initialDocType);
  const existingId = searchParams.id;

  const docDef = DocumentTypeRegistry.get(docType) || initialDocDef;
  const activeConfig = React.useMemo(() => {
    return (
      DOCUMENT_TYPE_CONFIGS[docType] ||
      (docDef?.id && DOCUMENT_TYPE_CONFIGS[docDef.id]) ||
      DOCUMENT_TYPE_CONFIGS[requestedTypeRaw] ||
      DOCUMENT_TYPE_CONFIGS.invoice
    );
  }, [docType, docDef, requestedTypeRaw]);

  const docTitle = docDef?.name || activeConfig?.title || 'Document';
  const docShortTitle = activeConfig?.shortName || docDef?.name || 'Document';
  const provenanceRule = docDef?.provenanceRule || 'Statutory Verified';
  const defaultPrefix = docDef?.defaultPrefix || (docType === 'invoice' ? 'INV-' : docType === 'estimate' ? 'EST-' : 'DOC-');

  // Party Role & Classification
  const isPurchasing = docDef?.category === 'orders_purchasing' || docType === 'purchase_order' || docType === 'goods_received_note';
  const isLogistics = docDef?.category === 'inventory_logistics' || docType === 'delivery_challan' || docType === 'packing_list';
  const isHR = docDef?.category === 'hr_payroll' || docType === 'salary_slip' || docType === 'job_offer_letter' || (docType as string) === 'job_offer';
  const isInstitutional = docDef?.category === 'institutional_legal' || docType === 'student_fee_receipt' || docType === 'rent_receipt';

  const partySectionTitle = isPurchasing
    ? 'Vendor / Supplier Details *'
    : isLogistics
    ? 'Consignee / Destination Details *'
    : isHR
    ? 'Employee / Candidate Details *'
    : docType === 'rent_receipt'
    ? 'Tenant / Occupant Details *'
    : docType === 'student_fee_receipt'
    ? 'Student / Guardian Details *'
    : 'Client / Customer Details *';

  const partyNameLabel = isPurchasing
    ? 'Vendor / Supplier Name *'
    : isLogistics
    ? 'Consignee / Destination Name *'
    : isHR
    ? 'Employee / Candidate Name *'
    : docType === 'rent_receipt'
    ? 'Tenant Name *'
    : docType === 'student_fee_receipt'
    ? 'Student Name *'
    : 'Client / Business Name *';

  const partyPlaceholder = isPurchasing
    ? 'e.g. Acme Supplies Corp or Vendor Legal Name'
    : isLogistics
    ? 'e.g. Central Logistics Hub or Destination Depo'
    : isHR
    ? 'e.g. John Doe (EMP-0142)'
    : docType === 'rent_receipt'
    ? 'e.g. Resident Name / Tenant'
    : docType === 'student_fee_receipt'
    ? 'e.g. Student Name / Roll No.'
    : 'e.g. Acme Corp or John Smith';

  const partyAddressLabel = isPurchasing
    ? 'Vendor Registered Address (Optional)'
    : isLogistics
    ? 'Destination / Delivery Address (Optional)'
    : isHR
    ? 'Residential Address (Optional)'
    : 'Billing Address (Optional)';

  const savedPartyBtnLabel = isPurchasing
    ? 'Saved Vendors'
    : isLogistics
    ? 'Saved Locations'
    : isHR
    ? 'Saved Personnel'
    : 'Saved Clients';

  const isEstimateOrQuote = docType === 'estimate' || docType === 'quotation' || docDef?.category === 'quotations_proposals';
  const hasDueDate = !isHR && docType !== 'receipt' && docType !== 'payment_voucher';
  const dueDateLabel = isPurchasing || isLogistics
    ? 'Expected Delivery Date *'
    : isEstimateOrQuote
    ? 'Valid Until *'
    : docType === 'work_order'
    ? 'Target Completion Date *'
    : 'Due Date *';

  const showPaymentTerms = docType === 'invoice' || docType === 'tax_invoice' || docType === 'commercial_invoice' || docType === 'service_invoice' || docType === 'progress_invoice';
  const isInvoiceFamily = docType === 'invoice' || docType === 'tax_invoice' || docType === 'commercial_invoice' || docType === 'service_invoice' || docType === 'bill_of_supply' || docType === 'debit_note';

  // Form State
  const [docId, setDocId] = useState<string>(existingId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [docNumber, setDocNumber] = useState<string>(`${defaultPrefix}${new Date().getFullYear()}-001`);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
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

  // Inline Client inputs (allows typing client name directly without opening modals)
  const [inlineCustomerName, setInlineCustomerName] = useState<string>('');
  const [inlineCustomerEmail, setInlineCustomerEmail] = useState<string>('');
  const [inlineCustomerPhone, setInlineCustomerPhone] = useState<string>('');
  const [inlineCustomerAddress, setInlineCustomerAddress] = useState<string>('');
  const [inlineCustomerTaxId, setInlineCustomerTaxId] = useState<string>('');
  const [isCustomerDetailsExpanded, setIsCustomerDetailsExpanded] = useState<boolean>(false);

  // Inline Quick Line Item adder (allows entering items directly on screen)
  const [quickItemDesc, setQuickItemDesc] = useState<string>('');
  const [quickItemQty, setQuickItemQty] = useState<string>('1');
  const [quickItemUnit, setQuickItemUnit] = useState<string>('item');
  const [quickItemPrice, setQuickItemPrice] = useState<string>('');
  const [quickItemError, setQuickItemError] = useState<string | null>(null);

  // Progressive Disclosure Sections
  const [isTaxDiscountExpanded, setIsTaxDiscountExpanded] = useState(false);
  const [isNotesTermsExpanded, setIsNotesTermsExpanded] = useState(false);
  const [isMoreOptionsExpanded, setIsMoreOptionsExpanded] = useState(false);

  // Validation State (No premature validation — only active after an issuance attempt)
  const [hasAttemptedIssue, setHasAttemptedIssue] = useState(false);

  // Modals & UI status
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [quickAddCustomerMode, setQuickAddCustomerMode] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: LineItemInput | null; index: number } | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const availableTemplates = React.useMemo(() => {
    if (activeConfig?.templates && activeConfig.templates.length > 0) {
      return activeConfig.templates;
    }
    return GST_LAYOUT_DEFINITIONS.map((l) => ({
      id: l.code,
      code: l.referenceId,
      name: l.name,
      tagline: l.keyFeatures,
      category: 'executive' as const,
      categoryLabel: 'Layout',
      similarTemplateIds: [],
    }));
  }, [activeConfig]);

  const initialTemplateId = (searchParams.templateId as string) || activeConfig?.defaultTemplateId || availableTemplates[0]?.id || 'gst_executive';
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);

  useEffect(() => {
    if (searchParams.templateId) {
      const match = availableTemplates.find((t) => t.id === searchParams.templateId);
      if (match) {
        setSelectedTemplateId(match.id);
        return;
      }
    }
    if (!availableTemplates.some((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(activeConfig?.defaultTemplateId || availableTemplates[0]?.id || 'gst_executive');
    }
  }, [availableTemplates, activeConfig, searchParams.templateId]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showReadinessChecklist, setShowReadinessChecklist] = useState(false);
  const [showQualityRubric, setShowQualityRubric] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Idempotency & Lifecycle Refs
  const isSubmittingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadInitial() {
      const activeProf = await BusinessProfileRepository.getActiveProfile();
      if (activeProf) {
        setBusinessProfile(activeProf);
      }

      if (existingId) {
        const existing = await DocumentRepository.getById(existingId);
        if (existing) {
          setDocId(existing.id);
          if (existing.doc_type) setDocType(existing.doc_type);
          if (existing.document_number) setDocNumber(existing.document_number);
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
            if (cust) {
              setInlineCustomerName(cust.name);
              setInlineCustomerEmail(cust.email || '');
              setInlineCustomerPhone(cust.phone || '');
              setInlineCustomerAddress(cust.billing_address || '');
              setInlineCustomerTaxId(cust.tax_id || '');
            }
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
      } else {
        // NEW DOCUMENT: Fetch active business profile to propagate default currency, locale, terms & tax labels
        const profile = await BusinessProfileRepository.getActiveProfile();
        if (profile) {
          setBusinessProfileId(profile.id);
          if (profile.default_currency) {
            setCurrency(profile.default_currency);
          }
          if (profile.default_document_locale) {
            setDocumentLocale(profile.default_document_locale);
          } else if (profile.country_iso2 === 'IN') {
            setDocumentLocale('en-IN');
          }
          if (profile.default_payment_terms) {
            const preset = profile.default_payment_terms as PaymentTermsPreset;
            setPaymentTermsPreset(preset);
            const baseDate = issueDate || Date.now();
            if (preset === 'due_on_receipt') setDueDate(baseDate);
            else if (preset === 'net_7') setDueDate(baseDate + 7 * 86400000);
            else if (preset === 'net_15') setDueDate(baseDate + 15 * 86400000);
            else if (preset === 'net_30') setDueDate(baseDate + 30 * 86400000);
            else if (preset === 'net_45') setDueDate(baseDate + 45 * 86400000);
            else if (preset === 'net_60') setDueDate(baseDate + 60 * 86400000);
          }
          if (profile.default_notes) {
            setNotes(profile.default_notes);
            setIsNotesTermsExpanded(true);
          }
          if (profile.country_iso2) {
            const countryMeta = COUNTRIES.find((c) => c.iso2.toUpperCase() === profile.country_iso2?.toUpperCase());
            if (countryMeta?.taxSystemName) {
              setTaxLabel(countryMeta.taxSystemName);
            } else if (profile.country_iso2 === 'IN') {
              setTaxLabel('GST');
            } else if (profile.country_iso2 === 'GB') {
              setTaxLabel('VAT');
            } else if (profile.country_iso2 === 'US') {
              setTaxLabel('Sales Tax');
            }
          }
        }
        if (searchParams.customerId) {
          const cust = await CustomerRepository.getById(searchParams.customerId);
          if (cust) {
            setCustomer(cust);
            setInlineCustomerName(cust.name);
            setInlineCustomerEmail(cust.email || '');
            setInlineCustomerPhone(cust.phone || '');
            setInlineCustomerAddress(cust.billing_address || '');
            setInlineCustomerTaxId(cust.tax_id || '');
          }
        }
      }
      initialLoadDone.current = true;
    }
    loadInitial();
  }, [existingId, searchParams.customerId, issueDate]);

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

  const taxExplanation = React.useMemo(() => {
    return TaxExplainabilityEngine.explainFromDocument({
      currency,
      place_of_supply: customer?.country || 'Standard Location',
      supply_type: 'intra_state',
      tax_label: taxLabel,
      tax_rate_bp: Number(taxRateBp),
      tax_minor: Number(calculation.tax.amountMinor),
    });
  }, [currency, customer, taxLabel, taxRateBp, calculation.tax.amountMinor]);

  const fullDocForPreview = React.useMemo(() => {
    const subtotalMinor = Number(calculation.subtotal.amountMinor);
    const discountMinor = Number(calculation.discount.amountMinor);
    const taxMinor = Number(calculation.tax.amountMinor);
    const totalMinor = Number(calculation.grandTotal.amountMinor);

    const doc: any = {
      id: docId,
      business_profile_id: businessProfileId,
      job_id: null,
      doc_type: docType,
      sequence_number: 1,
      document_number: docNumber || 'INV-2026-001',
      customer_id: customer?.id || null,
      lifecycle_status: 'draft',
      issue_date: issueDate,
      due_date: hasDueDate ? dueDate : null,
      currency,
      subtotal_minor: subtotalMinor,
      discount_minor: discountMinor,
      discount_type: discountType,
      discount_value: calculatedDiscountValue,
      tax_minor: taxMinor,
      tax_type: taxType,
      tax_rate_bp: Number(taxRateBp),
      tax_label: taxLabel,
      total_minor: totalMinor,
      deposit_minor: Number(calculatedDepositMinor),
      po_number: poNumber || null,
      payment_terms_preset: showPaymentTerms ? paymentTermsPreset : undefined,
      shipping_address: shippingAddress || null,
      payment_instructions: paymentInstructions || null,
      notes: notes || null,
      terms: terms || null,
      internal_notes: internalNotes || null,
      signature_uri: null,
      signature_date: null,
      place_of_supply: customer?.country === 'India' ? (businessProfile?.state || 'Maharashtra') : (businessProfile?.state || 'Maharashtra'),
      supply_type: 'services',
      reverse_charge: false,
      parent_document_id: null,
      is_archived: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      customer_name: customer?.name || inlineCustomerName || 'Acme Enterprises',
      customer_business_name: customer?.business_name || null,
      customer_email: customer?.email || inlineCustomerEmail || null,
      customer_phone: customer?.phone || inlineCustomerPhone || null,
      customer_billing_address: customer?.billing_address || inlineCustomerAddress || null,
      customer_tax_id: customer?.tax_id || inlineCustomerTaxId || null,
      items: items.map((it, idx) => ({
        id: it.id || `item_${idx}`,
        document_id: docId,
        catalog_item_id: it.catalogItemId || null,
        description: it.description,
        item_notes: it.itemNotes || null,
        quantity_scaled: Number(it.quantityScaled),
        unit_name: it.unitName || 'item',
        unit_price_minor: Number(it.unitPriceMinor),
        line_total_minor: Number(it.unitPriceMinor * (it.quantityScaled / 10000n)),
        sort_order: idx,
        hsn_sac_code: (it as any).hsn_sac_code || (it as any).hsn || (it as any).sac || '998314',
      })),
      total_paid_minor: 0,
      balance_minor: totalMinor,
      payments: [],
    };
    return doc;
  }, [
    docId, businessProfileId, docType, docNumber, customer, issueDate, dueDate, currency,
    calculation, discountType, calculatedDiscountValue, taxType, taxRateBp, taxLabel,
    calculatedDepositMinor, poNumber, paymentTermsPreset, shippingAddress, paymentInstructions,
    notes, terms, internalNotes, businessProfile, inlineCustomerName, inlineCustomerEmail,
    inlineCustomerPhone, inlineCustomerAddress, inlineCustomerTaxId, items
  ]);

  const readinessResult = React.useMemo(() => {
    if (!businessProfile) return null;
    return DocumentReadinessValidator.validateTaxInvoice(fullDocForPreview, businessProfile);
  }, [fullDocForPreview, businessProfile]);

  const qualityResult = React.useMemo(() => {
    return TemplateQualityScoreEngine.evaluate(selectedTemplateId as any);
  }, [selectedTemplateId]);

  const handleExportPdf = useCallback(async () => {
    if (!businessProfile) {
      Alert.alert('Organization Required', 'Please configure your organization profile before exporting.');
      return;
    }
    try {
      setIsExportingPdf(true);
      await PdfService.shareDocumentPdfAsync(fullDocForPreview, businessProfile, selectedTemplateId as any);
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Could not export document PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  }, [fullDocForPreview, businessProfile, selectedTemplateId]);

  // Autosave flush
  const flushAutosave = useCallback(async () => {
    if (!initialLoadDone.current || isSubmittingRef.current) return;
    try {
      await DocumentRepository.saveDraft({
        id: docId,
        businessProfileId,
        docType,
        customerId: customer?.id || null,
        issueDate,
        dueDate: hasDueDate ? dueDate : null,
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
        paymentTermsPreset: showPaymentTerms ? paymentTermsPreset : undefined,
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

  // Quick add line item directly from on-screen inputs
  function handleAddQuickLineItem() {
    setQuickItemError(null);
    if (!quickItemDesc.trim()) {
      setQuickItemError('Please enter an item or service description.');
      return;
    }
    let qtyScaled = 10000n;
    try {
      qtyScaled = parseQuantityStringToScaled(quickItemQty.trim() || '1');
      if (qtyScaled <= 0n) {
        setQuickItemError('Quantity must be greater than zero.');
        return;
      }
    } catch {
      setQuickItemError('Please enter a valid numeric quantity.');
      return;
    }

    let priceMinor = 0n;
    try {
      const priceMoney = parseDecimalStringToMoney(quickItemPrice.trim() || '0', currency);
      if (priceMoney.amountMinor < 0n) {
        setQuickItemError('Unit price cannot be negative.');
        return;
      }
      priceMinor = priceMoney.amountMinor;
    } catch {
      setQuickItemError('Please enter a valid numeric price.');
      return;
    }

    const newItem: LineItemInput = {
      id: `item_${Date.now()}_${items.length}`,
      description: quickItemDesc.trim(),
      quantityScaled: qtyScaled,
      unitName: quickItemUnit.trim() || 'item',
      unitPriceMinor: priceMinor,
    };

    setItems((prev) => [...prev, newItem]);
    setQuickItemDesc('');
    setQuickItemQty('1');
    setQuickItemPrice('');
    setQuickItemError(null);
    setServerErrorMessage(null);
  }

  // Issuance Handler with double-tap protection and inline auto-resolution
  async function handleIssue() {
    setHasAttemptedIssue(true);
    setServerErrorMessage(null);

    // 1. Resolve client (selected customer, inline typed name, or graceful default)
    let activeCustomer = customer;
    let effectiveName = (customer?.name || inlineCustomerName).trim();

    if (!effectiveName) {
      effectiveName = 'Walk-in Customer';
      setInlineCustomerName('Walk-in Customer');
    }

    // Auto-create customer record if typed inline or defaulted and not yet saved
    if (!activeCustomer) {
      try {
        activeCustomer = await CustomerRepository.create({
          name: effectiveName,
          email: inlineCustomerEmail.trim() || null,
          phone: inlineCustomerPhone.trim() || null,
          billingAddress: inlineCustomerAddress.trim() || null,
          taxId: inlineCustomerTaxId.trim() || null,
        });
        setCustomer(activeCustomer);
      } catch (err: any) {
        const msg = err.message || 'Failed to create customer record';
        setServerErrorMessage(msg);
        showAlert('Customer Creation Error', msg);
        return;
      }
    }

    // 2. Resolve line items: if quick item inputs are filled, auto-add to activeItems
    let activeItems = [...items];
    if (quickItemDesc.trim() && quickItemPrice.trim()) {
      try {
        const qtyScaled = parseQuantityStringToScaled(quickItemQty.trim() || '1');
        const priceMoney = parseDecimalStringToMoney(quickItemPrice.trim() || '0', currency);
        if (qtyScaled > 0n && priceMoney.amountMinor >= 0n) {
          const autoItem: LineItemInput = {
            id: `item_${Date.now()}_${activeItems.length}`,
            description: quickItemDesc.trim(),
            quantityScaled: qtyScaled,
            unitName: quickItemUnit.trim() || 'item',
            unitPriceMinor: priceMoney.amountMinor,
          };
          activeItems = [...activeItems, autoItem];
          setItems(activeItems);
          setQuickItemDesc('');
          setQuickItemQty('1');
          setQuickItemPrice('');
        }
      } catch {
        // Fall through to validation check
      }
    }

    if (activeItems.length === 0) {
      const msg = `Please add at least one line item (service or product) with a price before issuing this ${docShortTitle.toLowerCase()}.`;
      setServerErrorMessage(msg);
      showAlert('Line Item Required', msg);
      return;
    }

    // Validate line item specifications
    for (let i = 0; i < activeItems.length; i++) {
      const itm = activeItems[i];
      if (!itm.description?.trim()) {
        const msg = `Line item #${i + 1} is missing a description.`;
        setServerErrorMessage(msg);
        showAlert('Incomplete Item', msg);
        return;
      }
      if (itm.quantityScaled <= 0n) {
        const msg = `Line item #${i + 1} ("${itm.description}") must have a quantity greater than zero.`;
        setServerErrorMessage(msg);
        showAlert('Invalid Quantity', msg);
        return;
      }
      if (itm.unitPriceMinor < 0n) {
        const msg = `Line item #${i + 1} ("${itm.description}") cannot have a negative unit price.`;
        setServerErrorMessage(msg);
        showAlert('Invalid Price', msg);
        return;
      }
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsIssuing(true);

    try {
      await DocumentRepository.saveDraft({
        id: docId,
        businessProfileId,
        docType,
        customerId: activeCustomer.id,
        issueDate,
        dueDate: hasDueDate ? dueDate : null,
        currency,
        discountType,
        discountValue: calculatedDiscountValue,
        taxType,
        taxRateBp,
        taxLabel,
        notes,
        terms,
        items: activeItems,
        poNumber: poNumber.trim() || undefined,
        paymentTermsPreset: showPaymentTerms ? paymentTermsPreset : undefined,
        shippingAddress: shippingAddress.trim() || undefined,
        paymentInstructions: paymentInstructions.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        depositMinor: calculatedDepositMinor,
      });

      const issued = await DocumentRepository.issueDocument(docId);
      router.replace(`/document/${issued.id}` as any);
    } catch (err: any) {
      const msg = err.message || 'Failed to issue document';
      setServerErrorMessage(msg);
      showAlert('Unable to Issue Document', msg);
    } finally {
      setIsIssuing(false);
      isSubmittingRef.current = false;
    }
  }

  // Explicit Save Draft handler with tactile feedback
  async function handleSaveDraftExplicit() {
    if (isSubmittingRef.current) return;
    setServerErrorMessage(null);
    setIsSavingManual(true);
    setSaveStatus('saving');

    let activeCustomer = customer;
    const effectiveName = (customer?.name || inlineCustomerName).trim();
    if (!activeCustomer && effectiveName) {
      try {
        activeCustomer = await CustomerRepository.create({
          name: effectiveName,
          email: inlineCustomerEmail.trim() || null,
          phone: inlineCustomerPhone.trim() || null,
          billingAddress: inlineCustomerAddress.trim() || null,
          taxId: inlineCustomerTaxId.trim() || null,
        });
        setCustomer(activeCustomer);
      } catch {
        // Non-blocking for draft save
      }
    }

    let activeItems = [...items];
    if (activeItems.length === 0 && quickItemDesc.trim() && quickItemPrice.trim()) {
      try {
        const qtyScaled = parseQuantityStringToScaled(quickItemQty.trim() || '1');
        const priceMoney = parseDecimalStringToMoney(quickItemPrice.trim() || '0', currency);
        if (qtyScaled > 0n && priceMoney.amountMinor >= 0n) {
          const autoItem: LineItemInput = {
            id: `item_${Date.now()}_0`,
            description: quickItemDesc.trim(),
            quantityScaled: qtyScaled,
            unitName: quickItemUnit.trim() || 'item',
            unitPriceMinor: priceMoney.amountMinor,
          };
          activeItems = [autoItem];
          setItems(activeItems);
          setQuickItemDesc('');
          setQuickItemQty('1');
          setQuickItemPrice('');
        }
      } catch {
        // Non-blocking
      }
    }

    try {
      await DocumentRepository.saveDraft({
        id: docId,
        businessProfileId,
        docType,
        customerId: activeCustomer?.id || null,
        issueDate,
        dueDate: hasDueDate ? dueDate : null,
        currency,
        discountType,
        discountValue: calculatedDiscountValue,
        taxType,
        taxRateBp,
        taxLabel,
        notes,
        terms,
        items: activeItems,
        poNumber: poNumber.trim() || undefined,
        paymentTermsPreset: showPaymentTerms ? paymentTermsPreset : undefined,
        shippingAddress: shippingAddress.trim() || undefined,
        paymentInstructions: paymentInstructions.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        depositMinor: calculatedDepositMinor,
      });
      setSaveStatus('saved');
      showAlert(
        'Draft Saved',
        `Your ${docShortTitle.toLowerCase()} draft was saved successfully.`,
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Go to Documents',
            onPress: () => router.push('/(tabs)/documents' as any),
          },
        ]
      );
    } catch (err: any) {
      setSaveStatus('unsaved');
      const msg = err.message || 'Failed to save draft';
      setServerErrorMessage(msg);
      showAlert('Save Failed', msg);
    } finally {
      setIsSavingManual(false);
    }
  }

  const effectiveCustomerName = (customer?.name || inlineCustomerName).trim();
  const isCustomerMissing = hasAttemptedIssue && !effectiveCustomerName;
  const hasPendingQuickItem = Boolean(quickItemDesc.trim() && quickItemPrice.trim());
  const isItemsMissing = hasAttemptedIssue && items.length === 0 && !hasPendingQuickItem;

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
                ? `Edit ${docShortTitle} Draft`
                : `New ${docShortTitle}`}
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

            {/* Organization Logo & Brand Mark */}
            <LogoUploader
              logoUri={businessProfile?.logo_uri}
              profileId={businessProfile?.id}
              autoSaveProfile={true}
              compact={false}
              label="Organization Logo & Brand Mark"
              description="Displays in the gold header frame on this invoice and all exported PDFs."
              onLogoChange={(newUri) => {
                setBusinessProfile((prev) => (prev ? { ...prev, logo_uri: newUri } : null));
              }}
            />

            {/* 1. Customer Section (Universally Required) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.headingBadgeRow}>
                  <Text style={[styles.sectionHeading, { color: isCustomerMissing ? theme.statusDanger : theme.textPrimary }]}>
                    {partySectionTitle}
                  </Text>
                  <View style={[styles.badgeRequired, { backgroundColor: isCustomerMissing ? theme.statusDanger + '1A' : theme.surfaceSecondary, borderColor: isCustomerMissing ? theme.statusDanger : theme.borderSubtle }]}>
                    <Text style={[styles.badgeRequiredText, { color: isCustomerMissing ? theme.statusDanger : theme.textSecondary }]}>
                      REQUIRED
                    </Text>
                  </View>
                </View>
                {customer && (
                  <Pressable
                    onPress={() => {
                      setQuickAddCustomerMode(false);
                      setShowCustomerPicker(true);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Change customer"
                  >
                    <Text style={[styles.linkActionText, { color: theme.brandAnchor }]}>Change</Text>
                  </Pressable>
                )}
              </View>

              {customer ? (
                <View style={[styles.customerCardSelected, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
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
                    {customer.phone ? (
                      <Text style={[styles.customerSelectedContact, { color: theme.textMuted }]}>{customer.phone}</Text>
                    ) : null}
                    {customer.billing_address ? (
                      <Text style={[styles.customerSelectedContact, { color: theme.textMuted }]} numberOfLines={2}>
                        {customer.billing_address}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.customerRemoveBtn}
                    onPress={() => {
                      setCustomer(null);
                      setInlineCustomerName('');
                      setInlineCustomerEmail('');
                      setInlineCustomerPhone('');
                      setInlineCustomerAddress('');
                      setInlineCustomerTaxId('');
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove selected customer"
                  >
                    <X size={16} color={theme.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.customerInlineBox, { borderColor: isCustomerMissing ? theme.statusDanger : theme.borderSubtle, backgroundColor: theme.surface }]}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{partyNameLabel}</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: isCustomerMissing ? theme.statusDanger : theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    placeholder={partyPlaceholder}
                    placeholderTextColor={theme.textMuted}
                    value={inlineCustomerName}
                    onChangeText={(val) => {
                      setInlineCustomerName(val);
                      if (serverErrorMessage) setServerErrorMessage(null);
                    }}
                  />
                  <View style={styles.customerInlineActionsRow}>
                    <Pressable
                      style={styles.expandDetailsToggle}
                      onPress={() => setIsCustomerDetailsExpanded((prev) => !prev)}
                      hitSlop={6}
                    >
                      {isCustomerDetailsExpanded ? <ChevronUp size={14} color={theme.brandAnchor} /> : <ChevronDown size={14} color={theme.brandAnchor} />}
                      <Text style={[styles.expandDetailsText, { color: theme.brandAnchor }]}>
                        {isCustomerDetailsExpanded ? 'Hide Contact / Tax Details' : '+ Add Email, Phone, Address, Tax ID (Optional)'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.chooseClientMiniBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                      onPress={() => {
                        setQuickAddCustomerMode(false);
                        setShowCustomerPicker(true);
                      }}
                      hitSlop={6}
                    >
                      <Users size={13} color={theme.textSecondary} />
                      <Text style={[styles.chooseClientMiniText, { color: theme.textSecondary }]}>{savedPartyBtnLabel}</Text>
                    </Pressable>
                  </View>

                  {isCustomerDetailsExpanded && (
                    <View style={styles.customerDetailsBlock}>
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email (Optional)</Text>
                          <TextInput
                            style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                            placeholder="client@example.com"
                            placeholderTextColor={theme.textMuted}
                            value={inlineCustomerEmail}
                            onChangeText={setInlineCustomerEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                        <View style={styles.col}>
                          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone (Optional)</Text>
                          <TextInput
                            style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                            placeholder="+1 555-0199"
                            placeholderTextColor={theme.textMuted}
                            value={inlineCustomerPhone}
                            onChangeText={setInlineCustomerPhone}
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>
                      <View style={{ marginTop: spacing.xs }}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{partyAddressLabel}</Text>
                        <TextInput
                          style={[styles.input, styles.multiInput, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          placeholder="Street, City, Postal Code, Country"
                          placeholderTextColor={theme.textMuted}
                          value={inlineCustomerAddress}
                          onChangeText={setInlineCustomerAddress}
                          multiline
                        />
                      </View>
                      <View style={{ marginTop: spacing.xs }}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tax ID / GSTIN / VAT (Optional)</Text>
                        <TextInput
                          style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                          placeholder="e.g. 29ABCDE1234F1Z5"
                          placeholderTextColor={theme.textMuted}
                          value={inlineCustomerTaxId}
                          onChangeText={setInlineCustomerTaxId}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {isCustomerMissing && (
                <Text style={[styles.fieldInlineError, { color: theme.statusDanger }]}>
                  Please enter a name for {partyNameLabel.replace('*', '').trim().toLowerCase()} before issuing this {docShortTitle}.
                </Text>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 2. Currency & Dates Section (Universally Required) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.headingBadgeRow}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                    Currency & Dates *
                  </Text>
                  <View style={[styles.badgeRequired, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                    <Text style={[styles.badgeRequiredText, { color: theme.textSecondary }]}>
                      REQUIRED
                    </Text>
                  </View>
                </View>
              </View>

              {/* Currency Selector Strip */}
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termsPresetsScroll}>
                  {COMMON_CURRENCIES.map((c) => {
                    const isSelected = currency === c.code;
                    return (
                      <Pressable
                        key={c.code}
                        style={[
                          styles.termsChip,
                          {
                            backgroundColor: isSelected ? theme.brandAnchor : theme.surfaceSecondary,
                            borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                          },
                        ]}
                        onPress={() => setCurrency(c.code)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select currency ${c.code}`}
                      >
                        <Text
                          style={[
                            styles.termsChipText,
                            {
                              color: isSelected ? theme.brandAnchorText : theme.textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {c.code} ({c.symbol})
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.datesGrid}>
                <View style={styles.dateCol}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Issue Date *</Text>
                  <View style={[styles.dateDisplayRow, { borderBottomColor: theme.borderSubtle }]}>
                    <Calendar color={theme.textMuted} size={16} />
                    <Text style={[styles.dateText, { color: theme.textPrimary }]}>
                      {new Date(issueDate).toLocaleDateString(documentLocale)}
                    </Text>
                  </View>
                </View>

                {hasDueDate && (
                  <View style={styles.dateCol}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{dueDateLabel}</Text>
                    <View style={[styles.dateDisplayRow, { borderBottomColor: theme.borderSubtle }]}>
                      <Calendar color={theme.textMuted} size={16} />
                      <Text style={[styles.dateText, { color: theme.textPrimary }]}>
                        {dueDate ? new Date(dueDate).toLocaleDateString(documentLocale) : (isEstimateOrQuote ? 'No expiry' : 'Due on receipt')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {showPaymentTerms && (
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
                                color: isSelected ? theme.brandAnchorText : theme.textSecondary,
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

            {/* 3. Line Items Section (Universally Required - Min 1) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.headingBadgeRow}>
                  <Text style={[styles.sectionHeading, { color: isItemsMissing ? theme.statusDanger : theme.textPrimary }]}>
                    Line items ({items.length}) *
                  </Text>
                  <View style={[styles.badgeRequired, { backgroundColor: isItemsMissing ? theme.statusDanger + '1A' : theme.surfaceSecondary, borderColor: isItemsMissing ? theme.statusDanger : theme.borderSubtle }]}>
                    <Text style={[styles.badgeRequiredText, { color: isItemsMissing ? theme.statusDanger : theme.textSecondary }]}>
                      REQUIRED (MIN 1)
                    </Text>
                  </View>
                </View>
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

              {/* Existing Items List (if any) */}
              {items.length > 0 && (
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
                      <View
                        key={item.id || idx}
                        style={[
                          styles.itemRowWrapper,
                          idx < items.length - 1 && { borderBottomColor: theme.borderSubtle, borderBottomWidth: 1 },
                        ]}
                      >
                        <Pressable
                          style={styles.itemRowPressable}
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
                        <Pressable
                          style={styles.itemDeleteBtn}
                          onPress={() => handleDeleteItem(item.id || '')}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${item.description}`}
                        >
                          <Trash2 size={16} color={theme.statusDanger} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Direct On-Screen Line Item Adder (Frictionless entry) */}
              <View style={[styles.quickItemCard, { borderColor: isItemsMissing ? theme.statusDanger : theme.borderSubtle, backgroundColor: theme.surface }]}>
                <Text style={[styles.quickItemCardTitle, { color: theme.textSecondary }]}>
                  {items.length === 0 ? 'Add Line Item *' : '+ Add Another Item'}
                </Text>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Item or Service Description *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.textPrimary,
                      borderColor: isItemsMissing && !quickItemDesc.trim() ? theme.statusDanger : theme.borderSubtle,
                      backgroundColor: theme.surfaceSecondary,
                    },
                  ]}
                  placeholder="e.g. Website Design, Consulting, or Product SKU"
                  placeholderTextColor={theme.textMuted}
                  value={quickItemDesc}
                  onChangeText={(val) => {
                    setQuickItemDesc(val);
                    if (quickItemError) setQuickItemError(null);
                    if (serverErrorMessage) setServerErrorMessage(null);
                  }}
                />

                <View style={styles.quickItemGridRow}>
                  <View style={styles.quickItemColQty}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Qty *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                      placeholder="1"
                      placeholderTextColor={theme.textMuted}
                      value={quickItemQty}
                      onChangeText={setQuickItemQty}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.quickItemColUnit}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Unit</Text>
                    <TextInput
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                      placeholder="item"
                      placeholderTextColor={theme.textMuted}
                      value={quickItemUnit}
                      onChangeText={setQuickItemUnit}
                    />
                  </View>
                  <View style={styles.quickItemColPrice}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Unit Price ({currency}) *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.textPrimary,
                          borderColor: isItemsMissing && !quickItemPrice.trim() ? theme.statusDanger : theme.borderSubtle,
                          backgroundColor: theme.surfaceSecondary,
                        },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                      value={quickItemPrice}
                      onChangeText={(val) => {
                        setQuickItemPrice(val);
                        if (quickItemError) setQuickItemError(null);
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {quickItemError && (
                  <Text style={[styles.fieldInlineError, { color: theme.statusDanger }]}>
                    {quickItemError}
                  </Text>
                )}

                <View style={styles.quickItemActionsRow}>
                  <Pressable
                    style={[styles.addQuickItemBtn, { backgroundColor: theme.brandAnchor }]}
                    onPress={handleAddQuickLineItem}
                    accessibilityRole="button"
                    accessibilityLabel="Add line item to document"
                  >
                    <Plus size={16} color={theme.brandAnchorText} strokeWidth={2.5} />
                    <Text style={[styles.addQuickItemBtnText, { color: theme.brandAnchorText }]}>
                      Add Item
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.catalogModalBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}
                    onPress={() => {
                      setEditingItem(null);
                      setShowItemModal(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Choose from saved catalog or advanced editor"
                  >
                    <Package size={15} color={theme.textSecondary} />
                    <Text style={[styles.catalogModalBtnText, { color: theme.textSecondary }]}>
                      Catalog Item
                    </Text>
                  </Pressable>
                </View>
              </View>

              {isItemsMissing && (
                <Text style={[styles.fieldInlineError, { color: theme.statusDanger, marginTop: 8 }]}>
                  At least one line item is required before issuing this {docType}.
                </Text>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* 4. Taxes & Discounts (Optional) */}
            <View style={styles.sectionBlock}>
              <Pressable
                style={styles.disclosureHeader}
                onPress={() => setIsTaxDiscountExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle taxes and discounts section"
              >
                <View style={styles.disclosureTitleCol}>
                  <View style={styles.headingBadgeRow}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Tax & discount</Text>
                    <View style={[styles.badgeOptional, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                      <Text style={[styles.badgeOptionalText, { color: theme.textMuted }]}>OPTIONAL</Text>
                    </View>
                  </View>
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
                    <>
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

                      <Pressable
                        style={[styles.taxExplainRow, { borderColor: theme.brandAnchor + '30', backgroundColor: theme.brandAnchor + '0D' }]}
                        onPress={() => setShowTaxModal(true)}
                        accessibilityRole="button"
                        accessibilityLabel="View tax explanation and statutory rules"
                      >
                        <Info size={14} color={theme.brandAnchor} />
                        <Text style={[styles.taxExplainText, { color: theme.brandAnchor }]}>
                          Why this rate? View statutory rules & component split
                        </Text>
                        <ChevronRight size={14} color={theme.brandAnchor} />
                      </Pressable>
                    </>
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

            {/* 5. Notes & Terms (Optional) */}
            <View style={styles.sectionBlock}>
              <Pressable
                style={styles.disclosureHeader}
                onPress={() => setIsNotesTermsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle notes and terms section"
              >
                <View style={styles.disclosureTitleCol}>
                  <View style={styles.headingBadgeRow}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Notes & terms</Text>
                    <View style={[styles.badgeOptional, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                      <Text style={[styles.badgeOptionalText, { color: theme.textMuted }]}>OPTIONAL</Text>
                    </View>
                  </View>
                  <Text style={[styles.disclosureSummary, { color: theme.textMuted }]}>
                    {notes || terms ? 'Configured' : 'Optional customer memo and sale conditions'}
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

            {/* 6. More Options (Optional) */}
            <View style={styles.sectionBlock}>
              <Pressable
                style={styles.disclosureHeader}
                onPress={() => setIsMoreOptionsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle more options section"
              >
                <View style={styles.disclosureTitleCol}>
                  <View style={styles.headingBadgeRow}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>More options</Text>
                    <View style={[styles.badgeOptional, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                      <Text style={[styles.badgeOptionalText, { color: theme.textMuted }]}>OPTIONAL</Text>
                    </View>
                  </View>
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
                  <Pressable
                    style={({ pressed }) => [styles.totalRow, pressed && { opacity: 0.7 }]}
                    onPress={() => setShowTaxModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`View tax explanation for ${taxLabel}`}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                        {taxLabel} ({taxRateStr}%)
                      </Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.xs, backgroundColor: theme.brandAnchor + '18' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: theme.brandAnchor }}>
                          Why this rate?
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.totalValue, { color: theme.textPrimary }]}>
                      {formatMoney(calculation.tax, documentLocale)}
                    </Text>
                  </Pressable>
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

            {/* Issuance Readiness Checklist */}
            <View style={[styles.checklistCard, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.checklistTitle, { color: theme.textSecondary }]}>REQUIRED TO ISSUE</Text>
              <View style={styles.checkItemRow}>
                <CheckCircle2 size={16} color={effectiveCustomerName ? theme.statusSuccess : theme.statusDanger} />
                <Text style={[styles.checkItemText, { color: effectiveCustomerName ? theme.textPrimary : theme.statusDanger }]}>
                  {effectiveCustomerName ? `${partyNameLabel.replace('*', '').trim()}: ${effectiveCustomerName}` : `${partyNameLabel.replace('*', '').trim()} required (Type name or choose from list)`}
                </Text>
              </View>
              <View style={styles.checkItemRow}>
                <CheckCircle2 size={16} color={(items.length > 0 || hasPendingQuickItem) ? theme.statusSuccess : theme.statusDanger} />
                <Text style={[styles.checkItemText, { color: (items.length > 0 || hasPendingQuickItem) ? theme.textPrimary : theme.statusDanger }]}>
                  {items.length > 0 ? `Line items: ${items.length} added` : hasPendingQuickItem ? 'Line item ready to add' : 'At least 1 product or service line item required'}
                </Text>
              </View>
            </View>

            {/* Validation / Execution Error Banner right above action buttons */}
            {serverErrorMessage && (
              <View style={[styles.errorBanner, { backgroundColor: theme.surfaceSecondary, borderColor: theme.statusDanger, marginBottom: spacing.md }]}>
                <AlertCircle color={theme.statusDanger} size={18} />
                <Text style={[styles.errorBannerText, { color: theme.statusDanger }]}>{serverErrorMessage}</Text>
              </View>
            )}

            {/* 8. Action Buttons (Secondary Row [Preview] [Save Draft] + Primary Action [Issue Official Document]) */}
            <View style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <SecondaryButton
                  label="Preview"
                  icon={<Eye color={theme.secondaryActionText} size={18} />}
                  onPress={() => setShowPreviewModal(true)}
                  accessibilityLabel="Preview document"
                  style={{ flex: 1 }}
                />
                <SecondaryButton
                  label={isSavingManual ? 'Saving...' : 'Save Draft'}
                  icon={<Save color={theme.secondaryActionText} size={18} />}
                  onPress={handleSaveDraftExplicit}
                  disabled={isSavingManual || isIssuing}
                  accessibilityLabel="Save draft"
                  style={{ flex: 1 }}
                />
              </View>

              <PrimaryButton
                label={
                  isIssuing
                    ? 'Issuing...'
                    : `Issue Official ${docShortTitle}`
                }
                icon={<FileCheck color={theme.primaryActionText} size={20} />}
                onPress={handleIssue}
                disabled={isIssuing || isSavingManual}
                loading={isIssuing}
                accessibilityLabel={`Issue official ${docShortTitle.toLowerCase()}`}
                fullWidth
              />
            </View>
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
                  {docShortTitle} Preview
                </Text>
                <Text style={[styles.topBarStatus, { color: theme.textMuted }]}>
                  Draft (Not yet issued) · {provenanceRule}
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
              {/* Layout Switcher Pills */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                  Select {docShortTitle} Layout ({availableTemplates.length} layouts)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {availableTemplates.map((l) => {
                    const isSelected = selectedTemplateId === l.id;
                    return (
                      <Pressable
                        key={l.id}
                        onPress={() => setSelectedTemplateId(l.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: radii.full,
                          backgroundColor: isSelected ? theme.brandAnchor : theme.surfaceSecondary,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: isSelected ? theme.brandAnchorText : theme.textPrimary,
                          }}
                        >
                          {l.code} {l.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Dual-Gate Status Cards */}
              <View style={{ marginBottom: 14, gap: 8 }}>
                {/* 1. Document Readiness Hard Gate (Rule 46) */}
                <Pressable
                  onPress={() => setShowReadinessChecklist(!showReadinessChecklist)}
                  style={{
                    padding: 12,
                    borderRadius: radii.md,
                    backgroundColor: readinessResult?.hardGatePassed ? '#052e16' : '#451a03',
                    borderWidth: 1,
                    borderColor: readinessResult?.hardGatePassed ? '#166534' : '#b45309',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Shield size={16} color={readinessResult?.hardGatePassed ? '#4ade80' : '#f59e0b'} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: readinessResult?.hardGatePassed ? '#4ade80' : '#f59e0b' }}>
                        {readinessResult?.hardGatePassed
                          ? `${provenanceRule} Verified (100% Passed)`
                          : `${provenanceRule} Incomplete (${readinessResult?.violations.length || 0} issues)`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                      {showReadinessChecklist ? 'Hide' : 'Checklist'}
                    </Text>
                  </View>
                  {showReadinessChecklist && readinessResult && (
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 8 }}>
                      {readinessResult.checklist.map((c, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                          <Text style={{ fontSize: 11, color: c.passed ? '#4ade80' : '#ef4444', fontWeight: '800' }}>
                            {c.passed ? '✓' : '✗'}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, color: '#f8fafc', fontWeight: '600' }}>{c.item}</Text>
                            <Text style={{ fontSize: 10, color: '#94a3b8' }}>{c.statutoryRef} • {c.details}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>

                {/* 2. Design Quality Score (100-Point Rubric) */}
                <Pressable
                  onPress={() => setShowQualityRubric(!showQualityRubric)}
                  style={{
                    padding: 12,
                    borderRadius: radii.md,
                    backgroundColor: theme.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: theme.borderSubtle,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileCheck size={16} color="#38bdf8" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                        Quality Score: {qualityResult.totalScore}/100 • {qualityResult.tier}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      {showQualityRubric ? 'Hide' : 'Rubric'}
                    </Text>
                  </View>
                  {showQualityRubric && (
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: theme.borderSubtle, paddingTop: 8 }}>
                      {qualityResult.categories.map((cat, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>{cat.category}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textPrimary }}>
                            {cat.awardedPoints}/{cat.maxPoints}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={[styles.previewSheet, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                {/* Header */}
                <View style={styles.previewHeaderRow}>
                  <View>
                    {businessProfile?.logo_uri ? (
                      <View style={{ marginBottom: 6 }}>
                        <Image
                          source={{ uri: businessProfile.logo_uri }}
                          style={{ width: 48, height: 48, borderRadius: 4 }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}
                    <Text style={[styles.previewDocType, { color: theme.textPrimary }]}>
                      {docTitle.toUpperCase()}
                    </Text>
                    <View style={[styles.previewDraftTag, { borderColor: theme.statusDraft, backgroundColor: theme.surfaceSecondary }]}>
                      <Text style={[styles.previewDraftTagText, { color: theme.statusDraft }]}>{provenanceRule ? `${provenanceRule.toUpperCase()} · DRAFT` : 'DRAFT'}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.previewDateLabel, { color: theme.textSecondary }]}>Issue Date</Text>
                    <Text style={[styles.previewDateValue, { color: theme.textPrimary }]}>
                      {new Date(issueDate).toLocaleDateString(documentLocale)}
                    </Text>
                    {hasDueDate && dueDate && (
                      <>
                        <Text style={[styles.previewDateLabel, { color: theme.textSecondary, marginTop: 4 }]}>{dueDateLabel.replace('*', '').trim()}</Text>
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
                  <Text style={[styles.previewSectionHeading, { color: theme.textSecondary }]}>
                    {isPurchasing ? 'Vendor / Supplier:' : isLogistics ? 'Consignee / Deliver To:' : isHR ? 'Employee / Recipient:' : 'Bill To:'}
                  </Text>
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
                  {isInvoiceFamily && calculation.deposit.amountMinor > 0n && (
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Deposit Applied</Text>
                      <Text style={[styles.totalValue, { color: theme.statusSuccess }]}>
                        -{formatMoney(calculation.deposit, documentLocale)}
                      </Text>
                    </View>
                  )}
                  {isInvoiceFamily && (
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

              {/* Preview Action Buttons */}
              <View style={{ marginTop: spacing.lg, marginBottom: spacing.xxl, gap: 10 }}>
                <PrimaryButton
                  label={
                    isExportingPdf
                      ? 'Generating Official PDF...'
                      : `Export PDF (${availableTemplates.find((t) => t.id === selectedTemplateId)?.code || docShortTitle})`
                  }
                  icon={<Share2 color={theme.primaryActionText} size={18} />}
                  onPress={handleExportPdf}
                  loading={isExportingPdf}
                  disabled={isExportingPdf}
                  accessibilityLabel="Export official PDF document"
                  fullWidth
                />
                <SecondaryButton
                  label="Close Preview"
                  onPress={() => setShowPreviewModal(false)}
                  accessibilityLabel="Close preview modal"
                  fullWidth
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Customer Picker Modal */}
        <CustomerPickerModal
          visible={showCustomerPicker}
          selectedCustomerId={customer?.id}
          initialQuickAdd={quickAddCustomerMode}
          onSelectCustomer={(c) => {
            setCustomer(c);
            setHasAttemptedIssue(false);
            setServerErrorMessage(null);
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

        {/* Tax Explanation Modal */}
        <TaxExplanationModal
          visible={showTaxModal}
          onClose={() => setShowTaxModal(false)}
          explanation={taxExplanation}
          currency={currency}
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
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
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  saveDraftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    borderRadius: radii.sm,
    borderWidth: 1.5,
  },
  saveDraftBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  issueButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.sm,
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
  taxExplainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  taxExplainText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: spacing.xs,
  },
  headingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeRequired: {
    borderWidth: 1,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeRequiredText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeOptional: {
    borderWidth: 1,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeOptionalText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  customerCardSelected: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  customerRemoveBtn: {
    padding: 4,
    marginLeft: spacing.sm,
  },
  customerEmptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  customerInlineBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  customerInlineActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: spacing.sm,
  },
  expandDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  expandDetailsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chooseClientMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  chooseClientMiniText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerDetailsBlock: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  customerEmptyHeading: {
    fontSize: 13,
    fontWeight: '500',
  },
  customerEmptyButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customerBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  customerBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customerBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radii.sm,
  },
  customerBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickItemCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  quickItemCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickItemGridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickItemColQty: {
    flex: 1,
  },
  quickItemColUnit: {
    flex: 1,
  },
  quickItemColPrice: {
    flex: 1.5,
  },
  quickItemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  addQuickItemBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radii.sm,
  },
  addQuickItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  catalogModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  catalogModalBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addFirstItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    height: 40,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  addFirstItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  itemRowPressable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  itemDeleteBtn: {
    padding: spacing.xs,
  },
  addAnotherItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addAnotherItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checklistCard: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkItemText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
