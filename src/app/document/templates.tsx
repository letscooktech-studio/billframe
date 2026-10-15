/**
 * DOCUMENT TEMPLATE SELECTION SCREEN
 * Allows selecting the perfect verified document layout before creating/drafting:
 * 
 * 1. Document Types: Tax Invoice, Estimate, Delivery Challan, Credit Note, Purchase Order, Work Order, Payment Receipt.
 * 2. Down side: Proper Templates selector with visual cards and target organization descriptors.
 * 3. Live Interactive Document Preview Area showing the exact typography, letterhead, and table layout.
 * 4. Action Button: "Create with this Template" -> routes directly to the actual document build/draft screen (/document/edit).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  ArrowRight,
  FileText,
  Briefcase,
  Truck,
  RotateCcw,
  ShoppingBag,
  ClipboardList,
  Receipt,
  Sparkles,
  ShieldCheck,
  Building2,
  Sliders,
  Layers,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { useTheme } from '../../design/ThemeContext';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { BusinessProfile } from '../../domain/profile/types';
import { GST_LAYOUT_DEFINITIONS, GstLayoutMeta } from '../../services/pdf/templates/gst';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface DocumentTemplateItem {
  id: string;
  code: string;
  badge: string;
  name: string;
  targetOrganizations: string;
  keyFeatures: string;
  category: string;
  accentColor: string;
}

export interface DocumentTypeConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  defaultTemplateId: string;
  templates: DocumentTemplateItem[];
}

export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  invoice: {
    id: 'invoice',
    title: 'GST Tax Invoice',
    subtitle: 'Standard commercial invoice with GST, tax calculation and payment terms',
    icon: FileText,
    defaultTemplateId: 'gst_executive',
    templates: [
      {
        id: 'gst_executive',
        code: 'GST-01',
        badge: 'GST-01',
        name: 'Executive Letterhead',
        targetOrganizations: 'IT agencies, design studios, marketing firms, consultancies & engineering services.',
        keyFeatures: 'Dominant organization header, vertical divider, 3-column party info, generous executive whitespace.',
        category: 'executive',
        accentColor: '#3B82F6',
      },
      {
        id: 'gst_ledger',
        code: 'GST-02',
        badge: 'GST-02',
        name: 'Structured Ledger',
        targetOrganizations: 'Wholesalers, distributors, trading firms, parts suppliers & industrial vendors.',
        keyFeatures: '6-compartment metadata band, boxed party panels, 11-column high-density item grid, structured tax breakup.',
        category: 'ledger',
        accentColor: '#10B981',
      },
      {
        id: 'gst_minimal',
        code: 'GST-03',
        badge: 'GST-03',
        name: 'Minimal Professional',
        targetOrganizations: 'Independent consultants, freelance specialists, architects & boutique advisory studios.',
        keyFeatures: 'Borderless hairline typography, prominent invoice number, clean stacked summary, zero visual noise.',
        category: 'minimal',
        accentColor: '#1EC1CB',
      },
      {
        id: 'gst_corporate',
        code: 'GST-04',
        badge: 'GST-04',
        name: 'Corporate B2B',
        targetOrganizations: 'Enterprise vendors, Tier-1 suppliers, government contractors & manufacturing corporations.',
        keyFeatures: 'Dual buyer/consignee panels, E-invoice status flag, inverted solid black Grand Total bar.',
        category: 'corporate',
        accentColor: '#8B5CF6',
      },
      {
        id: 'gst_supply_chain',
        code: 'GST-05',
        badge: 'GST-05',
        name: 'Trade Supply Chain',
        targetOrganizations: 'Freight forwarders, logistics fleets, FMCG distributors & multi-depot shipping networks.',
        keyFeatures: 'HSN in column 2, 4-column metadata transport strip, multi-page ledger support with running footer.',
        category: 'supply_chain',
        accentColor: '#F59E0B',
      },
    ],
  },
  estimate: {
    id: 'estimate',
    title: 'Estimate / Quotation',
    subtitle: 'Project proposals, cost breakdowns, and formal commercial quotations',
    icon: Briefcase,
    defaultTemplateId: 'est_executive',
    templates: [
      {
        id: 'est_executive',
        code: 'EST-01',
        badge: 'EST-01',
        name: 'Executive Proposal',
        targetOrganizations: 'Creative studios, software agencies, commercial contractors & consultants.',
        keyFeatures: 'Scope of work narrative, milestone price table, validity timeline & acceptance signoff.',
        category: 'executive',
        accentColor: '#3B82F6',
      },
      {
        id: 'est_itemized',
        code: 'EST-02',
        badge: 'EST-02',
        name: 'Itemized Quotation',
        targetOrganizations: 'Fabricators, construction suppliers, hardware merchants & equipment repair.',
        keyFeatures: 'Detailed unit rates, optional quantities, revision numbering & delivery assumptions.',
        category: 'ledger',
        accentColor: '#10B981',
      },
      {
        id: 'est_proforma',
        code: 'EST-03',
        badge: 'EST-03',
        name: 'Commercial Proforma',
        targetOrganizations: 'Exporters, cross-border suppliers, wholesale traders & advance commercial supply.',
        keyFeatures: 'International bank wire coordinates, proforma invoice number, advance payment clauses.',
        category: 'corporate',
        accentColor: '#8B5CF6',
      },
    ],
  },
  challan: {
    id: 'challan',
    title: 'Delivery Challan',
    subtitle: 'Goods dispatch, vehicle transfer note & transit documentation',
    icon: Truck,
    defaultTemplateId: 'challan_standard',
    templates: [
      {
        id: 'challan_standard',
        code: 'DC-01',
        badge: 'DC-01',
        name: 'Standard Goods Dispatch',
        targetOrganizations: 'FMCG distributors, retail manufacturers, parts warehouses & delivery fleets.',
        keyFeatures: 'Vehicle registration, transporter ID, package/box tally, receiver acknowledgement seal.',
        category: 'supply_chain',
        accentColor: '#F59E0B',
      },
      {
        id: 'challan_transfer',
        code: 'DC-02',
        badge: 'DC-02',
        name: 'Depot Consignment Transfer',
        targetOrganizations: 'Multi-branch logistics, inter-warehouse stock transfer & internal transport.',
        keyFeatures: 'Source & destination warehouse codes, gate pass authorization, security signature block.',
        category: 'corporate',
        accentColor: '#10B981',
      },
    ],
  },
  credit_note: {
    id: 'credit_note',
    title: 'Credit Note / Debit Note',
    subtitle: 'Sales returns, tax adjustments, price variations & customer refunds',
    icon: RotateCcw,
    defaultTemplateId: 'credit_tax',
    templates: [
      {
        id: 'credit_tax',
        code: 'CN-01',
        badge: 'CN-01',
        name: 'Tax Credit Note',
        targetOrganizations: 'GST-registered entities processing returns, post-sale discounts or excess billing.',
        keyFeatures: 'Original invoice cross-reference, Rule 53 GST compliance, net tax credit adjustment.',
        category: 'ledger',
        accentColor: '#F43F5E',
      },
      {
        id: 'debit_memo',
        code: 'DN-01',
        badge: 'DN-01',
        name: 'Commercial Debit Memo',
        targetOrganizations: 'Suppliers claiming rate revisions, short payments, or debit balance adjustments.',
        keyFeatures: 'Debit claim justification, underlying PO reference, revised payable balance breakdown.',
        category: 'corporate',
        accentColor: '#8B5CF6',
      },
    ],
  },
  purchase_order: {
    id: 'purchase_order',
    title: 'Purchase Order',
    subtitle: 'Official procurement orders sent to vendors, contractors & suppliers',
    icon: ShoppingBag,
    defaultTemplateId: 'po_corporate',
    templates: [
      {
        id: 'po_corporate',
        code: 'PO-01',
        badge: 'PO-01',
        name: 'Corporate Purchase Order',
        targetOrganizations: 'Procurement teams, corporate buyers, factories & manufacturing contractors.',
        keyFeatures: 'Vendor billing/shipping address, shipping instructions, delivery deadline, buyer seal.',
        category: 'corporate',
        accentColor: '#3B82F6',
      },
      {
        id: 'po_supply',
        code: 'PO-02',
        badge: 'PO-02',
        name: 'Industrial Supply Order',
        targetOrganizations: 'Engineering works, raw material buyers, OEM assemblers & site contractors.',
        keyFeatures: 'Technical specification notes, inspection criteria, staggered delivery schedule.',
        category: 'supply_chain',
        accentColor: '#10B981',
      },
    ],
  },
  work_order: {
    id: 'work_order',
    title: 'Work Order & Contract',
    subtitle: 'Scope of work, milestone deliverables, technical terms & legal signoff',
    icon: ClipboardList,
    defaultTemplateId: 'wo_service',
    templates: [
      {
        id: 'wo_service',
        code: 'WO-01',
        badge: 'WO-01',
        name: 'Service Work Order',
        targetOrganizations: 'Maintenance engineers, field service providers, contractors & technical agencies.',
        keyFeatures: 'Job site address, scope deliverables, materials provided, customer completion signoff.',
        category: 'ledger',
        accentColor: '#8B5CF6',
      },
      {
        id: 'wo_contract',
        code: 'WO-02',
        badge: 'WO-02',
        name: 'Professional Engagement Agreement',
        targetOrganizations: 'Retained consultants, advisory specialists, creative partners & vendors.',
        keyFeatures: 'Confidentiality terms, payment schedules, intellectual property clauses & signature blocks.',
        category: 'executive',
        accentColor: '#1EC1CB',
      },
    ],
  },
  receipt: {
    id: 'receipt',
    title: 'Payment Receipt',
    subtitle: 'Official payment acknowledgments, rent receipts & settlement vouchers',
    icon: Receipt,
    defaultTemplateId: 'receipt_payment',
    templates: [
      {
        id: 'receipt_payment',
        code: 'REC-01',
        badge: 'REC-01',
        name: 'Executive Payment Receipt',
        targetOrganizations: 'Service providers, educational institutes, clinics & professional practices.',
        keyFeatures: 'Transaction UTR/cheque reference, payment mode, invoice settlement & balance due tally.',
        category: 'minimal',
        accentColor: '#10B981',
      },
      {
        id: 'receipt_rent',
        code: 'REC-02',
        badge: 'REC-02',
        name: 'House & Commercial Rent Receipt',
        targetOrganizations: 'Property landlords, commercial leasing entities & salaried tenant reimbursement.',
        keyFeatures: 'Property address, rental period month, landlord PAN disclosure, statutory revenue stamp.',
        category: 'ledger',
        accentColor: '#F59E0B',
      },
    ],
  },
};

export default function DocumentTemplatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams<{ type?: string }>();
  const { theme } = useTheme();

  const docTypeKey = searchParams.type && DOCUMENT_TYPE_CONFIGS[searchParams.type]
    ? searchParams.type
    : 'invoice';

  const [activeDocType, setActiveDocType] = useState<string>(docTypeKey);
  const activeConfig = DOCUMENT_TYPE_CONFIGS[activeDocType] || DOCUMENT_TYPE_CONFIGS.invoice;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    activeConfig.defaultTemplateId || activeConfig.templates[0].id
  );

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const prof = await BusinessProfileRepository.getActiveProfile();
        if (prof) setBusinessProfile(prof);
      } catch {}
    })();
  }, []);

  // Update selected template when switching document types
  const handleSwitchDocType = (typeKey: string) => {
    setActiveDocType(typeKey);
    const cfg = DOCUMENT_TYPE_CONFIGS[typeKey];
    if (cfg && cfg.templates.length > 0) {
      setSelectedTemplateId(cfg.templates[0].id);
    }
  };

  const selectedTemplate = useMemo(() => {
    return activeConfig.templates.find((t) => t.id === selectedTemplateId) || activeConfig.templates[0];
  }, [activeConfig, selectedTemplateId]);

  const handleCreateDocument = () => {
    if (activeDocType === 'invoice') {
      router.push({
        pathname: '/document/edit',
        params: { type: 'invoice', templateId: selectedTemplate.id },
      });
    } else if (activeDocType === 'estimate') {
      router.push({
        pathname: '/document/edit',
        params: { type: 'estimate', templateId: selectedTemplate.id },
      });
    } else if (activeDocType === 'work_order') {
      router.push({
        pathname: '/templates/studio',
        params: { typeId: 'work_order', layout: selectedTemplate.id },
      });
    } else {
      router.push({
        pathname: '/document/edit',
        params: { type: activeDocType, templateId: selectedTemplate.id },
      });
    }
  };

  const orgName = businessProfile?.name || 'Apex Studio Pvt Ltd';
  const orgGstin = businessProfile?.tax_id || '27AABCU9603R1ZM';
  const orgAddress = businessProfile?.address_line1 || '101, Maker Chambers V, Nariman Point, Mumbai 400021';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* ── Top Header Navigation ── */}
      <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/documents');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ArrowLeft size={22} color={theme.textPrimary} strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {activeConfig.title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            Choose layout · {activeConfig.templates.length} verified templates
          </Text>
        </View>
      </View>

      {/* ── Document Type Pills Carousel ── */}
      <View style={[styles.typePillsWrap, { borderBottomColor: theme.borderSubtle }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typePillsContent}
        >
          {Object.values(DOCUMENT_TYPE_CONFIGS).map((cfg) => {
            const isSelected = cfg.id === activeDocType;
            return (
              <Pressable
                key={cfg.id}
                onPress={() => handleSwitchDocType(cfg.id)}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                    borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color: isSelected ? theme.textPrimary : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cfg.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Scroll View: Live Preview + Downside Templates ── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section: Document Live Preview Card ── */}
        <View style={styles.previewContainer}>
          <View style={styles.previewHeaderRow}>
            <View style={styles.previewBadgeRow}>
              <View style={[styles.badgePill, { backgroundColor: theme.surfaceSecondary }]}>
                <ShieldCheck size={14} color={selectedTemplate.accentColor} strokeWidth={2} />
                <Text style={[styles.badgePillText, { color: selectedTemplate.accentColor }]}>
                  {selectedTemplate.badge}
                </Text>
              </View>
              <Text style={[styles.previewCategoryTag, { color: theme.textSecondary }]}>
                {selectedTemplate.category.toUpperCase()} LAYOUT
              </Text>
            </View>
            <Text style={[styles.previewInfoHint, { color: theme.textMuted }]}>
              Live Layout Mockup
            </Text>
          </View>

          {/* Interactive A4 Styled Sheet */}
          <View style={[styles.a4Sheet, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
            {/* Header Style variants */}
            {selectedTemplate.category === 'executive' ? (
              <View style={styles.mockExecHeader}>
                <View style={styles.mockExecLeft}>
                  <Text style={styles.mockOrgName}>{orgName}</Text>
                  <Text style={styles.mockOrgMeta}>GSTIN: {orgGstin}</Text>
                  <Text style={styles.mockOrgMeta}>{orgAddress}</Text>
                </View>
                <View style={styles.mockExecDivider} />
                <View style={styles.mockExecRight}>
                  <Text style={styles.mockDocTitle}>{activeConfig.title.toUpperCase()}</Text>
                  <Text style={styles.mockDocNumber}>DOC-2026-001</Text>
                  <Text style={styles.mockDocMeta}>Date: 15 Oct 2026</Text>
                  <Text style={styles.mockDocMeta}>Due: 14 Nov 2026</Text>
                </View>
              </View>
            ) : selectedTemplate.category === 'ledger' ? (
              <View style={styles.mockLedgerHeader}>
                <View style={styles.mockLedgerTopRow}>
                  <Text style={styles.mockOrgName}>{orgName}</Text>
                  <Text style={styles.mockDocTitle}>{activeConfig.title.toUpperCase()}</Text>
                </View>
                <View style={styles.mockLedgerBand}>
                  <View style={styles.mockBandCol}>
                    <Text style={styles.mockBandLabel}>INVOICE NO.</Text>
                    <Text style={styles.mockBandVal}>INV-2026-001</Text>
                  </View>
                  <View style={styles.mockBandCol}>
                    <Text style={styles.mockBandLabel}>DATE</Text>
                    <Text style={styles.mockBandVal}>15-OCT-2026</Text>
                  </View>
                  <View style={styles.mockBandCol}>
                    <Text style={styles.mockBandLabel}>STATE CODE</Text>
                    <Text style={styles.mockBandVal}>27 (MAH)</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.mockStandardHeader}>
                <View>
                  <Text style={styles.mockDocTitle}>{activeConfig.title.toUpperCase()}</Text>
                  <Text style={styles.mockDocNumber}>#DOC-2026-001</Text>
                </View>
                <View style={styles.mockStandardRight}>
                  <Text style={styles.mockOrgName}>{orgName}</Text>
                  <Text style={styles.mockOrgMeta}>{orgGstin}</Text>
                </View>
              </View>
            )}

            {/* Bill To / Party Box */}
            <View style={styles.mockPartyBox}>
              <Text style={styles.mockPartyHeading}>BILLED TO:</Text>
              <Text style={styles.mockClientName}>Reliance Retail Limited</Text>
              <Text style={styles.mockClientMeta}>GSTIN: 27AABCR1234F1Z8 · Mumbai, Maharashtra</Text>
            </View>

            {/* Table Mockup */}
            <View style={styles.mockTable}>
              <View style={styles.mockTableHeader}>
                <Text style={[styles.mockTh, { flex: 2 }]}>DESCRIPTION</Text>
                <Text style={[styles.mockTh, { width: 50, textAlign: 'center' }]}>HSN</Text>
                <Text style={[styles.mockTh, { width: 40, textAlign: 'right' }]}>QTY</Text>
                <Text style={[styles.mockTh, { width: 70, textAlign: 'right' }]}>RATE</Text>
                <Text style={[styles.mockTh, { width: 75, textAlign: 'right' }]}>AMOUNT</Text>
              </View>

              <View style={styles.mockTableRow}>
                <Text style={[styles.mockTd, { flex: 2, fontWeight: '600' }]}>Cloud Platform Architecture</Text>
                <Text style={[styles.mockTd, { width: 50, textAlign: 'center' }]}>998313</Text>
                <Text style={[styles.mockTd, { width: 40, textAlign: 'right' }]}>1</Text>
                <Text style={[styles.mockTd, { width: 70, textAlign: 'right' }]}>₹45,000</Text>
                <Text style={[styles.mockTd, { width: 75, textAlign: 'right', fontWeight: '600' }]}>₹45,000</Text>
              </View>

              <View style={styles.mockTableRow}>
                <Text style={[styles.mockTd, { flex: 2, fontWeight: '600' }]}>Security & GST Audit</Text>
                <Text style={[styles.mockTd, { width: 50, textAlign: 'center' }]}>998311</Text>
                <Text style={[styles.mockTd, { width: 40, textAlign: 'right' }]}>1</Text>
                <Text style={[styles.mockTd, { width: 70, textAlign: 'right' }]}>₹15,000</Text>
                <Text style={[styles.mockTd, { width: 75, textAlign: 'right', fontWeight: '600' }]}>₹15,000</Text>
              </View>
            </View>

            {/* Totals & Tax Breakup Mockup */}
            <View style={styles.mockTotalsWrap}>
              <View style={styles.mockTotalsCol}>
                <View style={styles.mockTotalRow}>
                  <Text style={styles.mockTotalLabel}>Taxable Value:</Text>
                  <Text style={styles.mockTotalVal}>₹60,000.00</Text>
                </View>
                <View style={styles.mockTotalRow}>
                  <Text style={styles.mockTotalLabel}>CGST (9%):</Text>
                  <Text style={styles.mockTotalVal}>₹5,400.00</Text>
                </View>
                <View style={styles.mockTotalRow}>
                  <Text style={styles.mockTotalLabel}>SGST (9%):</Text>
                  <Text style={styles.mockTotalVal}>₹5,400.00</Text>
                </View>
                <View style={[styles.mockTotalRow, styles.mockGrandTotalRow]}>
                  <Text style={styles.mockGrandTotalLabel}>TOTAL AMOUNT:</Text>
                  <Text style={styles.mockGrandTotalVal}>₹70,800.00</Text>
                </View>
              </View>
            </View>

            {/* Footer / Signature */}
            <View style={styles.mockFooter}>
              <Text style={styles.mockTerms}>Computer generated document. Valid without physical seal under IT Act 2000.</Text>
              <View style={styles.mockSignBlock}>
                <Text style={styles.mockSignOrg}>For {orgName}</Text>
                <View style={styles.mockSignLine} />
                <Text style={styles.mockSignLabel}>Authorized Signatory</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Down Side: Proper Templates Selection Area ── */}
        <View style={styles.selectorSection}>
          <View style={styles.selectorSectionHeader}>
            <Text style={[styles.selectorTitle, { color: theme.textPrimary }]}>
              SELECT A TEMPLATE
            </Text>
            <Text style={[styles.selectorSubtitle, { color: theme.textSecondary }]}>
              Tap any layout below to switch designs instantly
            </Text>
          </View>

          {/* Cards for each template in this document type */}
          <View style={styles.templateCardsList}>
            {activeConfig.templates.map((tmpl) => {
              const isSelected = tmpl.id === selectedTemplateId;
              return (
                <Pressable
                  key={tmpl.id}
                  style={({ pressed }) => [
                    styles.templateCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                      opacity: pressed ? 0.9 : 1,
                    },
                    isSelected && styles.templateCardSelected,
                  ]}
                  onPress={() => setSelectedTemplateId(tmpl.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.templateCardTop}>
                    <View style={styles.templateBadgeRow}>
                      <View style={[styles.templateCodeBadge, { backgroundColor: theme.surfaceSecondary }]}>
                        <Text style={[styles.templateCodeText, { color: tmpl.accentColor }]}>
                          {tmpl.badge}
                        </Text>
                      </View>
                      <Text style={[styles.templateNameText, { color: theme.textPrimary }]}>
                        {tmpl.name}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={[styles.checkCircle, { backgroundColor: theme.brandAnchor }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    ) : (
                      <View style={[styles.uncheckCircle, { borderColor: theme.borderDefault }]} />
                    )}
                  </View>

                  <Text style={[styles.targetOrgText, { color: theme.textSecondary }]}>
                    {tmpl.targetOrganizations}
                  </Text>

                  <View style={[styles.featuresRow, { borderTopColor: theme.borderSubtle }]}>
                    <Text style={[styles.featuresText, { color: theme.textMuted }]} numberOfLines={2}>
                      {tmpl.keyFeatures}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Floating Bottom Action Bar ── */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.borderSubtle,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.bottomBarLeft}>
          <Text style={[styles.bottomBarTemplateName, { color: theme.textPrimary }]}>
            {selectedTemplate.badge} · {selectedTemplate.name}
          </Text>
          <Text style={[styles.bottomBarHint, { color: theme.textSecondary }]}>
            Ready to draft
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            { opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleCreateDocument}
          accessibilityRole="button"
          accessibilityLabel={`Create ${activeConfig.title} with ${selectedTemplate.name}`}
        >
          <Text style={styles.createButtonText}>
            Create Document
          </Text>
          <ArrowRight size={18} color="#000000" strokeWidth={2.5} style={styles.createButtonIcon} />
        </Pressable>
      </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  typePillsWrap: {
    borderBottomWidth: 1,
  },
  typePillsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typePillText: {
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  previewContainer: {
    padding: spacing.md,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewCategoryTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  previewInfoHint: {
    fontSize: 11,
  },
  a4Sheet: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  mockExecHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginBottom: 12,
  },
  mockExecLeft: {
    flex: 1,
    paddingRight: 10,
  },
  mockExecDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  mockExecRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mockLedgerHeader: {
    marginBottom: 12,
  },
  mockLedgerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mockLedgerBand: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    padding: 6,
    justifyContent: 'space-between',
  },
  mockBandCol: {
    flex: 1,
  },
  mockBandLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  mockBandVal: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: '600',
  },
  mockStandardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mockStandardRight: {
    alignItems: 'flex-end',
  },
  mockOrgName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mockOrgMeta: {
    fontSize: 10,
    color: '#475569',
    marginTop: 1,
  },
  mockDocTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  mockDocNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 1,
  },
  mockDocMeta: {
    fontSize: 10,
    color: '#475569',
    marginTop: 1,
  },
  mockPartyBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0F172A',
  },
  mockPartyHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  mockClientName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  mockClientMeta: {
    fontSize: 10,
    color: '#475569',
  },
  mockTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mockTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  mockTh: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mockTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mockTd: {
    fontSize: 10,
    color: '#1E293B',
  },
  mockTotalsWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  mockTotalsCol: {
    width: 200,
  },
  mockTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  mockTotalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  mockTotalVal: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: '600',
  },
  mockGrandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
    paddingTop: 4,
    marginTop: 4,
  },
  mockGrandTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  mockGrandTotalVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  mockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  mockTerms: {
    fontSize: 8,
    color: '#94A3B8',
    flex: 1,
    paddingRight: 10,
  },
  mockSignBlock: {
    alignItems: 'center',
    width: 120,
  },
  mockSignOrg: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
  },
  mockSignLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#CBD5E1',
    marginTop: 22,
    marginBottom: 3,
  },
  mockSignLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  selectorSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  selectorSectionHeader: {
    marginBottom: spacing.md,
  },
  selectorTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  selectorSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  templateCardsList: {
    gap: 12,
  },
  templateCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  templateCardSelected: {
    borderWidth: 2,
  },
  templateCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  templateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  templateCodeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  templateNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  targetOrgText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  featuresRow: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  featuresText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
  },
  bottomBarLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  bottomBarTemplateName: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBarHint: {
    fontSize: 12,
    marginTop: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    minHeight: MIN_TOUCH_TARGET,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  createButtonIcon: {
    marginLeft: 6,
  },
});
