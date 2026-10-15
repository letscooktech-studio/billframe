/**
 * CHOOSE DOCUMENT — UNIVERSAL DOCUMENT CATALOGUE
 * Matches Screen 1 of the Billframe specification:
 * - 3-Step Breadcrumb Stepper: 1 Organization -> 2 Document Type -> 3 Layout
 * - Search bar with instant real-time filtering across all 36 templates
 * - Category filter pills: [All (36)], [HR & Team], [Sales & Billing], [Procurement], [Operations], [Corporate Admin], [Property & Education], [Custom]
 * - Category section headers with descriptive subtitle
 * - High-fidelity document cards with Gold/Black Document Master thumbnail previews
 * - Direct action buttons: [Preview] and [Select Template]
 * - Completely eliminates internal Class A/Class B labels from UI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Eye,
  Plus,
  Palette,
  Search,
  X,
} from 'lucide-react-native';
import { colors, spacing, radii, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { AuroraBackground } from '../../components/common/AuroraBackground';
import { FeatureIntroductionSheet } from '../../components/common/FeatureIntroductionSheet';
import { UniversalDocumentRepository } from '../../data/repositories/UniversalDocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { UniversalDocumentSchema } from '../../domain/documents/universal/types';

export interface CatalogDocItem {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  recipientName: string;
  docSubtitle: string;
  isFinancial: boolean;
}

export const CATALOG_ITEMS: CatalogDocItem[] = [
  // ── HR & Employment (8) ──
  {
    id: 'job_offer_letter',
    code: 'job_offer_letter',
    title: 'Job Offer Letter',
    category: 'hr_employment',
    description: 'Official corporate employment offer with CTC breakdown, joining terms, and candidate acceptance block.',
    recipientName: 'Priya Verma',
    docSubtitle: 'OFFER OF EMPLOYMENT',
    isFinancial: false,
  },
  {
    id: 'appointment_letter',
    code: 'appointment_letter',
    title: 'Appointment Letter',
    category: 'hr_employment',
    description: 'Formal appointment confirmation setting out commencement date, work hours, leave policies and statutory terms.',
    recipientName: 'Priya Verma',
    docSubtitle: 'APPOINTMENT LETTER',
    isFinancial: false,
  },
  {
    id: 'internship_letter',
    code: 'internship_letter',
    title: 'Internship Offer & Appointment',
    category: 'hr_employment',
    description: 'Academic internship engagement letter with monthly stipend, mentor assignment, and project scope.',
    recipientName: 'Rohan Deshmukh',
    docSubtitle: 'INTERNSHIP APPOINTMENT',
    isFinancial: false,
  },
  {
    id: 'experience_certificate',
    code: 'experience_certificate',
    title: 'Experience Certificate',
    category: 'hr_employment',
    description: 'Formal employment verification certificate certifying tenure, conduct, and final designation.',
    recipientName: 'Kavita Sundaram',
    docSubtitle: 'EXPERIENCE CERTIFICATE',
    isFinancial: false,
  },
  {
    id: 'relieving_letter',
    code: 'relieving_letter',
    title: 'Relieving Letter & Clearance',
    category: 'hr_employment',
    description: 'Formal separation letter confirming departure, handover completion, and official discharge from duties.',
    recipientName: 'Deepa Roy',
    docSubtitle: 'RELIEVING LETTER',
    isFinancial: false,
  },
  {
    id: 'promotion_letter',
    code: 'promotion_letter',
    title: 'Promotion & Title Elevation Letter',
    category: 'hr_employment',
    description: 'Career advancement letter confirming elevation to new executive role, revised CTC, and reporting manager.',
    recipientName: 'Siddharth Rao',
    docSubtitle: 'PROMOTION ORDER',
    isFinancial: false,
  },
  {
    id: 'salary_slip',
    code: 'salary_slip',
    title: 'Salary Slip / Payslip',
    category: 'hr_employment',
    description: 'Detailed monthly salary voucher with earnings breakdown, PF/tax deductions, and take-home net pay.',
    recipientName: 'Aarav Sharma',
    docSubtitle: 'SALARY SLIP / PAYSLIP',
    isFinancial: false,
  },
  {
    id: 'leave_approval_letter',
    code: 'leave_approval_letter',
    title: 'Leave Approval & Sanction Letter',
    category: 'hr_employment',
    description: 'Official sanction letter for sabbatical, maternity, study or extended privilege leave.',
    recipientName: 'Meera Iyer',
    docSubtitle: 'LEAVE SANCTION',
    isFinancial: false,
  },

  // ── Sales & Billing (6) ──
  {
    id: 'tax_invoice',
    code: 'tax_invoice',
    title: 'Rule 46 GST Tax Invoice',
    category: 'sales_billing',
    description: 'Statutory GST tax invoice compliant with Indian GST Rule 46 with itemized HSN codes and payment QR.',
    recipientName: 'Acme Corporation',
    docSubtitle: 'TAX INVOICE',
    isFinancial: true,
  },
  {
    id: 'bill_of_supply',
    code: 'bill_of_supply',
    title: 'Bill of Supply',
    category: 'sales_billing',
    description: 'Composition scheme and exempt supply invoice format with nil tax charge under Section 10 of CGST Act.',
    recipientName: 'Walk-in Customer',
    docSubtitle: 'BILL OF SUPPLY',
    isFinancial: true,
  },
  {
    id: 'quotation',
    code: 'quotation',
    title: 'Commercial Quotation / Estimate',
    category: 'sales_billing',
    description: 'Price estimate detailing line items, discount margins, delivery timelines, and offer validity terms.',
    recipientName: 'Titan Industrial Solutions',
    docSubtitle: 'COMMERCIAL QUOTATION',
    isFinancial: true,
  },
  {
    id: 'payment_receipt',
    code: 'payment_receipt',
    title: 'Payment Receipt / Voucher',
    category: 'sales_billing',
    description: 'Official payment voucher acknowledging invoice settlement, transaction reference, and balance.',
    recipientName: 'Wipro Enterprises Ltd',
    docSubtitle: 'PAYMENT RECEIPT',
    isFinancial: true,
  },
  {
    id: 'customer_account_statement',
    code: 'customer_account_statement',
    title: 'Customer Account Statement',
    category: 'sales_billing',
    description: 'Periodic customer accounts receivable ledger statement showing invoices, payments, and balance.',
    recipientName: 'Metro Logistics Ltd',
    docSubtitle: 'STATEMENT OF ACCOUNT',
    isFinancial: false,
  },
  {
    id: 'credit_note',
    code: 'credit_note',
    title: 'GST Credit Note (Rule 53)',
    category: 'sales_billing',
    description: 'Statutory GST credit note for billing adjustments, goods return credit, or discount reconciliation.',
    recipientName: 'Cognizant Technology',
    docSubtitle: 'CREDIT NOTE',
    isFinancial: true,
  },

  // ── Procurement & Dispatch (6) ──
  {
    id: 'purchase_order',
    code: 'purchase_order',
    title: 'Commercial Purchase Order',
    category: 'procurement',
    description: 'Corporate purchase order specifying procurement line items, shipping address, and vendor terms.',
    recipientName: 'Dell Technologies India',
    docSubtitle: 'PURCHASE ORDER',
    isFinancial: false,
  },
  {
    id: 'goods_received_note',
    code: 'goods_received_note',
    title: 'Goods Received Note (GRN)',
    category: 'procurement',
    description: 'Warehouse inbound intake document recording shipment verification, PO matching, and received goods disposition.',
    recipientName: 'Apex Micro Systems Ltd',
    docSubtitle: 'GOODS RECEIVED NOTE',
    isFinancial: false,
  },
  {
    id: 'supplier_evaluation',
    code: 'supplier_evaluation',
    title: 'Supplier Performance Evaluation',
    category: 'procurement',
    description: 'Periodic supplier scorecard evaluating on-time delivery, product compliance, price stability, and vendor SLA.',
    recipientName: 'Precision Fasteners & Tools',
    docSubtitle: 'SUPPLIER EVALUATION',
    isFinancial: false,
  },
  {
    id: 'delivery_challan',
    code: 'delivery_challan',
    title: 'Delivery Challan (Rule 55)',
    category: 'procurement',
    description: 'Statutory GST delivery challan for goods transportation for job work, demo or supply on approval.',
    recipientName: 'Precision Machining Works',
    docSubtitle: 'DELIVERY CHALLAN',
    isFinancial: false,
  },
  {
    id: 'packing_list',
    code: 'packing_list',
    title: 'Export / Shipment Packing List',
    category: 'procurement',
    description: 'Consignment packing specification outlining parcel count, net/gross weights, dimensions, and cargo contents.',
    recipientName: 'Global Logistics Hub Ltd',
    docSubtitle: 'PACKING LIST',
    isFinancial: false,
  },
  {
    id: 'material_issue_note',
    code: 'material_issue_note',
    title: 'Material Issue Note (MIN)',
    category: 'procurement',
    description: 'Internal inventory dispatch voucher transferring raw materials from central stores to production lines.',
    recipientName: 'Assembly Line 3',
    docSubtitle: 'MATERIAL ISSUE NOTE',
    isFinancial: false,
  },

  // ── Operations & Field Service (6) ──
  {
    id: 'work_order',
    code: 'work_order',
    title: 'Work Order / Job Card',
    category: 'operations',
    description: 'Field execution order with site location, task schedule, engineering materials, and sign-off.',
    recipientName: 'CloudScale Infrastructure Ltd',
    docSubtitle: 'WORK ORDER / JOB CARD',
    isFinancial: false,
  },
  {
    id: 'service_report',
    code: 'service_report',
    title: 'Field Service & Maintenance Report',
    category: 'operations',
    description: 'On-site technical service report documenting system diagnostics, component replacement, and client sign-off.',
    recipientName: 'Apex Cloud Datacenter',
    docSubtitle: 'SERVICE REPORT',
    isFinancial: false,
  },
  {
    id: 'site_inspection_report',
    code: 'site_inspection_report',
    title: 'Site Inspection Report',
    category: 'operations',
    description: 'Facility technical inspection checklist evaluating civil, electrical, fire safety, and compliance status.',
    recipientName: 'Apex Global Towers',
    docSubtitle: 'SITE INSPECTION REPORT',
    isFinancial: false,
  },
  {
    id: 'production_order',
    code: 'production_order',
    title: 'Manufacturing Production Order',
    category: 'operations',
    description: 'Factory floor production order establishing bill-of-materials consumption, target output, and QC checkpoints.',
    recipientName: 'Apex Edge Gateway v2.4',
    docSubtitle: 'PRODUCTION ORDER',
    isFinancial: false,
  },
  {
    id: 'quality_inspection_report',
    code: 'quality_inspection_report',
    title: 'Quality Inspection & QA Clearance',
    category: 'operations',
    description: 'Rigorous engineering quality assurance audit recording test tolerances, sample measurements, and batch clearance.',
    recipientName: 'Lot 26-41B Clearance',
    docSubtitle: 'QA CLEARANCE REPORT',
    isFinancial: false,
  },
  {
    id: 'equipment_maintenance_log',
    code: 'equipment_maintenance_log',
    title: 'Equipment Maintenance Log',
    category: 'operations',
    description: 'Comprehensive maintenance record tracking preventive maintenance cycles, technician notes, and next scheduled service.',
    recipientName: 'Haas CNC Milling Station',
    docSubtitle: 'MAINTENANCE LOG',
    isFinancial: false,
  },

  // ── Corporate Administration (4) ──
  {
    id: 'business_letterhead',
    code: 'business_letterhead',
    title: 'Executive Business Letter',
    category: 'corporate_admin',
    description: 'Formal corporate executive correspondence for official client notices, board memos, or agreements.',
    recipientName: 'Partner Representative',
    docSubtitle: 'EXECUTIVE CORRESPONDENCE',
    isFinancial: false,
  },
  {
    id: 'authorization_letter',
    code: 'authorization_letter',
    title: 'Official Letter of Authorization',
    category: 'corporate_admin',
    description: 'Formal corporate power of representation authorizing a designated agent or employee to execute actions.',
    recipientName: 'Harish Nambiar',
    docSubtitle: 'LETTER OF AUTHORIZATION',
    isFinancial: false,
  },
  {
    id: 'meeting_minutes',
    code: 'meeting_minutes',
    title: 'Meeting Minutes & Action Register',
    category: 'corporate_admin',
    description: 'Corporate executive meeting minutes record with agenda, action items register, and distribution list.',
    recipientName: 'Board of Directors',
    docSubtitle: 'MINUTES OF MEETING',
    isFinancial: false,
  },
  {
    id: 'equipment_responsibility',
    code: 'equipment_responsibility',
    title: 'Asset Handover & Responsibility Form',
    category: 'corporate_admin',
    description: 'Hardware custody undertaking detailing company equipment issued to employees with return and liability terms.',
    recipientName: 'Rahul Verma',
    docSubtitle: 'ASSET HANDOVER UNDERTAKING',
    isFinancial: false,
  },

  // ── Property & Education (6) ──
  {
    id: 'rent_receipt',
    code: 'rent_receipt',
    title: 'House Rent Receipt (Sec 10(13A))',
    category: 'property_education',
    description: 'Statutory residential house rent receipt for income tax HRA exemption with landlord PAN.',
    recipientName: 'Pooja Hegde',
    docSubtitle: 'RENT RECEIPT',
    isFinancial: false,
  },
  {
    id: 'move_in_handover_checklist',
    code: 'move_in_handover_checklist',
    title: 'Move-In Handover Checklist',
    category: 'property_education',
    description: 'Property lease condition report documenting fixture states, key handovers, meter readings, and sign-offs.',
    recipientName: 'Flat 402 Tenant',
    docSubtitle: 'HANDOVER CHECKLIST',
    isFinancial: false,
  },
  {
    id: 'student_fee_receipt',
    code: 'student_fee_receipt',
    title: 'Student Tuition & Fee Receipt',
    category: 'property_education',
    description: 'Academic institution fee receipt with tuition components, semester reference, and payment mode.',
    recipientName: 'Ananya Deshmukh',
    docSubtitle: 'STUDENT FEE RECEIPT',
    isFinancial: false,
  },
  {
    id: 'enrollment_confirmation_letter',
    code: 'enrollment_confirmation_letter',
    title: 'Student Enrollment Confirmation Letter',
    category: 'property_education',
    description: 'Official academic bona fide certificate certifying student enrollment status, semester, and course program.',
    recipientName: 'Aditya Swaminathan',
    docSubtitle: 'BONA FIDE CERTIFICATE',
    isFinancial: false,
  },
  {
    id: 'grant_proposal',
    code: 'grant_proposal',
    title: 'Grant Proposal & Program Summary',
    category: 'property_education',
    description: 'Formal funding grant proposal outlining program objectives, budget request, and expected impact metrics.',
    recipientName: 'Global Tech Equity Foundation',
    docSubtitle: 'GRANT PROPOSAL',
    isFinancial: false,
  },
  {
    id: 'donation_acknowledgement',
    code: 'donation_acknowledgement',
    title: 'Donation Acknowledgement (Sec 80G)',
    category: 'property_education',
    description: 'Charitable foundation tax-exempt donation receipt confirming contribution and statutory 80G exemption.',
    recipientName: 'Dr. Ramesh Ramanathan',
    docSubtitle: 'DONATION RECEIPT',
    isFinancial: false,
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Templates (36)', subtitle: 'Complete collection of 36 Gold/Black enterprise documents.' },
  { id: 'hr_employment', label: 'HR & Team (8)', subtitle: 'Letters, contracts, payslips and employment records.' },
  { id: 'sales_billing', label: 'Sales & Billing (6)', subtitle: 'GST invoices, bills of supply, receipts and account statements.' },
  { id: 'procurement', label: 'Procurement (6)', subtitle: 'Purchase orders, inward GRNs, supplier evaluations and challans.' },
  { id: 'operations', label: 'Operations & Field (6)', subtitle: 'Work orders, field service reports, site audits and maintenance logs.' },
  { id: 'corporate_admin', label: 'Corporate Admin (4)', subtitle: 'Executive correspondence, power of authorization and meeting minutes.' },
  { id: 'property_education', label: 'Property & Education (6)', subtitle: 'Rent receipts, handovers, tuition receipts, grants and donations.' },
  { id: 'custom', label: 'Custom Forms', subtitle: 'User-defined schemas and specialized organization documents.' },
];

export default function ChooseDocumentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('Apex Solutions');
  const [customSchemas, setCustomSchemas] = useState<UniversalDocumentSchema[]>([]);

  const loadData = useCallback(async () => {
    try {
      const activeProfile = await BusinessProfileRepository.getActiveProfile();
      if (activeProfile?.name) setBusinessName(activeProfile.name);

      const schemas = await UniversalDocumentRepository.getDocumentTypesAsync(activeProfile?.id);
      const userCustom = schemas.filter((s) => !s.isSystem);
      setCustomSchemas(userCustom);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge static and dynamic items
  const allItems: CatalogDocItem[] = useMemo(() => {
    const list: CatalogDocItem[] = [...CATALOG_ITEMS];
    for (const cs of customSchemas) {
      list.push({
        id: cs.id,
        code: cs.code,
        title: cs.name,
        category: 'custom',
        description: cs.description || 'Custom organization-defined document format.',
        recipientName: 'Designated Party',
        docSubtitle: cs.name.toUpperCase(),
        isFinancial: false,
      });
    }
    return list;
  }, [customSchemas]);

  const currentCategoryInfo = CATEGORY_TABS.find((c) => c.id === activeCategory) || CATEGORY_TABS[0];

  const displayedDocs = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.docSubtitle.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
      );
    });
  }, [allItems, activeCategory, searchQuery]);

  return (
    <AuroraBackground section="template_studio" intensity="subtle">
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={theme.textPrimary} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Choose Document</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Select from 36 professional Gold/Black templates
            </Text>
          </View>

          {/* Quick links to Branding and Custom Schema Builder */}
          <View style={styles.topActionsRow}>
            <Pressable
              style={styles.brandingBtn}
              onPress={() => router.push('/templates/edit')}
              accessibilityLabel="Letterhead & Branding"
            >
              <Palette size={16} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.newSchemaBtn}
              onPress={() => router.push('/templates/create-type')}
              accessibilityLabel="New Schema"
            >
              <Plus size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* 3-Step Stepper: 1 Organization -> 2 Document Type -> 3 Layout */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepCircleCompleted}>
              <Check size={12} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.stepLabelCompleted}>Organization</Text>
          </View>

          <View style={styles.stepConnectorActive} />

          <View style={styles.stepItem}>
            <View style={styles.stepCircleActive}>
              <Text style={styles.stepNumberActive}>2</Text>
            </View>
            <Text style={styles.stepLabelActive}>Document Type</Text>
          </View>

          <View style={styles.stepConnectorInactive} />

          <View style={styles.stepItem}>
            <View style={styles.stepCircleInactive}>
              <Text style={styles.stepNumberInactive}>3</Text>
            </View>
            <Text style={styles.stepLabelInactive}>Layout</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search 36 templates by title, keyword, or code..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={15} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Horizontal Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          style={styles.categoryScroll}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.categoryPill,
                  isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                ]}
                onPress={() => setActiveCategory(tab.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive ? styles.categoryPillTextActive : styles.categoryPillTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Main Document List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section Heading */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategoryTitle}>{currentCategoryInfo.label}</Text>
            <Text style={styles.sectionCategorySubtitle}>{currentCategoryInfo.subtitle}</Text>
          </View>

          {/* Cards List */}
          <View style={styles.cardsList}>
            {displayedDocs.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                {/* Card Top Title Row */}
                <Pressable
                  style={styles.cardHeaderPressable}
                  onPress={() => {
                    if (doc.isFinancial) {
                      router.push({ pathname: '/document/edit', params: { docType: doc.code } });
                    } else {
                      router.push({ pathname: '/templates/studio', params: { typeId: doc.code } });
                    }
                  }}
                >
                  <View style={styles.cardIconTitleRow}>
                    <FileText size={18} color="#FFFFFF" />
                    <Text style={styles.cardDocTitle}>{doc.title}</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </Pressable>

                <Text style={styles.cardDescription}>{doc.description}</Text>

                {/* Real Rendered Miniature Thumbnail (Gold/Black Document Master Preview) */}
                <View style={styles.paperThumbnail}>
                  {/* Company Logo / Header */}
                  <View style={styles.thumbHeaderRow}>
                    <View style={styles.thumbLogoFrame}>
                      <Text style={styles.thumbLogoText}>✦</Text>
                    </View>
                    <View style={styles.thumbBrandBlock}>
                      <Text style={styles.thumbBrandName}>{businessName.toUpperCase()}</Text>
                      <Text style={styles.thumbBrandSub}>OFFICIAL ENTERPRISE DOCUMENT</Text>
                    </View>
                    <View style={styles.thumbHeaderMeta}>
                      <View style={styles.thumbMetaLine} />
                      <View style={[styles.thumbMetaLine, { width: 32 }]} />
                    </View>
                  </View>

                  <View style={styles.thumbGoldDivider} />

                  {/* Document Title Header */}
                  <Text style={styles.thumbDocSubtitle}>{doc.docSubtitle}</Text>

                  {/* 2-Column Metadata Rounded Mini-Boxes */}
                  <View style={styles.thumbMetaBoxRow}>
                    <View style={styles.thumbMetaBox}>
                      <Text style={styles.thumbMetaLabel}>REF NO</Text>
                      <Text style={styles.thumbMetaVal}>{doc.code.substring(0, 4).toUpperCase()}-2026</Text>
                    </View>
                    <View style={styles.thumbMetaBox}>
                      <Text style={styles.thumbMetaLabel}>PARTY</Text>
                      <Text style={styles.thumbMetaVal} numberOfLines={1}>{doc.recipientName}</Text>
                    </View>
                  </View>

                  {/* Narrative Body Lines */}
                  <View style={styles.thumbBodyLines}>
                    <View style={styles.thumbLine} />
                    <View style={[styles.thumbLine, { width: '92%' }]} />
                    <View style={[styles.thumbLine, { width: '78%' }]} />
                  </View>

                  {/* Signature Block */}
                  <View style={styles.thumbSigRow}>
                    <View style={styles.thumbSigBlock}>
                      <View style={styles.thumbSigUnderline} />
                      <Text style={styles.thumbSigName}>Authorized Signatory</Text>
                      <Text style={styles.thumbSigRole}>For & On Behalf of {businessName}</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Action Buttons Row */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={styles.previewBtn}
                    onPress={() => {
                      if (doc.isFinancial) {
                        router.push({ pathname: '/document/edit', params: { docType: doc.code } });
                      } else {
                        router.push({ pathname: '/templates/studio', params: { typeId: doc.code, previewOnly: 'true' } });
                      }
                    }}
                  >
                    <Eye size={15} color="#FFFFFF" />
                    <Text style={styles.previewBtnText}>Preview</Text>
                  </Pressable>

                  <Pressable
                    style={styles.selectTemplateBtn}
                    onPress={() => {
                      if (doc.isFinancial) {
                        router.push({ pathname: '/document/edit', params: { docType: doc.code } });
                      } else {
                        router.push({ pathname: '/templates/studio', params: { typeId: doc.code } });
                      }
                    }}
                  >
                    <FileText size={15} color="#0F172A" />
                    <Text style={styles.selectTemplateBtnText}>Select Template</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Feature Introduction Sheet */}
        <FeatureIntroductionSheet
          featureId="template_studio"
          title="Template Studio"
          description="Create stunning invoices, quotes, receipts and more — tailored to your brand."
          primaryActionLabel="Explore Templates"
          onPrimaryAction={() => router.push('/templates/studio')}
        />
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  backBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  brandingBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newSchemaBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 10,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircleCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabelCompleted: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepLabelActive: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepCircleInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepLabelInactive: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  stepConnectorActive: {
    flex: 1,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepConnectorInactive: {
    flex: 1,
    height: 2,
    backgroundColor: '#334155',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 0,
  },
  categoryScroll: {
    maxHeight: 46,
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryPillInactive: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  categoryPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#0F172A',
  },
  categoryPillTextInactive: {
    color: '#94A3B8',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 12,
  },
  sectionCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionCategorySubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 3,
  },
  cardsList: {
    gap: 16,
  },
  docCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cardHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardDocTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
  },
  cardDescription: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  paperThumbnail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  thumbLogoFrame: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C59B27',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLogoText: {
    fontSize: 12,
    color: '#C59B27',
    fontWeight: '800',
  },
  thumbBrandBlock: {
    flex: 1,
  },
  thumbBrandName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  thumbBrandSub: {
    fontSize: 6.5,
    fontWeight: '700',
    color: '#8C6212',
    letterSpacing: 0.4,
  },
  thumbHeaderMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  thumbMetaLine: {
    width: 40,
    height: 2.5,
    backgroundColor: '#CBD5E1',
    borderRadius: 1,
  },
  thumbGoldDivider: {
    height: 1.5,
    backgroundColor: '#C59B27',
    marginBottom: 6,
  },
  thumbDocSubtitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  thumbMetaBoxRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  thumbMetaBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  thumbMetaLabel: {
    fontSize: 6.5,
    fontWeight: '700',
    color: '#64748B',
  },
  thumbMetaVal: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0F172A',
  },
  thumbBodyLines: {
    gap: 3,
    marginBottom: 10,
  },
  thumbLine: {
    height: 2.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
    width: '100%',
  },
  thumbSigRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  thumbSigBlock: {
    width: 120,
  },
  thumbSigUnderline: {
    height: 1,
    backgroundColor: '#0F172A',
    marginBottom: 2,
  },
  thumbSigName: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  thumbSigRole: {
    fontSize: 6.5,
    color: '#64748B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectTemplateBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  selectTemplateBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
